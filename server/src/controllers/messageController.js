const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { parsePagination, buildPagination } = require('../utils/helpers');

// Get messages in a conversation
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page, limit, skip } = parsePagination(req.query);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return next(ApiError.notFound('Conversation not found'));

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return next(ApiError.forbidden('You are not a participant in this conversation'));
    }

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId, isDeleted: false })
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversation: conversationId, isDeleted: false }),
    ]);

    // Reverse to display chronologically in chat window
    messages.reverse();

    const pagination = buildPagination(page, limit, total);
    return ApiResponse.paginated(res, 'Messages retrieved', messages, pagination);
  } catch (error) {
    next(error);
  }
};

// Send message via REST endpoint (useful for fallback or image attachment)
exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text', image } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.isBlocked) {
      return next(ApiError.badRequest('Cannot send message to this conversation'));
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content,
      type,
      image,
      readBy: [req.user._id],
    });

    await message.populate('sender', 'name avatar');

    conversation.lastMessage = {
      content,
      sender: req.user._id,
      timestamp: new Date(),
    };
    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('new_message', message);
    }

    return ApiResponse.created(res, 'Message sent', message);
  } catch (error) {
    next(error);
  }
};
