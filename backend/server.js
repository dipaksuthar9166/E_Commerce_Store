const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const shopRoutes = require('./routes/shopRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS for local network & production
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // Allow only the frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  },
});

// Make io accessible in controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Vendor joins their specific shop room
  socket.on('joinShopRoom', (shopId) => {
    socket.join(`shop_${shopId}`);
    console.log(`Socket ${socket.id} joined room shop_${shopId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL, // Allow only the frontend URL from .env
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/banners', bannerRoutes);

app.get('/', (req, res) => {
  res.send('Mersko E-Commerce API is running...');
});

// Database Connection & Server Listener
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mersko')
  .then(() => {
    console.log('MongoDB Connected');
    
    // CHANGE: Added '0.0.0.0' to bind the server across all network interfaces
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://192.168.1.9:${PORT}`);
      console.log(`Access on Mobile: http://<YOUR_LAPTOP_IP>:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });