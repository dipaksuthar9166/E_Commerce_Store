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

const StatCard = ({ label, value, icon: Icon, accent, subtext, trend }) => (
  <div className="bg-white rounded-xl border border-black/[0.05] dark:border-white/[0.06] p-3.5 hover:border-black/[0.08] dark:hover:border-white/[0.1] transition-colors">
    <div className="flex items-center gap-3">
      <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${accent} shrink-0`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-gray-500 text-[11px] font-medium truncate">{label}</p>
          {trend != null && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}
            >
              {trend >= 0 ? '+' : ''}
              {trend}%
            </span>
          )}
        </div>
        <p className="text-gray-900 text-lg font-bold tracking-tight leading-tight mt-0.5 truncate">{value}</p>
        {subtext && <p className="text-gray-400 text-[10px] mt-0.5 truncate">{subtext}</p>}
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, icon: Icon, children, action, className = '' }) => (
  <div className={`bg-white rounded-xl border border-black/[0.05] dark:border-white/[0.06] p-4 ${className}`}>
    <div className="flex items-center justify-between mb-3 gap-2">
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
        {Icon && <Icon size={15} className="text-blue-500" />}
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const OrderCard = ({ order, onAccept, onReject }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-400 font-medium">#{order._id?.slice(-6) || 'N/A'}</p>
        <p className="font-semibold text-gray-900 text-sm mt-0.5">{order.userId?.name || 'Customer'}</p>
      </div>
      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1">
        <Clock size={12} className="text-amber-500" />
        <span className="text-amber-600 text-xs font-medium">
          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>

    <ul className="text-xs text-gray-600 space-y-0.5 bg-gray-50 rounded-lg px-3 py-2">
      {order.items?.map((item, i) => {
        const name =
          item.productId?.name ||
          item.name ||
          (typeof item.productId === 'string' ? `Item ·${item.productId.slice(-4)}` : 'Item');
        return (
          <li key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
              <span className="truncate">{name}</span>
            </div>
            <span className="shrink-0">x{item.quantity}</span>
          </li>
        );
      })}
    </ul>

    <div className="flex items-center justify-between">
      <p className="font-bold text-gray-900 text-sm">
        <span className="text-gray-500 text-xs font-normal">Total </span>₹{order.totalAmount}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onReject(order._id)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold border border-red-100 hover:bg-red-100 transition-colors"
        >
          <XCircle size={14} />
          Reject
        </button>
        <button
          type="button"
          onClick={() => onAccept(order._id)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
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
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-100 text-xs">
      <p className="font-bold text-gray-500 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 py-0.5" style={{ color: p.color || p.fill }}>
          <span className="font-medium capitalize">{p.name || p.dataKey}:</span>
          <span className="font-bold text-gray-900">
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
    <div className="space-y-6 max-w-[1280px] mx-auto">
      {/* Greeting banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 md:p-8 border border-blue-100/80 dark:border-slate-700">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {greeting}, {shopName}!
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Live overview of today&apos;s profit, clients, orders &amp; trends.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleShopOnline}
          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm self-start ${
            isOnline
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
          {isOnline ? 'Shop is Online' : 'Shop is Offline'}
          <Zap size={16} />
        </button>
      </div>

      {/* Stats — compact 2-row grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard
          label="Pending Orders"
          value={loading ? '—' : stats.pendingOrders}
          icon={ShoppingBag}
          accent="bg-orange-400"
          subtext="Needs attention"
        />
        <StatCard
          label="Today's Orders"
          value={loading ? '—' : stats.todayOrders ?? 0}
          icon={Activity}
          accent="bg-blue-500"
          subtext="Placed today"
        />
        <StatCard
          label="Today's Clients"
          value={loading ? '—' : stats.todayClients ?? 0}
          icon={Users}
          accent="bg-violet-500"
          subtext="Unique customers"
        />
        <StatCard
          label="Today's Profit"
          value={loading ? '—' : fmtINR(stats.todayProfit)}
          icon={Wallet}
          accent="bg-emerald-500"
          subtext="After commission"
        />
        <StatCard
          label="Today's Sales"
          value={loading ? '—' : fmtINR(stats.todaySales)}
          icon={IndianRupee}
          accent="bg-orange-500"
          subtext="Delivered revenue"
        />
        <StatCard
          label="Gross Pipeline"
          value={loading ? '—' : fmtINR(stats.todayGross)}
          icon={TrendingUp}
          accent="bg-sky-500"
          subtext="Non-cancelled today"
        />
        <StatCard
          label="Total Orders"
          value={loading ? '—' : stats.totalOrders}
          icon={BarChart2}
          accent="bg-indigo-500"
          subtext="Lifetime orders"
        />
        <StatCard
          label="Total Products"
          value={loading ? '—' : stats.totalProducts}
          icon={Package}
          accent="bg-blue-400"
          subtext="Active in shop"
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
    </div>
  );
};

export default VendorDashboard;
