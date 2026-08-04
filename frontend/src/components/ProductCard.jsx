import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Star, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getProductImage } from '../utils/productImage';
import api from '../api/axios';

/* Neutral image placeholder — avoid multi-color card tints */
const bgTints = [
  'from-slate-50 to-slate-100',
  'from-slate-50 to-slate-100',
  'from-slate-50 to-slate-100',
  'from-slate-50 to-slate-100',
];

function toggleWishlistLocal(product) {
  const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
  const exists = list.some((item) => item._id === product._id);
  let next;
  if (exists) {
    next = list.filter((item) => item._id !== product._id);
  } else {
    next = [...list, product];
  }
  localStorage.setItem('wishlist', JSON.stringify(next));
  window.dispatchEvent(new Event('wishlist-updated'));
  return !exists;
}

const ProductCard = ({ product, index = 0 }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Local-only check — never hit wishlist API per card (was N+1 and slowed home page badly)
  useEffect(() => {
    const sync = () => {
      try {
        const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const id = String(product._id);
        setWishlisted(
          list.some((item) => String(item._id || item.id || item) === id)
        );
      } catch {
        setWishlisted(false);
      }
    };
    sync();
    window.addEventListener('wishlist-updated', sync);
    return () => window.removeEventListener('wishlist-updated', sync);
  }, [product._id]);

  const discount = product.discount_percent || product.discount || 0;
  const original = Number(product.price) || 0;
  const price = discount > 0 ? Math.round(original * (1 - discount / 100)) : original;
  const tint = bgTints[index % bgTints.length];
  const image = imgError ? getProductImage({ name: product.name }) : getProductImage(product);
  const shopName = product.shopId?.shopName || product.shopName || '';

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      try {
        await api.post(`/users/wishlist/${product._id}`);
        setWishlisted(!wishlisted);
        window.dispatchEvent(new Event('wishlist-updated'));
      } catch (err) {
        console.error(err);
      }
    } else {
      setWishlisted(toggleWishlistLocal(product));
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  return (
    <motion.div 
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group card-surface card-hover flex flex-col overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl"
    >
      <Link to={`/product/${product._id}`} className="block relative">
        <div
          className={`relative aspect-[4/3] bg-gradient-to-br ${tint} flex items-center justify-center p-4 overflow-hidden`}
        >
          <motion.img
            src={image}
            alt={product.name}
            className="w-full h-full object-contain drop-shadow-md"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            onError={() => setImgError(true)}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />

          {/* Wishlist */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            type="button"
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`absolute top-2.5 right-2.5 p-2 rounded-full shadow-sm backdrop-blur-md transition-colors ${
              wishlisted
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 text-gray-400 hover:text-rose-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
          </motion.button>

          {/* Discount badge */}
          {discount > 0 && (
            <span className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              {discount}% OFF
            </span>
          )}

          {/* Stock hint */}
          {product.stock === 0 && (
            <span className="absolute bottom-2 left-2.5 bg-slate-800/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Out of stock
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-3 sm:p-3.5">
        <Link to={`/product/${product._id}`}>
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {shopName && (
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
            Sold by {shopName}
          </p>
        )}

        {/* Rating row */}
        <div className="flex items-center gap-1 mt-1.5 mb-2">
          <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-1.5 py-0.5 rounded">
            {(product.rating || 4.2).toFixed ? (product.rating || 4.2).toFixed(1) : product.rating || '4.2'}
            <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
          </span>
          <span className="text-[11px] text-gray-400">
            ({product.reviewCount || Math.floor(20 + (index * 17) % 80)})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="font-bold text-gray-900 text-base sm:text-lg">
            ₹{price.toLocaleString('en-IN')}
          </span>
          {original && original > price && (
            <>
              <span className="text-xs text-gray-400 line-through">
                ₹{Number(original).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">
                Save ₹{(original - price).toLocaleString('en-IN')}
              </span>
            </>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handleAdd}
          disabled={product.stock === 0}
          className={`mt-auto w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            added
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200/60'
          }`}
        >
          {added ? (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Added
            </motion.div>
          ) : (
            <div className="flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
