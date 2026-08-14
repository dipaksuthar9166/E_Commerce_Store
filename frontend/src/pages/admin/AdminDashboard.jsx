import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Store,
  ShoppingBag,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import api from '../../api/axios';
import {
  PageShell,
  PageHeader,
  RefreshButton,
  StatCard,
  SurfaceCard,
  CardHeader,
  SoftBadge,
  DataTable,
  TableHead,
  Th,
  TableBody,
  Tr,
  TableEmpty,
  PageLoader,
  tdClass,
} from '../../components/ui/PageUI';

const statusColor = {
  pending: 'amber',
  accepted: 'blue',
  packing: 'indigo',
  ready_for_pickup: 'violet',
  out_for_delivery: 'orange',
  delivered: 'emerald',
  cancelled: 'rose',
};

const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-xl p-3 text-xs">
      <p className="font-bold text-slate-500 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-2 font-medium py-0.5">
          <span className="capitalize">{p.name}:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {p.dataKey === 'revenue' 
              ? `₹${Number(p.value).toLocaleString('en-IN')}` 
              : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleShopAction = async (shopId, approve) => {
    setApproving((prev) => ({ ...prev, [shopId]: true }));
    try {
      await api.put(`/admin/shops/${shopId}/status`, { isActive: approve });
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
      <PageShell>
        <PageLoader label="Loading platform overview..." />
      </PageShell>
    );
  }

  const { stats = {}, pendingShops = [], recentOrders = [], weekTrend = [] } = data || {};

  return (
    <PageShell>
      <PageHeader
        title="Platform Overview"
        subtitle={today}
        actions={
          <>
            <RefreshButton onClick={fetchDashboard} loading={loading} />
            <div className="flex items-center gap-2 h-10 px-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">Live Data</span>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="From delivered orders"
          icon={DollarSign}
          iconColor="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400"
          bar="from-emerald-400 via-teal-400 to-cyan-500"
          delay={0}
        />
        <StatCard
          title="Active Shops"
          value={stats.activeShops || 0}
          subtitle={`${stats.pendingShopsCount || 0} pending approval`}
          icon={Store}
          iconColor="bg-violet-50 text-violet-500 dark:bg-violet-500/15 dark:text-violet-400"
          bar="from-violet-400 via-fuchsia-400 to-pink-500"
          delay={0.05}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          subtitle="All time"
          icon={ShoppingBag}
          iconColor="bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400"
          bar="from-orange-400 via-rose-400 to-pink-500"
          delay={0.1}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers || 0}
          subtitle="Across all roles"
          icon={Users}
          iconColor="bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400"
          bar="from-blue-400 via-indigo-400 to-violet-500"
          delay={0.15}
        />
      </div>

      {/* Analytics Chart */}
      <SurfaceCard padding delay={0.1}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            7-Day Revenue Trend
          </h2>
        </div>
        <div className="h-[280px]">
          {weekTrend.length === 0 ? (
             <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading chart...</div>
          ) : (
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={weekTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 11, fill: '#64748b' }} 
                   tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`}
                 />
                 <Tooltip content={<CustomTooltip />} />
                 <Area 
                   type="monotone" 
                   dataKey="revenue" 
                   name="Platform Revenue" 
                   stroke="#10b981" 
                   strokeWidth={3}
                   fillOpacity={1} 
                   fill="url(#colorRevenue)" 
                 />
               </AreaChart>
             </ResponsiveContainer>
          )}
        </div>
      </SurfaceCard>

      {/* Pending Approvals */}
      <SurfaceCard padding={false} delay={0.12}>
        <CardHeader
          title="Shops Pending Approval"
          subtitle={`${pendingShops.length} shops awaiting review`}
          actions={
            pendingShops.length === 0 ? (
              <SoftBadge color="emerald">All Clear ✓</SoftBadge>
            ) : (
              <div className="w-8 h-8 bg-amber-50 dark:bg-amber-500/15 rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-amber-500 dark:text-amber-400" />
              </div>
            )
          }
        />

        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pendingShops.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <CheckCircle
                size={36}
                className="mx-auto mb-3 text-emerald-500 dark:text-emerald-400 opacity-50"
              />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                No shops pending approval right now.
              </p>
            </div>
          ) : (
            pendingShops.map((shop) => (
              <div
                key={shop._id}
                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-xl p-5 flex flex-col gap-4 hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                    <Store size={18} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-900 dark:text-white font-bold text-sm truncate">
                      {shop.name}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                      by {shop.vendor}
                    </p>
                    {shop.email && (
                      <p className="text-slate-400 dark:text-slate-500 text-xs">{shop.email}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 w-16 shrink-0">
                      Category
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-md">
                      {shop.category}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 w-16 shrink-0 pt-0.5">
                      Address
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                      {shop.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 w-16 shrink-0">
                      Applied
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {timeAgo(shop.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={approving[shop._id]}
                    onClick={() => handleShopAction(shop._id, true)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    {approving[shop._id] ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <CheckCircle size={13} />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={approving[shop._id]}
                    onClick={() => handleShopAction(shop._id, false)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    {approving[shop._id] ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <XCircle size={13} />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </SurfaceCard>

      {/* Recent Orders */}
      <SurfaceCard padding={false} delay={0.18}>
        <CardHeader
          title="Recent Orders"
          subtitle="Across all shops — latest 10"
          actions={
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/15 rounded-lg flex items-center justify-center">
              <ShoppingBag size={16} className="text-blue-500 dark:text-blue-400" />
            </div>
          }
        />

        <DataTable minWidth="700px">
          <TableHead>
            {['Order ID', 'Customer', 'Shop', 'Amount', 'Status', 'Time'].map((h) => (
              <Th key={h}>{h}</Th>
            ))}
          </TableHead>
          <TableBody>
            {recentOrders.length === 0 ? (
              <TableEmpty
                icon={ShoppingBag}
                title="No orders yet."
                subtitle="Orders will appear here as customers place them."
                colSpan={6}
              />
            ) : (
              recentOrders.map((order) => (
                <Tr key={order._id}>
                  <td className={`${tdClass} font-mono text-indigo-600 dark:text-indigo-400 font-semibold text-xs`}>
                    #{String(order._id).slice(-6).toUpperCase()}
                  </td>
                  <td className={`${tdClass} text-slate-800 dark:text-slate-100 font-medium text-xs`}>
                    {order.customer}
                  </td>
                  <td className={`${tdClass} text-slate-500 dark:text-slate-400 text-xs`}>
                    {order.shop}
                  </td>
                  <td className={`${tdClass} text-slate-900 dark:text-white font-bold text-xs`}>
                    ₹{Number(order.amount).toLocaleString('en-IN')}
                  </td>
                  <td className={tdClass}>
                    <SoftBadge color={statusColor[order.status] || 'slate'} className="capitalize">
                      {String(order.status || '').replace(/_/g, ' ')}
                    </SoftBadge>
                  </td>
                  <td className={`${tdClass} text-slate-500 dark:text-slate-400 text-xs`}>
                    {timeAgo(order.createdAt)}
                  </td>
                </Tr>
              ))
            )}
          </TableBody>
        </DataTable>
      </SurfaceCard>
    </PageShell>
  );
};

export default AdminDashboard;
