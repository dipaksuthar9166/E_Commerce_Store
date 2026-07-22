import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Store,
  ShoppingBag,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  Eye,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';

// ── Status styles for orders ──────────────────────────────────
const statusStyles = {
  pending:          'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50',
  accepted:         'bg-blue-900/50 text-blue-400 border border-blue-700/50',
  packing:          'bg-indigo-900/50 text-indigo-400 border border-indigo-700/50',
  ready_for_pickup: 'bg-purple-900/50 text-purple-400 border border-purple-700/50',
  out_for_delivery: 'bg-orange-900/50 text-orange-400 border border-orange-700/50',
  delivered:        'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50',
  cancelled:        'bg-red-900/50 text-red-400 border border-red-700/50',
};

// ── Time ago helper ───────────────────────────────────────────
const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ── Stat Card ────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, gradient, sub }) => (
  <div className={`relative rounded-2xl p-6 overflow-hidden ${gradient} shadow-lg`}>
    <div className="absolute -top-4 -right-4 w-28 h-28 bg-white/10 rounded-full" />
    <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
    <div className="relative z-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">{title}</p>
          <p className="text-white text-3xl font-black mt-2 tracking-tight">{value}</p>
        </div>
        <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Icon size={20} className="text-white" />
        </div>
      </div>
      {sub && (
        <div className="flex items-center gap-1 mt-4">
          <ArrowUpRight size={14} className="text-white/90" />
          <span className="text-white/90 text-xs font-semibold">{sub}</span>
        </div>
      )}
    </div>
  </div>
);

// ── Skeleton ─────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    <td colSpan={7} className="px-6 py-4">
      <div className="animate-pulse h-10 bg-slate-800 rounded-lg" />
    </td>
  </tr>
);

// ── Main Component ───────────────────────────────────────────
const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/admin/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleShopAction = async (shopId, approve) => {
    setApproving((prev) => ({ ...prev, [shopId]: true }));
    try {
      await api.put(`/admin/shops/${shopId}/status`, { isActive: approve });
      // Remove from pending list after action
      setData((prev) => ({
        ...prev,
        pendingShops: prev.pendingShops.filter((s) => s._id !== shopId),
        stats: {
          ...prev.stats,
          pendingShopsCount: prev.stats.pendingShopsCount - 1,
          ...(approve ? { activeShops: prev.stats.activeShops + 1 } : {}),
        },
      }));
    } catch (err) {
      console.error('Failed to update shop', err);
    } finally {
      setApproving((prev) => ({ ...prev, [shopId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-slate-400 text-sm">Loading platform overview...</p>
      </div>
    );
  }

  const { stats = {}, pendingShops = [], recentOrders = [] } = data || {};

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Platform Overview</h1>
          <p className="text-slate-400 text-sm mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-slate-300 text-sm font-medium">Live Data</span>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Revenue"
          value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          sub="From delivered orders"
        />
        <StatCard
          title="Active Shops"
          value={stats.activeShops || 0}
          icon={Store}
          gradient="bg-gradient-to-br from-violet-500 to-purple-700"
          sub={`${stats.pendingShopsCount || 0} pending approval`}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon={ShoppingBag}
          gradient="bg-gradient-to-br from-orange-500 to-rose-600"
          sub="All time"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          sub="Across all roles"
        />
      </div>

      {/* ── Pending Approvals ── */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock size={16} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Shops Pending Approval</h2>
              <p className="text-slate-500 text-xs">{pendingShops.length} shops awaiting review</p>
            </div>
          </div>
          {pendingShops.length === 0 && (
            <span className="text-emerald-400 text-xs font-semibold bg-emerald-900/40 border border-emerald-700/40 px-3 py-1 rounded-full">
              All Clear ✓
            </span>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pendingShops.length === 0 ? (
            <div className="col-span-3 text-center py-10 text-slate-500">
              <CheckCircle size={36} className="mx-auto mb-3 text-emerald-600 opacity-50" />
              <p>No shops pending approval right now.</p>
            </div>
          ) : (
            pendingShops.map((shop) => (
              <div
                key={shop._id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col gap-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shrink-0">
                    <Store size={18} className="text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">{shop.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">by {shop.vendor}</p>
                    {shop.email && <p className="text-slate-500 text-xs">{shop.email}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 w-16 shrink-0">Category</span>
                    <span className="text-xs text-slate-300 bg-slate-700/80 px-2 py-0.5 rounded-md">{shop.category}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-slate-500 w-16 shrink-0 pt-0.5">Address</span>
                    <span className="text-xs text-slate-400 leading-tight">{shop.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 w-16 shrink-0">Applied</span>
                    <span className="text-xs text-slate-400">{timeAgo(shop.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    disabled={approving[shop._id]}
                    onClick={() => handleShopAction(shop._id, true)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    {approving[shop._id] ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={13} />}
                    Approve
                  </button>
                  <button
                    disabled={approving[shop._id]}
                    onClick={() => handleShopAction(shop._id, false)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    {approving[shop._id] ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Recent Orders Table ── */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <ShoppingBag size={16} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Recent Orders</h2>
              <p className="text-slate-500 text-xs">Across all shops — latest 10</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Order ID', 'Customer', 'Shop', 'Amount', 'Status', 'Time'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-500">
                    <ShoppingBag size={36} className="mx-auto mb-3 opacity-20" />
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-blue-400 font-semibold text-xs">
                      #{String(order._id).slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-white font-medium text-xs">{order.customer}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{order.shop}</td>
                    <td className="px-6 py-4 text-white font-bold text-xs">
                      ₹{Number(order.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyles[order.status] || 'bg-slate-700 text-slate-300'}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{timeAgo(order.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
