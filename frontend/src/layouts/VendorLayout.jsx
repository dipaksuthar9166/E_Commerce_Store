import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  DollarSign,
  Settings,
  LogOut,
  Home,
  User,
  Menu,
  X,
  Layers,
  ChevronLeft,
  Ticket,
  Users,
  Image as ImageIcon,
  HelpCircle,
  Tag,
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { BrandMark } from '../components/BrandMark';
import ThemeToggle from '../components/ThemeToggle';
import api from '../api/axios';

/** Sidebar sections — logical order for day-to-day seller work */
const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/vendor' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { label: 'Products', icon: Package, to: '/vendor/products' },
      { label: 'Categories', icon: Tag, to: '/vendor/categories' },
      { label: 'Inventory', icon: Layers, to: '/vendor/inventory' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Banners / Ads', icon: ImageIcon, to: '/vendor/banners' },
      { label: 'Coupons', icon: Ticket, to: '/vendor/coupons' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Orders', icon: ShoppingBag, to: '/vendor/orders' },
      { label: 'Customers', icon: Users, to: '/vendor/customers' },
      { label: 'Earnings', icon: DollarSign, to: '/vendor/earnings' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', icon: Settings, to: '/vendor/settings' },
      { label: 'Support', icon: HelpCircle, to: '/vendor/support' },
    ],
  },
];

const bottomNavItems = [
  { label: 'Home', icon: Home, to: '/vendor' },
  { label: 'Orders', icon: ShoppingBag, to: '/vendor/orders' },
  { label: 'Products', icon: Package, to: '/vendor/products' },
  { label: 'Profile', icon: User, to: '/vendor/settings' },
];



const isNavActive = (pathname, to) => {
  if (to === '/vendor') return pathname === '/vendor';
  return pathname === to || pathname.startsWith(`${to}/`);
};

