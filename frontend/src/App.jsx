import React, { Suspense, lazy, useState } from "react";
import SplashScreen from "./components/SplashScreen";
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
import { NotificationProvider } from "./contexts/NotificationContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { LocationProvider } from "./contexts/LocationContext";
import { Toaster } from 'react-hot-toast';

import RoleProtectedRoute from "./components/RoleProtectedRoute";
import LocationPickerModal from './components/LocationPickerModal';
import InstallPWABanner from './components/InstallPWABanner';

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


function PageLoader() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        gap: 28,
      }}
    >
      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
          backgroundSize: "55px 55px",
        }}
      />

      {/* Rotating ring */}
      <div style={{ position: "relative", width: 80, height: 80 }}>
        {/* Outer glow ring */}
        <div
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            border: "1px solid rgba(59,130,246,0.12)",
          }}
        />
        {/* Spinner arc */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#3b82f6",
            borderRightColor: "rgba(59,130,246,0.3)",
            boxShadow: "0 0 16px rgba(59,130,246,0.5)",
            animation: "plSpin 0.9s linear infinite",
          }}
        />
        {/* Inner reverse arc */}
        <div
          style={{
            position: "absolute",
            inset: 10,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderBottomColor: "#f97316",
            borderLeftColor: "rgba(249,115,22,0.3)",
            boxShadow: "0 0 12px rgba(249,115,22,0.4)",
            animation: "plSpin 1.4s linear infinite reverse",
          }}
        />
        {/* Center M/ mark */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.3rem",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#3b82f6" }}>M</span>
          <span style={{ color: "#f97316", marginLeft: "-2px" }}>/</span>
        </div>
      </div>

      {/* 3 staggered dots */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {[
          { color: "#3b82f6", glow: "rgba(59,130,246,0.8)",  size: 7,  delay: "0s"     },
          { color: "#ffffff", glow: "rgba(255,255,255,0.6)", size: 10, delay: "0.22s"  },
          { color: "#f97316", glow: "rgba(249,115,22,0.8)",  size: 7,  delay: "0.44s"  },
        ].map((d, i) => (
          <div
            key={i}
            style={{
              width:  d.size,
              height: d.size,
              borderRadius: "50%",
              background: d.color,
              boxShadow: `0 0 10px ${d.glow}`,
              animation: `plDot 1.4s ease-in-out ${d.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: 140,
          height: 3,
          background: "rgba(255,255,255,0.07)",
          borderRadius: 99,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 99,
            background: "linear-gradient(90deg, #3b82f6, #f97316)",
            boxShadow: "0 0 10px rgba(59,130,246,0.6)",
            transformOrigin: "left center",
            animation: "plBar 2s cubic-bezier(0.4,0,0.2,1) infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 99,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
            animation: "plShimmer 2s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes plSpin    { to { transform: rotate(360deg); } }
        @keyframes plDot {
          0%,100% { transform: translateY(0)   scale(0.85); opacity: 0.4; }
          45%      { transform: translateY(-7px) scale(1.15); opacity: 1;   }
        }
        @keyframes plBar {
          0%   { transform: scaleX(0); opacity: 0.9; }
          70%  { transform: scaleX(1); opacity: 1;   }
          85%  { transform: scaleX(1); opacity: 0.6; }
          100% { transform: scaleX(0); opacity: 0;   }
        }
        @keyframes plShimmer {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(250%);  }
          100% { transform: translateX(250%);  }
        }
      `}</style>
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
  const [splashDone, setSplashDone] = useState(false);

  return (
    <BrowserRouter>
      {/* App launch splash screen */}
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}

      <LanguageProvider>
        <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <CartProvider>
            <LocationProvider>
              <LocationPickerModal />
              <InstallPWABanner />
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
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;