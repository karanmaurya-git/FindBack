const Conversation = require('../models/Conversation');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// Get all conversations for logged-in user
exports.getConversations = async (req, res, next) => {
  try {
    // This list changes every time a new conversation starts or a message
    // arrives — it must never be served from a cached/304 response, or a
    // freshly-created conversation can appear missing for a moment.
    res.set('Cache-Control', 'no-store');

    const conversations = await Conversation.find({
      participants: req.user._id,
      isActive: true,
    })
      .populate('participants', 'name avatar isVerified')
      .populate('item', 'name type images status')
      .sort({ updatedAt: -1 });

    return ApiResponse.success(res, 'Conversations retrieved', conversations);
  } catch (error) {
    next(error);
  }
};

// Start or get conversation between two users (e.g. regarding an item)
exports.startConversation = async (req, res, next) => {
  try {
    const { recipientId, itemId } = req.body;

    if (recipientId === req.user._id.toString()) {
      return next(ApiError.badRequest('You cannot start a conversation with yourself'));
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
      ...(itemId && { item: itemId }),
    })
      .populate('participants', 'name avatar isVerified')
      .populate('item', 'name type images');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        item: itemId || undefined,
        unreadCount: {
          [req.user._id.toString()]: 0,
          [recipientId.toString()]: 0,
        },
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name avatar isVerified')
        .populate('item', 'name type images');
    }

    return ApiResponse.success(res, 'Conversation initiated', conversation);
  } catch (error) {
    next(error);
  }
};

// Block conversation
exports.blockConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return next(ApiError.notFound('Conversation not found'));

    conversation.isBlocked = true;
    conversation.blockedBy = req.user._id;
    await conversation.save();

    return ApiResponse.success(res, 'Conversation has been blocked');
  } catch (error) {
    next(error);
  }
};
