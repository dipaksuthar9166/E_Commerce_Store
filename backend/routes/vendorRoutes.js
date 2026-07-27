const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
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
  updateReturnStatus,
  getVendorEarnings,
  bulkUploadProducts,
  getVendorReviews,
  replyToReview,
  applyBulkDiscount,

  blockCustomer,
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
// Bulk upload route (must be before /products/:id)
router.post('/products/bulk', protect, authorize('vendor'), upload.fields([{ name: 'excel', maxCount: 1 }, { name: 'images', maxCount: 50 }]), bulkUploadProducts);
router.post('/products/bulk-discount', protect, authorize('vendor'), applyBulkDiscount);
router.post('/products', protect, authorize('vendor'), addVendorProduct);
router.put('/products/:id', protect, authorize('vendor'), updateProduct);
router.put('/products/:id/promo', protect, authorize('vendor'), updateProductPromotion);
router.get('/orders', protect, authorize('vendor'), getVendorOrders);
router.put('/orders/:id/status', protect, authorize('vendor'), updateOrderStatus);
router.put('/orders/:id/return', protect, authorize('vendor'), updateReturnStatus);
router.get('/earnings', protect, authorize('vendor'), getVendorEarnings);
router.get('/stats/today-activity', protect, authorize('vendor'), getTodayActivityStats);
router.get('/reviews', protect, authorize('vendor'), getVendorReviews);
router.post('/reviews/:productId/:reviewId/reply', protect, authorize('vendor'), replyToReview);

router.put('/customers/:userId/block', protect, authorize('vendor'), blockCustomer);

module.exports = router;
