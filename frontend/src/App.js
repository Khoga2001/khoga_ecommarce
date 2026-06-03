import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import HomePage from "./pages/HomePage";
import CollectionPage from "./pages/CollectionPage";
import ProductPage from "./pages/ProductPage";
import SearchPage from "./pages/SearchPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccountPage from "./pages/AccountPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import AboutPage from "./pages/AboutPage";
import LegalPage from "./pages/LegalPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductEdit from "./pages/admin/AdminProductEdit";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminInventory from "./pages/admin/AdminInventory";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";
import { useNavigationType } from "react-router-dom";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";

function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();

  // Scroll to top on new navigation
  useEffect(() => {
    if (navigationType !== "POP") {
      // Force scroll to top using a small timeout to ensure DOM is ready
      setTimeout(() => window.scrollTo(0, 0), 10);
    }
  }, [location.pathname, navigationType]);

  // Save scroll position
  useEffect(() => {
    let timeoutId;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(`scroll_${location.key}`, window.scrollY);
      }, 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [location.key]);

  // Restore scroll position on POP (Back button)
  useEffect(() => {
    if (navigationType === "POP") {
      const savedScroll = sessionStorage.getItem(`scroll_${location.key}`);
      if (savedScroll) {
        const y = parseInt(savedScroll, 10);
        let attempts = 0;
        // Try restoring multiple times because content loads asynchronously
        const interval = setInterval(() => {
          window.scrollTo(0, y);
          if (window.scrollY >= y - 10 || attempts > 15) {
            clearInterval(interval);
          }
          attempts++;
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, [location.key, navigationType]);

  return null;
}
function StoreLayout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { lang } = useLanguage();
  
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);
  
  return (
    <div className="app-root" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar />
      <div className="page-content" style={{ paddingTop: isHome ? 0 : '68px' }}>{children}</div>
      <Footer />
      <CartDrawer />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollManager />
          <Toaster position="top-center" richColors />
          <Routes>
            {/* Admin (no Navbar/Footer) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductEdit />} />
              <Route path="products/:id" element={<AdminProductEdit />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="inventory" element={<AdminInventory />} />
            </Route>

            {/* Storefront */}
            <Route
              path="*"
              element={
                <StoreLayout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/shipping" element={<LegalPage titleEn="Shipping Policy" titleAr="سياسة الشحن" contentEn="<p>Our shipping policy is currently being updated. We strive to deliver your coffee fresh and as quickly as possible. For any urgent inquiries, please contact our support.</p>" contentAr="<p>جاري تحديث سياسة الشحن الخاصة بنا. نحن نسعى دائماً لتوصيل قهوتك طازجة وبأسرع وقت ممكن. لأي استفسارات عاجلة، يرجى التواصل مع الدعم الفني.</p>" />} />
                    <Route path="/returns" element={<LegalPage titleEn="Returns & Refunds" titleAr="الاستبدال والاسترجاع" contentEn="<p>If you are not 100% satisfied with your purchase, please contact us within 14 days of receiving your order. Coffee and perishable items are generally non-refundable unless there is a defect or error in the order.</p>" contentAr="<p>إذا لم تكن راضياً بنسبة 100٪ عن مشترياتك، يرجى التواصل معنا خلال 14 يوماً من استلام طلبك. القهوة والمنتجات القابلة للتلف غير قابلة للاسترجاع بشكل عام إلا في حالة وجود عيب أو خطأ في الطلب.</p>" />} />
                    <Route path="/privacy" element={<LegalPage titleEn="Privacy Policy" titleAr="سياسة الخصوصية" contentEn="<p>Your privacy is important to us. We only collect the necessary information required to process your orders and improve your shopping experience. We do not share or sell your data to third parties.</p>" contentAr="<p>خصوصيتك تهمنا. نحن نجمع فقط المعلومات الضرورية لمعالجة طلباتك وتحسين تجربة التسوق الخاصة بك. نحن لا نشارك أو نبيع بياناتك لأطراف خارجية.</p>" />} />
                    <Route path="/faq" element={<LegalPage titleEn="Frequently Asked Questions" titleAr="الأسئلة الشائعة" contentEn="<p><strong>1. How long does shipping take?</strong><br/>Usually 2-4 business days.</p><br/><p><strong>2. Is your coffee roasted daily?</strong><br/>Yes, we roast daily to ensure maximum freshness.</p>" contentAr="<p><strong>١. كم يستغرق الشحن؟</strong><br/>عادة ما يستغرق من 2-4 أيام عمل.</p><br/><p><strong>٢. هل تحمصون القهوة يومياً؟</strong><br/>نعم، نحمص قهوتنا بشكل يومي لضمان أقصى درجات الجودة والنضارة.</p>" />} />
                    <Route path="/contact" element={<LegalPage titleEn="Contact Us" titleAr="اتصل بنا" contentEn="<p>We would love to hear from you!</p><p><strong>Email:</strong> info@khogaeg.com<br/><strong>Phone / WhatsApp:</strong> +20 100 007 3883</p>" contentAr="<p>يسعدنا تواصلك معنا!</p><p><strong>البريد الإلكتروني:</strong> info@khogaeg.com<br/><strong>الهاتف / واتساب:</strong> +20 100 007 3883</p>" />} />
                    <Route path="/collections/:handle" element={<CollectionPage />} />
                    <Route path="/products/:handle" element={<ProductPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route
                      path="/account"
                      element={
                        <ProtectedRoute>
                          <AccountPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/account/orders"
                      element={
                        <ProtectedRoute>
                          <OrdersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/account/orders/:id"
                      element={
                        <ProtectedRoute>
                          <OrderDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <CheckoutPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/order-confirmation/:id"
                      element={
                        <ProtectedRoute>
                          <OrderConfirmationPage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </StoreLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
