const express = require('express');
const router = express.Router();
const {
  getShops,
  getShopById,
  getShopProducts,
  getFeaturedProducts,
  getPublicCategories,
  getProductsByCategory,
  addProductReview,
} = require('../controllers/shopController');
const { protect } = require('../middleware/authMiddleware');

// Public routes for fetching shop and product data
router.get('/', getShops);
router.get('/products/featured', getFeaturedProducts);
// Live categories created by vendors (customer sidebar)
router.get('/categories/public', getPublicCategories);
router.get('/category/:categoryName', getProductsByCategory);
router.post('/products/:id/reviews', protect, addProductReview);
router.get('/:id', getShopById);
router.get('/:id/products', getShopProducts);

module.exports = router;
