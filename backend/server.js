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
const couponRoutes = require('./routes/couponRoutes');

const app = express();
const server = http.createServer(app);

// Allow local dev + production frontend URLs for CORS / Socket.IO
// FRONTEND_URL = primary, FRONTEND_URLS = comma-separated extras (Vercel previews etc.)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(',').map((s) => s.trim()),
  'https://e-commerce-store-eta-lovat.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
].filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return true; // Postman / mobile / same-origin
  if (allowedOrigins.includes(origin)) return true;
  // Local / LAN (Capacitor phone testing)
  if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
    return true;
  }
  // Vercel production + preview deployments for this project
  if (/^https:\/\/e-commerce-store[a-z0-9-]*\.vercel\.app$/.test(origin)) {
    return true;
  }
  // Allow onlinekirana.vercel.app
  if (/^https:\/\/onlinekirana[a-z0-9-]*\.vercel\.app$/.test(origin)) {
    return true;
  }
  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      // Do not throw — throwing becomes a 500; false = CORS reject without crash
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: corsOptions,
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
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

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
app.use('/api/coupons', couponRoutes);

app.get('/', (req, res) => {
  res.send('Mersko E-Commerce API is running...');
});

// Database Connection & Server Listener
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mersko')
  .then(() => {
    console.log('MongoDB Connected');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`LAN access: http://<YOUR_LAPTOP_IP>:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
