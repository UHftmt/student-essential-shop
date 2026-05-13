import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import CheckoutPage from './pages/CheckoutPage';
import AdminInventory from './pages/AdminInventory';
import AdminOrders from './pages/AdminOrders';
import AdminDiscount from './pages/AdminDiscount';
import POS from './pages/POS';
import Orders from './pages/Orders';
import useProducts from './hooks/useProducts';
import './App.css';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function App() {
  const { products, isLoading, error, refresh } = useProducts();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            {isLoading && (
              <div className="loading-message">
                <div className="spinner"></div>
                <p>Loading....</p>
              </div>
            )}
            {error && !isLoading && null /* Error is handled within individual page components */}
            <Routes>
              <Route
                path="/"
                element={<Home products={products} error={error} refresh={refresh} />}
              />
              <Route
                path="/products"
                element={<Products />}
              />
              <Route
                path="/product/:id"
                element={<ProductDetail />}
              />
              <Route
                path="/cart"
                element={<Cart />}
              />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute allowedRoles={['customer', 'admin']}>
                    <Orders />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminInventory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/orders" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminOrders />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/discount" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDiscount />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pos" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'cashier']}>
                    <POS />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          {showBackToTop && (
            <button className="back-to-top" onClick={scrollToTop} aria-label="Back to top">
              ↑
            </button>
          )}
        </div>
      </Router>
    </CartProvider>
    </AuthProvider>
  );
}

export default App;
