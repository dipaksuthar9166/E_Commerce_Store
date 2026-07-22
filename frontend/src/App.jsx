import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Layouts
import MainLayout from './layouts/MainLayout';
import VendorLayout from './layouts/VendorLayout';
import DeliveryLayout from './layouts/DeliveryLayout';
import AdminLayout from './layouts/AdminLayout';

// Core Customer Pages
import Home from './pages/Home';
import ProductListing from './pages/ProductListing';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import CategoryPage from './pages/CategoryPage';

// Vendor Portal Pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorCategories from './pages/vendor/VendorCategories';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorEarnings from './pages/vendor/VendorEarnings';
import VendorSettings from './pages/vendor/VendorSettings';
import VendorInventory from './pages/vendor/VendorInventory';
import VendorCustomers from './pages/vendor/VendorCustomers';
import VendorCoupons from './pages/vendor/VendorCoupons';
import VendorSupport from './pages/vendor/VendorSupport';
import VendorBanners from './pages/vendor/VendorBanners';

// Admin Portal Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminShops from './pages/admin/AdminShops';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFinances from './pages/admin/AdminFinances';
import AdminSettings from './pages/admin/AdminSettings';

// Delivery Portal Pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DeliveryEarnings from './pages/delivery/DeliveryEarnings';
import DeliveryHistory from './pages/delivery/DeliveryHistory';
import DeliveryProfile from './pages/delivery/DeliveryProfile';

// Contexts & Security
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import RoleProtectedRoute from './components/RoleProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <Routes>
              {/* ── Auth (standalone — no sidebar/top nav) ──── */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ── Customer Routes ──────────────────────────── */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                {/* Flipkart-style: browse products, not shops */}
                <Route path="products" element={<ProductListing />} />
                <Route path="shops" element={<Navigate to="/products" replace />} />
                <Route path="shop/:id" element={<Navigate to="/products" replace />} />
                <Route path="product/:id" element={<ProductDetails />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="orders" element={<Orders />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="category/:categoryKey" element={<CategoryPage />} />
                <Route path="*" element={
                  <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                    <span className="text-6xl mb-4">🔍</span>
                    <h2 className="text-xl font-bold text-gray-700 mb-2">Page Not Found</h2>
                    <p className="text-sm">The page you're looking for doesn't exist.</p>
                  </div>
                } />
              </Route>

              {/* ── Vendor Portal ────────────────────────────── */}
              <Route path="/vendor" element={
                <RoleProtectedRoute allowedRoles={['vendor']}>
                  <VendorLayout />
                </RoleProtectedRoute>
              }>
                <Route index element={<VendorDashboard />} />
                <Route path="products" element={<VendorProducts />} />
                <Route path="categories" element={<VendorCategories />} />
                <Route path="inventory" element={<VendorInventory />} />
                <Route path="banners" element={<VendorBanners />} />
                <Route path="coupons" element={<VendorCoupons />} />
                <Route path="orders" element={<VendorOrders />} />
                <Route path="customers" element={<VendorCustomers />} />
                <Route path="earnings" element={<VendorEarnings />} />
                <Route path="settings" element={<VendorSettings />} />
                <Route path="support" element={<VendorSupport />} />
              </Route>

              {/* ── Delivery Portal ──────────────────────────── */}
              <Route path="/delivery" element={
                <RoleProtectedRoute allowedRoles={['delivery']}>
                  <DeliveryLayout />
                </RoleProtectedRoute>
              }>
                <Route index element={<DeliveryDashboard />} />
                <Route path="earnings" element={<DeliveryEarnings />} />
                <Route path="history" element={<DeliveryHistory />} />
                <Route path="profile" element={<DeliveryProfile />} />
              </Route>

              {/* ── Admin Portal ─────────────────────────────── */}
              <Route path="/admin" element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </RoleProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="shops" element={<AdminShops />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="finances" element={<AdminFinances />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;