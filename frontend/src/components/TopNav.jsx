import React, { useState } from 'react';
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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

const TopNav = ({ toggleSidebar }) => {
  const { getCartCount } = useCart();
  const { user, logout } = useAuth();
  const cartCount = getCartCount();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      {/* Promo strip */}
      <div className="hidden sm:block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white text-center text-[11px] sm:text-xs font-medium py-1.5 tracking-wide">
        Free delivery on orders above ₹499 · Same-day delivery in your area · Easy returns
      </div>

      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between gap-6 px-6 py-3.5 max-w-[1600px] mx-auto">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-lg">F</span>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Flip<span className="text-blue-600">Store</span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Explore · Buy · Deliver fast</p>
          </div>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-28 py-2.5 rounded-2xl bg-slate-100 border-2 border-transparent text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            placeholder="Search for products, brands and more..."
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1 sm:gap-2 text-sm font-medium text-slate-700 flex-shrink-0">
          <ThemeToggle variant="light" />

          {user ? (
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-slate-900 max-w-[100px] truncate">{user.name}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link
                  to="/orders"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                >
                  <Package className="w-4 h-4" /> My Orders
                </Link>
                <Link
                  to="/wishlist"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                >
                  <Heart className="w-4 h-4" /> Wishlist
                </Link>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 font-semibold"
            >
              <LogIn className="w-4 h-4" /> Login
            </Link>
          )}

          <Link
            to="/orders"
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <ClipboardList className="w-5 h-5" />
            <span>Orders</span>
          </Link>

          <Link
            to="/wishlist"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <Heart className="w-5 h-5" />
            <span className="hidden lg:inline">Wishlist</span>
          </Link>

          <Link
            to="/cart"
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold px-1 rounded-full border-2 border-white flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="font-semibold">Cart</span>
          </Link>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col px-3 py-3 gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-xl bg-slate-100 text-slate-700"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">F</span>
              </div>
              <span className="font-extrabold text-lg text-slate-900">
                Flip<span className="text-blue-600">Store</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <Link to="/wishlist" className="p-2 text-slate-600">
              <Heart className="w-5 h-5" />
            </Link>
            <Link to="/cart" className="p-2 text-slate-600 relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {cartCount}
                </span>
              )}
            </Link>
            <ThemeToggle variant="ghost" />
            {user ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
            ) : (
              <Link to="/login" className="p-2 text-blue-600">
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 border border-transparent text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            placeholder="Search products, brands..."
          />
        </form>
      </div>
    </header>
  );
};

export default TopNav;
