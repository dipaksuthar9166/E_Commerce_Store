import React, { useEffect, useRef } from 'react';
import { X, Bell, Check, ShoppingCart } from 'lucide-react';

// Placeholder for the alert sound file path
const ALERT_SOUND_PATH = '/sounds/order_alert.mp3';

const VendorOrderAlert = ({ order, onAccept, onReject, onClose }) => {
  const audioRef = useRef(null);

  // Play sound when a new order appears
  useEffect(() => {
    if (order && audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(error => {
        console.warn("Audio playback failed. User interaction might be required to play sound.", error);
      });
    }

    // Cleanup: stop sound when component unmounts or order is handled
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [order]);

  const handleAction = (action) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    action();
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 transform transition-all animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
        {/* Header with ringing bell */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-amber-50 rounded-t-2xl">
          <div className="relative">
            <Bell className="w-6 h-6 text-amber-600" />
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <h2 className="text-lg font-bold text-amber-800">New Order Received!</h2>
          <button
            onClick={() => handleAction(onClose)}
            className="ml-auto p-1.5 text-gray-400 hover:bg-gray-200 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        {/* Order Details */}
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-baseline">
            <p className="text-sm text-gray-500">
              Order ID: <span className="font-bold text-gray-800 font-mono">#{order._id.slice(-6).toUpperCase()}</span>
            </p>
            <p className="text-sm text-gray-500">
              From: <span className="font-bold text-gray-800">{order.userId?.name || 'Customer'}</span>
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-700 font-medium">{item.productId?.name || `Product ${index + 1}`}</span>
                <span className="text-gray-500 font-semibold">x {item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="text-center border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-4xl font-extrabold text-gray-900">₹{order.totalAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50/70 border-t border-gray-100 rounded-b-2xl">
          <button
            onClick={() => handleAction(() => onReject(order._id))}
            className="w-full py-4 rounded-xl bg-red-100 text-red-600 font-bold text-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
          >
            <X size={20} /> Reject
          </button>
          <button
            onClick={() => handleAction(() => onAccept(order._id))}
            className="w-full py-4 rounded-xl bg-green-500 text-white font-bold text-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
          >
            <Check size={20} /> Accept
          </button>
        </div>
      </div>
      <audio ref={audioRef} src={ALERT_SOUND_PATH} preload="auto"></audio>
    </div>
  );
};

export default VendorOrderAlert;