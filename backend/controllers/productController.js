const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

/**
 * @desc    Fetch all products (Flipkart-style catalogue) with optional search / filters
 * @route   GET /api/products
 * @access  Public
 */
exports.getProducts = asyncHandler(async (req, res) => {
  const filter = {};
  const search = req.query.search || req.query.keyword || '';

  if (req.query.tag) {
    filter.promo_tag = req.query.tag;
  }

  if (search.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
      { category: { $regex: search.trim(), $options: 'i' } },
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

  const limit = Math.min(Number(req.query.limit) || 100, 200);

  const products = await Product.find(filter)
    .populate('shopId', 'shopName isOnline isActive')
    .sort({ createdAt: -1 })
    .limit(limit);

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

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.status(200).json(product);
});

// Backwards-compatible alias
exports.getAllProducts = exports.getProducts;
