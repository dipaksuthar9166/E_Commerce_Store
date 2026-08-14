import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import TopNav from '../components/TopNav';
import BottomNav from '../components/BottomNav';
import Sidebar from '../components/Sidebar';
import { BrandMark } from '../components/BrandMark';
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const location = useLocation();

  // Product detail page needs edge-to-edge layout on mobile (Meesho style)
  const isProductPage = /^\/product\//.test(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-slate-900">
      <TopNav toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 relative max-w-[1600px] w-full mx-auto">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <main className="flex-1 w-full min-w-0 pb-24 md:pb-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {isProductPage ? (
                /* Product page: no padding on mobile so image goes edge-to-edge */
                <div className="w-full md:px-6 md:py-5">
                  <Outlet />
                </div>
              ) : (
                <div className="w-full px-3 sm:px-4 md:px-6 md:py-5 py-3">
                  <Outlet />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* SEO + brand footer (customer site) */}
      <footer className="hidden md:block border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-2">
              <BrandMark size="sm" />
              <span className="font-extrabold text-lg tracking-tight text-slate-900">MERSKO</span>
            </Link>
            <p className="text-slate-500 leading-relaxed max-w-xs">
              MERSKO is your online store for grocery, daily essentials and local products —
              with fast delivery and best prices.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-900 mb-2">Shop</p>
            <ul className="space-y-1.5 text-slate-500">
              <li><Link to="/products" className="hover:text-blue-600">All products</Link></li>
              <li><Link to="/cart" className="hover:text-blue-600">Cart</Link></li>
              <li><Link to="/orders" className="hover:text-blue-600">My orders</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-slate-900 mb-2">Account</p>
            <ul className="space-y-1.5 text-slate-500">
              <li><Link to="/login" className="hover:text-blue-600">Login</Link></li>
              <li><Link to="/register" className="hover:text-blue-600">Create account / Sell on MERSKO</Link></li>
              <li><Link to="/wishlist" className="hover:text-blue-600">Wishlist</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 text-center text-xs text-slate-400 py-3">
          © {new Date().getFullYear()} MERSKO — Online store · Explore · Buy · Deliver fast
        </div>
      </footer>

      <BottomNav />
    </div>
  );
};

export default MainLayout;
