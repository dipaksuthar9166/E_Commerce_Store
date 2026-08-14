const express = require('express');
const router = express.Router();
const {
  getCustomerChatHistory,
  getVendorConversations,
  getVendorChatHistory,
} = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Customer Chat Routes
router.get('/customer/:shopId', protect, getCustomerChatHistory);

// Vendor Chat Routes
router.get('/vendor/conversations', protect, authorize('vendor'), getVendorConversations);
router.get('/vendor/:userId', protect, authorize('vendor'), getVendorChatHistory);

module.exports = router;
