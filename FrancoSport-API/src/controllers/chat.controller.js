/**
 * Chat Controller
 * Franco Sport API
 */

import prisma from '../utils/prisma.js';
import { geminiService } from '../services/gemini.service.js';

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

/**
 * Send message to AI assistant
 * POST /api/chat/ai
 */
export const sendMessageToAI = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // 1. Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        user_id: userId,
        message: message,
        is_from_user: true,
        is_read: true, // AI reads it immediately
      },
    });

    // 2. Get recent history for context (last 10 messages)
    const history = await prisma.chatMessage.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 10,
    });
    
    // Reverse to chronological order for AI
    const chronologicalHistory = history.reverse();

    // 3. Generate AI response
    const aiResponseText = await geminiService.generateResponse(message, chronologicalHistory);

    // 4. Save AI response
    const aiMessage = await prisma.chatMessage.create({
      data: {
        user_id: userId,
        message: aiResponseText,
        is_from_user: false,
        is_read: true,
      },
    });

    res.json({
      success: true,
      data: {
        userMessage,
        aiMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete chat history for current user
 * DELETE /api/chat/my-history
 */
export const deleteMyHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.chatMessage.deleteMany({
      where: { user_id: userId },
    });

    res.json({
      success: true,
      message: 'Chat history deleted',
    });
  } catch (error) {
    next(error);
  }
};
