import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, User, MessageCircle, Clock, Check, CheckCheck } from 'lucide-react';
import { chatService } from '@/api/chat.service';
import type { ChatMessage } from '@/api/chat.service';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

interface Conversation {
  user_id: number;
  user_name: string;
  email: string;
  unread_count: number;
}

const AdminChat: React.FC = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    
    const socket = chatService.connect();
    if (socket) {
      chatService.onMessage((msg) => {
        // If message is from the selected user, append it
        if (selectedUser && msg.user_id === selectedUser.user_id && msg.is_from_user) {
          setMessages((prev) => [...prev, msg]);
          // Mark as read immediately if we are viewing this chat
          // (In a real app, we might want to emit a 'read' event)
        } else {
          // Otherwise update conversation list to show unread
          fetchConversations();
          toast.success(`Nuevo mensaje de ${msg.user?.first_name || 'Usuario'}`);
        }
      });

      chatService.onMessageSent((msg) => {
        if (selectedUser && msg.user_id === selectedUser.user_id && !msg.is_from_user) {
          setMessages((prev) => [...prev, msg]);
        }
      });
    }

    return () => {
      chatService.offMessage();
    };
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      fetchHistory(selectedUser.user_id);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (userId: number) => {
    try {
      const data = await chatService.getUserHistory(userId);
      setMessages(data);
      // Update unread count in list locally
      setConversations(prev => 
        prev.map(c => c.user_id === userId ? { ...c, unread_count: 0 } : c)
      );
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error al cargar historial');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    chatService.sendAdminReply(selectedUser.user_id, newMessage);
    setNewMessage('');
  };

  const filteredConversations = conversations.filter(c => 
    c.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6">
      {/* Sidebar - Conversations List */}
      <div className="w-1/3 bg-[#1A1A1A] border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white mb-4">Mensajes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-neutral-500">Cargando...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay conversaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => setSelectedUser(conv)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-neutral-800/50 transition-colors text-left ${
                    selectedUser?.user_id === conv.user_id ? 'bg-neutral-800 border-l-4 border-primary' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-neutral-400" />
                    </div>
                    {conv.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#1A1A1A]">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{conv.user_name}</h3>
                    <p className="text-xs text-neutral-400 truncate">{conv.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-[#1A1A1A] border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center gap-3 bg-black/20">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">{selectedUser.user_name[0]}</span>
              </div>
              <div>
                <h3 className="font-bold text-white">{selectedUser.user_name}</h3>
                <p className="text-xs text-neutral-400">{selectedUser.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${!msg.is_from_user ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl ${
                      !msg.is_from_user
                        ? 'bg-primary text-black rounded-tr-none'
                        : 'bg-neutral-800 text-white rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${!msg.is_from_user ? 'text-black/60' : 'text-neutral-400'}`}>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!msg.is_from_user && (
                        msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-neutral-800 bg-black/20">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-black border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-primary text-black p-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Selecciona una conversación para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
