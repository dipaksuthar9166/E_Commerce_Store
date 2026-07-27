const Shop = require('../models/Shop');
const Product = require('../models/Product');

// Get all active shops
exports.getShops = async (req, res) => {
  try {
    const shops = await Shop.find({ isActive: true });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching shops', error: error.message });
  }
};

// Get single shop (no products)
exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching shop details', error: error.message });
  }
};

// Get products for a specific shop
exports.getShopProducts = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { shopId: req.params.id };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching shop products', error: error.message });
  }
};

// Get all / featured products (homepage + product catalogue)
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    // Default 8 for home; pass limit=100 for full catalogue
    const limit = Math.min(Number(req.query.limit) || 8, 200);
    const products = await Product.find(query)
      .limit(limit)
      .populate('shopId', 'shopName')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching products', error: error.message });
  }
};

/**
 * Public marketplace categories — built from what VENDORS create.
 * Same name across sellers merges into one customer tab (Flipkart style).
 * Only categories that have at least 1 product are returned.
 */
exports.getPublicCategories = async (req, res) => {
  try {
    const Category = require('../models/Category');

    const rows = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products',
        },
      },
      {
        $project: {
          name: 1,
          productCount: { $size: '$products' },
        },
      },
      { $match: { productCount: { $gt: 0 } } },
      {
        $group: {
          _id: { $toLower: '$name' },
          name: { $first: '$name' },
          productCount: { $sum: '$productCount' },
        },
      },
      { $sort: { productCount: -1, name: 1 } },
    ]);

    const categories = rows.map((row) => ({
      name: row.name,
      key: String(row.name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
      productCount: row.productCount,
    }));

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching categories', error: error.message });
  }
};

// Get products by category name (for category pages - like Flipkart)
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { search } = req.query;
    const Category = require('../models/Category');

    // Special: Top Offers = products with discount / promo
    if (/^offers$/i.test(categoryName) || /^top-offers$/i.test(categoryName) || /^top offers$/i.test(categoryName)) {
      let offerQuery = {
        $or: [
          { discount_percent: { $gt: 0 } },
          { promo_tag: { $nin: [null, ''] } },
        ],
      };
      if (search) {
        offerQuery = {
          $and: [
            offerQuery,
            {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
              ],
            },
          ],
        };
      }
      const offerProducts = await Product.find(offerQuery)
        .populate('shopId', 'shopName address')
        .populate('categoryId', 'name')
        .sort({ discount_percent: -1, createdAt: -1 })
        .limit(50);
      return res.json(offerProducts);
    }

    // Find all vendor categories that match this name (case-insensitive, all sellers)
    const categories = await Category.find({
      name: { $regex: `^${categoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });

    if (!categories || categories.length === 0) {
      return res.json([]);
    }

    const categoryIds = categories.map((c) => c._id);
    let query = { categoryId: { $in: categoryIds } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query)
      .populate('shopId', 'shopName address')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching category products', error: error.message });
  }
};

exports.addProductReview = async (req, res) => {
  try {
    const { rating, comment, images } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (!comment || !String(comment).trim()) {
      return res.status(400).json({ message: 'Review comment is required' });
    }

    const safeImages = Array.isArray(images)
      ? images.filter((u) => typeof u === 'string' && u.length < 500000).slice(0, 5)
      : [];

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment: String(comment).trim().slice(0, 1000),
      images: safeImages,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.averageRating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added', review });
  } catch (error) {
    res.status(500).json({ message: 'Server Error adding review', error: error.message });
  }
};
