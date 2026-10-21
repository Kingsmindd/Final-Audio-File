// import "./App.css";

import { lazy, Suspense, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ----------- Route Wrappers --------------------
// FIXED: removed static imports of RootLayout and AdminRoute since they are
// already lazy-loaded below — having both caused "Identifier has already been declared" errors
import { StoreProvider } from "./context/StoreContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RollerLoader from "./components/RollerLoader";
import RootLayout from "./layout/RootLayout";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

// ----------- Lazy Loading ------------------
const HomePage = lazy(() => import("./pages/HomePage"));
const HeadphonesPage = lazy(() => import("./pages/HeadphonesPage"));
const SPeakersPage = lazy(() => import("./pages/SpeakerPage"));
const EarphonesPage = lazy(() => import("./pages/EarphonesPage"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const TermsAndConditionsPage = lazy(
  () => import("./pages/TermsAndConditionPage"),
);
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const OrderHistoryPage = lazy(() => import("./pages/OrderHistoryPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// Admin pages - only loaded if user is an admin
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
// const AdminRoute = lazy(() => import("./components/AdminRoute"));

// const RootLayout = lazy(() => import("./layout/RootLayout"));

function ShoppingSession({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <RollerLoader />;
  return <StoreProvider key={user?._id ? "user:" + user._id : "guest"}>{children}</StoreProvider>;
}

function App() {
  return (
    <>
      <AuthProvider>
        <ShoppingSession>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "#363636",
                  color: "#ffffff",
                  fontFamily: "Manrope, sans-serif",
                  fontSize: "14px",
                },
                success: {
                  iconTheme: {
                    primary: "#D87D4A",
                    secondary: "#ffffff",
                  },
                },
              }}
            />
            {/* FIXED: Toaster tag was never closed (missing "/>") which broke the entire JSX tree below it */}
            <Suspense fallback={<RollerLoader />}>
              <Routes>
                <Route element={<RootLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/headphones" element={<HeadphonesPage />} />
                  <Route path="/speakers" element={<SPeakersPage />} />
                  <Route path="/earphones" element={<EarphonesPage />} />
                  <Route path="/product/:id" element={<ProductDetailsPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/t&c" element={<TermsAndConditionsPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/orders" element={<OrderHistoryPage />} />
                  </Route>
                </Route>

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="users" element={<AdminUsers />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ShoppingSession>
      </AuthProvider>
    </>
  );
}

// https://audiophilefinale.vercel.app/

export default App;
