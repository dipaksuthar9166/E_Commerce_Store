const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getVendorDashboard,
  toggleShopOnline,
  getVendorCategories,
  addVendorCategory,
  getVendorProducts,
  lookupProductByBarcode,
  addVendorProduct,
  updateProduct,
  updateProductPromotion,
  getVendorOrders,
  updateOrderStatus,
  getVendorEarnings,
} = require('../controllers/vendorController');
const { getTodayActivityStats } = require('../controllers/vendorStatsController');

// Routes
router.get('/dashboard', protect, authorize('vendor'), getVendorDashboard);
router.put('/shop/toggle-online', protect, authorize('vendor'), toggleShopOnline);
router.get('/categories', protect, authorize('vendor'), getVendorCategories);
router.post('/categories', protect, authorize('vendor'), addVendorCategory);
router.get('/products', protect, authorize('vendor'), getVendorProducts);
// Barcode auto-fill — must be registered BEFORE /products/:id routes
router.get('/products/lookup/:barcode', protect, authorize('vendor'), lookupProductByBarcode);
router.post('/products', protect, authorize('vendor'), addVendorProduct);
router.put('/products/:id', protect, authorize('vendor'), updateProduct);
router.put('/products/:id/promo', protect, authorize('vendor'), updateProductPromotion);
router.get('/orders', protect, authorize('vendor'), getVendorOrders);
router.put('/orders/:id/status', protect, authorize('vendor'), updateOrderStatus);
router.get('/earnings', protect, authorize('vendor'), getVendorEarnings);
router.get('/stats/today-activity', protect, authorize('vendor'), getTodayActivityStats);

module.exports = router;
