const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  imagePath: { type: String, required: true },
  buttonText: { type: String, default: 'Shop Now' },
  targetUrl: { type: String, default: '/' },
  /** 0–4 maps to frontend gradient themes for modern product ads */
  theme: { type: Number, default: 0, min: 0, max: 4 },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;