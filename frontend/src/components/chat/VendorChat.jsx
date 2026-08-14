import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, User as UserIcon, Search, MessageSquare, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const VendorChat = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  
  const messagesEndRef = useRef(null);
  const shopId = user?.shopId || user?.shop; // Assuming vendor has shop reference

  useEffect(() => {
    fetchConversations();
    
    const newSocket = io(SOCKET_URL, { transports: ['websocket'] });
    
    newSocket.on('connect', () => {
      if (shopId) {
        newSocket.emit('joinShopRoom', shopId);
      }
    });

    newSocket.on('newChatMessage', (message) => {
      // If we receive a message and we're NOT looking at that chat, update unread count
      setConversations((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex(c => c.chatId === message.chatId);
        if (idx !== -1) {
          copy[idx].lastMessage = message;
          // If we are not currently active on this chat, bump unread count
          if (activeChat?.chatId !== message.chatId && message.senderModel === 'User') {
            copy[idx].unreadCount = (copy[idx].unreadCount || 0) + 1;
          }
          // Move to top
          const [item] = copy.splice(idx, 1);
          copy.unshift(item);
        } else if (message.senderModel === 'User') {
          // New conversation
          fetchConversations(); // easier to just refetch to get user details
        }
        return copy;
      });
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [shopId, activeChat]);

  // Handle active chat socket room
  useEffect(() => {
    if (!socket || !activeChat) return;

    socket.emit('joinChat', activeChat.chatId);
    
    const handleReceive = (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
      
      // Update last message in sidebar
      setConversations((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex(c => c.chatId === message.chatId);
        if (idx !== -1) {
          copy[idx].lastMessage = message;
          copy[idx].unreadCount = 0; // we are reading it
        }
        return copy;
      });
    };

    socket.on('receiveMessage', handleReceive);

    return () => {
      socket.off('receiveMessage', handleReceive);
      socket.emit('leaveChat', activeChat.chatId);
    };
  }, [socket, activeChat]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/chat/vendor/conversations');
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (conversation) => {
    try {
      setActiveChat(conversation);
      const userId = conversation.user._id;
      const { data } = await api.get(`/chat/vendor/${userId}`);
      setMessages(data);
      scrollToBottom();

      // Clear unread in sidebar
      setConversations((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex(c => c.chatId === conversation.chatId);
        if (idx !== -1) copy[idx].unreadCount = 0;
        return copy;
      });
    } catch (error) {
      console.error('Failed to load chat history', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !activeChat) return;

    socket.emit('sendMessage', {
      chatId: activeChat.chatId,
      senderId: user._id,
      senderModel: 'Shop',
      text: inputText,
    });

    setInputText('');
  };

  return (
    <div className={`h-[80vh] flex rounded-2xl overflow-hidden shadow-sm border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
      
      {/* Sidebar - Conversations List */}
      <div className={`w-1/3 flex flex-col border-r ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Chats</h2>
          <div className="mt-3 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none ${isDark ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900'}`}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No conversations yet.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.chatId}
                onClick={() => loadChat(conv)}
                className={`w-full text-left p-4 flex items-center gap-3 border-b transition-colors ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-50 hover:bg-gray-50'} ${activeChat?.chatId === conv.chatId ? (isDark ? 'bg-gray-800' : 'bg-blue-50') : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                  {conv.user.avatar ? (
                    <img src={conv.user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{conv.user.name}</span>
                    {conv.lastMessage && (
                      <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(conv.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs truncate max-w-[80%] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {conv.lastMessage?.text || 'No messages yet'}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${isDark ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={`p-4 border-b flex items-center gap-3 shadow-sm z-10 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-blue-100'}`}>
                 {activeChat.user.avatar ? (
                    <img src={activeChat.user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-blue-600'}`} />
                  )}
              </div>
              <div>
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeChat.user.name}</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{activeChat.user.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.senderModel === 'Shop';
                return (
                  <div key={idx} className={`flex flex-col max-w-[70%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : isDark ? 'bg-gray-800 text-gray-200 rounded-tl-sm border border-gray-700' : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                    }`}>
                      {msg.text}
                    </div>
                    <span className={`text-[10px] mt-1 px-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <form onSubmit={sendMessage} className={`p-4 border-t flex gap-3 items-center ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className={`flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-100 text-gray-900 border border-transparent'}`}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorChat;
