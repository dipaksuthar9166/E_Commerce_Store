const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

// @desc    Customer places a new order
// @route   POST /api/orders
// @access  Private (customer)
exports.placeOrder = async (req, res) => {
    try {
        const { items, deliveryAddress, paymentMethod } = req.body;

        if (!items || !items.length || !deliveryAddress) {
            return res.status(400).json({ message: 'Items and deliveryAddress are required' });
        }

        // Group items by shopId
        const products = await Product.find({ _id: { $in: items.map(i => i.productId) } }).select('+shopId');
        const itemsByShop = {};

        for (const item of items) {
            const product = products.find(p => p._id.toString() === item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.productId} not found` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Not enough stock for ${product.name}. Only ${product.stock} left.` });
            }

            const shopId = product.shopId.toString();
            if (!itemsByShop[shopId]) {
                itemsByShop[shopId] = [];
            }

            const price = (product.discount_percent > 0)
                ? product.price * (1 - product.discount_percent / 100)
                : product.price;

            itemsByShop[shopId].push({
                productId: product._id,
                quantity: item.quantity,
                price: price,
            });
        }

        const createdOrders = [];
        const io = req.app.get('io');

        // Create a separate order for each shop
        for (const shopId in itemsByShop) {
            const shopItems = itemsByShop[shopId];
            const totalAmount = shopItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const order = new Order({
                userId: req.user._id,
                shopId,
                items: shopItems,
                totalAmount,
                deliveryAddress,
                paymentMethod: paymentMethod || 'cod',
                status: 'pending',
                deliveryOTP: Math.floor(1000 + Math.random() * 9000).toString(),
                timeline: [{ status: 'placed', description: 'Order placed successfully' }]
            });

            await order.save();
            createdOrders.push(order);

            // Atomically update stock and emit socket event for each order
            for (const item of shopItems) {
                await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
            }
            if (io) {
                const populatedOrder = await Order.findById(order._id).populate('userId', 'name email');
                io.to(`shop_${shopId}`).emit('newOrder', populatedOrder);
            }
        }

        res.status(201).json({ message: `${createdOrders.length} orders created successfully.`, orders: createdOrders });
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
    const orders = await Order.find({ userId: req.user._id })
      .populate('shopId', 'shopName address')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
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
    if (order.deliveryOTP !== otp.toString()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    order.status = 'delivered';
    order.timeline.push({ status: 'delivered', description: 'Order delivered successfully' });
    await order.save();
    res.json({ message: 'Delivery verified successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
