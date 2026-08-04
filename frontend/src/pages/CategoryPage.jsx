import React, { useEffect, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { Package, Heart, ShoppingCart, Loader2, ArrowLeft, SlidersHorizontal, Star, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import { resolveCategoryFromKey } from '../data/customerCategories';
import usePublicCategories from '../hooks/usePublicCategories';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// ── Loading Skeleton ──────────────────────────────────────
const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-2xl border border-gray-100 overflow-hidden">
    <div className="aspect-[4/3] bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-3 bg-gray-200 rounded-full w-1/3" />
      <div className="h-4 bg-gray-200 rounded-full w-3/4" />
      <div className="h-3 bg-gray-200 rounded-full w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-6 bg-gray-200 rounded-full w-1/4" />
        <div className="h-8 bg-gray-200 rounded-xl w-1/3" />
      </div>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────
const CategoryPage = () => {
  const { categoryKey } = useParams();
  const { apiCategories, loading: catsLoading } = usePublicCategories();
  const category = resolveCategoryFromKey(categoryKey, apiCategories);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (category.type !== 'category') return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Use real category name (from vendors); offers is special-cased on backend
        const nameForApi = category.categoryName || category.label || categoryKey;
        const { data } = await api.get(
          `/shops/category/${encodeURIComponent(nameForApi)}`
        );
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading category products', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category.categoryName, category.label, category.type, categoryKey]);

  if (category.type === 'link') {
    return <Navigate to={category.path} replace />;
  }

  if (catsLoading && categoryKey !== 'offers') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Loading category...</p>
      </div>
    );
  }

  // Sort products
  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    return 0; // newest — default from server
  });

  const Icon = category.icon;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0 pb-20">

      {/* ── Hero Banner ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 mb-6 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary/5 rounded-full" />
        <div className="absolute -right-2 -bottom-6 w-24 h-24 bg-primary/5 rounded-full" />

        <div className="relative flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary flex-shrink-0 shadow-sm">
            <Icon size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{category.label}</h1>
              {!loading && (
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {products.length} {products.length === 1 ? 'product' : 'products'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
          </div>
        </div>

        {/* Sort & Filter Bar */}
        {!loading && products.length > 0 && (
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm py-16 px-8 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No products yet</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            This category doesn't have any products listed yet. Check back soon or explore other categories!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> All Products
          </Link>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {sorted.map((product, idx) => (
            <ProductCard key={product._id} product={product} index={idx} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default CategoryPage;
