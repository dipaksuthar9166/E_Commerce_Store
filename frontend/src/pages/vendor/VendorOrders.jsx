import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Truck,
  Box,
  ShoppingBag,
  ChevronRight,
  AlertCircle,
  ArchiveRestore,
} from 'lucide-react';
import api from '../../api/axios';
import { useSocket } from '../../contexts/SocketContext';
import {
  PageShell,
  PageHeader,
  RefreshButton,
  StatCard,
  SurfaceCard,
  SoftBadge,
  EmptyState,
} from '../../components/ui/PageUI';

const TABS = [
  { key: 'pending', label: 'New Orders', icon: AlertCircle },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle },
  { key: 'packing', label: 'Packing', icon: Box },
  { key: 'ready_for_pickup', label: 'Ready', icon: CheckCircle },
  { key: 'delivered', label: 'Delivered', icon: Truck },
  { key: 'returns', label: 'Returns', icon: ArchiveRestore },
];

const statusConfig = {
  pending: { label: 'Pending', color: 'rose', nextStatus: 'accepted' },
  accepted: { label: 'Accepted', color: 'blue', nextStatus: 'packing' },
  packing: { label: 'Packing', color: 'violet', nextStatus: 'ready_for_pickup' },
  ready_for_pickup: { label: 'Ready for Pickup', color: 'indigo', nextStatus: 'delivered' },
  delivered: { label: 'Delivered', color: 'emerald' },
  cancelled: { label: 'Cancelled', color: 'slate' },
  return_requested: { label: 'Return Requested', color: 'orange' },
  returned: { label: 'Returned', color: 'slate' },
};

const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.pending;
  return (
    <SoftBadge color={cfg.color}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </SoftBadge>
  );
};

