import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, Search, SlidersHorizontal } from 'lucide-react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

/**
 * Flipkart-style product catalogue.
 * Customer browses PRODUCTS only — not separate shops.
 */
const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  const q = searchParams.get('search') || '';
  const maxPrice = Number(searchParams.get('maxPrice')) || 0;
  const minRating = Number(searchParams.get('rating')) || 0;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (q.trim()) params.set('search', q.trim());
        if (maxPrice > 0) params.set('maxPrice', String(maxPrice));
        if (minRating > 0) params.set('rating', String(minRating));
        params.set('limit', '100');

        const { data } = await api.get(`/products?${params.toString()}`);
        setProducts(Array.isArray(data) ? data : []);
        setError(null);
      } catch {
        // Fallback if /products not available
        try {
          const params = new URLSearchParams();
          if (q.trim()) params.set('search', q.trim());
          params.set('limit', '100');
          const { data } = await api.get(`/shops/products/featured?${params.toString()}`);
          setProducts(Array.isArray(data) ? data : []);
          setError(null);
        } catch {
          setError('Failed to load products. Is the backend running?');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [q, maxPrice, minRating]);

  const filtered = useMemo(() => {
    let list = products;
    if (maxPrice > 0) {
      list = list.filter((p) => Number(p.price) <= maxPrice);
    }
    if (minRating > 0) {
      list = list.filter((p) => (p.averageRating || 0) >= minRating);
    }
    return list;
  }, [products, maxPrice, minRating]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-64 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse card-surface p-3">
              <div className="aspect-[4/3] bg-slate-200 rounded-xl mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto card-surface p-10 text-center">
        <Package className="w-12 h-12 text-rose-300 mx-auto mb-3" />
        <p className="text-rose-600 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {q ? `Results for “${q}”` : 'All Products'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            {q ? ` matching “${q}”` : ' available'}
          </p>
        </div>
        {q && (
          <Link
            to="/products"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Clear search
          </Link>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-semibold text-lg">No products found</p>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            Try a different search or browse categories from the menu.
          </p>
          <Link
            to="/"
            className="inline-flex px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Showing products from all sellers · Flipkart-style catalogue</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filtered.map((product, idx) => (
              <ProductCard key={product._id} product={product} index={idx} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductListing;
