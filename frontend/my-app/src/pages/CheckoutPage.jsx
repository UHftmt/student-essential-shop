import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import './CheckoutPage.css';

function CheckoutPage() {
  const { cartItems, total, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Validate all fields and return an errors object
  const validate = () => {
    const errs = {};

    if (name.trim() === '') {
      errs.name = 'Name is required';
    }

    if (email.trim() === '') {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (phone.trim() === '') {
      errs.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone.trim())) {
      errs.phone = 'Phone must be 10 digits';
    }

    if (address.trim() === '') {
      errs.address = 'Address is required';
    }

    if (city.trim() === '') {
      errs.city = 'City is required';
    }

    if (state.trim() === '') {
      errs.state = 'State is required';
    }

    if (zip.trim() === '') {
      errs.zip = 'ZIP code is required';
    }

    return errs;
  };

  // Quick boolean check used to enable/disable the submit button
  const isFormValid = name.trim() !== '' && email.trim() !== '' && cartItems.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    setErrors(errs);

    // Only proceed when there are zero errors
    if (Object.keys(errs).length === 0) {
      if (!token) {
        setApiError("Please log in to place an order.");
        return;
      }
      try {
        const res = await fetch(getApiUrl('/orders'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ items: cartItems })
        });
        const data = await res.json();
        if (res.ok) {
          clearCart();
          setSubmitted(true);
        } else {
          setApiError(data.error || 'Failed to place order');
        }
      } catch (err) {
        setApiError('Network error. Please try again.');
      }
    }
  };

  // ── Confirmation screen ──────────────────────────────
  if (submitted) {
    return (
      <div className="checkout-page-wrapper">
        <div className="checkout-container confirmation">
          <div className="confirmation-icon">✓</div>
          <h2>Order Confirmed!</h2>
          <p className="confirmation-text">
            Thank you, <strong>{name}</strong>! Your order has been placed
            successfully.
          </p>
          <p className="confirmation-detail">
            A confirmation email will be sent to <strong>{email}</strong>.
          </p>
          <div className="confirmation-summary">
            <p><span>Phone:</span> {phone}</p>
            <p><span>Address:</span> {address}</p>
            <p><span>City:</span> {city}, {state} {zip}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Checkout form ────────────────────────────────────
  return (
    <div className="checkout-page-wrapper">
      <div className="checkout-container">
        <h2>Checkout</h2>

        {/* ── Order summary from cart ── */}
        {cartItems.length === 0 ? (
          <div className="empty-cart-message" style={{ textAlign: 'center', margin: '20px 0' }}>
            <p className="empty-cart">Your cart is empty or products failed to load.</p>
            <button 
              className="back-btn" 
              onClick={() => navigate('/products')}
              style={{ marginTop: '10px' }}
            >
              Back to Products
            </button>
          </div>
        ) : (
          <div className="order-summary">
            <h3>Order Summary</h3>
            {cartItems.map((item) => (
              <div key={item.productId} className="summary-item">
                <span className="summary-name">{item.name} × {item.quantity}</span>
                <span className="summary-price">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="summary-total">
              <strong>Total</strong>
              <strong>${total.toFixed(2)}</strong>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {apiError && <div className="error-message" style={{color: 'red', padding: '10px', background: '#ffebee', borderRadius: '4px', marginBottom: '15px'}}>{apiError}</div>}
          {/* Name */}
          <div className="form-group">
            <label htmlFor="checkout-name">Full Name</label>
            <input
              id="checkout-name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="error-msg">{errors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="checkout-email">Email</label>
            <input
              id="checkout-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="checkout-phone">Phone</label>
            <input
              id="checkout-phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={errors.phone ? 'input-error' : ''}
            />
            {errors.phone && <span className="error-msg">{errors.phone}</span>}
          </div>

          {/* Address */}
          <div className="form-group">
            <label htmlFor="checkout-address">Address</label>
            <input
              id="checkout-address"
              type="text"
              placeholder="123 Main St"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={errors.address ? 'input-error' : ''}
            />
            {errors.address && (
              <span className="error-msg">{errors.address}</span>
            )}
          </div>

          {/* City / State / Zip — inline row */}
          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="checkout-city">City</label>
              <input
                id="checkout-city"
                type="text"
                placeholder="New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={errors.city ? 'input-error' : ''}
              />
              {errors.city && <span className="error-msg">{errors.city}</span>}
            </div>

            <div className="form-group flex-1">
              <label htmlFor="checkout-state">State</label>
              <input
                id="checkout-state"
                type="text"
                placeholder="NY"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={errors.state ? 'input-error' : ''}
              />
              {errors.state && (
                <span className="error-msg">{errors.state}</span>
              )}
            </div>

            <div className="form-group flex-1">
              <label htmlFor="checkout-zip">ZIP Code</label>
              <input
                id="checkout-zip"
                type="text"
                placeholder="10001"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className={errors.zip ? 'input-error' : ''}
              />
              {errors.zip && <span className="error-msg">{errors.zip}</span>}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="submit-btn"
            disabled={!isFormValid}
          >
            Place Order
          </button>
        </form>
      </div>
    </div>
  );
}

export default CheckoutPage;
