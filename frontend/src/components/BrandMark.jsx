import React from 'react';
import { Link } from 'react-router-dom';

export const BrandMark = ({ size = 'md' }) => (
  <div className={`relative flex items-center justify-center ${size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'}`}>
    <div className={`flex items-center justify-center font-black tracking-tighter ${size === 'sm' ? 'text-xl' : 'text-2xl'}`}>
      <span className="text-blue-500">M</span>
      <span className="text-orange-500 -ml-0.5">/</span>
    </div>
  </div>
);

export const Brand = ({ to = '/' }) => {
  return (
    <Link to={to} className="flex items-center gap-2.5 flex-shrink-0 group">
      <BrandMark />
      <div>
        <span className="font-extrabold text-xl tracking-tight text-slate-900">
          MERSKO
        </span>
        <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Explore · Buy · Deliver fast</p>
      </div>
    </Link>
  );
};
