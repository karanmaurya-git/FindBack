const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard-stats', userController.getDashboardStats);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.updatePassword);
router.post('/saved/:itemId', userController.toggleSaveItem);
router.get('/saved', userController.getSavedItems);
router.delete('/account', userController.deleteAccount);

module.exports = router;
