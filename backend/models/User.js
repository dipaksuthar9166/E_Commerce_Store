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
    required: true,
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
  isActive: { type: Boolean, default: true }, // Admin can deactivate
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
