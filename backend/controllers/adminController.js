const User = require('../models/User');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get admin dashboard stats + pending shops + recent orders
// @route   GET /api/admin/dashboard
// @access  Private (admin)
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers  = await User.countDocuments();
    const totalShops  = await Shop.countDocuments();
    const totalOrders = await Order.countDocuments();
    const activeShops = await Shop.countDocuments({ isActive: true });

    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Pending shops = isActive: false (newly registered, not yet approved)
    const pendingShops = await Shop.find({ isActive: false })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent 10 orders across all shops
    const recentOrders = await Order.find()
      .populate('userId', 'name')
      .populate('shopId', 'shopName')
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedOrders = recentOrders.map((order) => ({
      _id: order._id,
      customer: order.userId?.name || 'Unknown',
      shop: order.shopId?.shopName || 'Unknown Shop',
      amount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
    }));

    const formattedPending = pendingShops.map((shop) => ({
      _id: shop._id,
      name: shop.shopName,
      vendor: shop.userId?.name || 'Unknown',
      email: shop.userId?.email || '',
      address: shop.address,
      category: shop.shopCategory || 'Other',
      createdAt: shop.createdAt,
    }));

    res.status(200).json({
      stats: {
        totalUsers,
        totalShops,
        totalOrders,
        totalRevenue,
        activeShops,
        pendingShopsCount: pendingShops.length,
      },
      pendingShops: formattedPending,
      recentOrders: formattedOrders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all shops with owner info + product count
// @route   GET /api/admin/shops
// @access  Private (admin)
exports.getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    // Get product count for each shop
    const shopIds = shops.map((s) => s._id);
    const productCounts = await Product.aggregate([
      { $match: { shopId: { $in: shopIds } } },
      { $group: { _id: '$shopId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(productCounts.map((p) => [p._id.toString(), p.count]));

    const enriched = shops.map((shop) => ({
      _id: shop._id,
      shopName: shop.shopName,
      vendor: shop.userId?.name || 'Unknown',
      email: shop.userId?.email || '',
      address: shop.address,
      shopCategory: shop.shopCategory,
      isActive: shop.isActive,
      isOnline: shop.isOnline,
      productCount: countMap.get(shop._id.toString()) || 0,
      createdAt: shop.createdAt,
    }));

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Approve / block a shop (toggle isActive)
// @route   PUT /api/admin/shops/:id/status
// @access  Private (admin)
exports.updateShopStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // If isActive is explicitly provided in body, use it; otherwise toggle
    shop.isActive = typeof isActive === 'boolean' ? isActive : !shop.isActive;
    await shop.save();

    res.status(200).json({
      message: `Shop has been ${shop.isActive ? 'activated' : 'deactivated'}`,
      shop,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all users (excluding passwords)
// @route   GET /api/admin/users
// @access  Private (admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Ban or unban a user (toggle isActive)
// @route   PUT /api/admin/users/:id/status
// @access  Private (admin)
exports.updateUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot ban an admin user' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      message: `User has been ${user.isActive ? 'unbanned' : 'banned'}`,
      user: { _id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get admin platform finances
// @route   GET /api/admin/finances
// @access  Private (admin)
exports.getAdminFinances = async (req, res) => {
  try {
    const deliveredOrders = await Order.find({ status: 'delivered' });
    const totalSales = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const platformCommission = Math.round(totalSales * 0.1);

    const totalRiderDeliveries = await Order.countDocuments({
      status: 'delivered',
      deliveryBoyId: { $exists: true, $ne: null },
    });
    const riderPayouts = totalRiderDeliveries * 40;

    const netProfit = platformCommission - riderPayouts;

    res.status(200).json({
      totalSales,
      platformCommission,
      riderPayouts,
      netProfit,
      totalOrdersCount:  await Order.countDocuments(),
      activeShopsCount:  await Shop.countDocuments({ isActive: true }),
      activeRidersCount: await User.countDocuments({ role: 'delivery', isActive: true }),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
