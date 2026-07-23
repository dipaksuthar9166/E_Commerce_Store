const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  commissionRate: {
    type: Number,
    required: true,
    default: 10, // 10%
  },
  banners: {
    type: Array,
    default: [
      { title: "Summer Sale", image: "https://via.placeholder.com/800x400", link: "/category/summer" },
      { title: "New Arrivals", image: "https://via.placeholder.com/800x400", link: "/category/new" }
    ]
  }
}, { timestamps: true });

module.exports = mongoose.model('Config', configSchema);
