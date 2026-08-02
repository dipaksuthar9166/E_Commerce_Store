const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { sendSms } = require('../services/smsService');
const { emitOrderStatusUpdated } = require('../utils/orderSocket');

const ONLINE_METHODS = ['upi', 'card', 'netbanking', 'pay_later', 'emi'];
const PRE_DISPATCH = ['pending', 'accepted', 'packing'];
const CANCELLABLE = ['pending', 'accepted', 'packing'];
const RETURNABLE = ['delivered'];

function calcDeliveryFee(method, subtotal) {
  if (method === 'express') {
    return subtotal >= 499 ? 0 : 49;
  }
  if (method === 'slot') {
    return subtotal >= 399 ? 0 : 39;
  }
  // standard
  return subtotal >= 299 ? 0 : 29;
}

function calcPlatformFee(subtotal) {
  if (subtotal <= 0) return 0;
  if (subtotal >= 999) return 0;
  return 5;
}

function calcTax(taxableAmount) {
  // 5% GST on (subtotal - discount)
  return Math.round(Math.max(0, taxableAmount) * 0.05 * 100) / 100;
}

function estimateDeliveryAt(method, deliverySlot) {
  const now = new Date();
  if (method === 'express') {
    return new Date(now.getTime() + 45 * 60 * 1000);
  }
  if (method === 'slot' && deliverySlot?.date && deliverySlot?.timeLabel) {
    // Parse rough ETA from slot label like "10:00 AM - 12:00 PM"
    const d = new Date(deliverySlot.date);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(12, 0, 0, 0);
      return d;
    }
  }
  // standard ~ 2 hours
  return new Date(now.getTime() + 2 * 60 * 60 * 1000);
}

const { formatProductForClient } = require('../utils/productImageHelper');

function populateOrderQuery(q) {
  return q
    .populate('shopId', 'shopName address phone')
    // Include images so formatProductForClient can set hasImage, then strip binary
    .populate('items.productId', 'name imagePath images price discount_percent sizes colors')
    .populate('deliveryBoyId', 'name phone lastLocation')
    .populate('userId', 'name email phone');
}

/** Strip binary image buffers from populated order items before JSON response */
function formatOrderForClient(order) {
  if (!order) return order;
  const obj = typeof order.toObject === 'function' ? order.toObject() : { ...order };
  if (Array.isArray(obj.items)) {
    obj.items = obj.items.map((item) => {
      if (item?.productId && typeof item.productId === 'object' && item.productId._id) {
        return { ...item, productId: formatProductForClient(item.productId) };
      }
      return item;
    });
  }
  return obj;
}

async function loadFullOrder(orderId) {
  const order = await populateOrderQuery(Order.findById(orderId));
  return formatOrderForClient(order);
}

function assertOwner(order, user) {
  const ownerId =
    order.userId?._id?.toString?.() ||
    order.userId?.toString?.() ||
    String(order.userId || '');
  return ownerId === user._id.toString();
}

// @desc    Customer places a new order
// @route   POST /api/orders
// @access  Private (customer)
exports.placeOrder = async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      paymentMethod = 'cod',
      paymentDetails = {},
      couponCode,
      deliveryMethod = 'standard',
      deliverySlot = null,
      specialInstructions = '',
      contactPhone = null,
      deliveryCoords = null,
      shippingAddress = null,
    } = req.body;

    if (!items || !items.length || !deliveryAddress) {
      return res.status(400).json({ message: 'Items and deliveryAddress are required' });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const method = ['standard', 'express', 'slot'].includes(deliveryMethod)
      ? deliveryMethod
      : 'standard';
    const payMethod = ['cod', 'upi', 'card', 'netbanking', 'pay_later', 'emi'].includes(paymentMethod)
      ? paymentMethod
      : 'cod';

    if (method === 'slot' && (!deliverySlot?.date || !deliverySlot?.timeLabel)) {
      return res.status(400).json({ message: 'Please select a delivery slot for slot-based delivery' });
    }

    // Normalize line items — reject bad productIds early with a clear message
    const mongoose = require('mongoose');
    const normalizedItems = [];
    for (const raw of items) {
      const productId = raw?.productId != null
        ? (typeof raw.productId === 'object'
          ? (raw.productId._id || raw.productId.id)
          : raw.productId)
        : null;
      const quantity = Number(raw?.quantity);
      if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
        return res.status(400).json({
          message: 'Invalid cart item — product id missing. Please re-add items to cart.',
        });
      }
      if (!Number.isFinite(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Each item must have quantity of at least 1' });
      }
      normalizedItems.push({
        productId: String(productId),
        quantity: Math.floor(quantity),
        selectedSize: raw.selectedSize || null,
        selectedColor: raw.selectedColor || null,
      });
    }

    const products = await Product.find({
      _id: { $in: normalizedItems.map((i) => i.productId) },
    }).select('shopId stock name price discount_percent');

    const itemsByShop = {};

    for (const item of normalizedItems) {
      const product = products.find((p) => p._id.toString() === String(item.productId));
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      if (!product.shopId) {
        return res.status(400).json({
          message: `Product "${product.name}" is not linked to a shop and cannot be ordered.`,
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}. Only ${product.stock} left.`,
        });
      }

      const shopId = product.shopId.toString();
      if (!itemsByShop[shopId]) {
        itemsByShop[shopId] = { items: [] };
      }

      const price = product.discount_percent > 0
        ? Math.round(product.price * (1 - product.discount_percent / 100) * 100) / 100
        : product.price;

      const mrpSavings = product.discount_percent > 0
        ? Math.round((product.price - price) * item.quantity * 100) / 100
        : 0;

      itemsByShop[shopId].items.push({
        productId: product._id,
        quantity: item.quantity,
        price,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
        _mrpSavings: mrpSavings,
      });
    }

    const createdOrders = [];
    const io = req.app.get('io');
    let feeAssigned = false;

    for (const shopId of Object.keys(itemsByShop)) {
      const shopItems = itemsByShop[shopId].items;
      const subtotal = shopItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const itemSavings = shopItems.reduce((sum, item) => sum + (item._mrpSavings || 0), 0);

      let discountAmount = 0;
      let appliedCouponCode = null;

      if (couponCode) {
        const coupon = await Coupon.findOne({
          code: couponCode.toUpperCase(),
          shopId,
          isActive: true,
        });
        if (coupon) {
          const now = new Date();
          if (now >= coupon.validFrom && now <= coupon.validUntil && subtotal >= coupon.minOrderAmount) {
            if (coupon.discountType === 'fixed') {
              discountAmount = coupon.discountValue;
            } else if (coupon.discountType === 'percent') {
              discountAmount = (subtotal * coupon.discountValue) / 100;
              if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
              }
            }
            discountAmount = Math.min(discountAmount, subtotal);
            appliedCouponCode = coupon.code.toUpperCase();
          }
        }
      }

      const taxable = Math.max(0, subtotal - discountAmount);
      // Fees only on first shop order when multi-shop cart
      const deliveryFee = !feeAssigned ? calcDeliveryFee(method, subtotal) : 0;
      const platformFee = !feeAssigned ? calcPlatformFee(subtotal) : 0;
      const taxAmount = calcTax(taxable);
      feeAssigned = true;

      const totalAmount = Math.round((taxable + deliveryFee + platformFee + taxAmount) * 100) / 100;
      const savingsAmount = Math.round((itemSavings + discountAmount) * 100) / 100;
      const estimatedDeliveryAt = estimateDeliveryAt(method, deliverySlot);

      const cleanItems = shopItems.map(({ productId, quantity, price, selectedSize, selectedColor }) => ({
        productId,
        quantity,
        price,
        selectedSize,
        selectedColor,
      }));

      const isOnline = ONLINE_METHODS.includes(payMethod);

      const order = new Order({
        userId: req.user._id,
        shopId,
        items: cleanItems,
        subtotal,
        totalAmount,
        deliveryFee,
        platformFee,
        taxAmount,
        couponCode: appliedCouponCode,
        discountAmount,
        savingsAmount,
        deliveryAddress,
        shippingAddress: shippingAddress || {
          address: deliveryAddress,
          city: '',
          postalCode: '',
          country: 'India',
        },
        deliveryCoords: deliveryCoords?.lat != null
          ? { lat: deliveryCoords.lat, lng: deliveryCoords.lng }
          : undefined,
        contactPhone: contactPhone || req.user.phone || null,
        deliveryMethod: method,
        deliverySlot: method === 'slot' ? {
          date: deliverySlot.date,
          timeLabel: deliverySlot.timeLabel,
        } : undefined,
        specialInstructions: (specialInstructions || '').slice(0, 500),
        estimatedDeliveryAt,
        paymentMethod: payMethod,
        paymentDetails: {
          upiApp: paymentDetails?.upiApp || null,
          emiMonths: paymentDetails?.emiMonths || null,
        },
        paymentStatus: isOnline ? 'paid' : 'unpaid',
        status: 'pending',
        deliveryOTP: Math.floor(1000 + Math.random() * 9000).toString(),
        timeline: [{
          status: 'placed',
          description: 'Order placed successfully',
        }],
      });

      await order.save();
      createdOrders.push(order);

      if (req.user.phone || contactPhone) {
        const phone = contactPhone || req.user.phone;
        const message = `Your OTP for MERSKO order #${order._id.toString().slice(-6)} is ${order.deliveryOTP}. Do not share this with anyone.`;
        sendSms(phone, message).catch((err) => console.error('SMS sending failed:', err));
      }

      for (const item of cleanItems) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
      }

      if (io) {
        const populatedOrder = await Order.findById(order._id).populate('userId', 'name email phone');
        io.to(`shop_${shopId}`).emit('newOrder', populatedOrder);
      }
    }

    const fullOrders = await Promise.all(
      createdOrders.map((o) => loadFullOrder(o._id))
    );

    res.status(201).json({
      message: `${createdOrders.length} order(s) created successfully.`,
      orders: fullOrders, // already formatted (no binary images)
      // Back-compat for older clients
      _id: fullOrders[0]?._id,
      order: fullOrders[0],
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get orders for the logged-in customer
// @route   GET /api/orders/my
// @access  Private (customer)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await populateOrderQuery(
      Order.find({ userId: req.user._id }).sort({ createdAt: -1 })
    );
    res.status(200).json((orders || []).map((o) => formatOrderForClient(o)));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single order by id
// @route   GET /api/orders/:id
// @access  Private (owner / admin)
exports.getOrderById = async (req, res) => {
  try {
    const order = await loadFullOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (!assertOwner(order, req.user) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Customer cancels an order
// @route   PUT /api/orders/:id/cancel
// @access  Private (customer)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (!CANCELLABLE.includes(order.status)) {
      return res.status(400).json({
        message: `Order cannot be cancelled after dispatch. Status: ${order.status}`,
      });
    }

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }

    order.status = 'cancelled';
    order.cancelReason = req.body?.reason || 'Cancelled by customer';
    order.cancelledAt = new Date();
    order.timeline.push({
      status: 'cancelled',
      description: order.cancelReason,
    });

    // Initiate refund for prepaid orders
    if (order.paymentStatus === 'paid' || ONLINE_METHODS.includes(order.paymentMethod)) {
      order.paymentStatus = 'refund_pending';
      order.refund = {
        status: 'pending',
        amount: order.totalAmount,
        method: 'original',
        initiatedAt: new Date(),
        completedAt: null,
        note: 'Refund initiated on cancellation. Usually takes 3–5 business days.',
      };
      // Simulate auto-processing for demo
      order.refund.status = 'processing';
      order.timeline.push({
        status: 'refund_initiated',
        description: `Refund of ₹${order.totalAmount} initiated to original payment method`,
      });
    }

    await order.save();

    const updatedOrder = await loadFullOrder(order._id);
    const io = req.app.get('io');
    emitOrderStatusUpdated(io, order, updatedOrder);

    res.json({ message: 'Order cancelled successfully', order: updatedOrder });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Modify delivery address / contact before dispatch
// @route   PUT /api/orders/:id/modify
// @access  Private (customer)
exports.modifyOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!PRE_DISPATCH.includes(order.status)) {
      return res.status(400).json({
        message: 'Address/contact can only be modified before the order is ready for pickup',
      });
    }

    const { deliveryAddress, contactPhone, specialInstructions, shippingAddress } = req.body;

    if (deliveryAddress) {
      order.deliveryAddress = deliveryAddress;
      if (!order.shippingAddress) order.shippingAddress = {};
      order.shippingAddress.address = deliveryAddress;
    }
    if (shippingAddress) {
      order.shippingAddress = { ...order.shippingAddress?.toObject?.() || order.shippingAddress || {}, ...shippingAddress };
    }
    if (contactPhone !== undefined) order.contactPhone = contactPhone;
    if (specialInstructions !== undefined) {
      order.specialInstructions = String(specialInstructions).slice(0, 500);
    }

    order.timeline.push({
      status: 'details_updated',
      description: 'Delivery details updated by customer',
    });

    await order.save();
    const updatedOrder = await loadFullOrder(order._id);
    const io = req.app.get('io');
    emitOrderStatusUpdated(io, order, updatedOrder);

    res.json({ message: 'Order details updated', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Request return or exchange
// @route   POST /api/orders/:id/return
// @access  Private (customer)
exports.requestReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!RETURNABLE.includes(order.status)) {
      return res.status(400).json({ message: 'Only delivered orders can be returned or exchanged' });
    }
    if (order.returnRequest?.status && order.returnRequest.status !== 'none') {
      return res.status(400).json({ message: 'A return/exchange request already exists for this order' });
    }

    // 7-day return window
    const deliveredAt = order.timeline
      ?.slice()
      .reverse()
      .find((t) => t.status === 'delivered')?.date || order.updatedAt;
    const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 7) {
      return res.status(400).json({ message: 'Return window (7 days) has expired' });
    }

    const type = req.body?.type === 'exchange' ? 'exchange' : 'return';
    const reason = (req.body?.reason || '').trim();
    if (!reason) {
      return res.status(400).json({ message: 'Please provide a reason for return/exchange' });
    }

    order.returnRequest = {
      requestType: type,
      reason,
      status: 'requested',
      requestedAt: new Date(),
      resolvedAt: null,
    };
    order.status = 'return_requested';
    order.timeline.push({
      status: 'return_requested',
      description: `${type === 'exchange' ? 'Exchange' : 'Return'} requested: ${reason}`,
    });

    if (type === 'return' && (order.paymentStatus === 'paid' || ONLINE_METHODS.includes(order.paymentMethod))) {
      order.refund = {
        status: 'pending',
        amount: order.totalAmount,
        method: 'original',
        initiatedAt: new Date(),
        completedAt: null,
        note: 'Refund will be processed after pickup of returned item(s).',
      };
      order.paymentStatus = 'refund_pending';
    }

    await order.save();
    const updatedOrder = await loadFullOrder(order._id);
    res.json({ message: `${type === 'exchange' ? 'Exchange' : 'Return'} request submitted`, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get refund status
// @route   GET /api/orders/:id/refund
// @access  Private (customer)
exports.getRefundStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Auto-progress simulated refunds for demo realism
    if (order.refund?.status === 'processing' && order.refund.initiatedAt) {
      const hours = (Date.now() - new Date(order.refund.initiatedAt).getTime()) / (1000 * 60 * 60);
      if (hours >= 0.01) {
        // complete after a short time in demo (essentially next poll)
        // Keep processing until manually completed OR use 24h — for demo complete if > 30s
        const secs = (Date.now() - new Date(order.refund.initiatedAt).getTime()) / 1000;
        if (secs > 30) {
          order.refund.status = 'completed';
          order.refund.completedAt = new Date();
          order.refund.note = 'Refund credited to original payment method / wallet';
          order.paymentStatus = 'refunded';
          order.timeline.push({
            status: 'refund_completed',
            description: `Refund of ₹${order.refund.amount} completed`,
          });
          await order.save();
        }
      }
    } else if (order.refund?.status === 'pending' && order.refund.initiatedAt) {
      const secs = (Date.now() - new Date(order.refund.initiatedAt).getTime()) / 1000;
      if (secs > 10) {
        order.refund.status = 'processing';
        order.refund.note = 'Refund is being processed by the bank / payment partner';
        await order.save();
      }
    }

    res.json({
      orderId: order._id,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      refund: order.refund || { status: 'none', amount: 0 },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Download / view invoice data
// @route   GET /api/orders/:id/invoice
// @access  Private (customer)
exports.getInvoice = async (req, res) => {
  try {
    const order = await loadFullOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (!assertOwner(order, req.user) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const invoiceNo = `INV-${String(order._id).slice(-8).toUpperCase()}`;
    const lineItems = (order.items || []).map((item) => ({
      name: item.productId?.name || 'Product',
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: Math.round(item.price * item.quantity * 100) / 100,
      size: item.selectedSize || null,
      color: item.selectedColor || null,
    }));

    const invoice = {
      invoiceNo,
      orderId: order._id,
      issuedAt: order.createdAt,
      customer: {
        name: order.userId?.name || 'Customer',
        email: order.userId?.email || '',
        phone: order.contactPhone || order.userId?.phone || '',
      },
      shop: {
        name: order.shopId?.shopName || 'Shop',
        address: order.shopId?.address || '',
      },
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      items: lineItems,
      breakup: {
        subtotal: order.subtotal || lineItems.reduce((s, i) => s + i.lineTotal, 0),
        discount: order.discountAmount || 0,
        deliveryFee: order.deliveryFee || 0,
        platformFee: order.platformFee || 0,
        tax: order.taxAmount || 0,
        savings: order.savingsAmount || 0,
        total: order.totalAmount,
      },
      couponCode: order.couponCode,
    };

    // HTML printable invoice
    if (req.query.format === 'html') {
      const rows = lineItems.map((i) => `
        <tr>
          <td>${i.name}${i.size ? ` (${i.size})` : ''}${i.color ? ` / ${i.color}` : ''}</td>
          <td style="text-align:center">${i.quantity}</td>
          <td style="text-align:right">₹${i.unitPrice}</td>
          <td style="text-align:right">₹${i.lineTotal}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${invoiceNo}</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;color:#111;padding:0 16px}
  h1{font-size:22px;margin:0} .muted{color:#666;font-size:13px}
  table{width:100%;border-collapse:collapse;margin-top:20px}
  th,td{border-bottom:1px solid #eee;padding:10px 6px;font-size:14px}
  th{text-align:left;background:#f8fafc}
  .totals{margin-top:16px;margin-left:auto;width:280px}
  .totals div{display:flex;justify-content:space-between;padding:4px 0;font-size:14px}
  .totals .grand{font-weight:800;font-size:16px;border-top:2px solid #111;margin-top:8px;padding-top:8px}
  @media print{button{display:none}}
</style></head><body>
  <button onclick="window.print()" style="padding:8px 14px;margin-bottom:16px;cursor:pointer">Print / Save PDF</button>
  <h1>Tax Invoice</h1>
  <p class="muted">${invoiceNo} · Order #${String(order._id).slice(-8).toUpperCase()}</p>
  <p class="muted">Date: ${new Date(order.createdAt).toLocaleString()}</p>
  <div style="display:flex;justify-content:space-between;gap:24px;margin-top:20px">
    <div><strong>Bill To</strong><br/>${invoice.customer.name}<br/>${invoice.customer.phone || ''}<br/>${invoice.deliveryAddress || ''}</div>
    <div style="text-align:right"><strong>Sold By</strong><br/>${invoice.shop.name}<br/>${invoice.shop.address}</div>
  </div>
  <table>
    <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>₹${invoice.breakup.subtotal}</span></div>
    <div><span>Discount</span><span>-₹${invoice.breakup.discount}</span></div>
    <div><span>Delivery</span><span>₹${invoice.breakup.deliveryFee}</span></div>
    <div><span>Platform fee</span><span>₹${invoice.breakup.platformFee}</span></div>
    <div><span>GST (5%)</span><span>₹${invoice.breakup.tax}</span></div>
    <div class="grand"><span>Total</span><span>₹${invoice.breakup.total}</span></div>
  </div>
  <p class="muted" style="margin-top:28px">Payment: ${invoice.paymentMethod.toUpperCase()} · Status: ${invoice.paymentStatus}</p>
  <p class="muted">Thank you for shopping with MERSKO.</p>
</body></html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Re-order — return product payloads for cart
// @route   POST /api/orders/:id/reorder
// @access  Private (customer)
exports.reorder = async (req, res) => {
  try {
    const order = await loadFullOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (!assertOwner(order, req.user)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const cartItems = [];
    const unavailable = [];

    for (const item of order.items || []) {
      const product = item.productId;
      if (!product || !product._id) {
        unavailable.push({ reason: 'Product removed', quantity: item.quantity });
        continue;
      }
      const full = await Product.findById(product._id);
      if (!full || full.stock < 1) {
        unavailable.push({
          name: product.name,
          reason: 'Out of stock',
          quantity: item.quantity,
        });
        continue;
      }
      const qty = Math.min(item.quantity, full.stock);
      const price = full.discount_percent > 0
        ? Math.round(full.price * (1 - full.discount_percent / 100))
        : full.price;

      const formatted = formatProductForClient(full);
      cartItems.push({
        product: {
          id: full._id,
          _id: full._id,
          name: full.name,
          price: full.price,
          discount_percent: full.discount_percent || 0,
          imagePath: formatted.imagePath,
          hasImage: formatted.hasImage,
          imageCount: formatted.imageCount,
          shopId: full.shopId,
          sizes: full.sizes || [],
          colors: full.colors || [],
        },
        quantity: qty,
        price,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
        shopId: full.shopId,
      });
    }

    res.json({ cartItems, unavailable });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Rate delivery experience
// @route   POST /api/orders/:id/feedback
// @access  Private (customer)
exports.submitDeliveryFeedback = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (order.status !== 'delivered' && order.status !== 'returned') {
      return res.status(400).json({ message: 'Feedback available only after delivery' });
    }
    if (order.deliveryFeedback?.rating) {
      return res.status(400).json({ message: 'Feedback already submitted' });
    }

    const rating = Number(req.body?.rating);
    const packagingRating = Number(req.body?.packagingRating);
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Delivery rating (1–5) is required' });
    }

    order.deliveryFeedback = {
      rating,
      packagingRating: packagingRating >= 1 && packagingRating <= 5 ? packagingRating : rating,
      comment: (req.body?.comment || '').slice(0, 500),
      submittedAt: new Date(),
    };
    order.timeline.push({
      status: 'feedback_submitted',
      description: `Delivery rated ${rating}/5`,
    });
    await order.save();

    res.json({ message: 'Thanks for your feedback!', order: await loadFullOrder(order._id) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Raise order-specific support ticket
// @route   POST /api/orders/:id/support
// @access  Private (customer)
exports.raiseSupportTicket = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const subject = (req.body?.subject || '').trim();
    const message = (req.body?.message || '').trim();
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    order.supportTickets.push({ subject, message, status: 'open' });
    order.timeline.push({
      status: 'support_ticket',
      description: `Support ticket: ${subject}`,
    });
    await order.save();

    res.status(201).json({
      message: 'Support ticket created. Our team will contact you shortly.',
      order: await loadFullOrder(order._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Live tracking snapshot for an order (last known rider GPS)
// @route   GET /api/orders/:id/tracking
// @access  Private (customer who owns order, or assigned delivery partner)
exports.getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('shopId', 'shopName address')
      .populate('deliveryBoyId', 'name phone lastLocation');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isOwner = order.userId?.toString() === req.user._id.toString();
    const isRider =
      order.deliveryBoyId &&
      (order.deliveryBoyId._id || order.deliveryBoyId).toString() === req.user._id.toString();

    if (!isOwner && !isRider && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to track this order' });
    }

    const coords = order.deliveryBoyId?.lastLocation?.coordinates;
    let lat = null;
    let lng = null;
    if (Array.isArray(coords) && coords.length === 2) {
      lng = coords[0];
      lat = coords[1];
    }

    res.status(200).json({
      orderId: order._id,
      status: order.status,
      deliveryAddress: order.deliveryAddress,
      shopAddress: order.shopId?.address || '',
      shopName: order.shopId?.shopName || '',
      estimatedDeliveryAt: order.estimatedDeliveryAt,
      deliveryMethod: order.deliveryMethod,
      deliverySlot: order.deliverySlot,
      rider: order.deliveryBoyId
        ? {
            name: order.deliveryBoyId.name,
            phone: order.deliveryBoyId.phone || null,
          }
        : null,
      location:
        lat != null && lng != null
          ? {
              lat,
              lng,
              lastUpdated: order.deliveryBoyId?.lastLocation?.lastUpdated || null,
            }
          : null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update order timeline
// @route   PUT /api/orders/:id/timeline
// @access  Private (vendor/admin/delivery)
exports.updateOrderTimeline = async (req, res) => {
  try {
    const { status, description } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    order.status = status;
    order.timeline.push({ status, description });
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify delivery OTP
// @route   POST /api/orders/:id/verify-delivery
// @access  Private (delivery)
exports.verifyDelivery = async (req, res) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.deliveryBoyId || order.deliveryBoyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this delivery.' });
    }

    if (order.deliveryOTP !== otp.toString()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    order.status = 'delivered';
    if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }
    order.timeline.push({ status: 'delivered', description: 'Order delivered successfully' });
    await order.save();

    const populatedOrder = await loadFullOrder(order._id);
    const io = req.app.get('io');
    emitOrderStatusUpdated(io, order, populatedOrder);

    res.json({ message: 'Delivery verified successfully', order: populatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
