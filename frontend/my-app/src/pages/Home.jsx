import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import './Home.css';

function Home({ products }) {
  const navigate = useNavigate();

  // Display only products where featured = true
  const featuredProducts = products.filter(p => p.featured);

  return (
    <div className="home-container">
      <section className="hero-section">
        <h1 className="hero-title">Student Essential Shop</h1>
        <p className="hero-subtitle">Equip your campus life with top-tier gear, without the hassle.</p>
        <button 
          className="shop-now-btn" 
          onClick={() => navigate('/products')}
        >
          Shop Now
        </button>
      </section>

      <section className="featured-section">
        <h2 className="section-title" style={{ color: 'black' }}>Featured Products</h2>
        <div className="featured-scroll-row">
          {featuredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onSale={product.onSale}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
