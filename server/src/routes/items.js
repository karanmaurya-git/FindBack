const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Public listing & discovery routes
router.get('/', optionalAuth, itemController.getItems);
router.get('/nearby', itemController.getNearbyItems);
router.get('/my-items', protect, itemController.getMyItems);
router.get('/:id', optionalAuth, itemController.getItemById);

// Protected item creation & mutation
router.post('/', protect, uploadLimiter, upload.array('images', 5), itemController.createItem);
router.put('/:id', protect, itemController.updateItem);
router.delete('/:id', protect, itemController.deleteItem);

module.exports = router;
