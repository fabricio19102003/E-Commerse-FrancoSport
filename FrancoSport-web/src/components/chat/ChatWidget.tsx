import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Minimize2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { chatService } from '@/api/chat.service';
import type { ChatMessage } from '@/api/chat.service';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

const ChatWidget: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      // Fetch history
      chatService.getMyHistory()
        .then(setMessages)
        .catch(err => console.error('Error fetching chat history:', err));
    }
  }, [isAuthenticated, isOpen]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      // Connect to socket for notifications even if chat is closed
      const socket = chatService.connect();
      
      if (socket) {
        chatService.onMessage((msg) => {
          // Only add if it's not already in the list (avoid duplicates if we mix socket/rest)
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          
          if (!isOpen && !msg.is_from_user) {
            setUnreadCount(prev => prev + 1);
            toast.success('Tienes un nuevo mensaje de soporte');
          }
        });

        chatService.onMessageSent((msg) => {
           // Only add if it's not already in the list
           setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        });
      }
    }

    return () => {
      chatService.offMessage();
    };
  }, [isAuthenticated, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage;
    setNewMessage('');
    setIsLoading(true);

    try {
      // Send via socket (Human Support)
      chatService.sendMessage(messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
      setNewMessage(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <div className="relative">
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-14 h-14 shadow-lg flex items-center justify-center p-0"
          >
            <MessageCircle className="w-8 h-8" />
          </Button>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-background animate-bounce">
              {unreadCount}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <Card className="w-80 sm:w-96 h-[500px] flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="p-4 border-b border-border bg-primary/5 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <h3 className="font-bold text-primary">Soporte Franco Sport</h3>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-primary/10 rounded">
                <Minimize2 className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface/50">
            {messages.length === 0 && (
              <div className="text-center text-text-tertiary text-sm mt-10">
                <p>¡Hola {user?.first_name}!</p>
                <p>¿En qué podemos ayudarte hoy?</p>
              </div>
            )}
            
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.is_from_user ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.is_from_user
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-surface border border-border rounded-tl-none'
                  }`}
                >
                  <p>{msg.message}</p>
                  <span className={`text-[10px] block mt-1 ${msg.is_from_user ? 'text-white/70' : 'text-text-tertiary'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-surface">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <Button type="submit" size="sm" disabled={!newMessage.trim()} className="px-3">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default ChatWidget;
