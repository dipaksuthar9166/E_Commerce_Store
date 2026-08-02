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
const User = require('./models/User'); // Assuming this is your User model
const bannerRoutes = require('./routes/bannerRoutes');
const productRoutes = require('./routes/productRoutes');
const couponRoutes = require('./routes/couponRoutes');
const configRoutes = require('./routes/configRoutes');
const app = express();
const server = http.createServer(app);

// Allow local dev + production frontend URLs for CORS / Socket.IO
// FRONTEND_URL = primary, FRONTEND_URLS = comma-separated extras (Vercel previews etc.)
const baseAllowedOrigins = [
  process.env.FRONTEND_URL, // Your primary Vercel/production URL
  'http://localhost:5173',
  'http://localhost:4173',
];

const allowedOrigins = [...baseAllowedOrigins, ...(process.env.FRONTEND_URLS || '').split(',').filter(Boolean).map(s => s.trim())];

function isOriginAllowed(origin) {
  if (!origin) return true; // Postman / mobile / same-origin
  if (allowedOrigins.includes(origin)) return true;
  // Local / LAN (Capacitor phone testing)
  if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
    return true;
  }
  // Allow Vercel preview deployments for specific projects
  const vercelPreviewRegex = /https:\/\/e-commerce-store[a-z0-9-]*\.vercel\.app$/;
  if (vercelPreviewRegex.test(origin)) {
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
    if (!shopId) return;
    const room = `shop_${String(shopId)}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  // Customer joins personal room for live order status updates
  socket.on('joinUserRoom', (userId) => {
    if (!userId) return;
    const room = `user_${String(userId)}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined ${room}`);
  });

  // Customer joins order tracking room (live rider map)
  socket.on('joinOrderTrack', (orderId) => {
    if (!orderId) return;
    const room = `order_track_${String(orderId)}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined ${room}`);
  });

  socket.on('leaveOrderTrack', (orderId) => {
    if (!orderId) return;
    socket.leave(`order_track_${String(orderId)}`);
  });

  // Delivery partner sends location updates
  socket.on('updateLocation', async (data) => {
    const { orderId, lat, lng, deliveryBoyId } = data || {};
    if (orderId == null || lat == null || lng == null) return;

    const oid = String(orderId);
    console.log(`Location update for Order ${oid} from Delivery Boy ${deliveryBoyId}: ${lat}, ${lng}`);

    // Save the last known location to the User model
    if (deliveryBoyId && lat && lng) {
      try {
        await User.findByIdAndUpdate(deliveryBoyId, {
          'lastLocation.type': 'Point',
          'lastLocation.coordinates': [lng, lat], // [longitude, latitude]
          'lastLocation.lastUpdated': new Date(),
        });
      } catch (error) {
        console.error('Error updating delivery partner location:', error);
      }
    }

    // Broadcast to customers tracking this order
    io.to(`order_track_${oid}`).emit('deliveryLocationUpdated', {
      orderId: oid,
      lat: Number(lat),
      lng: Number(lng),
      at: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Multer / upload errors → clear JSON (instead of raw HTML 500)
app.use((err, req, res, next) => {
  if (err instanceof require('multer').MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err && err.message && /Invalid file type|Only Excel/i.test(err.message)) {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
});

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
app.use('/api/config', configRoutes);

// Lightweight health check — used by keep-alive pings (no DB work)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    uptime: process.uptime(),
    ts: Date.now(),
  });
});

app.get('/', (req, res) => {
  res.send('Mersko E-Commerce API is running...');
});

// Database Connection & Server Listener
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mersko')
  .then(() => {
    console.log('MongoDB Connected');

    server.listen(PORT, '0.0.0.0', () => {
      // Show real LAN IPs so phone testing is easy
      let lanLines = '';
      try {
        const os = require('os');
        const nets = os.networkInterfaces();
        const ips = [];
        for (const name of Object.keys(nets)) {
          for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
          }
        }
        if (ips.length) {
          lanLines = ips.map((ip) => `  Phone/API: http://${ip}:${PORT}`).join('\n');
        }
      } catch {
        // ignore
      }

      console.log(`Server running on http://localhost:${PORT}`);
      if (lanLines) {
        console.log('LAN (same Wi‑Fi — use this IP in the phone browser for frontend):\n' + lanLines);
      } else {
        console.log(`LAN access: http://<YOUR_PC_IP>:${PORT}`);
      }

      // Render free tier sleeps after ~15 min idle. Self-ping keeps it warm.
      // Set KEEP_ALIVE_URL to your public API root, e.g. https://xxx.onrender.com
      // Or rely on RENDER_EXTERNAL_URL which Render injects automatically.
      const keepAliveBase = (
        process.env.KEEP_ALIVE_URL ||
        process.env.RENDER_EXTERNAL_URL ||
        ''
      ).replace(/\/+$/, '');
      // Note: self-ping only helps WHILE the dyno is awake. Free Render still
      // needs an external cron (UptimeRobot / cron-job.org) after full sleep.
      if (keepAliveBase) {
        const pingUrl = `${keepAliveBase}/api/health`;
        const intervalMs = Number(process.env.KEEP_ALIVE_INTERVAL_MS) || 10 * 60 * 1000;
        const ping = () => {
          fetch(pingUrl).catch(() => {});
        };
        setInterval(ping, intervalMs);
        setTimeout(ping, 20_000);
        console.log(`Keep-alive enabled → ${pingUrl} every ${Math.round(intervalMs / 60000)}m`);
      }
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
