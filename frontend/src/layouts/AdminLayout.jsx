import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import {
  LayoutGrid,
  Store,
  ShoppingBag,
  BarChart2,
  Users,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { label: 'Dashboard',   icon: LayoutGrid,  path: '/admin' },
  { label: 'Shops',       icon: Store,        path: '/admin/shops' },
  { label: 'Live Orders', icon: ShoppingBag,  path: '/admin/orders' },
  { label: 'Finances',    icon: BarChart2,    path: '/admin/finances' },
  { label: 'Users',       icon: Users,        path: '/admin/users' },
  { label: 'Settings',    icon: Settings,     path: '/admin/settings' },
];

/* Derive breadcrumb from pathname */
const getBreadcrumb = (pathname) => {
  const segments = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  if (!segments.length) return ['Dashboard'];
  return segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const breadcrumbs = getBreadcrumb(location.pathname);
  const adminName = user?.name || 'Super Admin';
  const adminInitials = adminName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen bg-slate-950 font-sans overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex flex-col border-r border-slate-800/60 shrink-0 shadow-2xl shadow-black/40">

        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/60">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
            <span className="text-white font-black text-sm">M</span>
          </div>
          <div className="leading-tight">
            <p className="font-black text-white tracking-widest text-sm">MERSKO</p>
            <p className="text-[10px] text-slate-400 font-semibold tracking-[0.2em] uppercase">Admin</p>
          </div>
        </div>

        {/* Admin Mode Banner */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center gap-2">
          <ShieldCheck size={14} className="text-blue-400 flex-shrink-0" />
          <span className="text-blue-300 text-[10px] font-semibold tracking-wide">Admin Mode Active</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-3">
            Main Menu
          </p>
          {navItems.map(({ label, icon: Icon, path }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                  active
                    ? 'bg-blue-500/10 text-blue-400 border-l-4 border-blue-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-l-4 border-transparent'
                }`}
              >
                <Icon
                  size={18}
                  className={active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}
                />
                <span>{label}</span>
                {active && <ChevronRight size={13} className="ml-auto text-blue-400/70" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom: user + logout */}
        <div className="p-3 border-t border-slate-800/60">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md shadow-blue-500/30">
              {adminInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{adminName}</p>
              <p className="text-slate-500 text-[10px] truncate">{user?.email || 'admin@mersko.in'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Admin Mode Banner (top) ── */}
        <div className="bg-gradient-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur-sm flex items-center justify-center gap-2 py-1.5 px-4">
          <ShieldCheck size={13} className="text-blue-200" />
          <span className="text-blue-100 text-[11px] font-semibold tracking-wide">
            You are in Admin Mode — handle data with care
          </span>
        </div>

        {/* Top Header */}
        <header className="h-14 bg-white/[0.03] border-b border-slate-800/60 flex items-center justify-between px-6 shrink-0 backdrop-blur-sm">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-medium">Admin</span>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                <ChevronRight size={12} className="text-slate-700" />
                <span className={`text-xs font-semibold ${i === breadcrumbs.length - 1 ? 'text-white' : 'text-slate-400'}`}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Right: bell + avatar + logout */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative w-9 h-9 bg-slate-800/60 hover:bg-slate-700/60 rounded-xl flex items-center justify-center transition-colors border border-slate-700/40">
              <Bell size={16} className="text-slate-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-900" />
            </button>
            <ThemeToggle variant="solid" className="!bg-slate-800 !text-slate-200 !border-slate-700 hover:!bg-slate-700" />

            {/* Admin name + avatar */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-white text-xs font-semibold leading-tight">{adminName}</p>
                <p className="text-slate-500 text-[10px]">Super Admin</p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-md shadow-blue-500/30 border border-blue-400/30">
                {adminInitials}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-700/60" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm font-medium transition-colors px-3 py-2 rounded-xl hover:bg-red-500/10"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
