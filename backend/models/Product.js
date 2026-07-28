const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  sizes: {
    type: [String],
    default: []
  },
  colors: {
    type: [String],
    default: []
  },
  price: {
    type: Number,
    required: true,
  },
  images: [{
    data: Buffer,
    contentType: String
  }],
  category: {
    type: String,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  barcode: {
    type: String,
    default: '',
  },
  promo_tag: {
    type: String,
    default: null,
  },
  discount_percent: {
    type: Number,
    default: 0,
  },
  // --- New fields for Flipkart-like functionality ---
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    images: [{ type: String }],
    vendorReply: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Speed up catalogue / home queries
productSchema.index({ shopId: 1, createdAt: -1 });
productSchema.index({ categoryId: 1, createdAt: -1 });
productSchema.index({ promo_tag: 1 });

module.exports = mongoose.model('Product', productSchema);
