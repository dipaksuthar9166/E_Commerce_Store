import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  ChevronDown,
  ClipboardList,
  LogOut,
  LogIn,
  Heart,
  Menu,
  User,
  Package,
  MapPin,
  Loader2,
  Globe,
  Download,
  X,
  Smartphone,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useDeliveryLocation } from '../contexts/LocationContext';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { Brand, BrandMark } from './BrandMark';
import { usePWAInstall } from '../hooks/usePWAInstall';

/** ── How-to-install modal ── */
function InstallModal({ onClose }) {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isChrome = /chrome/i.test(navigator.userAgent) && !/edg/i.test(navigator.userAgent);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.97 }}
          animate={{ y: 0,  opacity: 1, scale: 1   }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Install MERSKO App</p>
                <p className="text-xs text-slate-500">Fast, offline-ready experience</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Steps */}
          <div className="px-5 py-4 space-y-3">
            {isIOS ? (
              <>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">iOS / Safari Steps</p>
                {[
                  { n: '1', text: 'Tap the Share button (box with arrow) in Safari' },
                  { n: '2', text: 'Scroll down and tap “Add to Home Screen”' },
                  { n: '3', text: 'Tap “Add” — app appears on your home screen!' },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-black flex items-center justify-center shrink-0">{s.n}</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{s.text}</p>
                  </div>
                ))}
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {isChrome ? 'Chrome' : 'Browser'} Steps
                </p>
                {[
                  { n: '1', text: 'Click the install icon (⤓) in the address bar (top-right)' },
                  { n: '2', text: 'Click “Install” in the popup' },
                  { n: '3', text: 'App opens like a native app — fast & offline!' },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-black flex items-center justify-center shrink-0">{s.n}</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{s.text}</p>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-md hover:shadow-blue-500/30 transition-shadow"
            >
              Got it!
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


const LocationButton = ({ compact = false }) => {
  const { shortAddress, address, loading, openPicker, error } = useDeliveryLocation();

  const label = loading
    ? 'Detecting…'
    : shortAddress || error || 'Select location';

  return (
    <button
      type="button"
      onClick={openPicker}
      title={address || 'Set delivery location'}
      className={
        compact
          ? 'flex items-center gap-1.5 max-w-[min(100%,220px)] px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-left transition-colors'
          : 'flex items-center gap-2 max-w-[200px] lg:max-w-[240px] px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors text-left group'
      }
    >
      <span
        className={
          compact
            ? 'w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0'
            : 'w-8 h-8 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 flex items-center justify-center shrink-0'
        }
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <MapPin className="w-3.5 h-3.5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        {!compact && (
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 leading-none mb-0.5">
            Deliver to
          </span>
        )}
        <span className="flex items-center gap-0.5">
          <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
            {label}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </span>
      </span>
    </button>
  );
};

/** Click-based account menu — works on touch (mobile) and desktop */
const AccountMenu = ({ variant = 'desktop' }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  if (!user) {
    if (variant === 'mobile') {
      return (
        <Link
          to="/login"
          className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
          aria-label="Login"
        >
          <User className="w-5 h-5" />
        </Link>
      );
    }
    return (
      <Link
        to="/login"
        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 font-semibold"
      >
        <LogIn className="w-4 h-4" /> {t('nav.login')}
      </Link>
    );
  }

  const trigger =
    variant === 'mobile' ? (
      <motion.button
        whileTap={{ scale: 0.9 }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold ring-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {(user.name || 'U').charAt(0).toUpperCase()}
      </motion.button>
    ) : (
      <motion.button
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
          {(user.name || 'U').charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold text-slate-900 max-w-[100px] truncate">{user.name}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </motion.button>
    );

  return (
    <div className="relative" ref={menuRef}>
      {trigger}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="menu"
            className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl z-[60]"
          >
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
            {user.email && (
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            )}
          </div>
          <Link
            to="/orders"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 active:bg-slate-100"
          >
            <Package className="w-4 h-4" /> {t('nav.orders')}
          </Link>
          <Link
            to="/wishlist"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 active:bg-slate-100"
          >
            <Heart className="w-4 h-4" /> {t('nav.wishlist')}
          </Link>
          <div className="h-px bg-slate-100 my-1" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 active:bg-rose-100"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

const TopNav = ({ toggleSidebar }) => {
  const { getCartCount } = useCart();
  const { t, lang, toggleLanguage } = useLanguage();
  const { isInstallable, installPWA } = usePWAInstall();
  const cartCount = getCartCount();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleInstallClick = () => {
    // Check both React state and early-captured window prompt
    if (isInstallable || window._pwaPrompt) {
      installPWA();
    } else {
      // Truly not installable — show how-to guide
      setShowInstallModal(true);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <>
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      {/* Promo strip — solid, not rainbow */}
      <div className="hidden sm:block bg-slate-900 text-slate-200 text-center text-[11px] sm:text-xs font-medium py-1.5 tracking-wide">
        Free delivery on orders above ₹499 · Same-day delivery in your area · Easy returns
      </div>

      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between gap-4 lg:gap-6 px-6 py-3.5 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 shrink-0">
          <Brand to="/" />
          <LocationButton />
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative group min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-28 py-2.5 rounded-2xl bg-slate-100 border-2 border-transparent text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            placeholder={t('nav.searchPlaceholder')}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1 sm:gap-2 text-sm font-medium text-slate-700 flex-shrink-0">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            <Globe className="w-4 h-4 text-blue-600" />
            {lang.toUpperCase()}
          </button>
          
          <ThemeToggle variant="light" />

          {/* ── Install App button (desktop) — always visible ── */}
          <motion.button
            onClick={handleInstallClick}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
            title="Install MERSKO App"
          >
            {isInstallable && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
            )}
            <Download className="w-3.5 h-3.5" />
            Install App
          </motion.button>

          <AccountMenu variant="desktop" />

          <Link
            to="/orders"
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <ClipboardList className="w-5 h-5" />
            <span>{t('nav.orders')}</span>
          </Link>

          <Link
            to="/wishlist"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <Heart className="w-5 h-5" />
            <span className="hidden lg:inline">{t('nav.wishlist')}</span>
          </Link>

          <Link
            to="/cart"
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <motion.span 
                  key={cartCount}
                  initial={{ scale: 0, y: -5 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold px-1 rounded-full border-2 border-white flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </div>
            <span className="font-semibold">{t('nav.cart')}</span>
          </Link>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col px-3 py-3 gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <BrandMark size="sm" />
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                MERSKO
              </span>
            </Link>
          </div>

          {/* Right icons — keep minimal on mobile */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Link to="/wishlist" className="p-2 text-slate-600 dark:text-slate-300">
              <Heart className="w-5 h-5" />
            </Link>
            <Link to="/cart" className="p-2 text-slate-600 dark:text-slate-300 relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0, y: -5 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>
            <ThemeToggle variant="ghost" />
            <AccountMenu variant="mobile" />
          </div>
        </div>

        <LocationButton compact />

        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-16 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            placeholder={t('nav.searchPlaceholder')}
          />
          {/* Inline install button inside search bar */}
          <button
            type="button"
            onClick={handleInstallClick}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold"
            title="Install App"
          >
            {isInstallable && (
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping shrink-0" />
            )}
            <Download className="w-3 h-3" />
            Install
          </button>
        </form>
      </div>
    </header>

    {/* ── Install How-To Modal ── */}
    {showInstallModal && <InstallModal onClose={() => setShowInstallModal(false)} />}
    </>
  );
};

export default TopNav;
