import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginReminderModal from './LoginReminderModal';
import './ProductCard.css';

function ProductCard({ product, onSale }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [showLoginReminder, setShowLoginReminder] = useState(false);

  const { id, name, price, image, stock, category } = product;

  let stockStatus = 'Out of Stock';
  let stockClass = 'stock-out';

  if (stock > 10) {
    stockStatus = 'In Stock';
    stockClass = 'stock-in';
  } else if (stock > 0) {
    stockStatus = 'Low Stock';
    stockClass = 'stock-low';
  }

  const handleCardClick = () => {
    if (id) {
      navigate(`/product/${id}`);
    }
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    if (!user) {
      // User is not logged in → show reminder
      setShowLoginReminder(true);
      return;
    }
    // User is logged in → add to cart
    addToCart(product);
  };

  return (
    <>
      <div className="product-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        {!!onSale && <div className="sale-badge">SALE!</div>}
        <img src={image} alt={name} className="product-image" />
        <div className="product-info">
          <div className="product-category">{category}</div>
          <h2 className="product-name">{name}</h2>
          <p className="product-price"><strong>${price}</strong></p>
          <p className={`product-stock ${stockClass}`}>{stockStatus}</p>
          <div className="product-action">
            <button
              className="add-to-cart-btn"
              onClick={handleAddToCartClick}
              disabled={stock === 0}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
      <LoginReminderModal
        isOpen={showLoginReminder}
        onClose={() => setShowLoginReminder(false)}
      />
    </>
  );
}

export default ProductCard;
