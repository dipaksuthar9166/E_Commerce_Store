import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useDeliveryLocation } from '../contexts/LocationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle, MapPin, CreditCard, Loader2, ShoppingBag, AlertCircle, Ticket,
  Truck, Zap, CalendarClock, MessageSquare, Minus, Plus, Home, Briefcase,
  Wallet, Smartphone, Building2, Clock, Tag, ShieldCheck
} from 'lucide-react';
import api from '../api/axios';
import { getProductImage } from '../utils/productImage';

// Fallback image URL
const fallbackPlaceholderImage = `https://via.placeholder.com/128/f0f0f0/999999?text=N/A`;

const DELIVERY_METHODS = [
  {
    id: 'express',
    label: 'Express delivery',
    desc: 'Arrive in ~45 mins',
    icon: Zap,
    eta: '45 mins',
  },
  {
    id: 'standard',
    label: 'Standard delivery',
    desc: 'Usually within 2 hours',
    icon: Truck,
    eta: '2 hours',
  },
  {
    id: 'slot',
    label: 'Slot-based delivery',
    desc: 'Pick a convenient time slot',
    icon: CalendarClock,
    eta: 'Scheduled',
  },
];

const SLOT_TIMES = [
  '8:00 AM – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 PM – 2:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
  '6:00 PM – 8:00 PM',
  '8:00 PM – 10:00 PM',
];

const PAYMENT_OPTIONS = [
  {
    id: 'upi',
    label: 'UPI',
    desc: 'Google Pay, PhonePe, BHIM & more',
    icon: Smartphone,
    group: 'online',
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    desc: 'Visa, Mastercard, RuPay',
    icon: CreditCard,
    group: 'online',
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    desc: 'All major banks',
    icon: Building2,
    group: 'online',
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    desc: 'Pay cash when order arrives',
    icon: Wallet,
    group: 'cash',
  },
  {
    id: 'pay_later',
    label: 'Pay Later',
    desc: 'Pay after delivery (eligible orders)',
    icon: Clock,
    group: 'later',
  },
  {
    id: 'emi',
    label: 'EMI',
    desc: 'No-cost & standard EMI options',
    icon: Tag,
    group: 'later',
  },
];

const UPI_APPS = [
  { id: 'gpay', label: 'Google Pay' },
  { id: 'phonepe', label: 'PhonePe' },
  { id: 'other', label: 'Other UPI' },
];

const EMI_MONTHS = [3, 6, 9, 12];

const NOTE_PRESETS = [
  'Leave at door',
  'Call before arrival',
  'Do not ring bell',
  'Hand to me only',
];

function calcDeliveryFee(method, subtotal) {
  if (method === 'express') return subtotal >= 499 ? 0 : 49;
  if (method === 'slot') return subtotal >= 399 ? 0 : 39;
  return subtotal >= 299 ? 0 : 29;
}

function calcPlatformFee(subtotal) {
  if (subtotal <= 0) return 0;
  if (subtotal >= 999) return 0;
  return 5;
}

