import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, Reply, Loader2, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const VendorReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get('/vendor/reviews');
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (productId, reviewId) => {
    if (!replyText.trim()) return;
    try {
      await api.post(`/vendor/reviews/${productId}/${reviewId}/reply`, { reply: replyText });
      setReplyText('');
      setReplyingTo(null);
      fetchReviews(); // Refresh to show the new reply
    } catch (error) {
      console.error('Failed to reply', error);
      alert('Failed to add reply');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={14}
        className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading customer reviews...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <MessageCircle className="text-blue-600" /> Customer Reviews
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Read and reply to feedback from your customers</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <MessageCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No reviews yet</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-sm">
            When customers leave a rating and review on your products, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.reviewId} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Product Thumbnail */}
                <div className="hidden sm:block shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 p-1 flex items-center justify-center overflow-hidden">
                    <img 
                      src={review.productImage || 'https://via.placeholder.com/100'} 
                      alt={review.productName} 
                      className="max-w-full max-h-full object-contain mix-blend-multiply" 
                    />
                  </div>
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {review.userName}
                      </h3>
                      <Link to={`/product/${review.productId}`} className="text-xs text-blue-600 hover:underline line-clamp-1 mt-0.5">
                        {review.productName}
                      </Link>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg shrink-0">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 my-2">
                    {renderStars(review.rating)}
                  </div>

                  <p className="text-sm text-gray-700 bg-gray-50/50 p-3 rounded-xl border border-gray-50 mb-3">
                    "{review.comment}"
                  </p>

                  {/* Vendor Reply Section */}
                  {review.vendorReply ? (
                    <div className="ml-4 pl-4 border-l-2 border-blue-100 mt-3">
                      <div className="flex items-center gap-1.5 mb-1 text-blue-600">
                        <Reply size={14} className="rotate-180" />
                        <span className="text-xs font-bold uppercase tracking-wider">Your Reply</span>
                        <CheckCircle size={12} className="ml-auto text-green-500" />
                      </div>
                      <p className="text-sm text-gray-700 italic">
                        {review.vendorReply}
                      </p>
                    </div>
                  ) : replyingTo === review.reviewId ? (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a public reply..."
                        className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 min-h-[80px]"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReplySubmit(review.productId, review.reviewId)}
                          disabled={!replyText.trim()}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                        >
                          Post Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(review.reviewId)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1"
                    >
                      <Reply size={14} /> Reply to customer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorReviews;
