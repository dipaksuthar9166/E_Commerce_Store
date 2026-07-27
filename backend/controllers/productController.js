const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

/**
 * @desc    Fetch all products (Flipkart-style catalogue) with optional search / filters
 * @route   GET /api/products
 * @access  Public
 */
exports.getProducts = asyncHandler(async (req, res) => {
  const Shop = require('../models/Shop');

  // Lean shop id list only — avoid full documents
  const activeShops = await Shop.find({ isActive: true, isOnline: true })
    .select('_id')
    .lean();
  const activeShopIds = activeShops.map((shop) => shop._id);

  // No open shops → empty catalogue (skip product scan)
  if (activeShopIds.length === 0) {
    res.set('Cache-Control', 'public, max-age=30');
    return res.status(200).json([]);
  }

  const filter = {
    shopId: { $in: activeShopIds },
  };
  const search = req.query.search || req.query.keyword || '';

  if (req.query.tag) {
    filter.promo_tag = req.query.tag;
  }

  if (search.trim()) {
    const q = search.trim();
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
    ];
  }

  if (req.query.maxPrice) {
    const max = Number(req.query.maxPrice);
    if (!Number.isNaN(max) && max > 0) {
      filter.price = { ...(filter.price || {}), $lte: max };
    }
  }

  if (req.query.minPrice) {
    const min = Number(req.query.minPrice);
    if (!Number.isNaN(min) && min >= 0) {
      filter.price = { ...(filter.price || {}), $gte: min };
    }
  }

  if (req.query.rating) {
    const rating = Number(req.query.rating);
    if (!Number.isNaN(rating) && rating > 0) {
      filter.averageRating = { $gte: rating };
    }
  }

  const limit = Math.min(Number(req.query.limit) || 48, 100);

  // List views don't need full review arrays — keeps payload small & fast
  const products = await Product.find(filter)
    .select(
      'name price imagePath images shopId category categoryId stock promo_tag discount_percent averageRating numReviews createdAt'
    )
    .populate('shopId', 'shopName isOnline isActive')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.set('Cache-Control', 'public, max-age=20');
  res.status(200).json(products);
});

/**
 * @desc    Get single product by id
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('shopId', 'shopName address isOnline isActive')
    .populate('categoryId', 'name');

  if (!product || !product.shopId || !product.shopId.isActive || !product.shopId.isOnline) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.status(200).json(product);
});

// Backwards-compatible alias
exports.getAllProducts = exports.getProducts;

/**
 * @desc    Get related products by category
 * @route   GET /api/products/:id/related
 * @access  Public
 */
exports.getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // First, find all shops that are active and online
  const activeShops = await require('../models/Shop').find({ isActive: true, isOnline: true }).select('_id');
  const activeShopIds = activeShops.map(shop => shop._id);

  const related = await Product.find({
    categoryId: product.categoryId,
    _id: { $ne: product._id },
    shopId: { $in: activeShopIds } // Only from active shops
  })
    .populate('shopId', 'shopName isOnline isActive')
    .limit(8)
    .sort({ createdAt: -1 });

  res.status(200).json(related);
});
