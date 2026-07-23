const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  discountType: {
    type: String,
    enum: ['percent', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  maxDiscount: {
    type: Number,
    default: null, // Used only for 'percent' to cap the discount
  },
  validFrom: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

// Ensure coupon codes are unique per shop
couponSchema.index({ shopId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Coupon', couponSchema);
