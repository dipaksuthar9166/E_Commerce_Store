import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { X, ChevronRight, Star, SlidersHorizontal, RotateCcw, Loader2 } from 'lucide-react';
import { isCategoryPathActive } from '../data/customerCategories';
import usePublicCategories from '../hooks/usePublicCategories';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentPath = location.pathname;
  const { navItems, loading } = usePublicCategories();

  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || 10000);
  const [minRating, setMinRating] = useState(Number(searchParams.get('rating')) || 0);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.set('maxPrice', String(maxPrice));
    if (minRating > 0) params.set('rating', String(minRating));
    else params.delete('rating');
    const target =
      currentPath.startsWith('/category') ||
      currentPath === '/products' ||
      currentPath === '/'
        ? `${currentPath === '/' ? '/products' : currentPath}?${params.toString()}`
        : `/products?${params.toString()}`;
    navigate(target);
    if (window.innerWidth < 768) toggleSidebar();
  };

  const resetFilters = () => {
    setMaxPrice(10000);
    setMinRating(0);
    navigate(currentPath.split('?')[0] || '/products');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-[280px] bg-white transform transition-transform duration-300 ease-out flex flex-col
          ${isOpen ? 'translate-x-0' : 'max-md:-translate-x-full translate-x-0'}
          md:sticky md:top-[120px] md:w-[260px] md:shrink-0 md:h-[calc(100vh-140px)] md:border md:border-slate-200/80 md:rounded-2xl md:my-5 md:ml-5 md:shadow-sm md:overflow-y-auto md:self-start md:z-10
        `}
      >
        <div className="flex items-center justify-between p-4 md:hidden border-b border-slate-100">
          <span className="font-bold text-lg text-slate-900">Browse</span>
          <button type="button" onClick={toggleSidebar} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
          <div className="px-5 mb-1 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm tracking-tight">Categories</span>
          </div>
          <p className="px-5 text-[10px] text-slate-400 mb-3">
            Live from sellers · Vendor → Categories → Products
          </p>

          <nav className="space-y-0.5 px-3 mb-5">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : (
              navItems.map((item) => {
                const isActive = isCategoryPathActive(currentPath, item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group text-sm ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm shadow-blue-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                    onClick={() => {
                      if (window.innerWidth < 768) toggleSidebar();
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                        }`}
                      >
                        <Icon size={15} />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    <ChevronRight
                      size={14}
                      className={isActive ? 'text-blue-400' : 'text-slate-300'}
                    />
                  </Link>
                );
              })
            )}
          </nav>

          <div className="mx-4 mb-4 h-px bg-slate-100" />

          <div className="px-5 mb-2 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-900 text-sm">Filters</span>
          </div>

          <div className="px-5 mb-5">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium text-slate-700">Max price</span>
              <span className="font-bold text-blue-600">₹{Number(maxPrice).toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="100"
              max="50000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>₹100</span>
              <span>₹50,000</span>
            </div>
          </div>

          <div className="px-5 mb-5">
            <div className="font-medium text-slate-700 text-xs mb-2.5">Customer rating</div>
            <div className="space-y-2">
              {[4, 3, 2, 0].map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 transition-colors ${
                    minRating === r ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="rating"
                    className="accent-blue-600"
                    checked={minRating === r}
                    onChange={() => setMinRating(r)}
                  />
                  {r === 0 ? (
                    <span className="text-sm text-slate-600">All ratings</span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-slate-700">
                      {r}
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-slate-400">& up</span>
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="px-4 flex gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
              title="Reset filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
