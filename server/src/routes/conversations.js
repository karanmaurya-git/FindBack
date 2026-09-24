const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', conversationController.getConversations);
router.post('/', conversationController.startConversation);
router.put('/:id/block', conversationController.blockConversation);

module.exports = router;
