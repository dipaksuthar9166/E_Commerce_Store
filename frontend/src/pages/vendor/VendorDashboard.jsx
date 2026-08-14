import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Package,
  IndianRupee,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Zap,
  BarChart2,
  Users,
  Wallet,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/axios';
import { PageShell, SurfaceCard, StatCard as UiStatCard } from '../../components/ui/PageUI';
import DynamicVendorBanner from '../../components/vendor/DynamicVendorBanner';

const fmtINR = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;


const STATUS_COLORS = {
  pending: '#f59e0b',
  accepted: '#3b82f6',
  packing: '#6366f1',
  ready_for_pickup: '#8b5cf6',
  out_for_delivery: '#f97316',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  packing: 'Packing',
  ready_for_pickup: 'Ready',
  out_for_delivery: 'Out',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const StatCard = ({ label, value, icon: Icon, iconColor, bar, subtext, delay = 0 }) => (
  <UiStatCard
    title={label}
    value={value}
    subtitle={subtext}
    icon={Icon}
    iconColor={iconColor}
    bar={bar}
    delay={delay}
    className="!p-4"
  />
);

const ChartCard = ({ title, icon: Icon, children, action, className = '' }) => (
  <SurfaceCard className={className} padding>
    <div className="flex items-center justify-between mb-3 gap-2">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
        {Icon && <Icon size={15} className="text-indigo-500 dark:text-indigo-400" />}
        {title}
      </h3>
      {action}
    </div>
    {children}
  </SurfaceCard>
);

const OrderCard = ({ order, onAccept, onReject }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">#{order._id?.slice(-6) || 'N/A'}</p>
        <p className="font-semibold text-slate-900 dark:text-white text-sm mt-0.5">{order.userId?.name || 'Customer'}</p>
      </div>
      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/50 rounded-lg px-2.5 py-1">
        <Clock size={12} className="text-amber-500" />
        <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>

    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
      {order.items?.map((item, i) => {
        const name =
          item.productId?.name ||
          item.name ||
          (typeof item.productId === 'string' ? `Item ·${item.productId.slice(-4)}` : 'Item');
        return (
          <li key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
              <span className="truncate">{name}</span>
            </div>
            <span className="shrink-0">x{item.quantity}</span>
          </li>
        );
      })}
    </ul>

    <div className="flex items-center justify-between">
      <p className="font-bold text-slate-900 dark:text-white text-sm">
        <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">Total </span>₹{order.totalAmount}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onReject(order._id)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-100 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
        >
          <XCircle size={14} />
          Reject
        </button>
        <button
          type="button"
          onClick={() => onAccept(order._id)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors shadow-sm"
        >
          <CheckCircle size={14} />
          Accept
        </button>
      </div>
    </div>
  </div>
);

const MoneyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 text-xs">
      <p className="font-bold text-slate-500 dark:text-slate-400 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 py-0.5" style={{ color: p.color || p.fill }}>
          <span className="font-medium capitalize">{p.name || p.dataKey}:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {typeof p.value === 'number' && (p.dataKey === 'sales' || p.dataKey === 'profit' || p.dataKey === 'gross')
              ? fmtINR(p.value)
              : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

const emptyHourly = () =>
  [
    { time: '8 AM', sales: 0, orders: 0, clients: 0, profit: 0 },
    { time: '10 AM', sales: 0, orders: 0, clients: 0, profit: 0 },
    { time: '12 PM', sales: 0, orders: 0, clients: 0, profit: 0 },
    { time: '2 PM', sales: 0, orders: 0, clients: 0, profit: 0 },
    { time: '4 PM', sales: 0, orders: 0, clients: 0, profit: 0 },
    { time: '6 PM', sales: 0, orders: 0, clients: 0, profit: 0 },
    { time: '8 PM', sales: 0, orders: 0, clients: 0, profit: 0 },
  ];

const VendorDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    todayOrders: 0,
    todaySales: 0,
    todayProfit: 0,
    todayClients: 0,
    todayGross: 0,
  });
  const [orders, setOrders] = useState([]);
  const [chartData, setChartData] = useState(emptyHourly());
  const [weekTrend, setWeekTrend] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const { socket } = useSocket();

  const gridStroke = isDark ? '#1f2937' : '#f3f4f6';
  const tickFill = isDark ? '#94a3b8' : '#9ca3af';
  const cursorFill = isDark ? '#1f2937' : '#f9fafb';

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/vendor/dashboard');
      setStats({ ...data.stats, shop: data.shop });
      setChartData(data.chartData?.length ? data.chartData : emptyHourly());
      setWeekTrend(data.weekTrend || []);
      setStatusBreakdown(data.statusBreakdown || []);
      setLowStock(data.lowStockProducts || []);

      if (data?.shop?.isOnline !== undefined) {
        setIsOnline(!!data.shop.isOnline);
      } else if (data?.shop?.isActive !== undefined) {
        setIsOnline(!!data.shop.isActive);
      }

      const ordersRes = await api.get('/vendor/orders');
      setOrders(ordersRes.data.filter((o) => o.status === 'pending').slice(0, 3));
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order) => {
      setOrders((prev) => [order, ...prev].slice(0, 3));
      setStats((prev) => ({
        ...prev,
        pendingOrders: prev.pendingOrders + 1,
        totalOrders: prev.totalOrders + 1,
        todayOrders: (prev.todayOrders || 0) + 1,
      }));
      fetchDashboardData();
    };

    const handleStatusUpdate = (updatedOrder) => {
      setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));
      if (updatedOrder.status === 'accepted' || updatedOrder.status === 'cancelled') {
        setStats((prev) => ({
          ...prev,
          pendingOrders: Math.max(0, prev.pendingOrders - 1),
        }));
      }
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderStatusUpdated', handleStatusUpdate);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderStatusUpdated', handleStatusUpdate);
    };
  }, [socket]);

  const shopName = stats?.shop?.shopName || user?.name || 'Vendor';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const updateOrderStatus = async (id, status) => {
    try {
      await api.put(`/vendor/orders/${id}/status`, { status });
      setOrders((prev) => prev.filter((o) => o._id !== id));
      setStats((prev) => ({ ...prev, pendingOrders: Math.max(0, prev.pendingOrders - 1) }));
    } catch (error) {
      console.error(`Failed to ${status} order`, error);
    }
  };

  const handleAccept = (id) => updateOrderStatus(id, 'accepted');
  const handleReject = (id) => updateOrderStatus(id, 'cancelled');

  const toggleShopOnline = async () => {
    try {
      const res = await api.put('/vendor/shop/toggle-online');
      setIsOnline(res.data.isOnline);
    } catch (error) {
      console.error('Failed to toggle shop status', error);
    }
  };

  const hasHourlyActivity = chartData.some(
    (p) => (p.sales || 0) > 0 || (p.orders || 0) > 0
  );
  const hasWeekActivity = weekTrend.some(
    (p) => (p.sales || 0) > 0 || (p.orders || 0) > 0
  );

  const pieData = useMemo(
    () =>
      statusBreakdown.map((s) => ({
        name: STATUS_LABELS[s.status] || s.status,
        value: s.count,
        status: s.status,
      })),
    [statusBreakdown]
  );

  const weekOrdersVsClients = weekTrend.map((d) => ({
    day: d.day,
    orders: d.orders,
    clients: d.clients,
  }));

  return (
    <PageShell className="max-w-[1280px] mx-auto">
      {/* Greeting banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-violet-50 to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 md:p-8 border border-indigo-100/80 dark:border-slate-800">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            {greeting}, {shopName}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Live overview of today&apos;s profit, clients, orders &amp; trends.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleShopOnline}
          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm self-start ${isOnline
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-rose-500'}`} />
          {isOnline ? 'Shop is Online' : 'Shop is Offline'}
          <Zap size={16} />
        </button>
      </div>

      <DynamicVendorBanner />

      {lowStock.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800/50 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-start gap-4">
          <div className="bg-rose-100 dark:bg-rose-900/50 p-2 rounded-xl shrink-0 w-fit">
            <AlertTriangle className="text-rose-600 dark:text-rose-400 w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-rose-800 dark:text-rose-300 font-bold mb-1">Low Stock Alert ({lowStock.length})</h3>
            <p className="text-rose-600 dark:text-rose-400 text-sm mb-3">Some of your products are running out of stock. Please restock them soon to avoid losing sales.</p>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((prod) => (
                <div key={prod._id} className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/50 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{prod.name}</span>
                  <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded text-xs font-bold">{prod.stock} left</span>
                </div>
              ))}
            </div>
          </div>
          <Link to="/vendor/products" className="shrink-0 px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-500 transition">
            Manage Inventory
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Pending Orders"
          value={loading ? '—' : stats.pendingOrders}
          icon={ShoppingBag}
          iconColor="bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400"
          bar="from-orange-400 via-amber-400 to-yellow-400"
          subtext="Needs attention"
        />
        <StatCard
          label="Today's Orders"
          value={loading ? '—' : stats.todayOrders ?? 0}
          icon={Activity}
          iconColor="bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400"
          bar="from-blue-400 via-indigo-400 to-violet-500"
          subtext="Placed today"
          delay={0.03}
        />
        <StatCard
          label="Today's Clients"
          value={loading ? '—' : stats.todayClients ?? 0}
          icon={Users}
          iconColor="bg-violet-50 text-violet-500 dark:bg-violet-500/15 dark:text-violet-400"
          bar="from-violet-400 via-fuchsia-400 to-pink-500"
          subtext="Unique customers"
          delay={0.06}
        />
        <StatCard
          label="Today's Profit"
          value={loading ? '—' : fmtINR(stats.todayProfit)}
          icon={Wallet}
          iconColor="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400"
          bar="from-emerald-400 via-teal-400 to-cyan-500"
          subtext="After commission"
          delay={0.09}
        />
        <StatCard
          label="Today's Sales"
          value={loading ? '—' : fmtINR(stats.todaySales)}
          icon={IndianRupee}
          iconColor="bg-orange-50 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400"
          bar="from-orange-400 via-rose-400 to-pink-500"
          subtext="Delivered revenue"
          delay={0.12}
        />
        <StatCard
          label="Gross Pipeline"
          value={loading ? '—' : fmtINR(stats.todayGross)}
          icon={TrendingUp}
          iconColor="bg-sky-50 text-sky-500 dark:bg-sky-500/15 dark:text-sky-400"
          bar="from-sky-400 via-cyan-400 to-teal-500"
          subtext="Non-cancelled today"
          delay={0.15}
        />
        <StatCard
          label="Total Orders"
          value={loading ? '—' : stats.totalOrders}
          icon={BarChart2}
          iconColor="bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400"
          bar="from-indigo-400 via-violet-400 to-fuchsia-500"
          subtext="Lifetime orders"
          delay={0.18}
        />
        <StatCard
          label="Total Products"
          value={loading ? '—' : stats.totalProducts}
          icon={Package}
          iconColor="bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400"
          bar="from-blue-400 via-sky-400 to-cyan-500"
          subtext="Active in shop"
          delay={0.21}
        />
      </div>

      {/* Charts row 1: Today sales + week profit/sales */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <ChartCard title="Today's Sales by Hour" icon={BarChart2}>
          <div className="h-[260px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">Loading…</div>
            ) : !hasHourlyActivity ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <BarChart2 size={32} className="mb-2 opacity-30" />
                <p className="text-sm font-medium">No sales activity yet today</p>
                <p className="text-xs mt-1">Hourly sales will show here</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickFill }} dy={8} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: tickFill }}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    width={48}
                  />
                  <Tooltip cursor={{ fill: cursorFill }} content={<MoneyTooltip />} />
                  <Bar dataKey="sales" name="Sales" fill="url(#barSales)" radius={[8, 8, 4, 4]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="7-Day Sales & Profit Trend" icon={TrendingUp}>
          <div className="h-[260px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">Loading…</div>
            ) : !hasWeekActivity ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <TrendingUp size={32} className="mb-2 opacity-30" />
                <p className="text-sm font-medium">No weekly data yet</p>
                <p className="text-xs mt-1">Sales & profit trend appears after orders</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="areaProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickFill }} dy={8} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: tickFill }}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    width={48}
                  />
                  <Tooltip content={<MoneyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Sales"
                    stroke="#3b82f6"
                    fill="url(#areaSales)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#10b981"
                    fill="url(#areaProfit)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Charts row 2: orders/clients hourly + weekly + status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <ChartCard title="Today: Orders & Clients" icon={Users}>
          <div className="h-[240px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">Loading…</div>
            ) : !hasHourlyActivity ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <Users size={28} className="mb-2 opacity-30" />
                <p className="text-sm font-medium">No client activity yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickFill }} dy={8} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickFill }} width={28} />
                  <Tooltip content={<MoneyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="clients" name="Clients" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="7-Day Orders & Clients" icon={Activity}>
          <div className="h-[240px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">Loading…</div>
            ) : !hasWeekActivity ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <Activity size={28} className="mb-2 opacity-30" />
                <p className="text-sm font-medium">No weekly orders yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekOrdersVsClients} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickFill }} dy={8} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickFill }} width={28} />
                  <Tooltip content={<MoneyTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="orders" name="Orders" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={14} />
                  <Bar dataKey="clients" name="Clients" fill="#c084fc" radius={[6, 6, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Order Status Mix" icon={Package}>
          <div className="h-[240px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">Loading…</div>
            ) : pieData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                <Package size={28} className="mb-2 opacity-30" />
                <p className="text-sm font-medium">No orders yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}`, name]}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e5e7eb',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Incoming orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            Incoming Orders
          </h2>
          <Link
            to="/vendor/orders"
            className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <ShoppingBag size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No new orders right now</p>
            <p className="text-gray-400 text-xs mt-1">New orders will appear here instantly</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} onAccept={handleAccept} onReject={handleReject} />
            ))}
          </div>
        )}
      </div>
  </PageShell >
  );
};

export default VendorDashboard;
