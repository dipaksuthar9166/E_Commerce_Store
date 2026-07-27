import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Box,
  ShoppingBag,
  ChevronRight,
  AlertCircle,
  ArchiveRestore,
} from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../contexts/SocketContext';

const TABS = [
  { key: 'pending', label: 'New Orders', icon: AlertCircle },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle },
  { key: 'packing', label: 'Packing', icon: Box },
  { key: 'ready_for_pickup', label: 'Ready', icon: CheckCircle },
  { key: 'delivered', label: 'Delivered', icon: Truck },
  { key: 'returns', label: 'Returns', icon: ArchiveRestore },
];

const statusConfig = {
  pending: { label: 'Pending', cls: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-400', nextStatus: 'accepted' },
  accepted: { label: 'Accepted', cls: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-400', nextStatus: 'packing' },
  packing: { label: 'Packing', cls: 'bg-purple-50 text-purple-700 border-purple-100', dot: 'bg-purple-400', nextStatus: 'ready_for_pickup' },
  ready_for_pickup: { label: 'Ready for Pickup', cls: 'bg-indigo-50 text-indigo-700 border-indigo-100', dot: 'bg-indigo-400', nextStatus: 'delivered' },
  delivered: { label: 'Delivered', cls: 'bg-green-50 text-green-700 border-green-100', dot: 'bg-green-400' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-50 text-gray-700 border-gray-100', dot: 'bg-gray-400' },
  return_requested: { label: 'Return Requested', cls: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-400' },
  returned: { label: 'Returned', cls: 'bg-gray-100 text-gray-800 border-gray-200', dot: 'bg-gray-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const OrderCard = ({ order, onStatusChange, onReturnAction }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
    <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-gray-50">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-gray-400">#{order._id?.slice(-6) || 'N/A'}</span>
          <StatusBadge status={order.status} />
        </div>
        <p className="font-semibold text-gray-900">{order.userId?.name || 'Customer'}</p>
        <p className="text-gray-400 text-xs">{order.userId?.email || 'N/A'}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-400">
          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="font-bold text-gray-900 text-lg">₹{order.totalAmount}</p>
      </div>
    </div>

    <div className="px-5 py-3 bg-gray-50/50 space-y-1.5">
      {order.items?.map((item, i) => {
        const name =
          item.productId?.name ||
          item.name ||
          (typeof item.productId === 'string' ? `Item ·${item.productId.slice(-4)}` : 'Item');
        return (
          <div key={i} className="flex justify-between text-sm gap-2">
            <span className="text-gray-700 flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              <span className="truncate">{name}</span>
              <span className="text-gray-400 text-xs shrink-0">×{item.quantity}</span>
            </span>
            <span className="text-gray-600 font-medium shrink-0">₹{item.price}</span>
          </div>
        );
      })}
    </div>

    <div className="flex gap-2 px-5 py-3 border-t border-gray-50 flex-wrap">
      {order.status === 'pending' && (
        <>
          <button
            onClick={() => onStatusChange(order._id, 'cancelled')}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-600 font-semibold text-xs border border-red-100 hover:bg-red-100 transition-colors"
          >
            <XCircle size={13} /> Reject
          </button>
          <button
            onClick={() => onStatusChange(order._id, 'accepted')}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500 text-white font-semibold text-xs hover:bg-blue-600 transition-colors shadow-sm"
          >
            <CheckCircle size={13} /> Accept
          </button>
        </>
      )}

      {order.status === 'accepted' && (
        <button
          onClick={() => onStatusChange(order._id, 'packing')}
          className="w-full py-2 rounded-lg bg-purple-500 text-white font-semibold text-xs hover:bg-purple-600 transition-colors shadow-sm"
        >Mark as Packing</button>
      )}

      {order.status === 'packing' && (
        <button
          onClick={() => onStatusChange(order._id, 'ready_for_pickup')}
          className="w-full py-2 rounded-lg bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600 transition-colors shadow-sm"
        >Ready for Pickup</button>
      )}

      {order.status === 'ready_for_pickup' && (
        <button
          onClick={() => onStatusChange(order._id, 'delivered')}
          className="w-full py-2 rounded-lg bg-green-500 text-white font-semibold text-xs hover:bg-green-600 transition-colors shadow-sm"
        >Mark as Delivered</button>
      )}
      
      {order.status === 'return_requested' && (
        <>
          <button
            onClick={() => onReturnAction(order._id, 'reject')}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-600 font-semibold text-xs border border-red-100 hover:bg-red-100 transition-colors"
          >
            <XCircle size={13} /> Reject Return
          </button>
          <button
            onClick={() => onReturnAction(order._id, 'approve')}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500 text-white font-semibold text-xs hover:bg-green-600 transition-colors shadow-sm"
          >
            <CheckCircle size={13} /> Approve Return
          </button>
        </>
      )}

      {order.status !== 'pending' && !['packing', 'ready_for_pickup', 'accepted', 'return_requested'].includes(order.status) && (
        <button className="text-xs text-gray-400 hover:text-blue-600 font-medium flex items-center gap-0.5 transition-colors w-full justify-center">
          View details <ChevronRight size={13} />
        </button>
      )}
    </div>
  </div>
);

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order) => {
      setOrders((prev) => [order, ...prev]);
    };

    const handleStatusUpdate = (updatedOrder) => {
      setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderStatusUpdated', handleStatusUpdate);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderStatusUpdated', handleStatusUpdate);
    };
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/vendor/orders');
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await api.put(`/vendor/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    } catch (error) {
      console.error(`Failed to update order status`, error);
      alert('Failed to update order status');
    }
  };

  const handleReturnAction = async (orderId, action) => {
    try {
      const { data } = await api.put(`/vendor/orders/${orderId}/return`, { action });
      const updated = data.order;
      if (updated) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      } else {
        // Fallback optimistic update
        const nextStatus = action === 'approve' ? 'returned' : 'delivered';
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o)));
      }
    } catch (error) {
      console.error('Failed to process return action', error);
      alert(error.response?.data?.message || 'Failed to process return request');
    }
  };

  const filtered = orders.filter((o) => {
    if (activeTab === 'returns') {
      return ['return_requested', 'returned'].includes(o.status);
    }
    return o.status === activeTab;
  });
  
  const counts = { pending: 0, accepted: 0, packing: 0, ready_for_pickup: 0, delivered: 0, returns: 0, cancelled: 0 };
  orders.forEach((o) => {
    if (o.status) {
      if (['return_requested', 'returned'].includes(o.status)) {
        counts.returns++;
      } else if (counts.hasOwnProperty(o.status)) {
        counts[o.status]++;
      }
    }
  });

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage and track all your incoming orders with real-time status updates</p>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-full overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === key
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
            {counts[key] > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  activeTab === key ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-5 border border-gray-100 h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <ShoppingBag size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No {TABS.find(t => t.key === activeTab)?.label || activeTab} orders</p>
          <p className="text-gray-400 text-xs mt-1">
            {activeTab === 'pending'
              ? 'New orders will appear here instantly with notifications.'
              : `All ${activeTab} orders will appear here.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((order) => (
            <OrderCard key={order._id} order={order} onStatusChange={updateOrderStatus} onReturnAction={handleReturnAction} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorOrders;
