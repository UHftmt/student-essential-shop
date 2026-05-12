import React, { useState, useMemo } from 'react';
import useProducts from '../hooks/useProducts';
import { getApiUrl } from '../utils/api';
import './AdminInventory.css';

function AdminInventory() {
  const { products, isLoading, error, refresh } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [editingRowId, setEditingRowId] = useState(null);
  const [editStockValue, setEditStockValue] = useState('');
  const [editError, setEditError] = useState('');

  const handleRestockClick = (product) => {
    setEditingRowId(product.id);
    setEditStockValue(product.stock.toString());
    setEditError('');
  };

  const handleCancel = () => {
    setEditingRowId(null);
    setEditStockValue('');
    setEditError('');
  };

  const handleSave = async (id) => {
    const stockNum = Number(editStockValue);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      setEditError('Stock must be a whole number ≥ 0');
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/products/${id}/stock`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock: stockNum }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stock');
      }

      setEditingRowId(null);
      setEditStockValue('');
      setEditError('');
      refresh();
    } catch (err) {
      setEditError(err.message);
    }
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      handleSave(id);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Derive unique categories from products
  const categories = useMemo(() => {
    return ['All', ...new Set(products.map(p => p.category))];
  }, [products]);

  // Apply filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 1. Text search (name)
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      // 2. Category
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      // 3. Low stock only
      const matchesLowStock = !lowStockOnly || product.stock < 5;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchQuery, categoryFilter, lowStockOnly]);

  if (isLoading) {
    return (
      <div className="admin-inventory-container">
        <p>Loading inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-inventory-container error">
        <p>⚠️ Failed to load inventory: {error}</p>
        <button onClick={refresh}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="admin-inventory-container">
      <h2>Admin Inventory</h2>

      <div className="inventory-filters">
        <input
          type="text"
          placeholder="Search by product name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="filter-search"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-category"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Low stock only
        </label>
      </div>

      <div className="table-responsive">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Badges</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-results">No products found.</td>
              </tr>
            ) : (
              filteredProducts.map(product => {
                const isUnder5 = product.stock < 5;
                const isOut = product.stock === 0;
                let rowClass = isUnder5 ? 'low-stock-row' : '';
                if (editingRowId === product.id) {
                  rowClass += ' editing-row';
                }

                return (
                  <tr key={product.id} className={rowClass.trim()}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td>
                      {editingRowId === product.id ? (
                        <div className="edit-stock-container">
                          <input
                            type="number"
                            className="edit-stock-input"
                            value={editStockValue}
                            onChange={(e) => setEditStockValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, product.id)}
                            autoFocus
                            min="0"
                            step="1"
                          />
                          {editError && <div className="edit-stock-error">{editError}</div>}
                        </div>
                      ) : (
                        <>
                          <span className="stock-number">{product.stock}</span>
                          {isOut ? (
                            <span className="stock-badge badge-out">OUT</span>
                          ) : isUnder5 ? (
                            <span className="stock-badge badge-low">LOW</span>
                          ) : null}
                        </>
                      )}
                    </td>
                    <td className="badges-cell">
                      {product.featured && <span className="product-badge badge-featured">Featured</span>}
                      {product.onSale && <span className="product-badge badge-sale">On Sale</span>}
                    </td>
                    <td>
                      {editingRowId === product.id ? (
                        <div className="action-buttons">
                          <button className="btn-save" onClick={() => handleSave(product.id)}>Save</button>
                          <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn-restock" onClick={() => handleRestockClick(product)}>Restock</button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminInventory;