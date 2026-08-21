const mongoose = require('mongoose');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { sendSms } = require('../services/smsService');
const { emitOrderStatusUpdated } = require('../utils/orderSocket');
const { sendPushNotification } = require('../services/notificationService');

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

        // Push notification to Vendor
        const shop = await Shop.findById(shopId).populate('userId');
        if (shop && shop.userId) {
          await sendPushNotification(shop.userId, {
            title: 'New Order Received! 🛒',
            body: `You have received a new order for ₹${order.totalAmount}.`,
            url: `/vendor/orders/${order._id}`
          });
        }
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
      const isPaid = order.paymentStatus === 'paid' || order.status === 'delivered' || order.paymentMethod === 'cod';
      const isDelivered = order.status === 'delivered';
      const isCancelled = order.status === 'cancelled';
      const statusColor = {
        pending: '#f59e0b', accepted: '#3b82f6', packing: '#06b6d4',
        ready_for_pickup: '#0ea5e9', out_for_delivery: '#8b5cf6',
        delivered: '#10b981', cancelled: '#ef4444',
      }[order.status] || '#6b7280';
      const statusLabel = {
        pending: 'Pending', accepted: 'Accepted', packing: 'Packing',
        ready_for_pickup: 'Shipped', out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered ✓', cancelled: 'Cancelled',
      }[order.status] || order.status;
      const payLabel = {
        cod: 'Cash on Delivery', upi: 'UPI', card: 'Credit / Debit Card',
        netbanking: 'Net Banking', emi: 'EMI', pay_later: 'Pay Later',
      }[order.paymentMethod] || (order.paymentMethod || '').toUpperCase();
      const savings = invoice.breakup.savings || invoice.breakup.discount || 0;
      const watermarkText = isCancelled ? 'CANCELLED' : (isPaid ? 'PAID' : 'UNPAID');
      const watermarkColor = isCancelled ? 'rgba(239,68,68,0.07)' : (isPaid ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)');
      const rows = lineItems.map((item) => `
        <tr>
          <td>
            <div style="font-weight:600;color:#0f172a;font-size:14px">${item.name}</div>
            <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap">
              ${item.size ? `<span style="font-size:10px;font-weight:600;background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:20px">Size: ${item.size}</span>` : ''}
              ${item.color ? `<span style="font-size:10px;font-weight:600;background:#f3e8ff;color:#7c3aed;padding:2px 8px;border-radius:20px">Color: ${item.color}</span>` : ''}
            </div>
          </td>
          <td style="text-align:center;font-size:15px;font-weight:700;color:#334155">${item.quantity}</td>
          <td style="text-align:right;color:#64748b;font-size:13px">&#8377;${Number(item.unitPrice).toFixed(2)}</td>
          <td style="text-align:right;font-weight:800;font-size:15px;color:#1e40af">&#8377;${Number(item.lineTotal).toFixed(2)}</td>
        </tr>`).join('');
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>MERSKO &bull; ${invoiceNo}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',system-ui,sans-serif;background:#e2e8f0;color:#0f172a;min-height:100vh;padding:28px 16px}
    .wrap{max-width:800px;margin:0 auto}
    .action-bar{display:flex;justify-content:flex-end;gap:10px;margin-bottom:14px}
    .btn{padding:10px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:all .15s}
    .btn-ghost{background:#fff;color:#475569;box-shadow:0 1px 4px rgba(0,0,0,.1)}
    .btn-primary{background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.3)}
    .card{background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 6px rgba(15,23,42,.04),0 24px 60px rgba(15,23,42,.12);position:relative}
    .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:110px;font-weight:900;letter-spacing:10px;color:${watermarkColor};pointer-events:none;user-select:none;white-space:nowrap;z-index:0;font-style:italic}
    .header{background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#6d28d9 100%);padding:38px 44px 42px;position:relative;overflow:hidden;z-index:1}
    .header::before{content:'';position:absolute;width:340px;height:340px;background:rgba(255,255,255,.06);border-radius:50%;top:-120px;right:-80px;pointer-events:none}
    .header::after{content:'';position:absolute;width:200px;height:200px;background:rgba(255,255,255,.04);border-radius:50%;bottom:-80px;left:80px;pointer-events:none}
    .hinner{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap}
    .brand{font-size:32px;font-weight:900;color:#fff;letter-spacing:-1.5px;line-height:1}
    .brand em{color:rgba(255,255,255,.4);font-style:normal}
    .brand-sub{font-size:11px;font-weight:500;color:rgba(255,255,255,.5);margin-top:4px;letter-spacing:.3px}
    .inv-right{text-align:right}
    .inv-cap{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.5);margin-bottom:3px}
    .inv-num{font-size:26px;font-weight:900;color:#fff;letter-spacing:-.5px;line-height:1}
    .inv-meta{font-size:12px;color:rgba(255,255,255,.5);margin-top:5px}
    .status-pill{display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:8px 18px;border-radius:100px;background:rgba(255,255,255,.15);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.2);font-size:12px;font-weight:700;color:#fff;letter-spacing:.3px}
    .sdot{width:8px;height:8px;border-radius:50%;background:${statusColor};box-shadow:0 0 0 3px rgba(255,255,255,.2);flex-shrink:0}
    .savings{background:linear-gradient(90deg,#065f46,#047857,#065f46);padding:13px 44px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1}
    .sav-text{font-size:13px;font-weight:600;color:rgba(255,255,255,.8)}
    .sav-amt{font-size:20px;font-weight:900;color:#6ee7b7;letter-spacing:-.5px}
    .body{padding:40px 44px;position:relative;z-index:1}
    .parties{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:36px}
    .party{border-radius:14px;padding:20px 22px;border:1.5px solid}
    .bill{background:#eff6ff;border-color:#bfdbfe}
    .sold{background:#faf5ff;border-color:#e9d5ff}
    .ptag{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;display:flex;align-items:center;gap:7px}
    .bill .ptag{color:#1d4ed8}
    .sold .ptag{color:#6d28d9}
    .ptag::before{content:'';width:3px;height:13px;border-radius:2px;display:inline-block;flex-shrink:0}
    .bill .ptag::before{background:#2563eb}
    .sold .ptag::before{background:#7c3aed}
    .pname{font-size:16px;font-weight:800;color:#0f172a;margin-bottom:6px}
    .pdetail{font-size:12.5px;color:#64748b;line-height:1.7}
    .sec{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:14px;display:flex;align-items:center;gap:10px}
    .sec::after{content:'';flex:1;height:1px;background:linear-gradient(to right,#e2e8f0,transparent)}
    table{width:100%;border-collapse:separate;border-spacing:0;border-radius:14px;overflow:hidden;border:1.5px solid #e2e8f0;margin-bottom:28px}
    thead tr{background:linear-gradient(135deg,#1e3a8a,#3730a3)}
    thead th{padding:13px 18px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.85)}
    tbody tr:nth-child(odd){background:#fff}
    tbody tr:nth-child(even){background:#f8faff}
    tbody tr{border-bottom:1px solid #f1f5f9}
    tbody tr:last-child{border-bottom:none}
    td{padding:14px 18px;vertical-align:top}
    .swrap{display:flex;justify-content:flex-end;margin-bottom:30px}
    .summary{width:310px;border-radius:14px;overflow:hidden;border:1.5px solid #e2e8f0}
    .srow{display:flex;justify-content:space-between;padding:11px 18px;font-size:13.5px;border-bottom:1px solid #f8fafc}
    .srow:last-child{border-bottom:none}
    .slabel{color:#64748b;font-weight:500}
    .sval{font-weight:600;color:#0f172a}
    .srow.disc .sval{color:#10b981;font-weight:700}
    .srow.free .sval{color:#10b981;font-weight:700}
    .grand{background:linear-gradient(135deg,#1e3a8a,#4338ca);padding:17px 18px;display:flex;justify-content:space-between;align-items:center}
    .gl{color:rgba(255,255,255,.7);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
    .gv{color:#fff;font-size:25px;font-weight:900;letter-spacing:-.8px}
    .chips{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:30px}
    .chip{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:13px 16px}
    .clabel{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:5px}
    .cval{font-size:14px;font-weight:700;color:#0f172a}
    .guide{background:linear-gradient(135deg,#fffbeb,#fefce8);border:1.5px solid #fde68a;border-radius:14px;padding:20px 22px}
    .gtitle{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#92400e;margin-bottom:12px}
    .glist{display:flex;flex-direction:column;gap:8px}
    .gi{display:flex;gap:10px;font-size:12.5px;color:#78350f;line-height:1.55}
    .garr{color:#f59e0b;font-weight:900;flex-shrink:0}
    .footer{background:linear-gradient(135deg,#0c1222,#162032);padding:30px 44px;text-align:center}
    .flogo{font-size:22px;font-weight:900;color:#fff;letter-spacing:-1px;margin-bottom:3px}
    .flogo em{color:rgba(255,255,255,.35);font-style:normal}
    .ftag{font-size:11.5px;color:rgba(255,255,255,.38);margin-bottom:18px}
    .fline{height:1px;background:linear-gradient(to right,transparent,rgba(255,255,255,.1),transparent);margin-bottom:14px}
    .fnote{font-size:11.5px;color:rgba(255,255,255,.32);line-height:1.8}
    .fnote a{color:rgba(255,255,255,.5);text-decoration:none}
    @media print{
      body{background:#fff;padding:0}
      .action-bar{display:none}
      .card{box-shadow:none;border-radius:0}
      .watermark{font-size:150px}
    }
    @media(max-width:580px){
      .parties,.chips{grid-template-columns:1fr}
      .summary{width:100%}
      .header,.body,.footer{padding-left:22px;padding-right:22px}
      .savings{padding-left:22px;padding-right:22px}
      .hinner{flex-direction:column}
      .inv-right{text-align:left}
    }
  </style>
</head>
<body>
<div class="wrap">
  <div class="action-bar">
    <button class="btn btn-ghost" onclick="window.close()">&#x2715;&nbsp; Close</button>
    <button class="btn btn-primary" onclick="window.print()">&#128424;&nbsp; Print / Save PDF</button>
  </div>
  <div class="card">
    <div class="watermark">${watermarkText}</div>
    <div class="header">
      <div class="hinner">
        <div>
          <div class="brand">MERSKO<em>.</em></div>
          <div class="brand-sub">Your Trusted Local Shopping Partner</div>
          <div class="status-pill"><div class="sdot"></div>${statusLabel}</div>
        </div>
        <div class="inv-right">
          <div class="inv-cap">Tax Invoice</div>
          <div class="inv-num">${invoiceNo}</div>
          <div class="inv-meta">Order #${String(order._id).slice(-8).toUpperCase()}</div>
          <div class="inv-meta">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    </div>
    ${savings > 0 ? `<div class="savings"><span class="sav-text">&#127881; You saved on this order!</span><span class="sav-amt">&#8722; &#8377;${Number(savings).toFixed(2)}</span></div>` : ''}
    <div class="body">
      <div class="parties">
        <div class="party bill">
          <div class="ptag">Bill To</div>
          <div class="pname">${invoice.customer.name}</div>
          <div class="pdetail">${invoice.customer.email ? invoice.customer.email + '<br>' : ''}${invoice.customer.phone ? '&#128222; ' + invoice.customer.phone + '<br>' : ''}${invoice.deliveryAddress ? '&#128205; ' + invoice.deliveryAddress : ''}</div>
        </div>
        <div class="party sold">
          <div class="ptag">Sold By</div>
          <div class="pname">${invoice.shop.name}</div>
          <div class="pdetail">${invoice.shop.address ? '&#128205; ' + invoice.shop.address : 'MERSKO Platform Seller'}</div>
        </div>
      </div>
      <div class="sec">Order Items</div>
      <table>
        <thead><tr>
          <th style="text-align:left">Item Description</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Amount</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="swrap">
        <div class="summary">
          <div class="srow"><span class="slabel">Subtotal</span><span class="sval">&#8377;${Number(invoice.breakup.subtotal).toFixed(2)}</span></div>
          ${invoice.breakup.discount > 0 ? `<div class="srow disc"><span class="slabel">Discount${invoice.couponCode ? ' (' + invoice.couponCode + ')' : ''}</span><span class="sval">&#8722; &#8377;${Number(invoice.breakup.discount).toFixed(2)}</span></div>` : ''}
          <div class="srow${invoice.breakup.deliveryFee <= 0 ? ' free' : ''}"><span class="slabel">Delivery Fee</span><span class="sval">${invoice.breakup.deliveryFee > 0 ? '&#8377;' + Number(invoice.breakup.deliveryFee).toFixed(2) : 'FREE'}</span></div>
          ${invoice.breakup.platformFee > 0 ? `<div class="srow"><span class="slabel">Platform Fee</span><span class="sval">&#8377;${Number(invoice.breakup.platformFee).toFixed(2)}</span></div>` : ''}
          <div class="srow"><span class="slabel">GST (5%)</span><span class="sval">&#8377;${Number(invoice.breakup.tax).toFixed(2)}</span></div>
          <div class="grand"><span class="gl">Total Payable</span><span class="gv">&#8377;${Number(invoice.breakup.total).toFixed(2)}</span></div>
        </div>
      </div>
      <div class="sec">Payment Details</div>
      <div class="chips">
        <div class="chip"><div class="clabel">Payment Method</div><div class="cval">&#128179; ${payLabel}</div></div>
        <div class="chip"><div class="clabel">Payment Status</div><div class="cval" style="color:${isPaid ? '#10b981' : '#f59e0b'}">${isPaid ? '&#9989; Paid' : '&#8987; Pending'}</div></div>
        <div class="chip"><div class="clabel">Invoice Date</div><div class="cval">&#128197; ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div></div>
        <div class="chip"><div class="clabel">Delivery Status</div><div class="cval" style="color:${statusColor}">&#9679; ${statusLabel}</div></div>
      </div>
      <div class="guide">
        <div class="gtitle">&#128203; Important Guidelines</div>
        <div class="glist">
          <div class="gi"><span class="garr">&#8594;</span><span>Computer-generated invoice. No physical signature required.</span></div>
          <div class="gi"><span class="garr">&#8594;</span><span>Return / exchange within <strong>7 days</strong> of delivery via MERSKO app.</span></div>
          <div class="gi"><span class="garr">&#8594;</span><span>Refund queries: <strong>support@mersko.app</strong> &mdash; quote Invoice No.</span></div>
          <div class="gi"><span class="garr">&#8594;</span><span>GST included as per applicable rates. Keep for warranty claims.</span></div>
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="flogo">MERSKO<em>.</em></div>
      <div class="ftag">Your Trusted Local Shopping Partner</div>
      <div class="fline"></div>
      <div class="fnote">Thank you for shopping with MERSKO! &#128204;<br/><a href="mailto:support@mersko.app">support@mersko.app</a> &nbsp;|&nbsp; mersko.app<br/>Auto-generated &mdash; no stamp or signature required.</div>
    </div>
  </div>
</div>
</body>
</html>`;

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
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    order.status = status;
    order.timeline.push({ status, description: description || '' });
    await order.save();

    const populatedOrder = await loadFullOrder(order._id);
    const io = req.app.get('io');
    emitOrderStatusUpdated(io, order, populatedOrder);

    // Push notification to Customer
    const user = await User.findById(order.userId);
    if (user) {
      await sendPushNotification(user, {
        title: 'Order Status Updated',
        body: `Your order status is now: ${status}. ${description}`,
        url: `/orders/${order._id}`
      });
    }

    res.json(populatedOrder);
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

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
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

    // Push notification to Customer
    const user = await User.findById(order.userId);
    if (user) {
      await sendPushNotification(user, {
        title: 'Order Delivered! 🎉',
        body: 'Your order has been successfully delivered. Thank you for shopping with MERSKO!',
        url: `/orders/${order._id}`
      });
    }

    res.json({ message: 'Delivery verified successfully', order: populatedOrder });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};