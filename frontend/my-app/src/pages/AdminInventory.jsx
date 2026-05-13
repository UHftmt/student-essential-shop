import React, { useState, useMemo } from 'react';
import useProducts from '../hooks/useProducts';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import './AdminInventory.css';

function AdminInventory() {
  const { products, isLoading, error, refresh } = useProducts();
  const { token } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [editingRowId, setEditingRowId] = useState(null);
  const [editStockValue, setEditStockValue] = useState('');
  const [editError, setEditError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', price: '', image: '', category: '', stock: 0, description: '', featured: false, onSale: false
  });

  const openModal = (mode, product = null) => {
    setModalMode(mode);
    setCurrentProduct(product);
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        image: product.image || '',
        category: product.category || '',
        stock: product.stock || 0,
        description: product.description || '',
        featured: !!product.featured,
        onSale: !!product.onSale
      });
    } else {
      setFormData({
        name: '', price: '', image: '', category: '', stock: 0, description: '', featured: false, onSale: false
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const url = modalMode === 'create' ? getApiUrl('/products') : getApiUrl(`/products/${currentProduct.id}`);
    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to save product');
      closeModal();
      refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(getApiUrl(`/products/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete product');
      refresh();
    } catch (err) {
      alert(err.message);
    }
  };

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
          'Authorization': `Bearer ${token}`
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
      <div className="inventory-header-actions">
        <h2>Admin Inventory</h2>
        <button className="btn-add" onClick={() => openModal('create')}>+ Add Product</button>
      </div>

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
                      <div className="badges-container">
                        {product.featured ? <span className="product-badge badge-featured">Featured</span> : null}
                        {product.onSale ? <span className="product-badge badge-sale">On Sale</span> : null}
                      </div>
                    </td>
                    <td>
                      {editingRowId === product.id ? (
                        <div className="action-buttons">
                          <button className="btn-save" onClick={() => handleSave(product.id)}>Save</button>
                          <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button className="btn-restock" onClick={() => handleRestockClick(product)}>Restock</button>
                          <button className="btn-edit" onClick={() => openModal('edit', product)}>Edit</button>
                          <button className="btn-delete" onClick={() => handleDelete(product.id)}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{modalMode === 'create' ? 'Add New Product' : 'Edit Product'}</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input type="number" step="0.01" name="price" value={formData.price} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" name="category" value={formData.category} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input type="text" name="image" value={formData.image} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleFormChange}></textarea>
              </div>
              <div className="form-group form-checkbox">
                <input type="checkbox" name="featured" checked={formData.featured} onChange={handleFormChange} />
                <label>Featured</label>
              </div>
              <div className="form-group form-checkbox">
                <input type="checkbox" name="onSale" checked={formData.onSale} onChange={handleFormChange} />
                <label>On Sale</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-save">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInventory;