import React from 'react';
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
import POS from './pages/POS';
import useProducts from './hooks/useProducts';
import './App.css';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function App() {
  const { products, isLoading, error } = useProducts();

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
            {error && (
              <div className="error-message">
                <p>⚠️ Failed to load products: {error}</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
              </div>
            )}
            <Routes>
              <Route
                path="/"
                element={<Home products={products} />}
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
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminInventory />
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
        </div>
      </Router>
    </CartProvider>
    </AuthProvider>
  );
}

export default App;

