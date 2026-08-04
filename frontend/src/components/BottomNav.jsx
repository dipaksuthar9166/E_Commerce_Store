import React from 'react';
import { Home, Package, ShoppingCart, ClipboardList, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';

const BottomNav = () => {
  const location = useLocation();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const path = location.pathname;

  const navItems = [
    { icon: Home, label: 'Home', match: (p) => p === '/', to: '/' },
    { icon: Package, label: 'Products', match: (p) => p.startsWith('/product'), to: '/products' },
    { icon: ShoppingCart, label: 'Cart', match: (p) => p === '/cart', to: '/cart', badge: cartCount },
    { icon: ClipboardList, label: 'Orders', match: (p) => p === '/orders', to: '/orders' },
    { icon: Heart, label: 'Saved', match: (p) => p === '/wishlist', to: '/wishlist' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgb(15_23_42/0.06)]">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const active = item.match(path);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${
                active ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <motion.div 
                whileTap={{ scale: 0.85 }} 
                animate={{ scale: active ? 1.1 : 1 }}
                className="relative"
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                {item.badge > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </motion.div>
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
              {active && (
                <motion.span 
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-600" 
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
