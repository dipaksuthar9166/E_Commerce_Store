const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false, // Optional for global master categories created by Admin
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  isGlobal: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

// A shop cannot have duplicate category names, but we also want to allow multiple global categories (each with unique name).
categorySchema.index({ shopId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
