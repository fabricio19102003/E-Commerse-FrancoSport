"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { chatService, type ChatMessage } from "@/api/chat.service";
import { useAuthStore } from "@/store";
import toast from "react-hot-toast";

interface SmartAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartAssistant = ({ isOpen, onClose }: SmartAssistantProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting with the 5 questions
  const initialQuestions = [
    "1. ¿Buscas algo para deporte o uso casual? 🏃‍♂️👟",
    "2. ¿Qué tipo de producto necesitas? 👕🎒",
    "3. ¿Qué estilo prefieres? (Moderno/Clásico) ✨",
    "4. ¿Tu prioridad es comodidad, precio o rendimiento? 💎",
    "5. ¿Tienes un presupuesto aproximado? 💰"
  ];

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      // Load history or show initial greeting
      const loadHistory = async () => {
        try {
          // We can use a separate history endpoint for AI if we want to separate it from support
          // For now, let's assume we want a fresh start or use the AI endpoint
          // But since we want to force the 5 questions, let's just show them if history is empty
          // OR we can just use local state for this session if we don't want persistence
          // The user wanted persistence in the previous turn, so let's try to use the chat service
          // BUT, since this is a specific "Assistant" mode, maybe we don't load the support chat history?
          // The user said "el chat... era para soporte técnico".
          // So this AI assistant should probably be ephemeral or have its own history.
          // Given the backend only has one "chat history", I will make this ephemeral for now
          // to avoid mixing with support chat.
          // WAIT: The backend `sendMessageToAI` saves to the SAME table.
          // If I use `sendMessageToAI`, it will show up in support chat history too.
          // This might be confusing.
          // Ideally, we should have a flag `is_ai` in the DB, but I can't change DB schema easily right now.
          // I will use `sendMessageToAI` but I won't load `getMyHistory` here.
          // I will only show messages from this session.
        } catch (error) {
          console.error(error);
        }
      };
      loadHistory();
    }
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    if (!isAuthenticated) {
      toast.error("Debes iniciar sesión para usar el asistente");
      return;
    }

    const messageText = newMessage;
    setNewMessage("");
    setIsLoading(true);

    // Add user message immediately
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      user_id: user?.id || 0,
      message: messageText,
      is_from_user: true,
      is_read: true,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await chatService.sendAIMessage(messageText);
      setMessages(prev => [...prev, response.aiMessage]);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      toast.error("Error al conectar con el asistente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success("Conversación reiniciada");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl h-[600px] rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-zinc-200 dark:border-zinc-800 flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-zinc-900 dark:text-white">
                      Asistente Inteligente
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Experto en deportes y estilo
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearChat}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
                    title="Reiniciar conversación"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 dark:bg-zinc-900/30">
                {messages.length === 0 && (
                  <div className="text-center space-y-6 py-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        ¡Hola {user?.first_name}! 👋
                      </h3>
                      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                        Soy tu asesor personal. Para encontrar lo perfecto para ti, necesito saber:
                      </p>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700 max-w-md mx-auto text-left">
                      <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                        {initialQuestions.map((q, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-primary font-bold">•</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Cuéntame todo en un solo mensaje o vamos paso a paso 👇
                    </p>
                  </div>
                )}

                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.is_from_user ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.is_from_user
                          ? "bg-primary text-white rounded-tr-none"
                          : "bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-tl-none text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {msg.is_from_user ? (
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      ) : (
                        <div className="prose dark:prose-invert prose-sm max-w-none text-zinc-800 dark:text-zinc-200">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="" {...props} />,
                              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-primary dark:text-primary-400" {...props} />,
                              a: ({node, ...props}) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                            }}
                          >
                            {msg.message}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <form
                  onSubmit={handleSendMessage}
                  className="flex gap-2 items-center bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-full border border-zinc-200 dark:border-zinc-700 focus-within:border-primary transition-colors"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isLoading}
                    className="p-3 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
