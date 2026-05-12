import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import { GoogleLogin } from '@react-oauth/google';
import './Navbar.css';

function Navbar() {
  const { itemCount, clearCart } = useCart();
  const { user, login, logout } = useAuth();

  const handleLoginSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;
    try {
      const res = await fetch(getApiUrl('/auth/google_login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: token })
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user, data.token);
      } else {
        console.error('Login failed on backend');
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const handleSignOut = () => {
    logout(clearCart);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">
          Student Essential Shop
        </Link>
      </div>
      <div className="navbar-right">
        <Link to="/" className="nav-link">Store</Link>
        <Link to="/products" className="nav-link">Products</Link>
        {user && user.role === 'customer' && (
          <Link to="/orders" className="nav-link">Orders</Link>
        )}
        {user && user.role === 'cashier' && (
          <Link to="/pos" className="nav-link">POS</Link>
        )}
        {user && user.role === 'admin' && (
          <>
            <Link to="/admin" className="nav-link">Admin Inventory</Link>
            <Link to="/admin/orders" className="nav-link">Admin Orders</Link>
            <Link to="/pos" className="nav-link">POS</Link>
          </>
        )}

        {user && (
          <Link to="/cart" className="nav-link cart-link">
            🛒 Cart
            <span className="cart-count">{itemCount}</span>
          </Link>
        )}

        {user ? (
          <div className="auth-user">
            <span className="user-name">{user.name}</span>
            <button className="btn-signout" onClick={handleSignOut}>Sign out</button>
          </div>
        ) : (
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => {
              console.error('Login Failed');
            }}
          />
        )}
      </div>
    </nav>
  );
}

export default Navbar;
