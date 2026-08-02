import React from 'react';
import { useCart } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, Truck } from 'lucide-react';
import { getProductImage } from '../utils/productImage';

const Cart = () => {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    getCartTotal, 
    getCartCount,
    getFullCartCount,
    toggleItemSelection,
    toggleSelectAll,
    isAllSelected,
    getSelectedItems
  } = useCart();
  const navigate = useNavigate();

  const selectedItems = getSelectedItems();
  const fullItemCount = getFullCartCount();

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-16 pb-10 animate-in fade-in max-w-lg mx-auto">
        <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-300">
          <ShoppingBag className="w-14 h-14" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-8 text-center">
          Discover products from local shops and add them here.
        </p>
        <Link
          to="/"
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const freeDeliveryAt = 499;
  const deliveryFee = subtotal >= freeDeliveryAt ? 0 : 40;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    // Pass selected items to checkout page via state
    navigate('/checkout', { state: { checkoutItems: selectedItems } });
  };

  const fallbackPlaceholderImage = `https://via.placeholder.com/128/f0f0f0/999999?text=N/A`;
  const handleImageError = (e) => {
    // Prevent infinite loop if the fallback image itself fails to load
    if (!e.target.src.startsWith('https://via.placeholder.com')) {
      e.target.src = fallbackPlaceholderImage;
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1 tracking-tight">
        Shopping Cart
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        <span className="font-bold text-blue-600">{getCartCount()} selected</span> of {fullItemCount} item{fullItemCount !== 1 ? 's' : ''} in your bag
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          <div className="card-surface p-4 flex items-center justify-between">
             <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={isAllSelected()}
                onChange={toggleSelectAll}
              />
              <span className="text-sm font-medium text-slate-700">Select all items</span>
             </label>
          </div>

          {cartItems.map((item) => {
            const img = getProductImage(item.product);
            return (
              <div
                key={item.cartItemId}
                className={`card-surface p-4 flex gap-4 transition-colors ${!item.selected ? 'bg-slate-50' : ''}`}
              >
                <div className="flex-shrink-0 pt-1">
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={item.selected}
                    onChange={() => toggleItemSelection(item.cartItemId)}
                  />
                </div>
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                  <img
                    src={img}
                    alt={item.product.name}
                    className="w-full h-full object-contain p-1"
                    onError={handleImageError}
                  />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 line-clamp-2">
                        {item.product.name}
                      </h3>
                      {item.shopName && (
                        <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                          {item.shopName}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-1">
                    <span className="text-base font-bold text-slate-900">
                      ₹{Number(item.price).toLocaleString('en-IN')}
                    </span>
                    {item.product.discount_percent > 0 && item.product.price > item.price && (
                      <span className="text-xs text-gray-400 line-through ml-2">
                        ₹{Number(item.product.price).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-auto pt-2">
                    <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, -1)}
                        className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-blue-600"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, 1)}
                        className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-blue-600"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-slate-500 ml-auto">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-4">
          <div className="card-surface p-6 sticky top-28">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Order summary</h2>

            <div className="space-y-3 text-sm text-slate-600 mb-5">
              <div className="flex justify-between">
                <span>Subtotal ({getCartCount()} items)</span>
                <span className="font-semibold text-slate-900">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="inline-flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> Delivery
                </span>
                <span className="font-semibold text-slate-900">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              {subtotal > 0 && deliveryFee > 0 && (
                <div className="text-xs text-blue-700 bg-blue-50 p-2.5 rounded-xl">
                  Add ₹{(freeDeliveryAt - subtotal).toLocaleString('en-IN')} more for free delivery
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-xl font-black text-slate-900">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
            >
              Proceed to checkout ({getCartCount()}) <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/"
              className="block text-center text-sm text-slate-500 hover:text-blue-600 mt-3 font-medium"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
