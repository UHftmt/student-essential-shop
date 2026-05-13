import React from 'react';
import './LoginReminderModal.css';

/**
 * LoginReminderModal – a popup that asks users to log in before
 * performing an action (e.g. adding to cart).
 *
 * Props:
 *   isOpen   – boolean controlling visibility
 *   onClose  – callback to dismiss the modal
 */
function LoginReminderModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="login-reminder-overlay" onClick={onClose}>
      <div className="login-reminder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-reminder-icon">🔒</div>
        <h3 className="login-reminder-title">Login Required</h3>
        <p className="login-reminder-message">
          Please sign in with your Google account before adding items to your cart.
        </p>
        <button className="login-reminder-btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

export default LoginReminderModal;
