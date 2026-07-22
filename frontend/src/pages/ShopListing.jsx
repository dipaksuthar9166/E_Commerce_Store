import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, MapPin, Clock, Search, Store } from 'lucide-react';
import api from '../api/axios';

const ShopListing = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const q = searchParams.get('search') || '';

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/shops');
        setShops(Array.isArray(data) ? data : []);
        setError(null);
      } catch {
        setError('Failed to load shops. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return shops;
    const term = q.toLowerCase();
    return shops.filter(
      (s) =>
        s.shopName?.toLowerCase().includes(term) ||
        s.address?.toLowerCase().includes(term)
    );
  }, [shops, q]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-64 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse card-surface overflow-hidden">
              <div className="h-44 bg-slate-200" />
              <div className="p-5 space-y-2">
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto card-surface p-10 text-center">
        <Store className="w-12 h-12 text-rose-300 mx-auto mb-3" />
        <p className="text-rose-600 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {q ? `Results for “${q}”` : 'Nearby Shops'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} store{filtered.length !== 1 ? 's' : ''} delivering near you
          </p>
        </div>
        {q && (
          <Link
            to="/shops"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            Clear search
          </Link>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface py-16 text-center">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No shops found</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">Try a different search or browse all stores</p>
          <Link
            to="/shops"
            className="inline-flex px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
          >
            View all shops
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((shop) => (
            <Link
              to={`/shop/${shop._id}`}
              key={shop._id}
              className="card-surface card-hover overflow-hidden group"
            >
              <div className="h-44 relative overflow-hidden bg-slate-100">
                <img
                  src={
                    shop.imagePath ||
                    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=800'
                  }
                  alt={shop.shopName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {shop.isActive === false && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-sm">
                      Currently closed
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  4.5
                </div>
                <span
                  className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    shop.isOnline !== false
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {shop.isOnline !== false ? 'Open now' : 'Offline'}
                </span>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {shop.shopName}
                  </h2>
                  <div className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg flex items-center shrink-0">
                    <Clock className="w-3 h-3 mr-1" /> 25–30 min
                  </div>
                </div>

                <p className="text-sm text-slate-500 flex items-start mb-4">
                  <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0 text-slate-400" />
                  <span className="line-clamp-2">{shop.address || 'Address not listed'}</span>
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    Local
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    Fast delivery
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopListing;
