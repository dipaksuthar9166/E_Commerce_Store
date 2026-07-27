import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../api/axios';
import { getSocketBaseUrl } from '../utils/apiBase';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [shopId, setShopId] = useState(null);
  const shopIdRef = useRef(null);

  useEffect(() => {
    shopIdRef.current = shopId;
  }, [shopId]);

  useEffect(() => {
    if (!user?._id) {
      setSocket((prev) => {
        if (prev) prev.disconnect();
        return null;
      });
      setConnected(false);
      setShopId(null);
      return undefined;
    }

    const userId = String(user._id);
    // Don't block first paint — connect after a tick; prefer polling first on cold hosts
    const newSocket = io(getSocketBaseUrl(), {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      timeout: 12000,
    });

    const joinRooms = () => {
      // Personal room — customer live order status (Orders page)
      newSocket.emit('joinUserRoom', userId);

      // Vendor shop room
      if (user.role === 'vendor' && shopIdRef.current) {
        newSocket.emit('joinShopRoom', shopIdRef.current);
      }
    };

    newSocket.on('connect', () => {
      setConnected(true);
      joinRooms();
      console.log('[socket] connected', newSocket.id, '→ user_' + userId);
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      console.log('[socket] disconnected', reason);
    });

    newSocket.on('reconnect', () => {
      setConnected(true);
      joinRooms();
      console.log('[socket] reconnected — rooms re-joined');
    });

    // Vendor: resolve shop id then join (also re-join on later connect via shopIdRef)
    if (user.role === 'vendor') {
      (async () => {
        try {
          const { data } = await api.get('/vendor/dashboard');
          if (data.shop?._id) {
            const id = data.shop._id;
            setShopId(id);
            shopIdRef.current = id;
            if (newSocket.connected) {
              newSocket.emit('joinShopRoom', id);
            }
          }
        } catch (error) {
          console.error('Failed to fetch shop for socket connection', error);
        }
      })();
    }

    // If already connected by the time listeners attach
    if (newSocket.connected) {
      setConnected(true);
      joinRooms();
    }

    setSocket(newSocket);

    return () => {
      newSocket.removeAllListeners();
      newSocket.disconnect();
      setConnected(false);
    };
  }, [user?._id, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, shopId, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
