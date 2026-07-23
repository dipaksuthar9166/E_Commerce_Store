const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getVendorCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
} = require('../controllers/couponController');

// Vendor Routes
router.get('/vendor', protect, authorize('vendor'), getVendorCoupons);
router.post('/vendor', protect, authorize('vendor'), createCoupon);
router.put('/vendor/:id', protect, authorize('vendor'), updateCoupon);
router.delete('/vendor/:id', protect, authorize('vendor'), deleteCoupon);

// Customer Route
router.post('/validate', protect, validateCoupon);

module.exports = router;