function calcTax(amount) {
  return Math.round(Math.max(0, amount) * 0.05 * 100) / 100;
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const Checkout = () => {
  const { cartItems, removeItems, updateQuantity } = useCart();
  const { user } = useAuth();
  const {
    address: savedDeliveryAddress,
    openPicker,
    lat,
    lng,
  } = useDeliveryLocation();
  const navigate = useNavigate();
  const location = useLocation();

  const checkoutItems = location.state?.checkoutItems || cartItems;

  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderIds, setOrderIds] = useState([]);
  const [localItems, setLocalItems] = useState([]);

  // Address
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [address, setAddress] = useState(() => savedDeliveryAddress || '');
  const [addressType, setAddressType] = useState('home');
  const [contactPhone, setContactPhone] = useState(() => user?.phone || '');
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  // Coupon / payment / delivery
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiApp, setUpiApp] = useState('gpay');
  const [emiMonths, setEmiMonths] = useState(3);
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [slotDate, setSlotDate] = useState(tomorrowISO());
  const [slotTime, setSlotTime] = useState(SLOT_TIMES[2]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Sync local editable qty from cart/checkout items
  useEffect(() => {
    setLocalItems(
      (checkoutItems || []).map((item) => ({
        ...item,
        quantity: item.quantity,
      }))
    );
  }, [checkoutItems]);

  useEffect(() => {
    // If there are no items to check out and the order is not successful yet, 
    // redirect to the cart page. This prevents direct access to an empty checkout page.
    if ((checkoutItems || []).length === 0 && !isSuccess) {
      navigate('/cart');
    }
  }, [checkoutItems, isSuccess, navigate]);

  useEffect(() => {
    if (savedDeliveryAddress && !selectedAddressId) {
      setAddress(savedDeliveryAddress);
    }
  }, [savedDeliveryAddress, selectedAddressId]);

  useEffect(() => {
    if (user?.phone && !contactPhone) setContactPhone(user.phone);
  }, [user, contactPhone]);

  // Load saved addresses
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await api.get('/users/addresses');
        const list = Array.isArray(data) ? data : [];
        setSavedAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) {
          setSelectedAddressId(def._id);
          setAddress(def.address + (def.city ? `, ${def.city}` : '') + (def.postalCode ? ` - ${def.postalCode}` : ''));
          setAddressType(def.type || 'home');
        }
      } catch {
        /* optional */
      }
    })();
  }, [user]);

  const resolveShopId = (item) => {
    const raw =
      item?.shopId ||
      item?.product?.shopId ||
      item?.product?.shop?._id ||
      item?.product?.shop;
    if (!raw) return null;
    if (typeof raw === 'object') return raw._id || raw.id || null;
    return raw;
  };

  const resolveProductId = (item) => {
    const raw =
      item?.product?._id ||
      item?.product?.id ||
      item?.productId ||
      item?._id ||
      item?.id;
    if (!raw) return null;
    if (typeof raw === 'object') return raw._id || raw.id || null;
    return String(raw);
  };

  // shopId is only needed for coupon validation — backend groups by product.shopId
  const shopId = resolveShopId(localItems[0]);

  const subtotal = useMemo(
    () => localItems.reduce((t, item) => t + (item.price || 0) * item.quantity, 0),
    [localItems]
  );

  const mrpSavings = useMemo(
    () =>
      localItems.reduce((t, item) => {
        const mrp = item.product?.price || item.price || 0;
        const paid = item.price || 0;
        return t + Math.max(0, mrp - paid) * item.quantity;
      }, 0),
    [localItems]
  );

  const deliveryFee = calcDeliveryFee(deliveryMethod, subtotal);
  const platformFee = calcPlatformFee(subtotal);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = calcTax(taxable);
  const total = Math.max(0, Math.round((taxable + deliveryFee + platformFee + taxAmount) * 100) / 100);
  const totalSavings = Math.round((mrpSavings + discountAmount) * 100) / 100;

  const changeQty = (item, delta) => {
    const cartItemId = item.cartItemId;
    const pid = resolveProductId(item);
    // CartContext.updateQuantity expects cartItemId (not product id)
    if (!location.state?.checkoutItems && cartItemId) {
      updateQuantity(cartItemId, delta);
    }
    setLocalItems((prev) =>
      prev
        .map((it) => {
          if (cartItemId && it.cartItemId) {
            if (it.cartItemId !== cartItemId) return it;
            return { ...it, quantity: it.quantity + delta };
          }
          const id = resolveProductId(it);
          if (id !== pid) return it;
          if ((it.selectedSize || null) !== (item.selectedSize || null)) return it;
          if ((it.selectedColor || null) !== (item.selectedColor || null)) return it;
          return { ...it, quantity: it.quantity + delta };
        })
        .filter((it) => it.quantity > 0)
    );
  };

  const selectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setAddress(
      addr.address +
        (addr.city ? `, ${addr.city}` : '') +
        (addr.postalCode ? ` - ${addr.postalCode}` : '')
    );
    setAddressType(addr.type || 'home');
    setSaveNewAddress(false);
  };

  const handleApplyCoupon = async (e) => {
    e?.preventDefault?.();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data } = await api.post('/coupons/validate', {
        code: couponInput,
        shopId,
        orderAmount: subtotal,
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
    if (!address.trim()) {
      setError('Please enter or select a delivery address.');
      return;
    }
    if (deliveryMethod === 'slot' && (!slotDate || !slotTime)) {
      setError('Please select a delivery date and time slot.');
      return;
    }

    const orderItems = localItems
      .map((item) => {
        const productId = resolveProductId(item);
        const shopId = resolveShopId(item); // <-- Naya: Har item ka shopId nikalein
        const quantity = Math.max(1, Number(item.quantity) || 0);

        // Agar productId ya shopId nahi hai to item ko skip karein
        if (!productId || !shopId || quantity < 1) return null;

        return {
          productId: String(productId),
          shopId: String(shopId), // <-- Naya: Payload mein shopId add karein
          quantity,
          selectedSize: item.selectedSize || null,
          selectedColor: item.selectedColor || null,
          // Backend ko zaroori anya details bhi yahan add kar sakte hain
          name: item.name,
          price: item.price,
          // Image is loaded client-side via product id + hasImage; keep URL only if absolute
          image: item.product?.imagePath || item.imagePath || null,
        };
      })
      .filter(Boolean);

    if (!orderItems.length) {
      setError('Cart error: product info missing. Please clear cart and re-add items.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Optionally save new address
      if (saveNewAddress && address.trim()) {
        try {
          await api.post('/users/addresses', {
            type: addressType,
            address: address.trim(),
            city: '',
            postalCode: '',
            isDefault: savedAddresses.length === 0,
          });
        } catch {
          /* non-blocking */
        }
      }

      const orderPayload = {
        deliveryAddress: address.trim(),
        paymentMethod,
        paymentDetails: {
          upiApp: paymentMethod === 'upi' ? upiApp : null,
          emiMonths: paymentMethod === 'emi' ? emiMonths : null,
        },
        couponCode: appliedCoupon ? appliedCoupon.couponCode : null,
        deliveryMethod,
        deliverySlot:
          deliveryMethod === 'slot'
            ? { date: slotDate, timeLabel: slotTime }
            : null,
        specialInstructions: specialInstructions.trim(),
        contactPhone: contactPhone.trim() || null,
        deliveryCoords: lat != null && lng != null ? { lat, lng } : null,
        shippingAddress: {
          address: address.trim(),
          city: '',
          postalCode: '',
          country: 'India',
          type: addressType,
        },
        items: orderItems, // Use 'items' key to match backend expectation
      };

      const { data } = await api.post('/orders', orderPayload);
      const orders = data.orders || (data._id ? [data] : []);
      setOrderIds(orders.map((o) => o._id).filter(Boolean));

      // CartContext.removeItems expects cartItemId values (not product ids)
      const purchasedCartItemIds = localItems
        .map((item) => item.cartItemId)
        .filter(Boolean);
      if (purchasedCartItemIds.length) {
        removeItems(purchasedCartItemIds);
      } else {
        // Fallback for legacy cart rows without cartItemId
        const productIds = new Set(orderItems.map((i) => String(i.productId)));
        removeItems(
          (cartItems || [])
            .filter((item) => productIds.has(String(resolveProductId(item) || '')))
            .map((item) => item.cartItemId)
            .filter(Boolean)
        );
      }
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      const apiMsg = err.response?.data?.message;
      const apiErr = err.response?.data?.error;
      if (err.response?.status === 401) {
        setError('Please log in again to place your order.');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot reach server. Check that the backend is running.');
      } else {
        setError(apiMsg || apiErr || 'Failed to place order. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for image loading errors
  const handleImageError = (e) => {
    // Prevent infinite loop if the fallback image itself fails to load
    if (!e.target.src.startsWith('https://via.placeholder.com')) {
      e.target.src = fallbackPlaceholderImage;
    }
  };
  if ((checkoutItems || []).length === 0 && !isSuccess) return null;

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-lg shadow-green-200">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Order Confirmed! 🎉</h2>
        <p className="text-gray-500 text-center max-w-sm mb-2">
          Your order has been placed. Track live status, invoice, and delivery from My Orders.
        </p>
        {orderIds.length > 0 && (
          <p className="text-xs text-gray-400 mb-8">
            Order ID{orderIds.length > 1 ? 's' : ''}:{' '}
            {orderIds.map((id) => (
              <span key={id} className="font-mono font-semibold text-gray-600 mr-2">
                #{String(id).slice(-8).toUpperCase()}
              </span>
            ))}
          </p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="px-6 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-hover transition-colors shadow-lg"
          >
            Track order
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 pb-28">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Checkout</h1>
        <p className="text-sm text-gray-500 mt-1">Review items, address, offers & payment before placing order</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="space-y-5">
        {/* ── 1. Item details review ───────────────────────── */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" /> Item details
          </h2>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {localItems.map((item, i) => {
              const name = item.product?.name || item.name || 'Product';
              const img = getProductImage(item.product || item);
              return (
                <div key={i} className="flex gap-3 items-start p-2 rounded-xl hover:bg-gray-50">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                    {img ? (
                      <img
                        src={img}
                        alt={name} // Use product name for alt text
                        className="w-full h-full object-cover"
                        onError={handleImageError} // Add onError handler
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">N/A</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {item.selectedSize && (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          Size: {item.selectedSize}
                        </span>
                      )}
                      {item.selectedColor && (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                          Color:
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-gray-300 inline-block"
                            style={{ backgroundColor: item.selectedColor }}
                          />
                          {item.selectedColor}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      ₹{(item.price * item.quantity).toFixed(0)}
                      <span className="text-xs font-normal text-gray-400 ml-1">
                        (₹{item.price} each)
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => changeQty(item, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white text-gray-600"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeQty(item, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white text-gray-600"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 2. Delivery address ──────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Delivery address
            </h2>
            <button
              type="button"
              onClick={openPicker}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-50"
            >
              Pin on map
            </button>
          </div>

          {savedAddresses.length > 0 && (
            <div className="space-y-2 mb-3">
              {savedAddresses.map((addr) => (
                <button
                  key={addr._id}
                  type="button"
                  onClick={() => selectSavedAddress(addr)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    selectedAddressId === addr._id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    {addr.type === 'work' ? (
                      <Briefcase size={12} className="text-gray-500" />
                    ) : (
                      <Home size={12} className="text-gray-500" />
                    )}
                    <span className="text-xs font-bold uppercase text-gray-500">{addr.type || 'home'}</span>
                    {addr.isDefault && (
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">{addr.address}</p>
                  {(addr.city || addr.postalCode) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[addr.city, addr.postalCode].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          <label className="block text-xs font-bold text-gray-500 mb-1.5">
            {savedAddresses.length ? 'Or enter / edit address' : 'Full delivery address'}
          </label>
          <textarea
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setSelectedAddressId(null);
            }}
            placeholder="Flat, street, landmark, city, pincode..."
            className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            rows="3"
            required
          />

          <div className="mt-3 flex flex-wrap gap-2 items-center">
            {['home', 'work', 'other'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAddressType(t)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border capitalize ${
                  addressType === t
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={saveNewAddress}
                onChange={(e) => setSaveNewAddress(e.target.checked)}
                className="rounded border-gray-300"
              />
              Save this address
            </label>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Contact phone</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* ── 3. Delivery method ───────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> Delivery method
          </h2>
          <div className="space-y-2">
            {DELIVERY_METHODS.map((m) => {
              const Icon = m.icon;
              const fee = calcDeliveryFee(m.id, subtotal);
              return (
                <label
                  key={m.id}
                  className={`flex items-center p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                    deliveryMethod === m.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    className="hidden"
                    checked={deliveryMethod === m.id}
                    onChange={() => setDeliveryMethod(m.id)}
                  />
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 ${
                    deliveryMethod === m.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </div>
                  <span className={`text-xs font-bold ${fee === 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                    {fee === 0 ? 'FREE' : `₹${fee}`}
                  </span>
                </label>
              );
            })}
          </div>

          {deliveryMethod === 'slot' && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Time slot</label>
                <select
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white"
                >
                  {SLOT_TIMES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Coupons ───────────────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" /> Coupons & offers
          </h2>
          {appliedCoupon ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
              <div>
                <span className="font-bold text-green-700">{appliedCoupon.couponCode}</span>
                <p className="text-xs text-green-600 mt-0.5">
                  You save ₹{discountAmount.toFixed(0)}
                </p>
              </div>
              <button type="button" onClick={handleRemoveCoupon} className="text-red-500 text-sm font-semibold">
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
                  placeholder="Enter promo / coupon code"
                  className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase tracking-wide"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponInput.trim()}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-70 flex items-center gap-2"
                >
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
            </div>
          )}
        </div>

        {/* ── 5. Payment method ────────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Payment method
          </h2>
          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <label
                  key={opt.id}
                  className={`flex items-center p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === opt.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="hidden"
                    checked={paymentMethod === opt.id}
                    onChange={() => setPaymentMethod(opt.id)}
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === opt.id ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {paymentMethod === opt.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <Icon size={16} className="mr-2 text-gray-500" />
                  <div>
                    <span className="font-semibold text-gray-800 text-sm">{opt.label}</span>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {paymentMethod === 'upi' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {UPI_APPS.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setUpiApp(app.id)}
                  className={`text-xs font-bold px-3 py-2 rounded-lg border ${
                    upiApp === app.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {app.label}
                </button>
              ))}
            </div>
          )}

          {paymentMethod === 'emi' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {EMI_MONTHS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEmiMonths(m)}
                  className={`text-xs font-bold px-3 py-2 rounded-lg border ${
                    emiMonths === m
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {m} months · ₹{Math.ceil(total / m)}/mo
                </button>
              ))}
            </div>
          )}

          {['upi', 'card', 'netbanking'].includes(paymentMethod) && (
            <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-start gap-2">
              <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
              Online payment is simulated in this build (order marked paid). Wire Razorpay/Stripe keys for live capture.
            </p>
          )}
        </div>

        {/* ── 6. Special instructions ──────────────────────── */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Special instructions
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {NOTE_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() =>
                  setSpecialInstructions((prev) =>
                    prev.includes(n) ? prev : prev ? `${prev}. ${n}` : n
                  )
                }
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700"
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value.slice(0, 500))}
            placeholder="Notes for delivery agent (optional)"
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            rows="2"
            maxLength={500}
          />
          <p className="text-[10px] text-gray-400 mt-1 text-right">{specialInstructions.length}/500</p>
        </div>

        {/* ── 7. Price breakup ─────────────────────────────── */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3">Price breakup</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Item total (MRP)</span>
              <span>₹{(subtotal + mrpSavings).toFixed(0)}</span>
            </div>
            {mrpSavings > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Product discount</span>
                <span>-₹{mrpSavings.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Base price</span>
              <span>₹{subtotal.toFixed(0)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon ({appliedCoupon?.couponCode})</span>
                <span>-₹{discountAmount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Delivery fee</span>
              <span className={deliveryFee === 0 ? 'text-emerald-600 font-semibold' : ''}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Platform fee</span>
              <span className={platformFee === 0 ? 'text-emerald-600 font-semibold' : ''}>
                {platformFee === 0 ? 'FREE' : `₹${platformFee}`}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST (5%)</span>
              <span>₹{taxAmount.toFixed(0)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1.5 font-semibold">
                <span>Total savings</span>
                <span>₹{totalSavings.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-100">
              <span>To pay</span>
              <span>₹{total.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Place order */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg text-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed sticky bottom-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Placing order...
            </>
          ) : (
            <>Place order · ₹{total.toFixed(0)}</>
          )}
        </button>

        {!user && (
          <p className="text-center text-sm text-amber-600 font-medium">
            ⚠️ You must be{' '}
            <button type="button" onClick={() => navigate('/login')} className="underline">
              logged in
            </button>{' '}
            to place an order.
          </p>
        )}
      </form>
    </div>
  );
};

export default Checkout;
