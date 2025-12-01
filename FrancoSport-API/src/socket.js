/**
 * Socket.io Configuration
 * Franco Sport API
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './utils/prisma.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (${socket.user.role})`);

    // Join user room (for personal notifications and chat)
    socket.join(`user_${socket.user.id}`);

    // If admin, join admin room
    if (socket.user.role === 'ADMIN' || socket.user.role === 'MODERATOR') {
      socket.join('admin_room');
    }

    // Handle incoming message from user
    socket.on('send_message', async (data) => {
      try {
        const { message } = data;
        const userId = socket.user.id;

        // Save to DB
        const chatMessage = await prisma.chatMessage.create({
          data: {
            user_id: userId,
            message,
            is_from_user: true,
            is_read: false,
          },
        });

        // Notify admins
        io.to('admin_room').emit('receive_message', {
          ...chatMessage,
          user: {
            id: userId,
            first_name: socket.user.first_name, // Assuming these are in token or we fetch them
            last_name: socket.user.last_name,
          },
        });

        // Confirm to sender
        socket.emit('message_sent', chatMessage);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Handle reply from admin
    socket.on('admin_reply', async (data) => {
      try {
        // Only admins can reply
        if (socket.user.role !== 'ADMIN' && socket.user.role !== 'MODERATOR') {
          return;
        }

        const { userId, message } = data;

        // Save to DB
        const chatMessage = await prisma.chatMessage.create({
          data: {
            user_id: userId,
            message,
            is_from_user: false,
            is_read: false,
          },
        });

        // Send to specific user
        io.to(`user_${userId}`).emit('receive_message', chatMessage);

        // Confirm to admin (sender)
        socket.emit('message_sent', chatMessage);
      } catch (error) {
        console.error('Error sending reply:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
