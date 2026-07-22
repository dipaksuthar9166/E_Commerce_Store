import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Zap,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PromoBannerSlider from '../components/PromoBannerSlider';
import ProductCard from '../components/ProductCard';
import usePublicCategories from '../hooks/usePublicCategories';
import api from '../api/axios';

const TRUST = [
  { icon: Truck, title: 'Fast delivery', desc: 'Same-day in your area' },
  { icon: ShieldCheck, title: 'Secure payments', desc: '100% protected checkout' },
  { icon: RotateCcw, title: 'Easy returns', desc: '7-day return policy' },
  { icon: Zap, title: 'Best prices', desc: 'Deals from top sellers' },
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { homeChips, loading: catsLoading } = usePublicCategories();

  useEffect(() => {
    const load = async () => {
      try {
        // Prefer full products API; fall back to featured shops endpoint
        try {
          const { data } = await api.get('/products?limit=12');
          setProducts(Array.isArray(data) ? data : []);
        } catch {
          const { data } = await api.get('/shops/products/featured?limit=12');
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error loading home data', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const dealProducts = products.filter(
    (p) => (p.discount_percent || p.discount || 0) > 0
  );
  const showDeals = dealProducts.length > 0 ? dealProducts : products.slice(0, 4);

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto space-y-8 md:space-y-10">
      {/* Category chips — real vendor categories only */}
      <section className="-mx-1">
        {catsLoading ? (
          <div className="flex gap-3 px-1 pb-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-[72px] flex flex-col items-center gap-1.5 animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-slate-200" />
                <div className="h-3 w-12 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : homeChips.length === 0 ? (
          <div className="card-surface px-4 py-3 text-sm text-slate-500">
            Categories appear here when sellers add products under a category (Vendor → Categories → My Products).
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide px-1 pb-1">
            {homeChips.map((cat) => (
              <Link
                key={cat.key}
                to={cat.path}
                className="flex-shrink-0 group flex flex-col items-center gap-1.5 w-[72px] sm:w-[84px]"
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-md shadow-slate-200/80 group-hover:scale-105 group-hover:shadow-lg transition-all`}
                >
                  <span className="drop-shadow-sm">{cat.emoji}</span>
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 text-center leading-tight group-hover:text-blue-600">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Promo banners */}
      <section>
        <PromoBannerSlider />
      </section>

      {/* Trust strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TRUST.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="card-surface flex items-center gap-3 p-3.5 sm:p-4"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{title}</p>
              <p className="text-[11px] text-slate-500 truncate">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Deals strip — products only */}
      {!loading && products.length > 0 && (
        <section className="rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 p-4 sm:p-5 shadow-lg shadow-rose-200/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Today&apos;s Picks
            </h2>
            <Link to="/products" className="text-white/90 text-sm font-medium hover:text-white">
              See more →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {showDeals.slice(0, 4).map((product) => (
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="bg-white/95 backdrop-blur rounded-xl p-2.5 hover:bg-white transition-colors"
              >
                <div className="aspect-square rounded-lg bg-slate-50 flex items-center justify-center p-2 mb-2 overflow-hidden">
                  <img
                    src={
                      product.imagePath ||
                      'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80&w=400'
                    }
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                </div>
                <p className="text-xs font-semibold text-slate-800 line-clamp-1">{product.name}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Featured Products
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Top picks from sellers across the platform</p>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse card-surface p-3">
                <div className="aspect-[4/3] bg-slate-200 rounded-xl mb-3" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="card-surface text-center py-14">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No products yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">
              Sellers can add products from their dashboard
            </p>
            <Link
              to="/products"
              className="inline-flex px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((product, idx) => (
              <ProductCard key={product._id} product={product} index={idx} />
            ))}
          </div>
        )}
      </section>

      {/* CTA banner */}
      <section className="card-surface overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
        <div className="relative z-10 px-6 py-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
              Become a seller
            </p>
            <h3 className="text-white text-xl sm:text-2xl font-black tracking-tight">
              Sell on MERSKO
            </h3>
            <p className="text-blue-100 text-sm mt-1 max-w-md">
              List products, manage orders live, and grow with millions of buyers.
            </p>
          </div>
          <Link
            to="/register"
            className="shrink-0 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-lg hover:bg-blue-50 transition-colors"
          >
            Start selling
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
