import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { X, Send, MessageSquare } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

// Replace with your actual backend URL in production
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const CustomerChat = ({ shopId, shopName }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const chatId = user && shopId ? `${user._id}_${shopId}` : null;

  useEffect(() => {
    if (!isOpen || !chatId) return;

    // Load history
    api.get(`/chat/customer/${shopId}`).then((res) => {
      setMessages(res.data);
      scrollToBottom();
    }).catch(console.error);

    // Initialize socket
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('joinChat', chatId);
    });

    newSocket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leaveChat', chatId);
      newSocket.disconnect();
    };
  }, [isOpen, chatId, shopId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !chatId) return;

    socket.emit('sendMessage', {
      chatId,
      senderId: user._id,
      senderModel: 'User',
      text: inputText,
    });

    setInputText('');
  };

  if (!user) return null; // Must be logged in to chat

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 transition-transform hover:scale-105 z-40"
        title="Chat with Seller"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-50"
            style={{ height: '500px', maxHeight: '70vh' }}
          >
            {/* Header */}
            <div className="bg-blue-600 p-4 flex items-center justify-between text-white shrink-0">
              <div>
                <h3 className="font-bold text-sm">Chat with {shopName || 'Seller'}</h3>
                <p className="text-xs text-blue-100">Usually replies instantly</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-10">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No messages yet. Say hi!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderModel === 'User';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CustomerChat;
