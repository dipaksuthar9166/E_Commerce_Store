import React from 'react';
import { Link } from 'react-router-dom';

/** MERSKO mark: blue M + orange slash — same as vendor portal */
export const BrandMark = ({ size = 'md' }) => {
  const box = size === 'sm' ? 'w-7 h-7 text-xl' : size === 'lg' ? 'w-10 h-10 text-3xl' : 'w-9 h-9 text-2xl';
  return (
    <div className={`relative flex items-center justify-center shrink-0 font-black tracking-tighter leading-none ${box}`}>
      <span className="text-blue-500">M</span>
      <span className="text-orange-500 -ml-0.5">/</span>
    </div>
  );
};

/** Full brand link for customer site (no VENDOR label) */
export const Brand = ({ to = '/', showTagline = true }) => {
  return (
    <Link to={to} className="flex items-center gap-2.5 flex-shrink-0 group">
      <BrandMark />
      <div>
        <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-slate-800">
          MERSKO
        </span>
        {showTagline && (
          <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Explore · Buy · Deliver fast</p>
        )}
      </div>
    </Link>
  );
};
