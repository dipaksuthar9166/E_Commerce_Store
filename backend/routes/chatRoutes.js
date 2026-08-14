const express = require('express');
const router = express.Router();
const {
  getCustomerChatHistory,
  getVendorConversations,
  getVendorChatHistory,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { vendorProtect } = require('../middleware/vendorMiddleware');

// Customer Chat Routes
router.get('/customer/:shopId', protect, getCustomerChatHistory);

// Vendor Chat Routes
router.get('/vendor/conversations', vendorProtect, getVendorConversations);
router.get('/vendor/:userId', vendorProtect, getVendorChatHistory);

module.exports = router;