const OrderCard = ({ order, onStatusChange, onReturnAction }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_1px_3px_rgb(15_23_42/0.04)] dark:shadow-black/30 hover:shadow-md transition-shadow overflow-hidden">
    <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-slate-50 dark:border-slate-800">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
            #{order._id?.slice(-6) || 'N/A'}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <p className="font-semibold text-slate-900 dark:text-white">
          {order.userId?.name || 'Customer'}
        </p>
        <p className="text-slate-400 dark:text-slate-500 text-xs">
          {order.userId?.email || 'N/A'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {new Date(order.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <p className="font-bold text-slate-900 dark:text-white text-lg">₹{order.totalAmount}</p>
      </div>
    </div>

    <div className="px-5 py-3 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
      {order.items?.map((item, i) => {
        const name =
          item.productId?.name ||
          item.name ||
          (typeof item.productId === 'string' ? `Item ·${item.productId.slice(-4)}` : 'Item');
        return (
          <div key={i} className="flex justify-between text-sm gap-2">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
              <span className="truncate">{name}</span>
              <span className="text-slate-400 text-xs shrink-0">×{item.quantity}</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400 font-medium shrink-0">
              ₹{item.price}
            </span>
          </div>
        );
      })}
    </div>

    <div className="flex gap-2 px-5 py-3 border-t border-slate-50 dark:border-slate-800 flex-wrap">
      {order.status === 'pending' && (
        <>
          <button
            type="button"
            onClick={() => onStatusChange(order._id, 'cancelled')}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-100 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
          >
            <XCircle size={13} /> Reject
          </button>
          <button
            type="button"
            onClick={() => onStatusChange(order._id, 'accepted')}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-colors shadow-sm shadow-indigo-500/25"
          >
            <CheckCircle size={13} /> Accept
          </button>
        </>
      )}

      {order.status === 'accepted' && (
        <button
          type="button"
          onClick={() => onStatusChange(order._id, 'packing')}
          className="w-full py-2 rounded-xl bg-violet-500 text-white font-semibold text-xs hover:bg-violet-600 transition-colors shadow-sm"
        >
          Mark as Packing
        </button>
      )}

      {order.status === 'packing' && (
        <button
          type="button"
          onClick={() => onStatusChange(order._id, 'ready_for_pickup')}
          className="w-full py-2 rounded-xl bg-indigo-500 text-white font-semibold text-xs hover:bg-indigo-600 transition-colors shadow-sm"
        >
          Ready for Pickup
        </button>
      )}

      {order.status === 'ready_for_pickup' && (
        <button
          type="button"
          onClick={() => onStatusChange(order._id, 'delivered')}
          className="w-full py-2 rounded-xl bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 transition-colors shadow-sm"
        >
          Mark as Delivered
        </button>
      )}

      {order.status === 'return_requested' && (
        <>
          <button
            type="button"
            onClick={() => onReturnAction(order._id, 'reject')}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-100 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
          >
            <XCircle size={13} /> Reject Return
          </button>
          <button
            type="button"
            onClick={() => onReturnAction(order._id, 'approve')}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <CheckCircle size={13} /> Approve Return
          </button>
        </>
      )}

      {order.status !== 'pending' &&
        !['packing', 'ready_for_pickup', 'accepted', 'return_requested'].includes(order.status) && (
          <button
            type="button"
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-0.5 transition-colors w-full justify-center"
          >
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vendor/orders');
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders', error);
    } finally {
      setLoading(false);
    }
  };

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

  const updateOrderStatus = async (id, status) => {
    try {
      await api.put(`/vendor/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    } catch (error) {
      console.error('Failed to update order status', error);
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
        const nextStatus = action === 'approve' ? 'returned' : 'delivered';
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o))
        );
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

  const counts = {
    pending: 0,
    accepted: 0,
    packing: 0,
    ready_for_pickup: 0,
    delivered: 0,
    returns: 0,
    cancelled: 0,
  };
  orders.forEach((o) => {
    if (o.status) {
      if (['return_requested', 'returned'].includes(o.status)) {
        counts.returns++;
      } else if (Object.prototype.hasOwnProperty.call(counts, o.status)) {
        counts[o.status]++;
      }
    }
  });

  return (
    <PageShell>
      <PageHeader
        title="Order Management"
        subtitle="Manage and track all your incoming orders with real-time status updates"
        actions={<RefreshButton onClick={fetchOrders} loading={loading} />}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="New Orders"
          value={loading ? '—' : counts.pending}
          subtitle="Awaiting accept"
          icon={AlertCircle}
          iconColor="bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400"
          bar="from-rose-400 via-orange-400 to-amber-400"
        />
        <StatCard
          title="In Progress"
          value={
            loading ? '—' : counts.accepted + counts.packing + counts.ready_for_pickup
          }
          subtitle="Accepted · packing · ready"
          icon={Box}
          iconColor="bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400"
          bar="from-indigo-400 via-violet-400 to-fuchsia-500"
          delay={0.05}
        />
        <StatCard
          title="Delivered"
          value={loading ? '—' : counts.delivered}
          subtitle="Completed"
          icon={CheckCircle}
          iconColor="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400"
          bar="from-emerald-400 via-teal-400 to-cyan-500"
          delay={0.1}
        />
        <StatCard
          title="Returns"
          value={loading ? '—' : counts.returns}
          subtitle="Requests & completed"
          icon={ArchiveRestore}
          iconColor="bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400"
          bar="from-orange-400 via-amber-400 to-yellow-400"
          delay={0.15}
        />
      </div>

      <SurfaceCard delay={0.1}>
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === key
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              {label}
              {counts[key] > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    activeTab === key
                      ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </SurfaceCard>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 h-40"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <SurfaceCard>
          <EmptyState
            icon={ShoppingBag}
            title={`No ${TABS.find((t) => t.key === activeTab)?.label || activeTab} orders`}
            subtitle={
              activeTab === 'pending'
                ? 'New orders will appear here instantly with notifications.'
                : `All ${activeTab.replace(/_/g, ' ')} orders will appear here.`
            }
          />
        </SurfaceCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onStatusChange={updateOrderStatus}
              onReturnAction={handleReturnAction}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default VendorOrders;
