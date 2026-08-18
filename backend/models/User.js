const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false, // Optional — Google login users may not have a password
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  avatar: {
    type: String, // Profile picture URL (from Google)
  },
  role: {
    type: String,
    enum: ['customer', 'vendor', 'admin', 'delivery'],
    default: 'customer',
  },
  // Delivery boy specific fields
  phone: { type: String },
  vehicleType: {
    type: String,
  },
  // Live GPS for delivery partners (GeoJSON Point: [lng, lat])
  lastLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
    lastUpdated: { type: Date },
  },
  // --- New fields for Flipkart-like functionality ---
  addresses: [{
    type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    address: { type: String, required: true },
    city: { type: String },
    postalCode: { type: String },
    isDefault: { type: Boolean, default: false }
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  pushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
  }],
  isActive: { type: Boolean, default: true }, // Admin can deactivate
  passwordResetToken: String,
  passwordResetExpires: Date,
}, { timestamps: true });

// Sparse 2dsphere index — only docs with lastLocation set
userSchema.index({ lastLocation: '2dsphere' }, { sparse: true });

// Hash password before saving (skip if no password, e.g. Google login)
userSchema.pre('save', async function() {
  if (!this.password || !this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false; // Google-only user
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
