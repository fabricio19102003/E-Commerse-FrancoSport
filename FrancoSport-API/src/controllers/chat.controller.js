/**
 * Chat Controller
 * Franco Sport API
 */

import prisma from '../utils/prisma.js';

/**
 * Get chat history for the current user
 * GET /api/chat/my-history
 */
export const getMyHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const messages = await prisma.chatMessage.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
    });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all conversations (Admin)
 * GET /api/chat/conversations
 */
export const getConversations = async (req, res, next) => {
  try {
    // Group messages by user to find active conversations
    // Prisma doesn't support distinct on non-unique fields easily with other data, 
    // so we might need a raw query or just fetch users who have messages.
    
    // Fetch users who have at least one message
    const usersWithMessages = await prisma.user.findMany({
      where: {
        chat_messages: {
          some: {},
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        _count: {
          select: { chat_messages: { where: { is_read: false, is_from_user: true } } },
        },
      },
    });

    // Format response
    const conversations = usersWithMessages.map(user => ({
      user_id: user.id,
      user_name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      unread_count: user._count.chat_messages,
    }));

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get chat history for a specific user (Admin)
 * GET /api/chat/user/:userId
 */
export const getUserHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const messages = await prisma.chatMessage.findMany({
      where: { user_id: parseInt(userId) },
      orderBy: { created_at: 'asc' },
    });

    // Mark messages as read
    await prisma.chatMessage.updateMany({
      where: { 
        user_id: parseInt(userId),
        is_from_user: true,
        is_read: false
      },
      data: { is_read: true },
    });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
