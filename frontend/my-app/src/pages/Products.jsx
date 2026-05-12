import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import useProducts from '../hooks/useProducts';
import './Products.css';

// Fuzzy match: checks if all characters of the query appear in order in the target
function fuzzyMatch(target, query) {
  if (!query) return true;
  const t = target.toLowerCase();
  const q = query.toLowerCase();

  // Exact substring match always wins
  if (t.includes(q)) return true;

  // Character-by-character ordered match
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function Products() {
  const { products, isLoading, error, lastUpdated, refresh } = useProducts();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(products.map(p => p.category))];

  // Sync state if URL changes (e.g. going back/forward)
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Live update: auto-select category as the user types
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSelectedCategory('All');
      return;
    }
    const matchedCategory = categories.find(
      cat => cat.toLowerCase() === q
    );
    if (matchedCategory) {
      setSelectedCategory(matchedCategory);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
    }
  };

  const getCategoryCount = (cat) => {
    if (cat === 'All') return products.length;
    return products.filter(p => p.category === cat).length;
  };

  // Filter live using searchQuery (updates on every keystroke)
  const filteredProducts = products.filter(product => {
    const query = searchQuery.trim();
    const matchesSearch =
      fuzzyMatch(product.name, query) ||
      fuzzyMatch(product.category, query);
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="loading-message">
        <div className="spinner"></div>
        <p>Loading....</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-page-container">
        <div className="products-header">
          <h1 className="products-title" style={{ color: 'black' }}>All Products</h1>
        </div>
        <div className="error-banner" style={{ padding: '15px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>⚠️ Failed to load products: {error}</p>
          <button onClick={refresh} style={{ padding: '8px 16px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page-container">
      <div className="products-header">
        <h1 className="products-title" style={{ color: 'black' }}>All Products</h1>

        <div className="products-meta-row">
          <button className="refresh-btn" onClick={refresh}>
            ↻ Refresh products
          </button>
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        <form className="products-search-wrapper" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="products-search-input"
            placeholder="Search by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="products-search-button">Search</button>
        </form>

        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-btn ${cat === selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat} ({getCategoryCount(cat)})
            </button>
          ))}
        </div>
        
        <p className="products-count-msg">
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="no-products-found">
          <p>No products found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onSale={product.onSale}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;
