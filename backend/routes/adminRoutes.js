const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

router.use(protect, authorize('admin'));
router.get('/dashboard', adminController.getAdminDashboard);
router.get('/shops', adminController.getAllShops);
router.put('/shops/:id/status', adminController.updateShopStatus);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.get('/finances', adminController.getAdminFinances);

module.exports = router;
