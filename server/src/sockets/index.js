const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const chatHandler = require('./chatHandler');

const onlineUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('User not found or deactivated'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Track online user
    onlineUsers.set(userId, socket.id);
    io.emit('user_online', { userId });

    console.log(`User connected: ${socket.user.name} (${userId})`);

    // Join user's personal room for notifications
    socket.join(`user_${userId}`);

    // Chat handlers
    chatHandler(io, socket, onlineUsers);

    // Handle disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user_offline', { userId });
      console.log(`User disconnected: ${socket.user.name}`);
    });

    // Get online users
    socket.on('get_online_users', () => {
      socket.emit('online_users', Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

module.exports = initializeSocket;
