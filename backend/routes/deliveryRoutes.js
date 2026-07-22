const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAvailableTasks,
  acceptTask,
  deliverTask,
  getRiderStats,
} = require('../controllers/deliveryController');

// All delivery routes are protected and restricted to riders
router.use(protect, authorize('delivery'));

router.get('/tasks', getAvailableTasks);
router.put('/orders/:id/accept', acceptTask);
router.put('/orders/:id/deliver', deliverTask);
router.get('/stats', getRiderStats);

module.exports = router;
