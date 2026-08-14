import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from 'lucide-react';

const FlashSaleCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  useEffect(() => {
    // Set target time to end of current day (midnight)
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const difference = endOfDay - now;
      
      if (difference > 0) {
        const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const m = Math.floor((difference / 1000 / 60) % 60);
        const s = Math.floor((difference / 1000) % 60);

        setTimeLeft({
          hours: h.toString().padStart(2, '0'),
          minutes: m.toString().padStart(2, '0'),
          seconds: s.toString().padStart(2, '0')
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeUnit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-red-600 text-white font-bold text-sm sm:text-base px-2 sm:px-2.5 py-1 rounded-md min-w-[36px] text-center shadow-inner overflow-hidden relative">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold uppercase mt-0.5 tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="hidden sm:flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-100">
        <Timer className="w-4 h-4 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wide">Ends In</span>
      </div>
      
      <div className="flex items-start gap-1">
        <TimeUnit value={timeLeft.hours} label="Hrs" />
        <span className="text-red-500 font-bold text-lg mt-0.5">:</span>
        <TimeUnit value={timeLeft.minutes} label="Min" />
        <span className="text-red-500 font-bold text-lg mt-0.5">:</span>
        <TimeUnit value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
};

export default FlashSaleCountdown;
