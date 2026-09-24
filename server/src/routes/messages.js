const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:conversationId', messageController.getMessages);
router.post('/:conversationId', messageController.sendMessage);

module.exports = router;
