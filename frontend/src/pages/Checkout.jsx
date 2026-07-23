import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle, MapPin, CreditCard, Loader2,
  ShoppingBag, AlertCircle, Ticket
} from 'lucide-react';
import api from '../api/axios';

const Checkout = () => {
  const { cartItems, clearCart, removeItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use items from location state if present, otherwise fall back to cartItems
  const checkoutItems = location.state?.checkoutItems || cartItems;

  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Redirect if no items to checkout
  useEffect(() => {
    if (checkoutItems.length === 0 && !isSuccess) {
      navigate('/cart');
    }
  }, [checkoutItems, isSuccess, navigate]);
  
  // Create a local calculation for subtotal based on checkoutItems
  const getCheckoutTotal = () => {
    return checkoutItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (checkoutItems.length === 0 && !isSuccess) return null;

  // Group by shopId — in a hyperlocal app one cart = one shop
  const shopId = checkoutItems[0]?.product?.shopId || checkoutItems[0]?.shopId;
  
  // Calculate subtotal
  const subtotal = getCheckoutTotal();
  const deliveryFee = subtotal > 299 ? 0 : 29;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault(); // Prevent form submission
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data } = await api.post('/coupons/validate', {
        code: couponInput,
        shopId: shopId,
        orderAmount: subtotal
      });
      setAppliedCoupon(data);
      setDiscountAmount(data.discountAmount);
      setCouponInput('');
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!shopId) {
      setError('Cart error: cannot detect shop. Please re-add items.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const orderPayload = {
        shopId,
        deliveryAddress: address,
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.couponCode : null,
        items: checkoutItems.map(item => ({
          productId: item.product?._id || item.product?.id || item._id,
          quantity: item.quantity,
        })),
      };

      const { data } = await api.post('/orders', orderPayload);
      setOrderId(data._id);
      
      // Instead of clearCart(), remove only the purchased items
      const purchasedItemIds = checkoutItems.map(item => item.product?._id || item.product?.id);
      removeItems(purchasedItemIds);
      
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-lg shadow-green-200">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Order Confirmed! 🎉</h2>
        <p className="text-gray-500 text-center max-w-sm mb-2">
          Your order has been placed and the vendor has been notified in real-time.
        </p>
        {orderId && (
          <p className="text-xs text-gray-400 mb-8">
            Order ID: <span className="font-mono font-semibold text-gray-600">#{orderId.slice(-8).toUpperCase()}</span>
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-hover transition-colors shadow-lg"
          >
            Browse More Shops
          </button>
        </div>
      </div>
    );
  }

  // ─── Checkout Form ────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 pb-24">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="space-y-5">

        {/* Order Summary Mini */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" /> Your Items
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {checkoutItems.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">
                  {item.product?.name || item.name} × {item.quantity}
                </span>
                <span className="font-semibold text-gray-900">
                  ₹{((item.product?.price || item.price) * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery Fee</span>
              <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Coupon ({appliedCoupon.couponCode})</span>
                <span>-₹{discountAmount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900 text-base pt-1 border-t border-gray-100">
              <span>Total</span><span>₹{total.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Coupon Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" /> Apply Coupon
          </h2>
          
          {appliedCoupon ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
              <div>
                <span className="font-bold text-green-700">{appliedCoupon.couponCode}</span>
                <p className="text-xs text-green-600 mt-0.5">Coupon applied successfully!</p>
              </div>
              <button 
                type="button" 
                onClick={handleRemoveCoupon}
                className="text-red-500 hover:text-red-700 text-sm font-semibold px-2 py-1"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase tracking-wide"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition"
                >
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
            </div>
          )}
        </div>

        {/* Delivery Address */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Delivery Address
          </h2>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your full delivery address (flat, street, landmark, city, pincode)..."
            className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            rows="3"
            required
          />
        </div>

        {/* Payment Method */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Payment Method
          </h2>
          <div className="space-y-3">
            <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio" name="payment" value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
                className="hidden"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 ${paymentMethod === 'cod' ? 'border-primary' : 'border-gray-300'}`}>
                {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <div>
                <span className="font-semibold text-gray-800">💵 Cash on Delivery</span>
                <p className="text-xs text-gray-500 mt-0.5">Pay when your order arrives</p>
              </div>
            </label>
            <label className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-xl opacity-40 cursor-not-allowed">
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-3" />
              <div>
                <span className="font-semibold text-gray-600">💳 Online Payment</span>
                <p className="text-xs text-gray-500 mt-0.5">UPI / Card — Coming Soon</p>
              </div>
            </label>
          </div>
        </div>

        {/* Place Order Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg text-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              Place Order · ₹{total.toFixed(0)}
            </>
          )}
        </button>

        {!user && (
          <p className="text-center text-sm text-amber-600 font-medium">
            ⚠️ You must be <button type="button" onClick={() => navigate('/login')} className="underline">logged in</button> to place an order.
          </p>
        )}
      </form>
    </div>
  );
};

export default Checkout;
