import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

/** Derive Socket.IO origin from env or from VITE_API_URL (strip /api). */
function getSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/+$/, '');
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '') || 'http://localhost:5000';
}

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [shopId, setShopId] = useState(null);

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    // Vendor: join shop room for live order alerts
    if (user.role === 'vendor') {
      const fetchShopAndJoinRoom = async () => {
        try {
          const { data } = await api.get('/vendor/dashboard');
          if (data.shop && data.shop._id) {
            setShopId(data.shop._id);
            newSocket.emit('joinShopRoom', data.shop._id);
          }
        } catch (error) {
          console.error('Failed to fetch shop for socket connection', error);
        }
      };
      fetchShopAndJoinRoom();
    }

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reconnect only when user changes
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, shopId }}>
      {children}
    </SocketContext.Provider>
  );
};
