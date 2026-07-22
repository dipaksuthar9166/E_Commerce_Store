const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const { generateProductPrompt } = require('../utils/promptGenerator');
const { generateAndStoreImage } = require('../services/aiImageService');


const COMMISSION_RATE = 0.1;

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const dayLabel = (d) =>
  d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

// @desc    Get vendor dashboard info + trend charts
// @route   GET /api/vendor/dashboard
// @access  Private (vendor)
exports.getVendorDashboard = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    const totalProducts = await Product.countDocuments({ shopId: shop._id });
    const totalOrders = await Order.countDocuments({ shopId: shop._id });
    const pendingOrders = await Order.countDocuments({ shopId: shop._id, status: 'pending' });

    const todayStart = startOfDay();
    const weekStart = startOfDay();
    weekStart.setDate(weekStart.getDate() - 6);

    // All orders in last 7 days (for trends)
    const weekOrders = await Order.find({
      shopId: shop._id,
      createdAt: { $gte: weekStart },
    })
      .select('totalAmount status createdAt userId')
      .lean();

    const todayOrdersList = weekOrders.filter((o) => new Date(o.createdAt) >= todayStart);
    const todayOrders = todayOrdersList.length;

    // Sales/profit: count all non-cancelled as gross pipeline; delivered as realized
    const nonCancelledToday = todayOrdersList.filter((o) => o.status !== 'cancelled');
    const todayGross = nonCancelledToday.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const todayDelivered = todayOrdersList.filter((o) => o.status === 'delivered');
    const todaySales = todayDelivered.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const todayCommission = Math.round(todaySales * COMMISSION_RATE);
    const todayProfit = todaySales - todayCommission;

    const todayClientIds = new Set(
      todayOrdersList
        .map((o) => (o.userId ? String(o.userId) : null))
        .filter(Boolean)
    );
    const todayClients = todayClientIds.size;

    // Hourly activity today (sales + orders + clients)
    const chartBuckets = [
      { hour: 8, time: '8 AM' },
      { hour: 10, time: '10 AM' },
      { hour: 12, time: '12 PM' },
      { hour: 14, time: '2 PM' },
      { hour: 16, time: '4 PM' },
      { hour: 18, time: '6 PM' },
      { hour: 20, time: '8 PM' },
    ];
    const hourMap = Object.fromEntries(
      chartBuckets.map((b) => [b.hour, { sales: 0, orders: 0, clients: new Set() }])
    );

    todayOrdersList.forEach((order) => {
      let h = new Date(order.createdAt).getHours();
      if (h % 2 !== 0) h -= 1;
      if (h < 8) h = 8;
      if (h > 20) h = 20;
      if (!hourMap[h]) return;
      hourMap[h].sales += order.totalAmount || 0;
      hourMap[h].orders += 1;
      if (order.userId) hourMap[h].clients.add(String(order.userId));
    });

    const chartData = chartBuckets.map(({ hour, time }) => ({
      time,
      sales: hourMap[hour].sales,
      orders: hourMap[hour].orders,
      clients: hourMap[hour].clients.size,
      profit: Math.round(hourMap[hour].sales * (1 - COMMISSION_RATE)),
    }));

    // 7-day trend
    const weekTrend = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = startOfDay();
      day.setDate(day.getDate() - i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);

      const dayOrders = weekOrders.filter((o) => {
        const t = new Date(o.createdAt);
        return t >= day && t < next;
      });
      const active = dayOrders.filter((o) => o.status !== 'cancelled');
      const delivered = dayOrders.filter((o) => o.status === 'delivered');
      const gross = active.reduce((s, o) => s + (o.totalAmount || 0), 0);
      const sales = delivered.reduce((s, o) => s + (o.totalAmount || 0), 0);
      const clients = new Set(
        dayOrders.map((o) => (o.userId ? String(o.userId) : null)).filter(Boolean)
      ).size;

      weekTrend.push({
        day: dayLabel(day),
        date: day.toISOString().slice(0, 10),
        orders: dayOrders.length,
        clients,
        sales,
        gross,
        profit: Math.round(sales * (1 - COMMISSION_RATE)),
        commission: Math.round(sales * COMMISSION_RATE),
      });
    }

    // Order status breakdown (all-time counts for pie)
    const statusKeys = [
      'pending',
      'accepted',
      'packing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ];
    const statusBreakdown = await Promise.all(
      statusKeys.map(async (status) => ({
        status,
        count: await Order.countDocuments({ shopId: shop._id, status }),
      }))
    );

    res.status(200).json({
      shop,
      stats: {
        totalProducts,
        totalOrders,
        pendingOrders,
        todayOrders,
        todaySales,
        todayGross,
        todayProfit,
        todayCommission,
        todayClients,
        commissionRate: COMMISSION_RATE,
      },
      chartData,
      weekTrend,
      statusBreakdown: statusBreakdown.filter((s) => s.count > 0),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Toggle shop online/offline status
// @route   PUT /api/vendor/shop/toggle-online
// @access  Private (vendor)
exports.toggleShopOnline = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    shop.isOnline = !shop.isOnline;
    await shop.save();

    res.status(200).json({
      message: `Shop is now ${shop.isOnline ? 'online' : 'offline'}`,
      isOnline: shop.isOnline,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all categories for vendor's shop
// @route   GET /api/vendor/categories
// @access  Private (vendor)
exports.getVendorCategories = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    // N+1 समस्या को ठीक करने के लिए अनुकूलित कोड
    const categories = await Category.find({ shopId: shop._id }).sort({ createdAt: -1 }).lean();

    const productCounts = await Product.aggregate([
        { $match: { shopId: shop._id } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } }
    ]);

    const countsMap = new Map(productCounts.map(item => [item._id?.toString(), item.count]));

    const categoriesWithCounts = categories.map(category => ({
        ...category,
        productCount: countsMap.get(category._id.toString()) || 0
    }));

    res.status(200).json(categoriesWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new category for vendor's shop
// @route   POST /api/vendor/categories
// @access  Private (vendor)
exports.addVendorCategory = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const normalizedName = name.trim();
    const existingCategory = await Category.findOne({
      shopId: shop._id,
      name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });

    if (existingCategory) {
      return res.status(200).json(existingCategory);
    }

    const category = await Category.create({ shopId: shop._id, name: normalizedName });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all products for vendor's shop
// @route   GET /api/vendor/products
// @access  Private (vendor)
exports.getVendorProducts = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    const products = await Product.find({ shopId: shop._id }).populate('categoryId', 'name').sort({ createdAt: -1 });
    const formattedProducts = products.map((product) => ({
      ...product.toObject(),
      categoryName: product.categoryId?.name || '',
    }));

    res.status(200).json(formattedProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a new product to vendor's shop with AI Image Generation
// @route   POST /api/vendor/products
// @access  Private (vendor)
exports.addVendorProduct = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    const { name, price, stock, description, categoryId, categoryName, color } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    let resolvedCategory;
    if (categoryId) {
      resolvedCategory = await Category.findById(categoryId);
    } else if (categoryName && categoryName.trim()) {
      const normalizedName = categoryName.trim();
      resolvedCategory = await Category.findOne({
        shopId: shop._id,
        name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      });
      if (!resolvedCategory) {
        resolvedCategory = await Category.create({ shopId: shop._id, name: normalizedName });
      }
    }

    // --- AI Image Generation Step ---
    const prompt = generateProductPrompt(name, color, resolvedCategory?.name);
    const generatedImagePath = await generateAndStoreImage(prompt);
    // --- End of AI Step ---

    const product = await Product.create({
      shopId: shop._id,
      name,
      price,
      color, // Assuming 'color' field exists in Product model
      stock: stock || 0,
      description: description || '',
      categoryId: resolvedCategory?._id,
      imagePath: generatedImagePath, // Use the AI-generated image
    });

    const populatedProduct = await Product.findById(product._id).populate('categoryId', 'name');
    res.status(201).json({
      ...populatedProduct.toObject(),
      categoryName: populatedProduct.categoryId?.name || '',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/vendor/products/:id
 * @access  Private/Vendor
 */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Ensure product belongs to the vendor
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found for this vendor' });
    }

    if (product.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const { name, price, stock, description, barcode, categoryId, imagePath, color } = req.body;

    // NOTE: Image regeneration on update is not included in this scaffold.
    // The original imagePath from the request will be used if provided.
    // You could add logic here to regenerate the image if name or color changes.

    product.name = name ?? product.name;
    product.price = price ?? product.price;
    product.stock = stock ?? product.stock;
    product.description = description ?? product.description;
    product.barcode = barcode ?? product.barcode;
    product.categoryId = categoryId || undefined;
    product.imagePath = imagePath ?? product.imagePath;
    product.color = color ?? product.color; // Assuming 'color' field exists

    const updatedProduct = await product.save();

    const populatedProduct = await Product.findById(updatedProduct._id).populate('categoryId', 'name');
    
    res.json({
      ...populatedProduct.toObject(),
      categoryName: populatedProduct.categoryId ? populatedProduct.categoryId.name : '',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
};
// @desc    Get all orders for vendor's shop
// @route   GET /api/vendor/orders
// @access  Private (vendor)
exports.getVendorOrders = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    const orders = await Order.find({ shopId: shop._id })
      .populate('userId', 'name email')
      .populate('items.productId', 'name imagePath price')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update order status (accept / reject)
// @route   PUT /api/vendor/orders/:id/status
// @access  Private (vendor)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'accepted', 'packing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, shopId: shop._id },
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found or does not belong to your shop' });
    }

    // Emit real-time event to the shop's room
    const io = req.app.get('io');
    if (io) {
      io.to(`shop_${shop._id}`).emit('orderStatusUpdated', order);
      
      // If vendor marks order as ready, make it available to all riders
      if (status === 'ready_for_pickup') {
        const populatedOrderForRider = await Order.findById(order._id)
          .populate('shopId', 'shopName address location')
          .populate('userId', 'name phone');

        const formattedTask = {
          _id: populatedOrderForRider._id,
          shop: populatedOrderForRider.shopId?.shopName || 'Shop',
          shopAddress: populatedOrderForRider.shopId?.address || 'Shop Address',
          distance: '2.5 km', // Mock distance
          deliveryAddress: populatedOrderForRider.deliveryAddress,
          customer: populatedOrderForRider.userId?.name || 'Customer',
          phone: populatedOrderForRider.userId?.phone || '+91 99999 99999',
          earning: 40, // Flat ₹40 delivery fee
        };
        io.emit('taskAvailable', formattedTask);
      }
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get vendor earnings statistics
// @route   GET /api/vendor/earnings
// @access  Private (vendor)
exports.getVendorEarnings = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop found for this vendor' });
    }

    const deliveredOrders = await Order.find({ shopId: shop._id, status: 'delivered' });
    
    const grossSales = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const platformCommission = Math.round(grossSales * 0.1);
    const netEarnings = grossSales - platformCommission;

    const totalOrdersCount = await Order.countDocuments({ shopId: shop._id });
    const deliveredCount = deliveredOrders.length;
    const cancelledCount = await Order.countDocuments({ shopId: shop._id, status: 'cancelled' });

    // Recent 5 sales
    const recentSales = await Order.find({ shopId: shop._id, status: 'delivered' })
      .populate('userId', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    const formattedSales = recentSales.map(order => ({
      _id: order._id,
      customer: order.userId?.name || 'Customer',
      date: order.updatedAt,
      amount: order.totalAmount,
      earning: Math.round(order.totalAmount * 0.9),
    }));

    res.status(200).json({
      grossSales,
      platformCommission,
      netEarnings,
      totalOrdersCount,
      deliveredCount,
      cancelledCount,
      recentSales: formattedSales,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update promotional details for a product
// @route   PUT /api/vendor/products/:id/promo
// @access  Private (Vendor)
exports.updateProductPromotion = async (req, res) => {
  try {
    const { promo_tag, discount_percent } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // सुनिश्चित करें कि प्रोडक्ट उसी वेंडर का है जो लॉग-इन है
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop || product.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to update this product' });
    }

    // प्रोडक्ट में प्रमोशनल जानकारी अपडेट करें
    product.promo_tag = promo_tag || null;
    product.discount_percent = discount_percent || 0;

    const updatedProduct = await product.save();

    const populatedProduct = await Product.findById(updatedProduct._id).populate('categoryId', 'name');

    res.status(200).json({
      ...populatedProduct.toObject(),
      categoryName: populatedProduct.categoryId ? populatedProduct.categoryId.name : '',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
