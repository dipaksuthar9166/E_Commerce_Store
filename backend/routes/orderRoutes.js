const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getOrderTracking,
  updateOrderTimeline,
  verifyDelivery,
  cancelOrder,
  modifyOrder,
  requestReturn,
  getRefundStatus,
  getInvoice,
  reorder,
  submitDeliveryFeedback,
  raiseSupportTicket,
} = require('../controllers/orderController');

// Customer places an order
router.post('/', protect, placeOrder);

// Customer views their own orders
router.get('/my', protect, getMyOrders);

// Customer cancels an order
router.put('/:id/cancel', protect, cancelOrder);

// Modify address / phone / notes before dispatch
router.put('/:id/modify', protect, modifyOrder);

// Return / exchange
router.post('/:id/return', protect, requestReturn);

// Refund status
router.get('/:id/refund', protect, getRefundStatus);

// Invoice (JSON or ?format=html)
router.get('/:id/invoice', protect, getInvoice);

// Re-order items into cart payload
router.post('/:id/reorder', protect, reorder);

// Delivery experience feedback
router.post('/:id/feedback', protect, submitDeliveryFeedback);

// Order-specific support ticket
router.post('/:id/support', protect, raiseSupportTicket);

// Live rider location snapshot
router.get('/:id/tracking', protect, getOrderTracking);

// Single order detail
router.get('/:id', protect, getOrderById);

router.put('/:id/timeline', protect, updateOrderTimeline);
router.post('/:id/verify-delivery', protect, verifyDelivery);

module.exports = router;
