import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { getProductImage } from '../utils/productImage';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const { addToCart } = useCart();

  const load = () => {
    try {
      setWishlistItems(JSON.parse(localStorage.getItem('wishlist') || '[]'));
    } catch {
      setWishlistItems([]);
    }
  };

  useEffect(() => {
    load();
    window.addEventListener('wishlist-updated', load);
    return () => window.removeEventListener('wishlist-updated', load);
  }, []);

  const removeFromWishlist = (id) => {
    const updated = wishlistItems.filter((item) => item._id !== id);
    setWishlistItems(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    window.dispatchEvent(new Event('wishlist-updated'));
  };

  const moveToCart = (product) => {
    addToCart(product);
    removeFromWishlist(product._id);
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
                  src={getProductImage(item)}
                  alt={item.name}
                  className="max-h-full object-contain"
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
