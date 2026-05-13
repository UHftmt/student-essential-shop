import React from 'react';
import './ErrorCard.css';

/**
 * ErrorCard – a reusable error display component for product fetch failures.
 *
 * Props:
 *   message  – the error message string to display
 *   onRetry  – callback for the "Try again" button
 */
function ErrorCard({ message, onRetry }) {
  return (
    <div className="error-card-area">
      <div className="error-card">
        <span className="error-card-icon">⚠️</span>
        <p className="error-card-text">Failed to load products: {message}</p>
        {onRetry && (
          <button className="error-card-btn" onClick={onRetry}>Try again</button>
        )}
      </div>
    </div>
  );
}

export default ErrorCard;
