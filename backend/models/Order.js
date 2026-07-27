const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  selectedSize: { type: String, default: null },
  selectedColor: { type: String, default: null },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  deliveryFee: {
    type: Number,
    default: 0,
  },
  platformFee: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'upi', 'card', 'netbanking', 'pay_later', 'emi'],
    default: 'cod',
  },
  paymentDetails: {
    upiApp: { type: String, default: null }, // gpay | phonepe | other
    emiMonths: { type: Number, default: null },
  },
  status: {
    type: String,
    enum: [
      'pending',
      'accepted',
      'packing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'return_requested',
      'returned',
    ],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refund_pending', 'refunded', 'failed'],
    default: 'unpaid',
  },
  deliveryAddress: {
    type: String, // Kept for backwards compatibility
  },
  shippingAddress: {
    address: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String },
    type: { type: String }, // home | work | other
  },
  deliveryCoords: {
    lat: { type: Number },
    lng: { type: Number },
  },
  contactPhone: {
    type: String,
    default: null,
  },
  deliveryMethod: {
    type: String,
    enum: ['standard', 'express', 'slot'],
    default: 'standard',
  },
  deliverySlot: {
    date: { type: String, default: null },
    timeLabel: { type: String, default: null },
  },
  specialInstructions: {
    type: String,
    default: '',
    maxlength: 500,
  },
  estimatedDeliveryAt: {
    type: Date,
    default: null,
  },
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  couponCode: {
    type: String,
    default: null,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  savingsAmount: {
    type: Number,
    default: 0,
  },
  deliveryOTP: {
    type: String,
  },
  timeline: [{
    status: { type: String, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String },
  }],
  // Cancel / refund
  cancelReason: { type: String, default: null },
  cancelledAt: { type: Date, default: null },
  refund: {
    status: {
      type: String,
      enum: ['none', 'pending', 'processing', 'completed', 'failed'],
      default: 'none',
    },
    amount: { type: Number, default: 0 },
    method: { type: String, default: null }, // original | wallet
    initiatedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    note: { type: String, default: null },
  },
  // Return / exchange
  returnRequest: {
    requestType: {
      type: String,
      enum: ['return', 'exchange'],
    },
    reason: { type: String, default: null },
    status: {
      type: String,
      enum: ['none', 'requested', 'approved', 'rejected', 'picked_up', 'completed'],
      default: 'none',
    },
    requestedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  // Delivery experience feedback
  deliveryFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    packagingRating: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: '' },
    submittedAt: { type: Date },
  },
  // Order-specific support tickets
  supportTickets: [{
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
    },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
