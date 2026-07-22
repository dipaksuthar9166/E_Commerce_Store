import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

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

    const newSocket = io('http://192.168.1.9:5000', {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // If user is a vendor, we should fetch their shop ID to join the room
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

    // Cleanup on unmount or user change
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, shopId }}>
      {children}
    </SocketContext.Provider>
  );
};
