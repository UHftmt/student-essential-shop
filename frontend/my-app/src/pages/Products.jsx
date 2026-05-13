import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ErrorCard from '../components/ErrorCard';
import useProducts from '../hooks/useProducts';
import './Products.css';

function Products() {
  const { products, isLoading, error, lastUpdated, refresh, search } = useProducts();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(products.map(p => p.category))];

  // Sync state if URL changes (e.g. going back/forward)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchQuery(urlSearch);
    // If the URL has a search param on mount/change, trigger a backend search
    if (urlSearch) {
      search(urlSearch);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      setSearchParams({ search: query });
      // Send the search query to the backend
      search(query);
    } else {
      setSearchParams({});
      // Empty query → reload all products
      refresh();
    }
    // Reset category filter on new search
    setSelectedCategory('All');
  };

  const getCategoryCount = (cat) => {
    if (cat === 'All') return products.length;
    return products.filter(p => p.category === cat).length;
  };

  // Filter only by the selected category button (client-side).
  // The text search is handled by the backend, so we don't filter by
  // searchQuery here.
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="loading-message">
        <div className="spinner"></div>
        <p>Loading....</p>
      </div>
    );
  }

  return (
    <div className="products-page-container">
      <div className="products-header">
        <h1 className="products-title">All Products</h1>

        <div className="products-meta-row">
          <button className="refresh-btn" onClick={() => { setSearchQuery(''); setSearchParams({}); refresh(); }}>
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
            placeholder="Search by name, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="products-search-button">Search</button>
        </form>

        {!error && (
          <>
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
          </>
        )}
      </div>

      {error ? (
        <ErrorCard message={error} onRetry={refresh} />
      ) : filteredProducts.length === 0 ? (
        <div className="no-products-found">
          <p>No products found{searchQuery ? ` matching "${searchQuery}"` : ''}</p>
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
