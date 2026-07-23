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

const Category = require('../models/Category');

// @desc    Get all global categories
// @route   GET /api/admin/categories
// @access  Private (admin)
exports.getGlobalCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isGlobal: true }).sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a global category
// @route   POST /api/admin/categories
// @access  Private (admin)
exports.createGlobalCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const category = await Category.create({ name, isGlobal: true });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a global category
// @route   PUT /api/admin/categories/:id
// @access  Private (admin)
exports.updateGlobalCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, isGlobal: true },
      { name },
      { new: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a global category
// @route   DELETE /api/admin/categories/:id
// @access  Private (admin)
exports.deleteGlobalCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, isGlobal: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all orders across all shops
// @route   GET /api/admin/orders
// @access  Private (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('shopId', 'shopName')
      .populate('deliveryBoyId', 'name')
      .sort({ createdAt: -1 });
      
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const Config = require('../models/Config');

// @desc    Get system configuration
// @route   GET /api/admin/config
// @access  Private (admin)
exports.getConfig = async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({ commissionRate: 10 });
    }
    res.status(200).json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update system configuration
// @route   PUT /api/admin/config
// @access  Private (admin)
exports.updateConfig = async (req, res) => {
  try {
    const { commissionRate, banners } = req.body;
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({ commissionRate, banners });
    } else {
      if (commissionRate !== undefined) config.commissionRate = commissionRate;
      if (banners !== undefined) config.banners = banners;
      await config.save();
    }
    res.status(200).json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
