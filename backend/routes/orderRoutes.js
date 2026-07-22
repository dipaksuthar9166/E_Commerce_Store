const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { placeOrder, getMyOrders, updateOrderTimeline, verifyDelivery } = require('../controllers/orderController');

// Customer places an order
router.post('/', protect, placeOrder);

// Customer views their own orders
router.get('/my', protect, getMyOrders);

router.put('/:id/timeline', protect, updateOrderTimeline);
router.post('/:id/verify-delivery', protect, verifyDelivery);

module.exports = router;
