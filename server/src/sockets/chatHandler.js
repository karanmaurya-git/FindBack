const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const chatHandler = (io, socket, onlineUsers) => {
  // Join a conversation room
  socket.on('join_conversation', async (conversationId) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      const userId = socket.user._id.toString();
      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId
      );

      if (!isParticipant) return;

      socket.join(`conversation_${conversationId}`);

      // Mark messages as read
      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: socket.user._id },
          readBy: { $nin: [socket.user._id] },
        },
        { $addToSet: { readBy: socket.user._id } }
      );

      // Reset unread count
      conversation.unreadCount.set(userId, 0);
      await conversation.save();

      socket.emit('messages_read', { conversationId });
    } catch (error) {
      console.error('Join conversation error:', error);
    }
  });

  // Leave conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, type = 'text', image } = data;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || conversation.isBlocked) return;

      const userId = socket.user._id.toString();
      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId
      );

      if (!isParticipant) return;

      // Create message
      const message = await Message.create({
        conversation: conversationId,
        sender: socket.user._id,
        content,
        type,
        image,
        readBy: [socket.user._id],
      });

      // Populate sender info
      await message.populate('sender', 'name avatar');

      // Update conversation
      conversation.lastMessage = {
        content: type === 'image' ? '📷 Image' : content,
        sender: socket.user._id,
        timestamp: new Date(),
      };

      // Update unread counts for other participants
      conversation.participants.forEach((participantId) => {
        const pid = participantId.toString();
        if (pid !== userId) {
          const currentCount = conversation.unreadCount.get(pid) || 0;
          conversation.unreadCount.set(pid, currentCount + 1);
        }
      });

      await conversation.save();

      // Emit to conversation room
      io.to(`conversation_${conversationId}`).emit('new_message', message);

      // Notify other participants not in the room
      conversation.participants.forEach((participantId) => {
        const pid = participantId.toString();
        if (pid !== userId) {
          io.to(`user_${pid}`).emit('message_notification', {
            conversationId,
            message,
          });
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing_start', ({ conversationId }) => {
    socket.to(`conversation_${conversationId}`).emit('user_typing', {
      userId: socket.user._id,
      name: socket.user.name,
    });
  });

  socket.on('typing_stop', ({ conversationId }) => {
    socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
      userId: socket.user._id,
    });
  });

  // Mark messages as read
  socket.on('mark_read', async ({ conversationId }) => {
    try {
      const userId = socket.user._id.toString();

      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: socket.user._id },
          readBy: { $nin: [socket.user._id] },
        },
        { $addToSet: { readBy: socket.user._id } }
      );

      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.unreadCount.set(userId, 0);
        await conversation.save();
      }

      socket.to(`conversation_${conversationId}`).emit('messages_read', {
        conversationId,
        userId: socket.user._id,
      });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });
};

module.exports = chatHandler;
