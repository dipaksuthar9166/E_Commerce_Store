import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// Layouts
import MainLayout from "./layouts/MainLayout";
import VendorLayout from "./layouts/VendorLayout";
import DeliveryLayout from "./layouts/DeliveryLayout";
import AdminLayout from "./layouts/AdminLayout";

// Contexts
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { LocationProvider } from "./contexts/LocationContext";
import { Toaster } from 'react-hot-toast';

import RoleProtectedRoute from "./components/RoleProtectedRoute";

// Lazy Pages
const Home = lazy(() => import("./pages/Home"));
const ProductListing = lazy(() => import("./pages/ProductListing"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Wishlist = lazy(() => import("./pages/Wishlist"));

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));

const VendorDashboard = lazy(() =>
  import("./pages/vendor/VendorDashboard")
);
const VendorProducts = lazy(() =>
  import("./pages/vendor/VendorProducts")
);
const VendorCategories = lazy(() =>
  import("./pages/vendor/VendorCategories")
);
const VendorOrders = lazy(() =>
  import("./pages/vendor/VendorOrders")
);
const VendorEarnings = lazy(() =>
  import("./pages/vendor/VendorEarnings")
);
const VendorSettings = lazy(() =>
  import("./pages/vendor/VendorSettings")
);
const VendorInventory = lazy(() =>
  import("./pages/vendor/VendorInventory")
);
const VendorCustomers = lazy(() =>
  import("./pages/vendor/VendorCustomers")
);
const VendorCoupons = lazy(() =>
  import("./pages/vendor/VendorCoupons")
);
const VendorPromotions = lazy(() =>
  import("./pages/vendor/VendorPromotions")
);
const VendorReviews = lazy(() =>
  import("./pages/vendor/VendorReviews")
);
const VendorSupport = lazy(() =>
  import("./pages/vendor/VendorSupport")
);
const VendorBanners = lazy(() =>
  import("./pages/vendor/VendorBanners")
);

const AdminDashboard = lazy(() =>
  import("./pages/admin/AdminDashboard")
);
const AdminShops = lazy(() =>
  import("./pages/admin/AdminShops")
);
const AdminUsers = lazy(() =>
  import("./pages/admin/AdminUsers")
);
const AdminFinances = lazy(() =>
  import("./pages/admin/AdminFinances")
);
const AdminSettings = lazy(() =>
  import("./pages/admin/AdminSettings")
);
const AdminCategories = lazy(() =>
  import("./pages/admin/AdminCategories")
);
const AdminOrders = lazy(() =>
  import("./pages/admin/AdminOrders")
);

const DeliveryDashboard = lazy(() =>
  import("./pages/delivery/DeliveryDashboard")
);
const DeliveryEarnings = lazy(() =>
  import("./pages/delivery/DeliveryEarnings")
);
const DeliveryHistory = lazy(() =>
  import("./pages/delivery/DeliveryHistory")
);
const DeliveryProfile = lazy(() =>
  import("./pages/delivery/DeliveryProfile")
);

const LocationPickerModal = lazy(() =>
  import("./components/LocationPickerModal")
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -15 },
  };

  const pageTransition = {
    duration: 0.3,
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route path="/" element={<MainLayout />}>
          <Route
            index
            element={
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="in"
                exit="out"
                transition={pageTransition}
              >
                <Home />
              </motion.div>
            }
          />

          <Route path="products" element={<ProductListing />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route
            path="category/:categoryKey"
            element={<CategoryPage />}
          />

          <Route path="shops" element={<Navigate to="/products" replace />} />
          <Route path="shop/:id" element={<Navigate to="/products" replace />} />
        </Route>

        <Route
          path="/vendor"
          element={
            <RoleProtectedRoute allowedRoles={["vendor"]}>
              <VendorLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<VendorDashboard />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="categories" element={<VendorCategories />} />
          <Route path="inventory" element={<VendorInventory />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="customers" element={<VendorCustomers />} />
          <Route path="reviews" element={<VendorReviews />} />
          <Route path="earnings" element={<VendorEarnings />} />
          <Route path="settings" element={<VendorSettings />} />
          <Route path="support" element={<VendorSupport />} />
          <Route path="coupons" element={<VendorCoupons />} />
          <Route path="promotions" element={<VendorPromotions />} />
          <Route path="banners" element={<VendorBanners />} />
        </Route>

        <Route
          path="/delivery"
          element={
            <RoleProtectedRoute allowedRoles={["delivery"]}>
              <DeliveryLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<DeliveryDashboard />} />
          <Route path="earnings" element={<DeliveryEarnings />} />
          <Route path="history" element={<DeliveryHistory />} />
          <Route path="profile" element={<DeliveryProfile />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="shops" element={<AdminShops />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="finances" element={<AdminFinances />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <LocationProvider>
              <Toaster 
                position="top-center"
                toastOptions={{
                  style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                  },
                }}
              />
              <Suspense fallback={null}>
                <LocationPickerModal />
              </Suspense>

              <Suspense fallback={<PageLoader />}>
                <AnimatedRoutes />
              </Suspense>
            </LocationProvider>
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;