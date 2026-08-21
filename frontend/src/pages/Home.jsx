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
import { motion } from 'framer-motion';
import PromoBannerSlider from '../components/PromoBannerSlider';
import ProductCard from '../components/ProductCard';
import StaticMap from '../components/StaticMap';

import usePublicCategories from '../hooks/usePublicCategories';
import api from '../api/axios';
import { getProductImage } from '../utils/productImage';
import FlashSaleCountdown from '../components/FlashSaleCountdown';
import { useLanguage } from '../contexts/LanguageContext';

const TRUST = [
  { icon: Truck, title: 'Fast delivery', desc: 'Same-day in your area' },
  { icon: ShieldCheck, title: 'Secure payments', desc: '100% protected checkout' },
  { icon: RotateCcw, title: 'Easy returns', desc: '7-day return policy' },
  { icon: Zap, title: 'Best prices', desc: 'Deals from top sellers' },
];

const Home = () => {
  const { t } = useLanguage();
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto space-y-8 md:space-y-10">
      {/* H1 for SEO — brand + primary keywords */}
      <header className="sr-only">
        <h1>MERSKO — Online store for grocery, daily essentials and local products</h1>
      </header>

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
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex gap-3 overflow-x-auto scrollbar-hide px-1 pb-1"
          >
            {homeChips.map((cat) => (
              <motion.div key={cat.key} variants={sectionVariants} className="flex-shrink-0">
                <Link
                  to={cat.path}
                  className="group flex flex-col items-center gap-1.5 w-[72px] sm:w-[84px]"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-2xl group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors shadow-sm"
                  >
                    <span>{cat.emoji}</span>
                  </motion.div>
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-700 text-center leading-tight group-hover:text-blue-600">
                    {cat.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Promo banners */}
      <section>
        <PromoBannerSlider />
      </section>

      {/* Trust strip */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {TRUST.map(({ icon: Icon, title, desc }) => (
          <motion.div
            variants={sectionVariants}
            key={title}
            className="card-surface flex items-center gap-3 p-3.5 sm:p-4 hover:shadow-md transition-shadow"
          >
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"
            >
              <Icon className="w-5 h-5" />
            </motion.div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{title}</p>
              <p className="text-[11px] text-slate-500 truncate">{desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.section>

      {/* Deals strip — products only (neutral, not rainbow) */}
      {!loading && products.length > 0 && (
        <motion.section 
          variants={sectionVariants} 
          initial="hidden" 
          animate="visible"
          className="rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-red-600 p-1 shadow-lg overflow-hidden"
        >
          <div className="bg-white rounded-xl p-4 sm:p-5 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-5">
              <Zap className="w-40 h-40" />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                </div>
                <div>
                  <h2 className="text-slate-900 font-extrabold text-xl sm:text-2xl tracking-tight">
                    {t('home.flashSale')}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">{t('home.flashSaleDesc')}</p>
                </div>
              </div>
              
              <FlashSaleCountdown />
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative z-10"
            >
              {showDeals.slice(0, 4).map((product, idx) => {
                const discount = product.discount_percent || product.discount || 0;
                const original = Number(product.price) || 0;
                const price = discount > 0 ? Math.round(original * (1 - discount / 100)) : original;
                
                // Mock sold percentage for UI
                const soldPercentage = 40 + (idx * 15);
                
                return (
                <motion.div key={product._id} variants={sectionVariants}>
                  <Link
                    to={`/product/${product._id}`}
                    className="block group relative bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3 hover:border-red-200 hover:shadow-md transition-all h-full"
                  >
                    {discount > 0 && (
                      <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {discount}% OFF
                      </div>
                    )}
                  <div className="aspect-square rounded-lg bg-slate-50 flex items-center justify-center p-3 mb-3 overflow-hidden group-hover:bg-slate-100 transition-colors">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">{product.name}</p>
                  
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <p className="text-sm sm:text-base font-extrabold text-slate-900">
                      ₹{price.toLocaleString('en-IN')}
                    </p>
                    {discount > 0 && (
                      <p className="text-[10px] sm:text-xs text-slate-400 line-through font-medium">
                        ₹{original.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  {/* Stock Progress Bar */}
                  <div className="mt-auto">
                    <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-500 mb-1">
                      <span>{soldPercentage}% Sold</span>
                      <span className="text-red-600">Almost Gone!</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full" 
                        style={{ width: `${soldPercentage}%` }}
                      />
                    </div>
                  </div>
                  </Link>
                </motion.div>
              )})}
            </motion.div>
          </div>
        </motion.section>
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
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5"
          >
            {products.map((product, idx) => (
              <ProductCard key={product._id} product={product} index={idx} />
            ))}
          </motion.div>
        )}
      </section>

      {/* Store Location Map */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Our Store Location
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Visit us at our physical store</p>
        </div>
        <StaticMap 
          position={{ lat: 28.6139, lng: 77.2090 }} 
          popupText="MERSKO Main Store, New Delhi" 
          height="300px" 
        />
      </section>

      {/* CTA banner — solid blue, no multi-color gradient */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden"
      >
        <div className="px-6 py-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              Become a seller
            </p>
            <h3 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
              Sell on MERSKO
            </h3>
            <p className="text-slate-400 text-sm mt-1 max-w-md">
              List products, manage orders live, and grow with millions of buyers.
            </p>
          </div>
          <Link
            to="/register"
            className="shrink-0 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Start selling
          </Link>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
