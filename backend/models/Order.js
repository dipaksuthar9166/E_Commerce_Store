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
  }
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
  totalAmount: {
    type: Number,
    required: true,
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
    ],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    default: 'unpaid',
  },
  deliveryAddress: {
    type: String, // Kept for backwards compatibility
  },
  shippingAddress: {
    address: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String }
  },
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // --- New fields for Flipkart-like functionality ---
  deliveryOTP: {
    type: String,
  },
  timeline: [{
    status: { type: String, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
