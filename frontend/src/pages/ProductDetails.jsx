import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Shield, RotateCcw, Truck, Share2, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { getProductImage, getProductImageByIndex } from '../utils/productImage';

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
  
  // New UI states
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (product) {
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      }
      if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
      }
    }
  }, [product]);

  const fallbackPlaceholderImage = `https://via.placeholder.com/512/f0f0f0/999999?text=No+Image`;
  const handleImageError = (e) => {
    // Prevent infinite loop if the fallback image itself fails to load
    if (!e.target.src.startsWith('https://via.placeholder.com')) {
      e.target.src = fallbackPlaceholderImage;
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        // images[] is stripped on API — build gallery slots from imageCount / hasImage
        const count = Math.max(
          Number(data.imageCount) || 0,
          data.hasImage ? 1 : 0,
          data.imagePath ? 1 : 0,
          Array.isArray(data.images) ? data.images.length : 0
        );
        const productData = {
          ...data,
          hasImage: data.hasImage ?? count > 0,
          imageCount: count || (data.hasImage ? 1 : 0),
          // Index placeholders for thumbnail strip (URLs resolved via getProductImageByIndex)
          images: Array.from({ length: Math.max(count, 1) }, (_, i) => i),
          rating: data.averageRating || 4.2,
          reviews: data.reviews || [],
        };
        setProduct(productData);
        
        // Fetch related products
        try {
          const relatedRes = await api.get(`/products/${id}/related`);
          setRelatedProducts(relatedRes.data || []);
        } catch (err) {
          console.error('Error fetching related products:', err);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    const fetchWishlist = async () => {
      if (user) {
        try {
          const { data } = await api.get('/users/wishlist');
          setIsWishlisted(data.some(item => (item._id || item) === id));
        } catch (err) {
          console.error('Failed to fetch wishlist', err);
        }
      } else {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setIsWishlisted(wishlist.some(item => item._id === id));
      }
    };
    
    fetchWishlist();
  }, [id, user]);

  const handleAddToCart = () => {
    if (product) {
      const price = product.discount_percent > 0
        ? Math.round(product.price * (1 - product.discount_percent / 100))
        : product.price;
      addToCart({
        id: product._id,
        _id: product._id,
        name: product.name,
        price: product.price,
        discount_percent: product.discount_percent || 0,
        image_path: getProductImage(product),
        images: product.images || [],
        shopId: product.shopId?._id || product.shopId || null,
        shopName: product.shopId?.shopName || product.shopName || '',
        selectedSize: selectedSize || null,
        selectedColor: selectedColor || null,
        sizes: product.sizes || [],
        colors: product.colors || [],
      });
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    
    if (user) {
      try {
        await api.post(`/users/wishlist/${product._id}`);
        setIsWishlisted(!isWishlisted);
      } catch (err) {
        console.error('Failed to toggle wishlist', err);
      }
    } else {
      let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      if (isWishlisted) {
        wishlist = wishlist.filter(item => item._id !== product._id);
      } else {
        wishlist.push(product);
      }
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      setIsWishlisted(!isWishlisted);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    
    try {
      await api.post(`/products/${id}/reviews`, {
        rating,
        comment: reviewText
      });
      
      const newReview = {
        user: user?.name || 'Anonymous',
        rating,
        comment: reviewText,
        createdAt: new Date().toISOString()
      };
      
      setProduct(prev => ({
        ...prev,
        reviews: [newReview, ...prev.reviews],
        numReviews: prev.numReviews + 1,
        rating: ((prev.rating * prev.numReviews) + rating) / (prev.numReviews + 1)
      }));
      setReviewText('');
      setRating(5);
      alert('Review added successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    }
  };
  
  const TabButton = ({ tabName, label, count }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-3 py-3 text-sm font-bold transition-colors duration-200 ${
        activeTab === tabName
          ? 'border-b-2 border-blue-600 text-blue-600'
          : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {label} {count !== undefined && <span className="text-xs bg-slate-200 dark:bg-slate-700 rounded-full px-1.5 py-0.5">{count}</span>}
    </button>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!product) {
    return <div className="text-center py-20 text-xl font-medium text-gray-600">Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1220] py-6 px-4 md:px-8 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Glow effect background (hidden on light mode) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 hidden dark:block">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        </div>

        {/* Left Side: Images */}
        <div className="md:w-5/12 p-6 md:p-8 flex flex-col items-center sticky top-24 h-max z-10 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/50">
          <div className="w-full aspect-square relative mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex items-center justify-center group overflow-hidden border border-slate-100 dark:border-slate-700/50">
            {product.discount_percent > 0 && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-black tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-rose-500/30 z-20">
                {product.discount_percent}% OFF
              </div>
            )}
            <button 
              onClick={handleToggleWishlist}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-md border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 transition-all duration-300 hover:scale-110 z-20"
            >
              <Heart className={`w-5 h-5 transition-colors duration-300 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            <img 
              src={getProductImageByIndex(product, activeImage)} 
              alt={product.name} 
              className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110 relative z-10 drop-shadow-xl"
              onError={handleImageError}
            />
          </div>
          
          <div className="flex gap-3 w-full overflow-x-auto pb-2 justify-center scrollbar-hide">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`w-16 h-16 rounded-xl overflow-hidden transition-all duration-300 border-2 p-1 ${activeImage === idx ? 'border-blue-600 dark:border-blue-500 scale-110 shadow-lg shadow-blue-500/20' : 'border-transparent bg-slate-100 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'} flex-shrink-0`}
              >
                <img 
                  src={getProductImageByIndex(product, idx)} 
                  alt="" 
                  className="w-full h-full object-cover rounded-lg"
                  onError={handleImageError}
                />
              </button>
            ))}
          </div>
          
          <div className="flex gap-4 w-full mt-8 relative z-10">
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-4 px-2 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-slate-900/20 border border-slate-800 hover:-translate-y-1"
            >
              <ShoppingCart className="w-5 h-5" /> ADD TO CART
            </button>
            <button 
              onClick={() => { handleAddToCart(); navigate('/checkout'); }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-2 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-blue-600/30 border border-blue-500 hover:-translate-y-1"
            >
              <Shield className="w-5 h-5" /> BUY NOW
            </button>
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="md:w-7/12 p-6 md:p-10 relative z-10 flex flex-col">
          <div className="mb-2 flex items-center gap-2">
             <span className="text-xs font-bold tracking-widest uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md">
               {product.category || 'Premium'}
             </span>
             {product.stock === 0 ? (
               <span className="text-xs font-bold tracking-widest uppercase text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-md">Out of Stock</span>
             ) : product.stock <= 5 ? (
               <span className="text-xs font-bold tracking-widest uppercase text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-md">Only {product.stock} left</span>
             ) : (
               <span className="text-xs font-bold tracking-widest uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md">In Stock</span>
             )}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 rounded-full text-sm font-bold shadow-md">
              <Star className="w-3.5 h-3.5 fill-current" /> {product.rating.toFixed(1)}
            </div>
            <a href="#reviews" onClick={(e) => { e.preventDefault(); setActiveTab('reviews'); }} className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-blue-600 cursor-pointer transition-colors">
              Read {product.reviews.length} Reviews
            </a>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden border-b border-slate-200 dark:border-slate-700 mb-6">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <TabButton tabName="details" label="Details" />
              <TabButton tabName="reviews" label="Reviews" count={product.reviews.length} />
              {relatedProducts.length > 0 && <TabButton tabName="related" label="Related" />}
            </nav>
          </div>

          <div className={`${activeTab === 'details' ? 'block' : 'hidden'} md:block`}>
            <div className="mb-8">
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="flex flex-col mb-1.5">
                    <span className="text-slate-400 line-through text-lg font-medium">₹{product.originalPrice.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Inclusive of all taxes</p>
            </div>

            {(product.colors?.length > 0 || product.sizes?.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                {product.colors?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Color</h3>
                    <div className="flex gap-3">
                      {product.colors.map((color, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedColor(color)}
                          style={{ backgroundColor: color }}
                          className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center border border-slate-200 dark:border-slate-700 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-600 dark:ring-offset-slate-900 scale-110 shadow-lg' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                          title={color}
                        >
                          {selectedColor === color && <Check className="w-5 h-5 text-white mix-blend-difference" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {product.sizes?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Size</h3>
                    <div className="flex gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`w-12 h-10 rounded-xl font-bold text-sm transition-all duration-200 ${selectedSize === size ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                   <RotateCcw className="w-5 h-5" />
                 </div>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">7 Days<br/>Return</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                   <Truck className="w-5 h-5" />
                 </div>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Free<br/>Delivery</span>
              </div>
            </div>

            {(product.shopId?.shopName || product.shopName) && (
              <div className="mb-8 p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/20 rounded-2xl border border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Sold by</p>
                  <p className="font-bold text-slate-900 dark:text-white text-lg">
                    {product.shopId?.shopName || product.shopName}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            )}

            <div className="mb-10">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                Description
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-[15px]">
                  {product.description || "No description provided for this premium product. Contact the seller for more details."}
                </p>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div id="reviews" className={`${activeTab === 'reviews' ? 'block' : 'hidden'} md:block mt-auto border-t border-slate-100 dark:border-slate-800 pt-10`}>
            <h2 className="text-lg font-bold mb-6 text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              Ratings & Reviews
            </h2>

            {user ? (
              <form onSubmit={handleReviewSubmit} className="mb-10 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 transition-all hover:shadow-md">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Share your experience</h3>
                <div className="flex items-center gap-1.5 mb-5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transform transition hover:scale-110"
                    >
                      <Star className={`w-8 h-8 ${star <= rating ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-300 dark:text-slate-600'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mb-4 text-sm text-slate-700 dark:text-slate-200 shadow-inner"
                  rows="3"
                  placeholder="What did you like or dislike?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                ></textarea>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/20"
                >
                  Post Review
                </button>
              </form>
            ) : (
              <div className="mb-10 p-5 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-500 rounded-2xl text-sm flex items-center gap-3 border border-amber-200 dark:border-amber-500/20">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>Please <span className="font-bold underline cursor-pointer hover:text-amber-900 dark:hover:text-amber-400" onClick={() => navigate('/login')}>log in</span> to write a review and share your thoughts.</p>
              </div>
            )}

            <div className="space-y-4">
              {product.reviews.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm italic py-4">No reviews yet. Be the first to review!</p>
              ) : (
                product.reviews.map((review, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`text-white px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm ${review.rating >= 4 ? 'bg-emerald-500' : review.rating >= 3 ? 'bg-amber-500' : 'bg-rose-500'}`}>
                        {review.rating} <Star className="w-3 h-3 fill-white" />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{review.user || review.name}</span>
                      <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500" /> Verified
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed">{review.comment}</p>
                    <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                      Posted on {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : review.date}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Products Section */}
      <div className={`${activeTab === 'related' ? 'block' : 'hidden'} md:block max-w-[1400px] mx-auto mt-12 mb-8`}>
        {relatedProducts.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">You might also like</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {relatedProducts.map((prod, index) => (
                <ProductCard key={prod._id} product={prod} index={index} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
