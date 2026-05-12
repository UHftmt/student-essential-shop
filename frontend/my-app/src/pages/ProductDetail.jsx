import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getApiUrl } from '../utils/api';
import './ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch a single product from the Flask API when the page loads (or id changes)
  useEffect(() => {
    fetch(getApiUrl(`/products/${id}`))
      .then(response => {
        if (!response.ok) {
          throw new Error("Product not found");
        }
        return response.json();
      })
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Loading....</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-error">
        <h2>⚠️ Product not found or unavailable</h2>
        <p>We couldn't load this product. Please try again.</p>
        <button className="back-btn" onClick={() => navigate('/products')}>Back to Products</button>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        &larr; Back
      </button>
      <div className="product-detail-content">
        <div className="product-detail-image-wrapper">
          {product.onSale && <div className="detail-sale-badge">SALE!</div>}
          <img src={product.image} alt={product.name} className="product-detail-image" />
        </div>
        <div className="product-detail-info">
          <div className="detail-category">{product.category}</div>
          <h1 className="detail-name">{product.name}</h1>
          <p className="detail-price">${product.price}</p>
          <p className="detail-description">{product.description}</p>
          
          <div className="detail-stock-status">
            {product.stock > 10 ? (
              <span className="stock-in">In Stock ({product.stock} available)</span>
            ) : product.stock > 0 ? (
              <span className="stock-low">Low Stock ({product.stock} left)</span>
            ) : (
              <span className="stock-out">Out of Stock</span>
            )}
          </div>
          
          <button 
            className="detail-add-btn"
            disabled={product.stock === 0}
            onClick={() => addToCart(product)}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
