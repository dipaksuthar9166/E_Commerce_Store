import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [permission, setPermission] = useState(Notification?.permission || 'default');

  // Request permission on mount if logged in
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(setPermission);
    }
  }, [user]);

  // Handle incoming push notifications
  useEffect(() => {
    if (!socket || !user) return;

    const showNativeNotification = (title, options) => {
      if (permission === 'granted' && 'Notification' in window) {
        new Notification(title, {
          icon: '/logo.png', // Fallback icon
          badge: '/logo.png',
          ...options
        });
      }
    };

    const handleNewOrder = (order) => {
      if (user.role === 'vendor' || user.role === 'admin') {
        showNativeNotification('🛒 New Order Received!', {
          body: `Order #${order._id.slice(-6)} placed for ₹${order.totalAmount}.`,
        });
      }
    };

    const handleOrderStatusUpdate = (order) => {
      if (user.role === 'customer') {
        const statuses = {
          accepted: 'has been accepted by the shop.',
          packing: 'is now being packed.',
          ready_for_pickup: 'is ready for delivery pickup.',
          out_for_delivery: 'is out for delivery! 🚚',
          delivered: 'has been successfully delivered! 🎉',
          cancelled: 'was cancelled.'
        };
        
        const statusMsg = statuses[order.status] || `status changed to ${order.status}.`;
        
        showNativeNotification('📦 Order Update', {
          body: `Your order #${order._id.slice(-6)} ${statusMsg}`
        });
      } else if (user.role === 'vendor' && order.status === 'cancelled') {
         showNativeNotification('❌ Order Cancelled', {
            body: `Order #${order._id.slice(-6)} has been cancelled.`
         });
      }
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderStatusUpdated', handleOrderStatusUpdate);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderStatusUpdated', handleOrderStatusUpdate);
    };
  }, [socket, user, permission]);

  // Expose manual push function for custom triggers
  const sendPushNotification = (title, body) => {
    if (permission === 'granted' && 'Notification' in window) {
      new Notification(title, { body, icon: '/logo.png' });
    } else if (permission === 'default') {
      Notification.requestPermission().then((p) => {
        setPermission(p);
        if (p === 'granted') new Notification(title, { body, icon: '/logo.png' });
      });
    }
  };

  return (
    <NotificationContext.Provider value={{ permission, sendPushNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