const SidebarContent = ({
  location,
  shopName,
  user,
  handleLogout,
  onNavClick,
  isOnline,
  onToggleOnline,
  collapsed,
  pendingOrders,
}) => {
  const initials = (user?.name || shopName || 'V')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`flex flex-col h-full transition-all duration-300 pb-20 ${collapsed ? 'items-center' : ''}`}>
      <div className={`px-5 py-5 border-b border-gray-100 flex ${collapsed ? 'justify-center' : 'justify-start'}`}>
        <Link to="/vendor" className="flex items-center gap-2" onClick={onNavClick}>
          <BrandMark />
          {!collapsed && (
            <div>
              <p className="font-extrabold text-xl tracking-tight text-gray-900 leading-none">MERSKO</p>
              <p className="text-blue-500 text-[10px] font-semibold tracking-wider uppercase mt-1">Vendor</p>
            </div>
          )}
        </Link>
      </div>

      <div className={`mx-3 mt-4 p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
          {!collapsed && (
            <span className="text-xs font-medium text-gray-700">{isOnline ? 'Shop Online' : 'Shop Offline'}</span>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleOnline}
            className={`text-xs font-semibold py-1 px-2.5 rounded-lg transition-colors ${
              isOnline
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ label, icon: Icon, to }) => {
                const active = isNavActive(location.pathname, to);
                return (
                  <NavLink
                    to={to}
                    end={to === '/vendor'}
                    onClick={onNavClick}
                    title={collapsed ? label : undefined}
                    className={() =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group relative ${
                        active
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`
                    }
                    key={to}
                  >
                    <Icon size={18} className={`flex-shrink-0 transition-colors ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    {!collapsed && (
                      <>
                        <span className="truncate">{label}</span>
                        {label === 'Orders' && pendingOrders > 0 && (
                          <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            {pendingOrders}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && label === 'Orders' && pendingOrders > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-2">
        <Link
          to="/vendor/settings"
          onClick={onNavClick}
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-xs font-semibold truncate">{user?.name || shopName}</p>
              <p className="text-gray-400 text-[10px] truncate">{user?.email || 'vendor@mersko.in'}</p>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={17} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );
};

const VendorLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);

  const shopName = user?.shopName || user?.name || 'My Shop';
  const { socket } = useSocket();
  const [toast, setToast] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const loadShopState = async () => {
      try {
        const { data } = await api.get('/vendor/dashboard');
        if (data?.shop?.isOnline !== undefined) {
          setIsOnline(!!data.shop.isOnline);
        } else if (data?.shop?.isActive !== undefined) {
          setIsOnline(!!data.shop.isActive);
        }
        if (data?.stats?.pendingOrders != null) {
          setPendingOrders(data.stats.pendingOrders);
        }
      } catch {
        // keep defaults
      }
    };
    loadShopState();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order) => {
      setPendingOrders((n) => n + 1);
      setToast({
        id: order._id,
        title: 'New Order Received!',
        message: `${order.userId?.name || 'Customer'} placed an order for \u20b9${order.totalAmount}`,
      });
      setToastVisible(true);
      setTimeout(() => dismissToast(), 5000);
    };

    const handleStatusUpdate = (updatedOrder) => {
      if (updatedOrder?.status && updatedOrder.status !== 'pending') {
        setPendingOrders((n) => Math.max(0, n - 1));
      }
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderStatusUpdated', handleStatusUpdate);
    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderStatusUpdated', handleStatusUpdate);
    };
  }, [socket]);

  const dismissToast = () => {
    setToastVisible(false);
    setTimeout(() => setToast(null), 300);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleOnline = async () => {
    try {
      const { data } = await api.put('/vendor/shop/toggle-online');
      setIsOnline(!!data.isOnline);
    } catch (err) {
      console.error('Failed to toggle shop status', err);
    }
  };

  const sidebarProps = {
    location,
    shopName,
    user,
    handleLogout,
    isOnline,
    onToggleOnline: handleToggleOnline,
    collapsed,
    pendingOrders,
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop sidebar */}
        <aside
          className={`hidden md:flex flex-col bg-white border-r border-gray-100 h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-shrink-0 overflow-y-auto transition-all duration-300 ${
            collapsed ? 'w-20' : 'w-64'
          }`}
        >
          <SidebarContent {...sidebarProps} onNavClick={() => {}} />
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Mobile sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-sm transform transition-transform duration-300 ease-out md:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10 p-1"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
          <SidebarContent {...sidebarProps} collapsed={false} onNavClick={() => setSidebarOpen(false)} />
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Desktop top bar */}
          <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft
                size={18}
                className={`text-gray-500 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              />
            </button>
            <div className="flex items-center gap-2">
              <ThemeToggle variant="solid" />
              <button
                type="button"
                onClick={handleToggleOnline}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </button>
              <Link
                to="/vendor/orders"
                className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                title="Orders"
              >
                <ShoppingBag size={18} />
                {pendingOrders > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingOrders > 9 ? '9+' : pendingOrders}
                  </span>
                )}
              </Link>
            </div>
          </header>

          {/* Mobile top header */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <BrandMark size="sm" />
                <span className="font-extrabold text-gray-900 text-sm tracking-tight">MERSKO</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle variant="solid" />
              <button
                type="button"
                onClick={handleToggleOnline}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-6 relative scroll-smooth">
            <div className="w-full min-h-full p-4 md:p-6">
              <Outlet />
            </div>
          </main>

          {/* Mobile bottom nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50">
            <div className="flex justify-around items-center h-16">
              {bottomNavItems.map(({ label, icon: Icon, to }) => (
                <NavLink key={to} to={to} end={to === '/vendor'}>
                  {({ isActive: navActive }) => (
                    <div
                      className={`relative flex flex-col items-center justify-center space-y-1 px-3 transition-colors ${
                        navActive ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      <div className={`transition-transform duration-200 ${navActive ? 'scale-110' : 'scale-100'}`}>
                        <Icon size={22} />
                      </div>
                      <span className="text-[10px] font-medium">{label}</span>
                      {label === 'Orders' && pendingOrders > 0 && (
                        <span className="absolute top-0 right-1 min-w-[14px] h-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {pendingOrders > 9 ? '9+' : pendingOrders}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed top-4 right-4 z-[60] max-w-sm w-[calc(100%-32px)] transition-all duration-300 ${
            toastVisible ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0'
          }`}
          onClick={dismissToast}
        >
          <div className="bg-orange-500 rounded-xl shadow-lg p-4 cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="font-bold text-white text-sm leading-tight">{toast.title}</p>
                <p className="text-orange-50 text-xs mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast();
                }}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorLayout;
