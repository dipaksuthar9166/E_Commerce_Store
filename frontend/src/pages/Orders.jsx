import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import {
  ShoppingBag, Clock, Bike, XCircle, ChevronRight, Loader2, MapPin, Package,
  Sparkles, RefreshCw, Phone, RotateCcw, MessageCircle, Star,
  Edit3, Headphones, AlertTriangle, Download, ImagePlus
} from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import CustomerOrderTracker from '../components/maps/CustomerOrderTracker';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

/* ─── Status Config ─────────────────────────────────────────── */
const statusConfig = {
  pending:          { label: 'Placed',           color: 'text-amber-600 bg-amber-50 border-amber-200',       dot: 'bg-amber-400',   desc: 'Order placed — waiting for shop',           step: 0 },
  accepted:         { label: 'Accepted',         color: 'text-blue-600 bg-blue-50 border-blue-200',          dot: 'bg-blue-500',    desc: 'Shop accepted — preparing your order',      step: 1 },
  packing:          { label: 'Packed',           color: 'text-cyan-600 bg-cyan-50 border-cyan-200',          dot: 'bg-cyan-500',    desc: 'Your order is being packed',                step: 1 },
  ready_for_pickup: { label: 'Shipped',          color: 'text-sky-600 bg-sky-50 border-sky-200',             dot: 'bg-sky-500',     desc: 'Packed & ready — waiting for rider',        step: 2 },
  out_for_delivery: { label: 'Out for delivery', color: 'text-purple-600 bg-purple-50 border-purple-200',    dot: 'bg-purple-500',  desc: 'Rider is on the way! 🛵',                   step: 2 },
  delivered:        { label: 'Delivered',        color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', desc: 'Order delivered successfully 🎉',           step: 3 },
  cancelled:        { label: 'Cancelled',        color: 'text-rose-600 bg-rose-50 border-rose-200',          dot: 'bg-rose-500',    desc: 'Order has been cancelled',                  step: -1 },
  return_requested: { label: 'Return requested', color: 'text-orange-600 bg-orange-50 border-orange-200',    dot: 'bg-orange-500',  desc: 'Return/exchange request submitted',         step: 3 },
  returned:         { label: 'Returned',         color: 'text-slate-600 bg-slate-50 border-slate-200',       dot: 'bg-slate-500',   desc: 'Return completed',                          step: 3 },
};

const ACTIVE_STATUSES = ['pending', 'accepted', 'packing', 'ready_for_pickup', 'out_for_delivery'];
const PAST_STATUSES = ['delivered', 'cancelled', 'return_requested', 'returned'];
const CANCELLABLE = ['pending', 'accepted', 'packing'];
const MODIFIABLE = ['pending', 'accepted', 'packing'];

const STEPS = ['Placed', 'Packed', 'Shipped', 'Delivered'];
const STEP_ICONS = [Package, Package, Bike, Sparkles];

const sameId = (a, b) => String(a || '') === String(b || '');

const formatEta = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString([], {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const refundLabel = {
  none: 'No refund',
  pending: 'Refund pending',
  processing: 'Refund processing',
  completed: 'Refund completed',
  failed: 'Refund failed',
};

/* ─── Live Tracker ──────────────────────────────────────────── */
const LiveTracker = ({ status }) => {
  if (status === 'cancelled') return null;
  const currentStep = statusConfig[status]?.step ?? 0;

  return (
    <div className="mt-4 px-1">
      <div className="flex items-center gap-0">
        {STEPS.map((label, idx) => {
          const Icon = STEP_ICONS[idx];
          const filled = idx <= currentStep;
          const isLast = idx === STEPS.length - 1;
          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
                  filled
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon size={13} />
                </div>
                <span className={`text-[9px] font-bold leading-tight text-center max-w-[48px] ${
                  filled ? 'text-indigo-600' : 'text-gray-400'
                }`}>{label}</span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mb-3 mx-0.5 rounded-full transition-all duration-700 ${
                  idx < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Modal shell ───────────────────────────────────────────── */
const Modal = ({ title, onClose, children, wide }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
  >
    <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" />
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 50 }}
      transition={{ type: "spring", duration: 0.5 }}
      className={`relative bg-white w-full ${wide ? 'max-w-lg' : 'max-w-md'} rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}
    >
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-sm font-bold px-2">✕</button>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  </motion.div>
);

const StarPicker = ({ value, onChange, label }) => (
  <div>
    {label && <p className="text-xs font-bold text-gray-500 mb-1.5">{label}</p>}
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star
            size={22}
            className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  </div>
);

/* ─── Skeleton Card ─────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse">
    <div className="flex justify-between gap-4">
      <div className="space-y-3 flex-1">
        <div className="flex gap-2">
          <div className="h-3 w-20 bg-gray-200 rounded-full" />
          <div className="h-3 w-16 bg-gray-200 rounded-full" />
        </div>
        <div className="h-4 w-40 bg-gray-200 rounded-lg" />
        <div className="h-3 w-32 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-7 w-20 bg-gray-200 rounded-lg" />
    </div>
  </div>
);

/* ─── Order Card ────────────────────────────────────────────── */
const OrderCard = ({
  order,
  navigate,
  onCancel,
  onModify,
  onReturn,
  onReorder,
  onFeedback,
  onReviewProduct,
  onSupport,
  onRefreshRefund,
}) => {
  const [busy, setBusy] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[order.status] || statusConfig.pending;
  const dateStr = new Date(order.createdAt).toLocaleDateString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const isActive = ACTIVE_STATUSES.includes(order.status);
  const isCancellable = CANCELLABLE.includes(order.status);
  const isModifiable = MODIFIABLE.includes(order.status);
  const isDelivered = order.status === 'delivered';
  const rider = order.deliveryBoyId;
  const eta = formatEta(order.estimatedDeliveryAt);
  const refund = order.refund;

  const run = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const openInvoice = async () => {
    try {
      const { data: html } = await api.get(`/orders/${order._id}/invoice`, {
        params: { format: 'html' },
        responseType: 'text',
        transformResponse: [(d) => d],
      });
      const blob = new Blob([html], { type: 'text/html' });
      const objUrl = URL.createObjectURL(blob);
      window.open(objUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
    } catch {
      alert('Could not open invoice. Please try again.');
    }
  };

  const topBar =
    order.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
    ['accepted', 'packing', 'ready_for_pickup'].includes(order.status) ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
    order.status === 'out_for_delivery' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' :
    order.status === 'delivered' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
    order.status === 'return_requested' ? 'bg-gradient-to-r from-orange-400 to-amber-500' :
    'bg-gradient-to-r from-rose-400 to-pink-400';

  return (
    <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className={`h-1 w-full ${topBar}`} />

      <div className="p-5">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                #{String(order._id).slice(-8).toUpperCase()}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${config.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${isActive ? 'animate-pulse' : ''}`} />
                {config.label}
              </span>
              {order.paymentMethod && (
                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 uppercase">
                  {order.paymentMethod.replace('_', ' ')}
                </span>
              )}
            </div>

            <h3 className="font-bold text-gray-900 text-base leading-tight">
              {order.shopId?.shopName || 'Local Shop'}
            </h3>
            {order.shopId?.address && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={11} className="flex-shrink-0" />
                <span className="truncate">{order.shopId.address}</span>
              </div>
            )}

            <div className="pt-1 space-y-0.5">
              {(order.items || []).map((item, idx) => {
                const name =
                  item.productId?.name ||
                  (typeof item.productId === 'string'
                    ? `Item #${String(item.productId).slice(-4)}`
                    : `Item #${idx + 1}`);
                return (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                    <span className="truncate">{name}</span>
                    {item.selectedSize && (
                      <span className="text-gray-400">· {item.selectedSize}</span>
                    )}
                    <span className="text-gray-400 ml-auto flex-shrink-0">x {item.quantity}</span>
                  </div>
                );
              })}
            </div>

            {order.deliveryAddress && (
              <div className="flex items-start gap-1 text-[11px] text-gray-500 pt-0.5">
                <MapPin size={11} className="flex-shrink-0 mt-0.5 text-indigo-400" />
                <span className="line-clamp-2">Deliver to: {order.deliveryAddress}</span>
              </div>
            )}

            {eta && isActive && (
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 w-fit">
                <Clock size={11} />
                <span>ETA: <strong>{eta}</strong></span>
                {order.deliveryMethod && (
                  <span className="text-indigo-400 capitalize">· {order.deliveryMethod}</span>
                )}
              </div>
            )}

            {order.deliverySlot?.timeLabel && (
              <div className="text-[11px] text-sky-700 bg-sky-50 border border-sky-100 rounded-lg px-2 py-1 w-fit">
                Slot: {order.deliverySlot.date} · {order.deliverySlot.timeLabel}
              </div>
            )}

            {rider?.name && order.status === 'out_for_delivery' && (
              <div className="flex items-center gap-2 text-[11px] text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-2 py-1 w-fit">
                <Bike size={12} />
                <span>Rider: <strong>{rider.name}</strong></span>
                {rider.phone && (
                  <a href={`tel:${rider.phone}`} className="inline-flex items-center gap-0.5 font-bold hover:underline">
                    <Phone size={11} /> Call
                  </a>
                )}
                {rider.phone && (
                  <a
                    href={`sms:${rider.phone}`}
                    className="inline-flex items-center gap-0.5 font-bold hover:underline"
                  >
                    <MessageCircle size={11} /> SMS
                  </a>
                )}
              </div>
            )}

            {refund && refund.status && refund.status !== 'none' && (
              <button
                type="button"
                onClick={() => run('refund', () => onRefreshRefund(order._id))}
                className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg border w-fit ${
                  refund.status === 'completed'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                    : 'text-amber-700 bg-amber-50 border-amber-100'
                }`}
              >
                {busy === 'refund' ? <Loader2 size={11} className="animate-spin" /> : <WalletIcon />}
                {refundLabel[refund.status] || refund.status}
                {refund.amount ? ` · ₹${refund.amount}` : ''}
              </button>
            )}

            <p className={`text-xs font-medium italic ${
              order.status === 'delivered' ? 'text-emerald-600' :
              order.status === 'cancelled' ? 'text-rose-500' : 'text-indigo-500'
            }`}>{config.desc}</p>
          </div>

          <div className="flex flex-col sm:items-end justify-between gap-3 sm:min-w-[110px]">
            <div className="sm:text-right">
              <div className="flex items-center gap-1 text-xs text-gray-400 sm:justify-end">
                <Clock size={11} />
                <span>{dateStr}</span>
              </div>
              <p className="text-2xl font-black text-gray-900 mt-1">&#8377;{order.totalAmount}</p>
              {(order.deliveryFee > 0 || order.taxAmount > 0) && (
                <p className="text-[10px] text-gray-400">
                  incl. fees & GST
                </p>
              )}
            </div>

            {order.deliveryOTP && isActive && (
              <div className="bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-lg text-center shadow-sm">
                <span className="block text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-0.5">
                  Delivery OTP
                </span>
                <span className="block text-xl font-mono font-black text-yellow-800 tracking-[0.2em]">
                  {order.deliveryOTP}
                </span>
                <span className="block text-[9px] text-yellow-600 mt-0.5">Share only with rider</span>
              </div>
            )}
          </div>
        </div>

        <LiveTracker status={order.status} />

        {order.status === 'out_for_delivery' && (
          <CustomerOrderTracker
            orderId={order._id}
            deliveryAddress={order.deliveryAddress}
            shopAddress={order.shopId?.address}
          />
        )}

        {/* Action toolbar */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
          {isCancellable && (
            <ActionBtn
              danger
              icon={XCircle}
              label="Cancel"
              loading={busy === 'cancel'}
              onClick={() => run('cancel', () => onCancel(order))}
            />
          )}
          {isModifiable && (
            <ActionBtn
              icon={Edit3}
              label="Edit details"
              loading={busy === 'modify'}
              onClick={() => onModify(order)}
            />
          )}
          <ActionBtn
            icon={Download}
            label="Invoice"
            loading={busy === 'invoice'}
            onClick={() => run('invoice', openInvoice)}
          />
          <ActionBtn
            icon={RefreshCw}
            label="Buy again"
            loading={busy === 'reorder'}
            onClick={() => run('reorder', () => onReorder(order))}
          />
          {isDelivered && (!order.returnRequest || order.returnRequest.status === 'none') && (
            <ActionBtn
              icon={RotateCcw}
              label="Return / Exchange"
              onClick={() => onReturn(order)}
            />
          )}
          {isDelivered && !order.deliveryFeedback?.rating && (
            <ActionBtn
              icon={Star}
              label="Rate delivery"
              onClick={() => onFeedback(order)}
            />
          )}
          {isDelivered && (
            <ActionBtn
              icon={MessageCircle}
              label="Review product"
              onClick={() => onReviewProduct(order)}
            />
          )}
          <ActionBtn
            icon={Headphones}
            label="Support"
            onClick={() => onSupport(order)}
          />
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="ml-auto text-[11px] font-bold text-gray-400 hover:text-indigo-600 inline-flex items-center gap-1"
          >
            Details
            <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {expanded && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-gray-600 space-y-2 animate-in fade-in">
            <PriceBreakup order={order} />
            {order.specialInstructions && (
              <p><span className="font-bold text-gray-800">Instructions:</span> {order.specialInstructions}</p>
            )}
            {order.contactPhone && (
              <p><span className="font-bold text-gray-800">Contact:</span> {order.contactPhone}</p>
            )}
            {order.timeline?.length > 0 && (
              <div>
                <p className="font-bold text-gray-800 mb-1">Timeline</p>
                <ul className="space-y-1">
                  {[...order.timeline].reverse().map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-gray-400 whitespace-nowrap">
                        {new Date(t.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>{t.description || t.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {order.returnRequest?.status && order.returnRequest.status !== 'none' && (
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-2">
                <p className="font-bold text-orange-800 capitalize">
                  {order.returnRequest.requestType || order.returnRequest.type} · {order.returnRequest.status}
                </p>
                <p className="text-orange-700">{order.returnRequest.reason}</p>
              </div>
            )}
            {order.supportTickets?.length > 0 && (
              <div>
                <p className="font-bold text-gray-800 mb-1">Support tickets</p>
                {order.supportTickets.map((t, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-lg p-2 mb-1">
                    <div className="flex justify-between">
                      <span className="font-semibold">{t.subject}</span>
                      <span className="text-[10px] uppercase font-bold text-indigo-600">{t.status}</span>
                    </div>
                    <p className="text-gray-500">{t.message}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate(`/product/${order.items?.[0]?.productId?._id || ''}`)}
              className="text-indigo-600 font-bold hover:underline"
              disabled={!order.items?.[0]?.productId?._id}
            >
              View products →
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const WalletIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const ActionBtn = ({ icon: Icon, label, onClick, loading, danger }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
      danger
        ? 'text-rose-600 bg-rose-50 border-rose-100 hover:bg-rose-100'
        : 'text-gray-700 bg-white border-gray-200 hover:border-indigo-200 hover:text-indigo-700'
    }`}
  >
    {loading ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />}
    {label}
  </button>
);

const PriceBreakup = ({ order }) => {
  const sub = order.subtotal ?? (order.totalAmount - (order.deliveryFee || 0) - (order.platformFee || 0) - (order.taxAmount || 0) + (order.discountAmount || 0));
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-2 space-y-1">
      <p className="font-bold text-gray-800 mb-1">Price breakup</p>
      <Row label="Subtotal" value={sub} />
      {(order.discountAmount > 0) && <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`} value={-order.discountAmount} green />}
      <Row label="Delivery fee" value={order.deliveryFee || 0} free={!order.deliveryFee} />
      <Row label="Platform fee" value={order.platformFee || 0} free={!order.platformFee} />
      <Row label="GST" value={order.taxAmount || 0} />
      {(order.savingsAmount > 0) && <Row label="Total savings" value={order.savingsAmount} green />}
      <div className="flex justify-between font-black text-gray-900 pt-1 border-t border-gray-100">
        <span>Total</span><span>₹{order.totalAmount}</span>
      </div>
    </div>
  );
};

const Row = ({ label, value, green, free }) => (
  <div className={`flex justify-between ${green ? 'text-emerald-600' : 'text-gray-600'}`}>
    <span>{label}</span>
    <span>{free ? 'FREE' : `₹${Math.abs(value)}${value < 0 ? '' : ''}`}</span>
  </div>
);

/* ─── Main Component ────────────────────────────────────────── */
const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pastExpanded, setPastExpanded] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(null); // { type, order }
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { socket, connected } = useSocket();
  const { addItemsToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const ordersRef = React.useRef(orders);
  ordersRef.current = orders;

  const applyOrderPatch = useCallback((updatedOrder) => {
    if (!updatedOrder?._id) return;
    setOrders((prev) => {
      const exists = prev.some((o) => sameId(o._id, updatedOrder._id));
      if (!exists) return prev;
      return prev.map((o) => {
        if (!sameId(o._id, updatedOrder._id)) return o;
        return {
          ...o,
          ...updatedOrder,
          _id: o._id,
          shopId:
            updatedOrder.shopId &&
            (typeof updatedOrder.shopId === 'object') &&
            updatedOrder.shopId.shopName
              ? updatedOrder.shopId
              : o.shopId,
          items:
            Array.isArray(updatedOrder.items) && updatedOrder.items.length
              ? updatedOrder.items
              : o.items,
          deliveryBoyId:
            updatedOrder.deliveryBoyId !== undefined
              ? updatedOrder.deliveryBoyId
              : o.deliveryBoyId,
          timeline: updatedOrder.timeline?.length ? updatedOrder.timeline : o.timeline,
          refund: updatedOrder.refund || o.refund,
          returnRequest: updatedOrder.returnRequest || o.returnRequest,
          deliveryFeedback: updatedOrder.deliveryFeedback || o.deliveryFeedback,
          supportTickets: updatedOrder.supportTickets || o.supportTickets,
        };
      });
    });
  }, []);

  const fetchMyOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get('/orders/my');
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders history', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  useEffect(() => {
    if (!socket) return;
    const handleStatusUpdate = (updatedOrder) => {
      if (!updatedOrder?._id) {
        fetchMyOrders(true);
        return;
      }
      const exists = ordersRef.current.some((o) => sameId(o._id, updatedOrder._id));
      if (!exists) {
        fetchMyOrders(true);
        return;
      }
      applyOrderPatch(updatedOrder);
    };
    socket.on('orderStatusUpdated', handleStatusUpdate);
    return () => socket.off('orderStatusUpdated', handleStatusUpdate);
  }, [socket, applyOrderPatch, fetchMyOrders]);

  useEffect(() => {
    if (!socket) return;
    const joinAll = () => {
      ordersRef.current
        .filter((o) => ACTIVE_STATUSES.includes(o.status))
        .forEach((o) => socket.emit('joinOrderTrack', String(o._id)));
    };
    joinAll();
    socket.on('connect', joinAll);
    socket.on('reconnect', joinAll);
    return () => {
      socket.off('connect', joinAll);
      socket.off('reconnect', joinAll);
      ordersRef.current
        .filter((o) => ACTIVE_STATUSES.includes(o.status))
        .forEach((o) => socket.emit('leaveOrderTrack', String(o._id)));
    };
  }, [socket, connected, orders]);

  useEffect(() => {
    const hasActive = orders.some((o) => ACTIVE_STATUSES.includes(o.status));
    if (!hasActive) return undefined;
    const ms = connected ? 5000 : 2500;
    const t = setInterval(() => fetchMyOrders(true), ms);
    return () => clearInterval(t);
  }, [orders, fetchMyOrders, connected]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchMyOrders(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', () => fetchMyOrders(true));
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', () => fetchMyOrders(true));
    };
  }, [fetchMyOrders]);

  const handleCancel = async (order) => {
    setModal({ type: 'cancel', order });
    setForm({ reason: '' });
  };

  const submitCancel = async () => {
    setSubmitting(true);
    try {
      await api.put(`/orders/${modal.order._id}/cancel`, { reason: form.reason || 'Cancelled by customer' });
      setModal(null);
      await fetchMyOrders(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModify = (order) => {
    setModal({ type: 'modify', order });
    setForm({
      deliveryAddress: order.deliveryAddress || '',
      contactPhone: order.contactPhone || user?.phone || '',
      specialInstructions: order.specialInstructions || '',
    });
  };

  const submitModify = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.put(`/orders/${modal.order._id}/modify`, form);
      applyOrderPatch(data.order);
      setModal(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = (order) => {
    setModal({ type: 'return', order });
    setForm({ type: 'return', reason: '' });
  };

  const submitReturn = async () => {
    if (!form.reason?.trim()) {
      alert('Please provide a reason');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/orders/${modal.order._id}/return`, form);
      applyOrderPatch(data.order);
      setModal(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReorder = async (order) => {
    try {
      const { data } = await api.post(`/orders/${order._id}/reorder`);
      if (data.cartItems?.length) {
        addItemsToCart(data.cartItems);
      }
      if (data.unavailable?.length) {
        alert(
          `Added available items to cart.\nUnavailable: ${data.unavailable.map((u) => u.name || u.reason).join(', ')}`
        );
      } else {
        alert('Items added to cart!');
      }
      navigate('/cart');
    } catch (error) {
      alert(error.response?.data?.message || 'Could not re-order');
    }
  };

  const handleFeedback = (order) => {
    setModal({ type: 'feedback', order });
    setForm({ rating: 5, packagingRating: 5, comment: '' });
  };

  const submitFeedback = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/orders/${modal.order._id}/feedback`, form);
      applyOrderPatch(data.order);
      setModal(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewProduct = (order) => {
    const products = (order.items || [])
      .map((i) => i.productId)
      .filter((p) => p && p._id);
    setModal({ type: 'review', order, products });
    setForm({
      productId: products[0]?._id || '',
      rating: 5,
      comment: '',
      images: [],
    });
  };

  const onPickReviewImages = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    ).then((images) => setForm((f) => ({ ...f, images })));
  };

  const submitReview = async () => {
    if (!form.productId || !form.comment?.trim()) {
      alert('Select a product and write a review');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/shops/products/${form.productId}/reviews`, {
        rating: form.rating,
        comment: form.comment,
        images: form.images || [],
      });
      alert('Review submitted. Thank you!');
      setModal(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupport = (order) => {
    setModal({ type: 'support', order });
    setForm({ subject: 'Order issue', message: '' });
  };

  const submitSupport = async () => {
    if (!form.message?.trim()) {
      alert('Please describe your issue');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/orders/${modal.order._id}/support`, form);
      applyOrderPatch(data.order);
      setModal(null);
      alert('Support ticket created. We will get back to you shortly.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshRefund = async (orderId) => {
    try {
      const { data } = await api.get(`/orders/${orderId}/refund`);
      setOrders((prev) =>
        prev.map((o) =>
          sameId(o._id, orderId)
            ? { ...o, refund: data.refund, paymentStatus: data.paymentStatus }
            : o
        )
      );
    } catch {
      /* ignore */
    }
  };

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const pastOrders = orders.filter((o) => PAST_STATUSES.includes(o.status));

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto pb-24">
        <div className="mb-8 animate-pulse">
          <div className="h-8 w-40 bg-gray-200 rounded-xl mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pb-24 animate-in fade-in duration-500">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1 text-sm">Track, manage, return & review your orders</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl border border-dashed border-indigo-200 p-14 text-center shadow-sm">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-100 border border-indigo-100">
            <ShoppingBag size={40} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
            Place an order to track delivery, download invoices, and manage returns here.
          </p>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg"
          >
            Find products nearby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 pb-24">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-3xl font-extrabold text-gray-900">My Orders</h1>
          {activeOrders.length > 0 && (
            <span className="relative inline-flex">
              <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-50" />
              <span className="relative text-[10px] font-extrabold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                {activeOrders.length} LIVE
              </span>
            </span>
          )}
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              connected
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            {connected ? 'LIVE' : 'SYNCING'}
          </span>
          <button
            type="button"
            onClick={() => fetchMyOrders(true)}
            disabled={refreshing}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        <p className="text-gray-500 text-sm">
          Live tracking · cancel · return · invoice · reviews · support
        </p>
      </div>

      <div className="space-y-10">
        {activeOrders.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-indigo-600">Active Orders</h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">
                {activeOrders.length} order{activeOrders.length > 1 ? 's' : ''}
              </span>
            </div>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              {activeOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  navigate={navigate}
                  onCancel={handleCancel}
                  onModify={handleModify}
                  onReturn={handleReturn}
                  onReorder={handleReorder}
                  onFeedback={handleFeedback}
                  onReviewProduct={handleReviewProduct}
                  onSupport={handleSupport}
                  onRefreshRefund={handleRefreshRefund}
                />
              ))}
            </motion.div>
          </section>
        )}

        {pastOrders.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => setPastExpanded((p) => !p)}
              className="flex items-center gap-2 mb-4 group w-full"
            >
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 group-hover:text-gray-600">
                Past Orders
              </h2>
              <span className="ml-auto text-xs text-gray-400 font-medium">
                {pastOrders.length} order{pastOrders.length > 1 ? 's' : ''}
              </span>
              <ChevronRight
                size={14}
                className={`text-gray-400 transition-transform ${pastExpanded ? 'rotate-90' : ''}`}
              />
            </button>
            {pastExpanded && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                {pastOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    navigate={navigate}
                    onCancel={handleCancel}
                    onModify={handleModify}
                    onReturn={handleReturn}
                    onReorder={handleReorder}
                    onFeedback={handleFeedback}
                    onReviewProduct={handleReviewProduct}
                    onSupport={handleSupport}
                    onRefreshRefund={handleRefreshRefund}
                  />
                ))}
              </motion.div>
            )}
          </section>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      <AnimatePresence>
        {modal?.type === 'cancel' && (
          <Modal title="Cancel order" onClose={() => setModal(null)}>
            <p className="text-sm text-gray-600 mb-3">
              Cancel order #{String(modal.order._id).slice(-8).toUpperCase()}? This cannot be undone.
              {['upi', 'card', 'netbanking', 'pay_later', 'emi'].includes(modal.order.paymentMethod) && (
                <span className="block mt-1 text-amber-700 text-xs">
                  A refund of ₹{modal.order.totalAmount} will be initiated to your original payment method.
                </span>
              )}
            </p>
            <textarea
              value={form.reason || ''}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Reason for cancellation (optional)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border font-bold text-sm">
                Keep order
              </button>
              <button
                type="button"
                onClick={submitCancel}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm disabled:opacity-60"
              >
                {submitting ? 'Cancelling…' : 'Confirm cancel'}
              </button>
            </div>
          </Modal>
        )}

        {modal?.type === 'modify' && (
          <Modal title="Modify delivery details" onClose={() => setModal(null)}>
            <p className="text-xs text-gray-500 mb-3">You can edit address & contact only before the order is ready for pickup.</p>
            <label className="block text-xs font-bold text-gray-500 mb-1">Delivery address</label>
            <textarea
              value={form.deliveryAddress || ''}
              onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3 resize-none"
              rows={3}
            />
            <label className="block text-xs font-bold text-gray-500 mb-1">Contact phone</label>
            <input
              type="tel"
              value={form.contactPhone || ''}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3"
            />
            <label className="block text-xs font-bold text-gray-500 mb-1">Special instructions</label>
            <textarea
              value={form.specialInstructions || ''}
              onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 resize-none"
              rows={2}
            />
            <button
              type="button"
              onClick={submitModify}
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </Modal>
        )}

        {modal?.type === 'return' && (
          <Modal title="Return / Exchange" onClose={() => setModal(null)}>
            <div className="flex gap-2 mb-3">
              {['return', 'exchange'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border capitalize ${
                    form.type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea
              value={form.reason || ''}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Reason (defective, wrong item, not as described…)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 resize-none"
              rows={3}
              required
            />
            <button
              type="button"
              onClick={submitReturn}
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-orange-600 text-white font-bold text-sm disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : `Submit ${form.type} request`}
            </button>
          </Modal>
        )}

        {modal?.type === 'feedback' && (
          <Modal title="Rate delivery experience" onClose={() => setModal(null)}>
            <div className="space-y-4 mb-4">
              <StarPicker
                label="Delivery agent"
                value={form.rating || 5}
                onChange={(n) => setForm({ ...form, rating: n })}
              />
              <StarPicker
                label="Packaging quality"
                value={form.packagingRating || 5}
                onChange={(n) => setForm({ ...form, packagingRating: n })}
              />
              <textarea
                value={form.comment || ''}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder="Any comments? (optional)"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none"
                rows={3}
              />
            </div>
            <button
              type="button"
              onClick={submitFeedback}
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit feedback'}
            </button>
          </Modal>
        )}

        {modal?.type === 'review' && (
          <Modal title="Rate & review product" onClose={() => setModal(null)} wide>
            {modal.products?.length > 0 ? (
              <>
                <label className="block text-xs font-bold text-gray-500 mb-1">Product</label>
                <select
                  value={form.productId || ''}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3 bg-white"
                >
                  {modal.products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <StarPicker
                  label="Rating"
                  value={form.rating || 5}
                  onChange={(n) => setForm({ ...form, rating: n })}
                />
                <textarea
                  value={form.comment || ''}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  placeholder="Write your review…"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm mt-3 mb-3 resize-none"
                  rows={3}
                />
                <label className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 cursor-pointer mb-4">
                  <ImagePlus size={14} />
                  Add photos
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onPickReviewImages} />
                </label>
                {form.images?.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {form.images.map((src, i) => (
                      <img key={i} src={src} alt="" className="w-14 h-14 rounded-lg object-cover border" />
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-60"
                >
                  {submitting ? 'Submitting…' : 'Post review'}
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500">No products available to review.</p>
            )}
          </Modal>
        )}

        {modal?.type === 'support' && (
          <Modal title="Customer support" onClose={() => setModal(null)}>
            <div className="flex gap-2 mb-4">
              <a
                href="tel:+918000000000"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <Phone size={14} /> Call
              </a>
              <a
                href={`mailto:support@mersko.app?subject=Order%20${String(modal.order._id).slice(-8)}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <MessageCircle size={14} /> Email
              </a>
            </div>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <AlertTriangle size={12} /> Or raise a ticket for this order
            </p>
            <input
              type="text"
              value={form.subject || ''}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Subject"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-2"
            />
            <textarea
              value={form.message || ''}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Describe your issue…"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4 resize-none"
              rows={3}
            />
            <button
              type="button"
              onClick={submitSupport}
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Raise ticket'}
            </button>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
