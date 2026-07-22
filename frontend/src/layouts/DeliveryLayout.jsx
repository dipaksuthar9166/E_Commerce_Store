import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { MapPin, DollarSign, ClipboardList, User, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const DeliveryLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(true);

  const navItems = [
    { to: '/delivery',        icon: MapPin,        label: 'Tasks'    },
    { to: '/delivery/earnings', icon: DollarSign,  label: 'Earnings' },
    { to: '/delivery/history',  icon: ClipboardList,label: 'History'  },
    { to: '/delivery/profile',  icon: User,         label: 'Profile'  },
  ];

  const riderName = user?.name?.split(' ')[0] || 'Rider';

  return (
    <div className="flex flex-col h-screen bg-gray-100 max-w-sm mx-auto relative shadow-2xl overflow-hidden">

      {/* ── Sticky Top Header ─────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex items-center justify-between shadow-lg">
        {/* Left: Rider identity */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/40">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Welcome back</p>
            <p className="text-white font-bold text-sm leading-tight">{riderName}</p>
          </div>
        </div>

        {/* Right: Theme + Online toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle
            variant="ghost"
            className="!text-white hover:!bg-white/15"
          />
          <button
            type="button"
            onClick={() => setIsOnline((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
              isOnline
                ? 'bg-green-400 text-green-900 shadow-[0_0_12px_rgba(74,222,128,0.6)]'
                : 'bg-white/20 text-white/80'
            }`}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-900 animate-pulse" />
                ONLINE
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-white/60" />
                OFFLINE
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Scrollable Content ────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet context={{ isOnline }} />
      </main>

      {/* ── Fixed Bottom Navigation ───────────────────────── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 z-20">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ to, icon: Icon, label }) => {
            // exact match for root /delivery, prefix match for sub-routes
            const isActive =
              to === '/delivery'
                ? location.pathname === '/delivery'
                : location.pathname.startsWith(to);

            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/delivery'}
                className="flex flex-col items-center gap-0.5 flex-1 py-2 relative group"
              >
                {/* Active top indicator */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-600" />
                )}
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-600 scale-110'
                    : 'text-gray-400 group-hover:text-gray-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-semibold transition-colors duration-200 ${
                  isActive ? 'text-indigo-600' : 'text-gray-400'
                }`}>
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DeliveryLayout;
