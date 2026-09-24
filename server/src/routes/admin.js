const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin', 'moderator'));

router.get('/stats', adminController.getPlatformStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.getUsers);
router.put('/users/:id', authorize('admin'), adminController.updateUser);
router.get('/items', adminController.getItems);
router.get('/claims', adminController.getClaims);

module.exports = router;
