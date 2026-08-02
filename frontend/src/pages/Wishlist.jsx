import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data } = await api.get('/users/wishlist');
        setWishlistItems(data);
      } else {
        setWishlistItems(JSON.parse(localStorage.getItem('wishlist') || '[]'));
      }
    } catch {
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    window.addEventListener('wishlist-updated', load);
    return () => window.removeEventListener('wishlist-updated', load);
  }, [user]);

  const removeFromWishlist = async (id) => {
    if (user) {
      try {
        await api.post(`/users/wishlist/${id}`);
        setWishlistItems(prev => prev.filter(item => item._id !== id));
        window.dispatchEvent(new Event('wishlist-updated'));
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = wishlistItems.filter((item) => item._id !== id);
      setWishlistItems(updated);
      localStorage.setItem('wishlist', JSON.stringify(updated));
      window.dispatchEvent(new Event('wishlist-updated'));
    }
  };

  const moveToCart = (product) => {
    addToCart(product);
    removeFromWishlist(product._id);
  };

  const fallbackPlaceholderImage = `https://via.placeholder.com/256/f0f0f0/999999?text=No+Image`;
  const handleImageError = (e) => {
    // Prevent infinite loop if the fallback image itself fails to load
    if (!e.target.src.startsWith('https://via.placeholder.com')) {
      e.target.src = fallbackPlaceholderImage;
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2 tracking-tight">
        <Heart className="text-rose-500 fill-rose-500 w-6 h-6" />
        My Wishlist
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        {wishlistItems.length} saved item{wishlistItems.length !== 1 ? 's' : ''}
      </p>

      {wishlistItems.length === 0 ? (
        <div className="card-surface p-12 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-rose-200" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Wishlist is empty</h2>
          <p className="text-slate-500 mb-6 text-center text-sm">
            Tap the heart on any product to save it here.
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition font-semibold shadow-md shadow-blue-600/20"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {wishlistItems.map((item) => (
            <div key={item._id} className="card-surface card-hover overflow-hidden flex flex-col">
              <div className="relative aspect-square p-4 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <img
                  src={item.imagePath || item.image_path || `https://via.placeholder.com/256/f0f0f0/999999?text=No+Image`}
                  alt={item.name}
                  className="max-h-full object-contain"
                  onError={handleImageError}
                />
                <button
                  type="button"
                  onClick={() => removeFromWishlist(item._id)}
                  className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <Link to={`/product/${item._id}`} className="hover:text-blue-600 transition-colors">
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2 min-h-10">
                    {item.name}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold text-slate-900">
                    ₹{Number(item.price).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => moveToCart(item)}
                  className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm"
                >
                  <ShoppingCart className="w-4 h-4" /> Move to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
