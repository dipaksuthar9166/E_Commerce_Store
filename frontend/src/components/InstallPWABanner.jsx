import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const InstallPWABanner = () => {
  const { isInstallable, installPWA } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();

  // Don't show in admin/vendor routes
  const isCustomerRoute = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/vendor') && !location.pathname.startsWith('/delivery');

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!isInstallable || isDismissed || !isCustomerRoute) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white p-3 shadow-lg flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Install MERSKO App</p>
            <p className="text-xs text-blue-100">For a faster, better experience.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={installPWA}
            className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPWABanner;
