import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import {
  ShoppingBag, Clock, CheckCircle2, Bike, XCircle,
  ChevronRight, Loader2, MapPin, Package, Sparkles,
  RotateCcw, RefreshCw
} from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

/* ─── Status Config ─────────────────────────────────────────── */
const statusConfig = {
  pending:          { label: 'Ordered',         color: 'text-amber-600 bg-amber-50 border-amber-200',   dot: 'bg-amber-400',   desc: 'Order Placed',       step: 0 },
  accepted:         { label: 'Packed',         color: 'text-blue-600 bg-blue-50 border-blue-200',      dot: 'bg-blue-500',    desc: 'Order is packed',    step: 1 },
  out_for_delivery: { label: 'Shipped', color: 'text-purple-600 bg-purple-50 border-purple-200', dot: 'bg-purple-500', desc: 'Order is on the way! 🛵',         step: 2 },
  delivered:        { label: 'Delivered',        color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', desc: 'Order delivered successfully 🎉', step: 3 },
  cancelled:        { label: 'Cancelled',        color: 'text-rose-600 bg-rose-50 border-rose-200',      dot: 'bg-rose-500',    desc: 'Order has been cancelled',        step: -1 },
};

const STEPS = ['Ordered', 'Packed', 'Shipped', 'Delivered'];
const STEP_ICONS = [Package, Package, Bike, Sparkles];

/* ─── Live Tracker ──────────────────────────────────────────── */
const LiveTracker = ({ status }) => {
  if (status === 'cancelled') return null;
  const currentStep = statusConfig[status]?.step ?? 0;

  return (
    <div className="mt-4 px-1">
      <div className="flex items-center gap-0">
        {STEPS.map((label, idx) => {
          const Icon = STEP_ICONS[idx];
          const filled = idx <= currentStep;
          const isLast = idx === STEPS.length - 1;
          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
                  filled
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon size={13} />
                </div>
                <span className={`text-[9px] font-bold leading-tight text-center max-w-[48px] ${
                  filled ? 'text-indigo-600' : 'text-gray-400'
                }`}>{label}</span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mb-3 mx-0.5 rounded-full transition-all duration-700 ${
                  idx < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Skeleton Card ─────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse">
    <div className="flex justify-between gap-4">
      <div className="space-y-3 flex-1">
        <div className="flex gap-2">
          <div className="h-3 w-20 bg-gray-200 rounded-full" />
          <div className="h-3 w-16 bg-gray-200 rounded-full" />
        </div>
        <div className="h-4 w-40 bg-gray-200 rounded-lg" />
        <div className="h-3 w-32 bg-gray-200 rounded-lg" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-gray-100 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="h-3 w-16 bg-gray-200 rounded-full" />
        <div className="h-7 w-20 bg-gray-200 rounded-lg" />
      </div>
    </div>
    <div className="mt-4 h-2 w-full bg-gray-100 rounded-full" />
  </div>
);

/* ─── Order Card ────────────────────────────────────────────── */
const OrderCard = ({ order, navigate }) => {
  const config = statusConfig[order.status] || statusConfig.pending;
  const dateStr = new Date(order.createdAt).toLocaleDateString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const isActive = ['pending', 'accepted', 'out_for_delivery'].includes(order.status);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      {/* Top gradient accent */}
      <div className={`h-1 w-full ${
        order.status === 'pending'          ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
        order.status === 'accepted'         ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
        order.status === 'out_for_delivery' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' :
        order.status === 'delivered'        ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                                              'bg-gradient-to-r from-rose-400 to-pink-400'
      }`} />

      <div className="p-5">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {/* Left */}
          <div className="space-y-2 flex-1 min-w-0">
            {/* Order ID + Status badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                #{order._id.slice(-8).toUpperCase()}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${config.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${isActive ? 'animate-pulse' : ''}`} />
                {config.label}
              </span>
            </div>

            {/* Shop */}
            <h3 className="font-bold text-gray-900 text-base leading-tight">{order.shopId?.shopName || 'Local Shop'}</h3>
            {order.shopId?.address && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={11} className="flex-shrink-0" />
                <span className="truncate">{order.shopId.address}</span>
              </div>
            )}

            {/* Items list */}
            <div className="pt-1 space-y-0.5">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                  <span>{item.productId?.name || `Item #${item.productId?.toString?.().slice(-4) || idx + 1}`}</span>
                  <span className="text-gray-400 ml-auto">
                    x {item.quantity}
                    {item.productId?.discount_percent > 0 && (
                      <span className="ml-2 text-green-600 font-bold">
                        (-{item.productId.discount_percent}%)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Status description */}
            <p className={`text-xs font-medium italic ${
              order.status === 'delivered' ? 'text-emerald-600' :
              order.status === 'cancelled' ? 'text-rose-500' : 'text-indigo-500'
            }`}>{config.desc}</p>
          </div>

          {/* Right */}
          <div className="flex flex-col sm:items-end justify-between gap-3 sm:min-w-[100px]">
            <div className="sm:text-right">
              <div className="flex items-center gap-1 text-xs text-gray-400 sm:justify-end">
                <Clock size={11} />
                <span>{dateStr}</span>
              </div>
              <p className="text-2xl font-black text-gray-900 mt-1">&#8377;{order.totalAmount}</p>
            </div>
            
            {order.deliveryOTP && isActive && order.status !== 'delivered' && (
              <div className="bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-lg text-center shadow-sm">
                <span className="block text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-0.5">Delivery OTP</span>
                <span className="block text-xl font-mono font-black text-yellow-800 tracking-[0.2em]">{order.deliveryOTP}</span>
              </div>
            )}
            
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 font-bold hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all border border-indigo-100 mt-auto"
            >
              <RefreshCw size={11} />
              Order Again
            </button>
          </div>
        </div>

        {/* Live Step Tracker */}
        <LiveTracker status={order.status} />
      </div>
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────────── */
const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pastExpanded, setPastExpanded] = useState(true);
  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? { ...o, status: updatedOrder.status } : o));
    };
    socket.on('orderStatusUpdated', handleStatusUpdate);
    return () => { socket.off('orderStatusUpdated', handleStatusUpdate); };
  }, [socket]);

  const fetchMyOrders = async () => {
    try {
      const { data } = await api.get('/orders/my');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders history', error);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter(o => ['pending', 'accepted', 'out_for_delivery'].includes(o.status));
  const pastOrders   = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  /* Loading Skeleton */
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto pb-24">
        <div className="mb-8 animate-pulse">
          <div className="h-8 w-40 bg-gray-200 rounded-xl mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  /* Empty State */
  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pb-24 animate-in fade-in duration-500">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1 text-sm">Track current orders and view your purchase history</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl border border-dashed border-indigo-200 p-14 text-center shadow-sm">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-100 border border-indigo-100">
            <ShoppingBag size={40} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
            Looks like you haven't placed any orders yet. Explore nearby shops to get started!
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            Find Shops Nearby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 pb-24">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-extrabold text-gray-900">My Orders</h1>
          {activeOrders.length > 0 && (
            <span className="relative inline-flex">
              <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-50" />
              <span className="relative text-[10px] font-extrabold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                {activeOrders.length} LIVE
              </span>
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm">Track current orders and view your purchase history</p>
      </div>

      <div className="space-y-10">
        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-indigo-600">Active Orders</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">{activeOrders.length} order{activeOrders.length > 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-4">
              {activeOrders.map(order => (
                <OrderCard key={order._id} order={order} navigate={navigate} />
              ))}
            </div>
          </section>
        )}

        {/* Past Orders */}
        {pastOrders.length > 0 && (
          <section>
            <button
              onClick={() => setPastExpanded(p => !p)}
              className="flex items-center gap-2 mb-4 group w-full"
            >
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 group-hover:text-gray-600 transition-colors">Past Orders</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">{pastOrders.length} order{pastOrders.length > 1 ? 's' : ''}</span>
              <ChevronRight
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${pastExpanded ? 'rotate-90' : ''}`}
              />
            </button>

            {pastExpanded && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                {pastOrders.map(order => (
                  <OrderCard key={order._id} order={order} navigate={navigate} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Orders;
