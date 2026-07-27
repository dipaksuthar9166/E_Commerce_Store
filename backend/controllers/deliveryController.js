const Order = require('../models/Order');
const { emitOrderStatusUpdated } = require('../utils/orderSocket');

// @desc    Get all available delivery tasks (orders accepted by shop but not assigned to a rider)
// @route   GET /api/delivery/tasks
// @access  Private (delivery)
exports.getAvailableTasks = async (req, res) => {
  try {
    const tasks = await Order.find({ status: 'ready_for_pickup', deliveryBoyId: { $exists: false } })
      .populate('shopId', 'shopName address location')
      .populate('userId', 'name email');
    
    // Format tasks to match frontend structure easily
    const formattedTasks = tasks.map(task => ({
      _id: task._id,
      shop: task.shopId?.shopName || 'Shop',
      shopAddress: task.shopId?.address || 'Shop Address',
      distance: '2.5 km', // Mock distance
      deliveryAddress: task.deliveryAddress,
      customer: task.userId?.name || 'Customer',
      phone: task.userId?.phone || '+91 99999 99999',
      earning: 40, // Flat ₹40 delivery fee
    }));

    res.status(200).json(formattedTasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Rider accepts a delivery task
// @route   PUT /api/delivery/orders/:id/accept
// @access  Private (delivery)
exports.acceptTask = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'ready_for_pickup' || order.deliveryBoyId) {
      return res.status(400).json({ message: 'Order has already been taken by another rider' });
    }

    order.deliveryBoyId = req.user._id;
    order.status = 'out_for_delivery';
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('shopId', 'shopName address')
      .populate('userId', 'name email phone')
      .populate('items.productId', 'name imagePath price discount_percent')
      .populate('deliveryBoyId', 'name phone');

    // Notify other riders + shop + customer (live Orders page)
    const io = req.app.get('io');
    if (io) {
      io.emit('taskTaken', order._id);
      emitOrderStatusUpdated(io, order, populatedOrder);
    }

    res.status(200).json({
      _id: order._id,
      shop: populatedOrder.shopId?.shopName,
      shopAddress: populatedOrder.shopId?.address,
      distance: '2.5 km',
      deliveryAddress: order.deliveryAddress,
      customer: populatedOrder.userId?.name,
      phone: populatedOrder.userId?.phone || '+91 99999 99999',
      earning: 40,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// @desc    Get rider statistics (earnings, delivery count, etc.)
// @route   GET /api/delivery/stats
// @access  Private (delivery)
exports.getRiderStats = async (req, res) => {
  try {
    const deliveriesDone = await Order.countDocuments({ deliveryBoyId: req.user._id, status: 'delivered' });
    const earnings = deliveriesDone * 40; // ₹40 per delivery
    const distanceCovered = (deliveriesDone * 2.5).toFixed(1); // 2.5 km mock per delivery

    // Get order history details
    const history = await Order.find({ deliveryBoyId: req.user._id })
      .populate('shopId', 'shopName address')
      .populate('userId', 'name phone')
      .sort({ updatedAt: -1 });

    const formattedHistory = history.map(item => ({
      _id: item._id,
      shop: item.shopId?.shopName || 'Shop',
      shopAddress: item.shopId?.address || '',
      deliveryAddress: item.deliveryAddress || '',
      customer: item.userId?.name || 'Customer',
      phone: item.userId?.phone || '+91 99999 99999',
      distance: '2.5 km',
      date: item.updatedAt,
      earning: 40,
      status: item.status,
    }));

    res.status(200).json({
      deliveriesDone,
      earnings,
      distanceCovered,
      history: formattedHistory,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
