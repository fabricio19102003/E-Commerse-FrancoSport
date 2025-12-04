import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store';
import axios from './axios';

let socket: Socket | null = null;

export interface ChatMessage {
    id: number;
    user_id: number;
    message: string;
    is_from_user: boolean;
    is_read: boolean;
    created_at: string;
    user?: {
        id: number;
        first_name: string;
        last_name: string;
    };
}

export const chatService = {
    connect: () => {
        const token = useAuthStore.getState().token;
        if (!token) return null;

        if (socket && socket.connected) return socket;

        // Ensure we connect to the root URL, not /api
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const socketUrl = apiUrl.replace(/\/api\/?$/, '');

        socket = io(socketUrl, {
            auth: {
                token,
            },
        });

        socket.on('connect', () => {
            console.log('Chat connected');
        });

        socket.on('disconnect', () => {
            console.log('Chat disconnected');
        });

        return socket;
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    sendMessage: (message: string) => {
        if (socket) {
            socket.emit('send_message', { message });
        }
    },

    sendAdminReply: (userId: number, message: string) => {
        if (socket) {
            socket.emit('admin_reply', { userId, message });
        }
    },

    sendAIMessage: async (message: string) => {
        const response = await axios.post<{ success: boolean; data: { userMessage: ChatMessage; aiMessage: ChatMessage } }>('/chat/ai', { message });
        return response.data.data;
    },

    onMessage: (callback: (message: ChatMessage) => void) => {
        if (socket) {
            socket.on('receive_message', callback);
        }
    },

    onMessageSent: (callback: (message: ChatMessage) => void) => {
        if (socket) {
            socket.on('message_sent', callback);
        }
    },

    offMessage: () => {
        if (socket) {
            socket.off('receive_message');
            socket.off('message_sent');
        }
    },

    getMyHistory: async () => {
        const response = await axios.get<{ success: boolean; data: ChatMessage[] }>('/chat/my-history');
        return response.data.data;
    },

    deleteMyHistory: async () => {
        const response = await axios.delete<{ success: boolean }>('/chat/my-history');
        return response.data;
    },

    getConversations: async () => {
        const response = await axios.get<{ success: boolean; data: any[] }>('/chat/conversations');
        return response.data.data;
    },

    getUserHistory: async (userId: number) => {
        const response = await axios.get<{ success: boolean; data: ChatMessage[] }>(`/chat/user/${userId}`);
        return response.data.data;
    },
};
