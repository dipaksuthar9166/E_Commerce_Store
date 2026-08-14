import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, ShoppingCart, Heart, Shield, RotateCcw, Truck,
  Share2, Check, AlertCircle, ChevronLeft, ChevronRight,
  Package, Zap, ArrowLeft
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { getProductImage, getProductImageByIndex } from '../utils/productImage';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import FrequentlyBoughtTogether from '../components/FrequentlyBoughtTogether';
import toast from 'react-hot-toast';
import CustomerChat from '../components/chat/CustomerChat';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const touchStartX = useRef(null);

  const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

  useEffect(() => {
    if (product) {
      if (product.sizes?.length > 0) setSelectedSize(product.sizes[0]);
      if (product.colors?.length > 0) setSelectedColor(product.colors[0]);
    }
  }, [product]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        const count = Math.max(
          Number(data.imageCount) || 0,
          data.hasImage ? 1 : 0,
          data.imagePath ? 1 : 0,
          Array.isArray(data.images) ? data.images.length : 0
        );
        setProduct({
          ...data,
          hasImage: data.hasImage ?? count > 0,
          imageCount: count || (data.hasImage ? 1 : 0),
          images: Array.from({ length: Math.max(count, 1) }, (_, i) => i),
          rating: data.averageRating || 4.2,
          reviews: data.reviews || [],
        });
        try {
          const rel = await api.get(`/products/${id}/related`);
          setRelatedProducts(rel.data || []);
        } catch { /* ignore */ }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();

    if (user) {
      api.get('/users/wishlist').then(({ data }) =>
        setIsWishlisted(data.some(item => (item._id || item) === id))
      ).catch(() => {});
    } else {
      const wl = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setIsWishlisted(wl.some(item => item._id === id));
    }
  }, [id, user]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product._id, _id: product._id,
      name: product.name, price: product.price,
      discount_percent: product.discount_percent || 0,
      image_path: getProductImage(product),
      images: product.images || [],
      shopId: product.shopId?._id || product.shopId || null,
      shopName: product.shopId?.shopName || product.shopName || '',
      selectedSize: selectedSize || null,
      selectedColor: selectedColor || null,
      sizes: product.sizes || [], colors: product.colors || [],
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    const adding = !isWishlisted;
    if (user) {
      try { await api.post(`/users/wishlist/${product._id}`); } catch { }
    } else {
      let wl = JSON.parse(localStorage.getItem('wishlist') || '[]');
      wl = isWishlisted ? wl.filter(i => i._id !== product._id) : [...wl, product];
      localStorage.setItem('wishlist', JSON.stringify(wl));
    }
    setIsWishlisted(p => !p);
    if (adding) toast.success('Added to wishlist!', { icon: '❤️' });
    else toast('Removed from wishlist', { icon: '💔' });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name, url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const nextImage = () => setActiveImage(i => (i + 1) % (product?.images?.length || 1));
  const prevImage = () => setActiveImage(i => (i - 1 + (product?.images?.length || 1)) % (product?.images?.length || 1));

  // Swipe support
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? nextImage() : prevImage(); }
    touchStartX.current = null;
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    const toastId = toast.loading('Submitting review...');
    try {
      await api.post(`/products/${id}/reviews`, { rating, comment: reviewText });
      setProduct(prev => ({
        ...prev,
        reviews: [{ user: user?.name || 'Anonymous', rating, comment: reviewText, createdAt: new Date().toISOString() }, ...prev.reviews],
      }));
      setReviewText(''); setRating(5);
      toast.success('Review submitted successfully!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review', { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile skeleton */}
        <div className="md:hidden">
          <div className="w-full h-80 bg-gray-200 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          </div>
        </div>
        {/* Desktop skeleton */}
        <div className="hidden md:flex max-w-6xl mx-auto p-8 gap-8">
          <div className="w-2/5 h-96 bg-gray-200 rounded-2xl animate-pulse" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Package className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500 font-semibold text-lg">Product not found</p>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 font-bold flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  const discountedPrice = product.discount_percent > 0
    ? Math.round(product.price * (1 - product.discount_percent / 100))
    : product.price;
  const originalPrice = product.originalPrice || (product.discount_percent > 0 ? product.price : null);
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-40 md:pb-0">

      {/* ════════════════════════════════════════════════
          MOBILE LAYOUT (hidden on md+)
          ════════════════════════════════════════════════ */}
      <div className="md:hidden">
        {/* ── Image Carousel ────────────────────────── */}
        <div
          className="relative w-full bg-white overflow-hidden"
          style={{ aspectRatio: '1/1' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Discount badge */}
          {product.discount_percent > 0 && (
            <div className="absolute top-3 left-3 z-20 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
              {product.discount_percent}% off
            </div>
          )}

          {/* Top action bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 pt-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md">
                <Share2 className="w-4 h-4 text-gray-700" />
              </button>
              <button onClick={handleToggleWishlist} className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md">
                <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
              </button>
            </div>
          </div>

          {/* Main image */}
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={getProductImageByIndex(product, activeImage)}
              alt={product.name}
              className="w-full h-full object-contain p-4"
              onError={e => { e.target.src = fallbackImage; }}
            />
          </AnimatePresence>

          {/* Dot indicators */}
          {product.images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
              {product.images.map((_, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`rounded-full transition-all ${i === activeImage ? 'w-5 h-1.5 bg-pink-500' : 'w-1.5 h-1.5 bg-gray-300'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {product.images.length > 1 && (
          <div className="flex gap-2 px-4 py-3 bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide">
            {product.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-pink-500' : 'border-transparent'}`}
              >
                <img
                  src={getProductImageByIndex(product, idx)}
                  alt=""
                  className="w-full h-full object-contain bg-gray-50"
                  onError={e => { e.target.src = fallbackImage; }}
                />
              </button>
            ))}
          </div>
        )}

        {/* ── Product Info ───────────────────────── */}
        <div className="bg-white mt-2 px-4 py-4">
          {/* Name */}
          <h1 className="text-gray-900 font-semibold text-base leading-snug mb-2">
            {product.name}
          </h1>

          {/* Seller & Wishlist */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">
              {product.shopId?.shopName || product.shopName ? `Sold by ${product.shopId?.shopName || product.shopName}` : 'Verified Seller'}
            </span>
            <button onClick={handleToggleWishlist} className="flex items-center gap-1 text-xs font-semibold text-gray-600">
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              {isWishlisted ? 'Wishlisted' : 'Wishlist'}
            </button>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              {(product.rating || 4.2).toFixed(1)} <Star className="w-3 h-3 fill-white" />
            </span>
            <span className="text-xs text-gray-500">({product.reviews?.length || 0} ratings)</span>
          </div>

          {/* Price block */}
          <div className="mb-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black text-gray-900">₹{discountedPrice.toLocaleString('en-IN')}</span>
              {originalPrice && originalPrice > discountedPrice && (
                <>
                  <span className="text-sm text-gray-400 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
                  <span className="text-sm font-bold text-green-600">{product.discount_percent}% off</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Inclusive of all taxes</p>
          </div>

          {/* UPI offer chip */}
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            <Zap className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-green-800">UPI Offer: Extra ₹50 off on orders above ₹299</span>
          </div>

          {/* COD info */}
          {product.price && (
            <p className="text-xs text-gray-500 mb-4">
              ₹{product.price.toLocaleString('en-IN')} <span className="text-gray-400">with COD</span>
            </p>
          )}
        </div>

        {/* Colors */}
        {product.colors?.length > 0 && (
          <div className="bg-white mt-2 px-4 py-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Select Color</h3>
            <div className="flex gap-2 flex-wrap">
              {product.colors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor === color ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent opacity-70'}`}
                >
                  {selectedColor === color && <Check className="w-4 h-4 text-white mix-blend-difference" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sizes */}
        {product.sizes?.length > 0 && (
          <div className="bg-white mt-2 px-4 py-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Select Size</h3>
            <div className="flex gap-2 flex-wrap">
              {product.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[44px] h-10 px-3 rounded-lg text-sm font-bold border-2 transition-all ${selectedSize === size ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delivery & Services */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Truck, label: 'Free\nDelivery', color: 'text-blue-600 bg-blue-50' },
              { icon: RotateCcw, label: '7-Day\nReturn', color: 'text-green-600 bg-green-50' },
              { icon: Shield, label: '100%\nAuthentic', color: 'text-purple-600 bg-purple-50' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-gray-600 font-medium leading-tight text-center whitespace-pre-line">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-white mt-2 px-4 py-4">
            <h2 className="text-sm font-bold text-gray-800 mb-2">Product Description</h2>
            <p className={`text-sm text-gray-600 leading-relaxed ${!showFullDesc ? 'line-clamp-3' : ''}`}>
              {product.description}
            </p>
            {product.description.length > 150 && (
              <button onClick={() => setShowFullDesc(p => !p)} className="text-xs font-bold text-pink-600 mt-2">
                {showFullDesc ? 'Show less ↑' : 'Read more ↓'}
              </button>
            )}
          </div>
        )}

        {/* Stock */}
        {!inStock && (
          <div className="bg-red-50 mx-4 my-2 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-600">Out of stock</span>
          </div>
        )}
        {inStock && product.stock <= 5 && (
          <div className="bg-amber-50 mx-4 my-2 rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-amber-700">Hurry! Only {product.stock} left in stock</span>
          </div>
        )}

        {/* Frequently Bought Together (Mobile) */}
        {relatedProducts.length > 0 && (
          <div className="px-4 mb-4">
            <FrequentlyBoughtTogether 
              mainProduct={product} 
              relatedProduct={relatedProducts[0]} 
            />
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white mt-2 px-4 py-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Ratings & Reviews</h2>
          {user ? (
            <form onSubmit={handleReviewSubmit} className="mb-4 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(star => (
                  <button key={star} type="button" onClick={() => setRating(star)}>
                    <Star className={`w-7 h-7 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-pink-300"
                rows={3} placeholder="Write your review..." value={reviewText}
                onChange={e => setReviewText(e.target.value)} required
              />
              <button type="submit" className="w-full bg-pink-600 text-white font-bold py-2.5 rounded-xl text-sm">
                Submit Review
              </button>
            </form>
          ) : (
            <button onClick={() => navigate('/login')} className="text-sm text-pink-600 font-semibold mb-4 block">
              Login to write a review →
            </button>
          )}

          {product.reviews.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No reviews yet.</p>
          ) : product.reviews.slice(0, 5).map((rv, i) => (
            <div key={i} className="border-b border-gray-100 py-3 last:border-b-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 ${rv.rating >= 4 ? 'bg-green-600' : rv.rating >= 3 ? 'bg-amber-500' : 'bg-red-500'}`}>
                  {rv.rating} <Star className="w-2.5 h-2.5 fill-white" />
                </span>
                <span className="text-xs font-semibold text-gray-700">{rv.user || rv.name || 'Customer'}</span>
                <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-0.5">
                  <Check className="w-3 h-3 text-green-500" /> Verified
                </span>
              </div>
              <p className="text-sm text-gray-600">{rv.comment}</p>
            </div>
          ))}
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div className="mt-2 bg-white px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-gray-800 mb-3">More Like This</h2>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.slice(0, 6).map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP LAYOUT (hidden below md)
          ════════════════════════════════════════════════ */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-10">

          {/* Left: Image Gallery */}
          <div className="w-2/5 flex-shrink-0">
            <div className="sticky top-24">
              {/* Main image */}
              <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
                style={{ aspectRatio: '1/1' }}
              >
                {product.discount_percent > 0 && (
                  <span className="absolute top-4 left-4 z-10 bg-red-500 text-white text-sm font-black px-3 py-1 rounded-full">
                    {product.discount_percent}% off
                  </span>
                )}
                <button onClick={handleToggleWishlist}
                  className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>

                {product.images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 rounded-full shadow flex items-center justify-center">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 rounded-full shadow flex items-center justify-center">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={getProductImageByIndex(product, activeImage)}
                    alt={product.name}
                    className="w-full h-full object-contain p-8"
                    onError={e => { e.target.src = fallbackImage; }}
                  />
                </AnimatePresence>
              </div>

              {/* Thumbnail strip */}
              {product.images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                  {product.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-pink-500' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <img
                        src={getProductImageByIndex(product, idx)} alt=""
                        className="w-full h-full object-contain bg-gray-50"
                        onError={e => { e.target.src = fallbackImage; }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Desktop CTA buttons */}
              <div className="flex gap-3 mt-5">
                <motion.button
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all border-2 ${
                    addedToCart
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : !inStock
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-pink-500 text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  {addedToCart
                    ? <><Check className="w-5 h-5" /> Added!</>
                    : <><ShoppingCart className="w-5 h-5" /> Add to Cart</>
                  }
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-5 h-5" /> Buy Now
                </motion.button>
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex-1 min-w-0">
            {/* Category */}
            <div className="flex items-center gap-2 mb-2">
              {product.category && (
                <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {product.category}
                </span>
              )}
              {!inStock && (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md">Out of Stock</span>
              )}
              {inStock && product.stock <= 5 && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">Only {product.stock} left!</span>
              )}
            </div>

            {/* Product name */}
            <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-3">
              {product.name}
            </h1>

            {/* Seller & Share */}
            <div className="flex items-center gap-3 mb-4">
              {(product.shopId?.shopName || product.shopName) && (
                <span className="text-sm text-gray-500">by <strong className="text-gray-700">{product.shopId?.shopName || product.shopName}</strong></span>
              )}
              <button onClick={handleShare} className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-5 pb-5 border-b border-gray-100">
              <span className="flex items-center gap-1 bg-green-600 text-white text-sm font-bold px-2.5 py-1 rounded-lg shadow-sm">
                {(product.rating || 4.2).toFixed(1)} <Star className="w-3.5 h-3.5 fill-white" />
              </span>
              <span className="text-sm text-gray-500">{product.reviews?.length || 0} Ratings</span>
            </div>

            {/* Price block */}
            <div className="mb-5">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl font-black text-gray-900">
                  ₹{discountedPrice.toLocaleString('en-IN')}
                </span>
                {originalPrice && originalPrice > discountedPrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
                    <span className="text-base font-bold text-green-600">{product.discount_percent}% off</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
            </div>

            {/* UPI Offer */}
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
              <Zap className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-green-800">UPI Offer applied! Extra ₹50 off on this order</span>
            </div>

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Color</h3>
                <div className="flex gap-3 flex-wrap">
                  {product.colors.map((color, idx) => (
                    <button key={idx} onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor === color ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-90'}`}
                    >
                      {selectedColor === color && <Check className="w-4 h-4 text-white mix-blend-difference" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Size</h3>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] h-11 px-4 rounded-xl text-sm font-bold border-2 transition-all ${selectedSize === size ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            <div className="grid grid-cols-3 gap-3 mb-6 bg-gray-50 rounded-2xl p-4">
              {[
                { icon: Truck, label: 'Free Delivery', sub: 'On all orders', color: 'text-blue-600 bg-blue-50' },
                { icon: RotateCcw, label: '7-Day Return', sub: 'Easy returns', color: 'text-green-600 bg-green-50' },
                { icon: Shield, label: '100% Authentic', sub: 'Verified seller', color: 'text-purple-600 bg-purple-50' },
              ].map(({ icon: Icon, label, sub, color }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{label}</p>
                    <p className="text-[11px] text-gray-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-8">
                <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-pink-500 rounded-full" />
                  Product Description
                </h2>
                <p className={`text-sm text-gray-600 leading-relaxed ${!showFullDesc ? 'line-clamp-4' : ''}`}>
                  {product.description}
                </p>
                {product.description.length > 200 && (
                  <button onClick={() => setShowFullDesc(p => !p)} className="text-sm font-bold text-pink-600 mt-2">
                    {showFullDesc ? 'Show less ↑' : 'Read more ↓'}
                  </button>
                )}
              </div>
            )}

            {/* Frequently Bought Together (Desktop) */}
            {relatedProducts.length > 0 && (
              <FrequentlyBoughtTogether 
                mainProduct={product} 
                relatedProduct={relatedProducts[0]} 
              />
            )}

            {/* Reviews */}
            <div id="reviews" className="border-t border-gray-100 pt-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-indigo-500 rounded-full" />
                Ratings & Reviews
              </h2>
              {user ? (
                <form onSubmit={handleReviewSubmit} className="mb-6 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">Share your experience</h3>
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} type="button" onClick={() => setRating(star)}>
                        <Star className={`w-8 h-8 transition-colors ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-pink-300"
                    rows={3} placeholder="What did you like or dislike?" value={reviewText}
                    onChange={e => setReviewText(e.target.value)} required
                  />
                  <button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors">
                    Post Review
                  </button>
                </form>
              ) : (
                <div className="mb-6 p-4 bg-amber-50 text-amber-800 rounded-2xl text-sm flex items-center gap-3 border border-amber-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>Please <button className="font-bold underline" onClick={() => navigate('/login')}>log in</button> to write a review.</p>
                </div>
              )}
              {product.reviews.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No reviews yet. Be the first!</p>
              ) : product.reviews.map((rv, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 mb-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold text-white px-2 py-0.5 rounded flex items-center gap-1 ${rv.rating >= 4 ? 'bg-green-600' : rv.rating >= 3 ? 'bg-amber-500' : 'bg-red-500'}`}>
                      {rv.rating} <Star className="w-2.5 h-2.5 fill-white" />
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{rv.user || rv.name || 'Customer'}</span>
                    <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" /> Verified
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{rv.comment}</p>
                  <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                    {rv.createdAt ? new Date(rv.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-black text-gray-900 mb-5">More Like This</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          MOBILE: Sticky Bottom Bar (Meesho style)
          ════════════════════════════════════════════════ */}
      {/* Sticky Bottom Bar — sits ABOVE the BottomNav (bottom-16 = 64px, BottomNav height) */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-[60] bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
        <div className="flex px-4 py-3 gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border-2 transition-all ${
              addedToCart
                ? 'bg-green-50 border-green-500 text-green-700'
                : !inStock
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-pink-500 text-pink-600 active:bg-pink-50'
            }`}
          >
            {addedToCart
              ? <><Check className="w-5 h-5" /> Added!</>
              : <><ShoppingCart className="w-5 h-5" /> Add to Cart</>
            }
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleBuyNow}
            disabled={!inStock}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-5 h-5" /> Buy Now
          </motion.button>
        </div>
      </div>
      {/* Customer Chat Widget */}
      {product?.shop?._id && (
        <CustomerChat shopId={product.shop._id} shopName={product.shop.name || 'Seller'} />
      )}
    </div>
  );
};

export default ProductDetails;
