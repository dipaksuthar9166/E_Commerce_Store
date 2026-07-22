const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  shopName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  shopCategory: {
    type: String,
    enum: ['Grocery', 'Pharmacy', 'Hardware', 'Stationery', 'Electronics', 'Clothing', 'Food', 'Books', 'Beauty', 'Other'],
    default: 'Other',
  },
  isOnline: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
