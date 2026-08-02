const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

router.use(protect, authorize('admin'));
router.get('/dashboard', adminController.getAdminDashboard);
router.get('/shops', adminController.getAllShops);
router.put('/shops/:id/status', adminController.updateShopStatus);
router.delete('/shops/:id', adminController.deleteShop);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.get('/finances', adminController.getAdminFinances);
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.get('/categories', adminController.getGlobalCategories);
router.post('/categories', adminController.createGlobalCategory);
router.put('/categories/:id', adminController.updateGlobalCategory);
router.delete('/categories/:id', adminController.deleteGlobalCategory);
router.get('/config', adminController.getConfig);
router.put('/config', adminController.updateConfig);
router.post('/reset-data', adminController.resetPlatformData);

module.exports = router;
