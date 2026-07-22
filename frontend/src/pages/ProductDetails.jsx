import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Shield, RotateCcw, Truck, Share2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        const productData = {
          ...data,
          images: data.images?.length > 0 ? data.images : [data.imagePath || 'https://via.placeholder.com/600'],
          rating: data.averageRating || 4.2,
          reviews: data.reviews || [],
        };
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    
    // Check if in wishlist from localStorage for now
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsWishlisted(wishlist.some(item => item._id === id));
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      const price = product.discount_percent > 0
        ? Math.round(product.price * (1 - product.discount_percent / 100))
        : product.price;
      addToCart({
        id: product._id,
        _id: product._id,
        name: product.name,
        price: price,
        image_path: product.images[0],
        shopId: product.shopId?._id || product.shopId || 'default',
        shopName: product.shopId?.shopName || product.shopName || '',
      });
    }
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (isWishlisted) {
      wishlist = wishlist.filter(item => item._id !== product._id);
    } else {
      wishlist.push(product);
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    setIsWishlisted(!isWishlisted);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    
    const newReview = {
      user: user?.name || 'Anonymous',
      rating,
      comment: reviewText,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    
    setProduct(prev => ({
      ...prev,
      reviews: [newReview, ...prev.reviews]
    }));
    setReviewText('');
    setRating(5);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!product) {
    return <div className="text-center py-20 text-xl font-medium text-gray-600">Product not found</div>;
  }

  const discountPercentage = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <div className="bg-gray-100 min-h-screen py-6 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto bg-white rounded-sm shadow-sm flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Images */}
        <div className="md:w-5/12 p-4 border-r border-gray-100 flex flex-col items-center sticky top-20 h-max">
          <div className="w-full aspect-square relative mb-4 border border-gray-200 rounded p-4 flex items-center justify-center">
            <img 
              src={product.images[activeImage]} 
              alt={product.name} 
              className="max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-110"
            />
            <button 
              onClick={handleToggleWishlist}
              className="absolute top-4 right-4 p-2 rounded-full bg-white shadow border border-gray-200 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>
          <div className="flex gap-2 w-full overflow-x-auto pb-2 justify-center">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`w-16 h-16 border-2 rounded ${activeImage === idx ? 'border-blue-500' : 'border-gray-200'} p-1 flex-shrink-0`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          
          <div className="flex gap-4 w-full mt-6">
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-[#ff9f00] hover:bg-[#f39800] text-white font-semibold py-4 rounded shadow-md flex items-center justify-center gap-2 transition-colors text-lg"
            >
              <ShoppingCart className="w-5 h-5" /> ADD TO CART
            </button>
            <button 
              onClick={() => { handleAddToCart(); navigate('/checkout'); }}
              className="flex-1 bg-[#fb641b] hover:bg-[#e05a18] text-white font-semibold py-4 rounded shadow-md flex items-center justify-center gap-2 transition-colors text-lg"
            >
              <Shield className="w-5 h-5" /> BUY NOW
            </button>
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="md:w-7/12 p-6 md:p-8">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">{product.name}</h1>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-600 text-white px-2 py-0.5 rounded text-sm font-bold flex items-center gap-1">
              {product.rating} <Star className="w-3 h-3 fill-white" />
            </div>
            <span className="text-gray-500 text-sm font-medium">{product.reviews.length} Ratings & Reviews</span>
          </div>

          <div className="mb-6">
            <div className="flex items-end gap-3">
              <span className="text-3xl font-semibold text-gray-900">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <>
                  <span className="text-gray-500 line-through text-lg">₹{product.originalPrice.toLocaleString()}</span>
                  <span className="text-green-600 font-bold text-sm mb-1">{discountPercentage}% off</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 text-sm text-gray-700">
               <RotateCcw className="w-6 h-6 text-blue-500" />
               <span>7 Days Replacement Policy</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
               <Truck className="w-6 h-6 text-blue-500" />
               <span>Free Delivery available</span>
            </div>
          </div>

          {/* Flipkart-style: seller name only — no separate shop browse */}
          {(product.shopId?.shopName || product.shopName) && (
            <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-gray-600">
                Sold by{' '}
                <span className="font-semibold text-slate-900">
                  {product.shopId?.shopName || product.shopName}
                </span>
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">✓ Genuine product · Platform protected</p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6 mb-8">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Product Description</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Reviews Section */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center justify-between">
              Ratings & Reviews
            </h2>

            {/* Submit Review */}
            {user ? (
              <form onSubmit={handleReviewSubmit} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-3">Rate this product</h3>
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mb-3"
                  rows="3"
                  placeholder="Description..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                ></textarea>
                <button 
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Submit Review
                </button>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                Please <span className="font-bold underline cursor-pointer" onClick={() => navigate('/login')}>log in</span> to write a review.
              </div>
            )}

            {/* List Reviews */}
            <div className="space-y-6">
              {product.reviews.map((review, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-6 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`text-white px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${review.rating >= 4 ? 'bg-green-600' : review.rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                      {review.rating} <Star className="w-2.5 h-2.5 fill-white" />
                    </div>
                    <p className="font-medium text-gray-800 text-sm">{review.comment}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <span className="font-semibold text-gray-700">{review.user}</span>
                    <span>{review.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
