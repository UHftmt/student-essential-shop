import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, total } = useCart();

  return (
    <div className="cart-page-wrapper">
      <div className="cart-container">
        <h2>Your Cart</h2>
        {cartItems.length === 0 ? (
          <p className="empty-cart">Your cart is empty.</p>
        ) : (
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.productId} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-image" />
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">${item.price} each</span>
                </div>
                <div className="cart-item-controls">
                  <button
                    className="control-btn"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="cart-item-quantity">{item.quantity}</span>
                  <button
                    className="control-btn"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    +
                  </button>
                </div>
                {item.quantity >= item.stock && (
                  <span className="stock-warning">
                    Max quantity reached ({item.stock} in stock)
                  </span>
                )}
                <div className="cart-item-subtotal">
                  <span className="subtotal-amount">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(item.productId)}
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="cart-total">
              <h3>Total</h3>
              <h3>${total.toFixed(2)}</h3>
            </div>
            <button
              className="checkout-btn"
              onClick={() => navigate('/checkout')}
            >
              Check Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
