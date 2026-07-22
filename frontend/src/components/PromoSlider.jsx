import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// एक प्रोडक्ट कार्ड के लिए कंपोनेंट
const ProductCard = ({ product }) => {
  // डिस्काउंटेड प्राइस की गणना करें
  const discountedPrice = product.price - (product.price * (product.discount_percent || 0)) / 100;

  return (
    <Link to={`/product/${product._id}`} className="block w-48 flex-shrink-0 snap-start">
      <div className="relative group overflow-hidden rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="absolute top-2 left-2 z-10">
          {product.discount_percent > 0 && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {product.discount_percent}% OFF
            </span>
          )}
        </div>
        <img
          src={product.images[0]?.url || '/placeholder.png'}
          alt={product.name}
          className="w-full h-40 object-cover transform group-hover:scale-105 transition-transform duration-300"
        />
        <div className="p-3">
          <h3 className="text-sm font-semibold text-gray-800 truncate">{product.name}</h3>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-lg font-bold text-gray-900">₹{discountedPrice.toFixed(2)}</p>
            {product.discount_percent > 0 && (
              <p className="text-xs text-gray-500 line-through">₹{product.price.toFixed(2)}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// स्केलेटन लोडर के लिए कंपोनेंट
const SkeletonLoader = () => (
  <div className="w-48 flex-shrink-0 animate-pulse">
    <div className="bg-gray-300 h-40 w-full rounded-lg"></div>
    <div className="p-3">
      <div className="bg-gray-300 h-4 w-3/4 rounded"></div>
      <div className="mt-2 bg-gray-300 h-6 w-1/2 rounded"></div>
    </div>
  </div>
);

const PromoSlider = ({ title, tag }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchPromotionalProducts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/products?tag=${tag}`);
        setProducts(data);
      } catch (error) {
        console.error(`Failed to fetch products for tag: ${tag}`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotionalProducts();
  }, [tag]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!loading && products.length === 0) {
    return null; // अगर कोई प्रोडक्ट नहीं है तो कुछ भी रेंडर न करें
  }

  return (
    <div className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <div className="hidden md:flex items-center space-x-2">
            <button onClick={() => scroll('left')} className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100">
              <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
            </button>
            <button onClick={() => scroll('right')} className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100">
              <ChevronRightIcon className="h-6 w-6 text-gray-700" />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-4"
        >
          {loading
            ? Array.from({ length: 5 }).map((_, index) => <SkeletonLoader key={index} />)
            : products.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </div>
    </div>
  );
};

export default PromoSlider;