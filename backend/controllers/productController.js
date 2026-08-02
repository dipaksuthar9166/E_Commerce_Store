const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const {
  formatProductForClient,
  hasBinaryImages,
  isHttpUrl,
  toImageBuffer,
} = require('../utils/productImageHelper');

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

  // List views: never send binary image buffers (breaks production payloads)
  const products = await Product.find(filter)
    .select(
      'name price imagePath images shopId category categoryId stock promo_tag discount_percent averageRating numReviews createdAt'
    )
    .populate('shopId', 'shopName isOnline isActive')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.set('Cache-Control', 'public, max-age=20');
  res.status(200).json(products.map((p) => formatProductForClient(p)));
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

  const formatted = formatProductForClient(product);
  // Client builds gallery URLs from imageCount + /images/:index
  res.status(200).json(formatted);
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
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(related.map((p) => formatProductForClient(p)));
});

/**
 * @desc    Get the primary image for a single product
 * @route   GET /api/products/:id/image
 * @access  Public
 */
exports.getProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select('images imagePath');

  if (product && hasBinaryImages(product)) {
    const image = product.images[0];
    const buffer = toImageBuffer(image.data);
    if (buffer) {
      res.set({
        'Content-Type': image.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      });
      return res.send(buffer);
    }
  }

  // Redirect to external / cloud URL when no binary is stored
  if (product && isHttpUrl(product.imagePath)) {
    return res.redirect(302, product.imagePath);
  }

  return res.status(404).send('Not found');
});

/**
 * @desc    Get a specific image for a single product by index
 * @route   GET /api/products/:id/images/:index
 * @access  Public
 */
exports.getProductImageByIndex = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select('images imagePath');
  const index = parseInt(req.params.index, 10);

  if (
    product &&
    hasBinaryImages(product) &&
    !Number.isNaN(index) &&
    index >= 0 &&
    index < product.images.length
  ) {
    const image = product.images[index];
    const buffer = toImageBuffer(image.data);
    if (buffer) {
      res.set({
        'Content-Type': image.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      });
      return res.send(buffer);
    }
  }

  if (index === 0 && product && isHttpUrl(product.imagePath)) {
    return res.redirect(302, product.imagePath);
  }

  return res.status(404).send('Image not found');
});

