const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getActiveBanners,
  getVendorBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');

// Public: customer home slider
router.get('/active', getActiveBanners);

// Vendor banner management
router.get('/vendor', protect, authorize('vendor'), getVendorBanners);
router.post('/', protect, authorize('vendor'), createBanner);
router.put('/:id', protect, authorize('vendor'), updateBanner);
router.delete('/:id', protect, authorize('vendor'), deleteBanner);

module.exports = router;
