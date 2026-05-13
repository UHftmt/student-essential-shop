import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import './AdminDiscount.css';

function AdminDiscount() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [originalDiscounts, setOriginalDiscounts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New discount form state
  const [newDiscount, setNewDiscount] = useState({
    name: '',
    percentage: '',
    stackability: 0,
    state: 0
  });

  // Track which rows are in edit mode
  const [editingId, setEditingId] = useState(null);

  const fetchDiscounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl('/discounts'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOriginalDiscounts(JSON.parse(JSON.stringify(data)));
        setDiscounts(JSON.parse(JSON.stringify(data)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setHasChanges(false);
    }
  };

  useEffect(() => {
    if (token) fetchDiscounts();
  }, [token]);

  const handleBackToPos = () => {
    if (hasChanges) {
      const confirmLeave = window.confirm("You have unsaved changes. Are you sure you want to leave without applying?");
      if (!confirmLeave) return;
    }
    navigate('/pos');
  };

  const handleAddDiscount = () => {
    if (!newDiscount.name || !newDiscount.percentage) return;
    
    const tempId = 'temp_' + Date.now();
    const discountToAdd = {
      id: tempId,
      name: newDiscount.name,
      percentage: parseFloat(newDiscount.percentage),
      stackability: parseInt(newDiscount.stackability),
      state: parseInt(newDiscount.state)
    };

    setDiscounts([discountToAdd, ...discounts]);
    setHasChanges(true);
    setNewDiscount({ name: '', percentage: '', stackability: 0, state: 0 });
  };

  const handleRemove = (id) => {
    setDiscounts(discounts.filter(d => d.id !== id));
    setHasChanges(true);
  };

  const startEdit = (id) => {
    setEditingId(id);
  };

  const saveEdit = () => {
    setEditingId(null);
    setHasChanges(true);
  };

  const handleEditChange = (id, field, value) => {
    setDiscounts(discounts.map(d => {
      if (d.id === id) {
        return { ...d, [field]: value };
      }
      return d;
    }));
  };

  const handleCancelChanges = () => {
    setDiscounts(JSON.parse(JSON.stringify(originalDiscounts)));
    setHasChanges(false);
    setEditingId(null);
  };

  const handleApplyChanges = async () => {
    try {
      // Find deleted
      const currentIds = discounts.map(d => d.id);
      const deleted = originalDiscounts.filter(od => !currentIds.includes(od.id));
      
      // Find new
      const added = discounts.filter(d => String(d.id).startsWith('temp_'));
      
      // Find updated
      const updated = discounts.filter(d => {
        if (String(d.id).startsWith('temp_')) return false;
        const orig = originalDiscounts.find(od => od.id === d.id);
        if (!orig) return false;
        return (
          orig.name !== d.name ||
          orig.percentage !== d.percentage ||
          orig.stackability !== d.stackability ||
          orig.state !== d.state
        );
      });

      // Execute Deletes
      for (const d of deleted) {
        await fetch(getApiUrl(`/discounts/${d.id}`), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      // Execute Adds
      for (const d of added) {
        await fetch(getApiUrl('/discounts'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(d)
        });
      }

      // Execute Updates
      for (const d of updated) {
        await fetch(getApiUrl(`/discounts/${d.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(d)
        });
      }

      // Refresh
      await fetchDiscounts();
      alert("Changes applied successfully!");

    } catch (err) {
      console.error(err);
      alert("Error applying changes.");
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="admin-discount-container">
      <div className="admin-header">
        <h2>Discount Management</h2>
        <button className="btn-back" onClick={handleBackToPos}>&larr; Back to POS</button>
      </div>

      <div className="add-discount-area">
        <h3>Add New Discount</h3>
        <div className="add-discount-form">
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={newDiscount.name} 
              onChange={e => setNewDiscount({...newDiscount, name: e.target.value})}
              placeholder="e.g. Holiday Sale"
            />
          </div>
          <div className="form-group">
            <label>Percentage (%)</label>
            <input 
              type="number" 
              value={newDiscount.percentage} 
              onChange={e => setNewDiscount({...newDiscount, percentage: e.target.value})}
              placeholder="e.g. 15"
              min="0" max="100"
            />
          </div>
          <div className="form-group">
            <label>Stackability</label>
            <select 
              value={newDiscount.stackability} 
              onChange={e => setNewDiscount({...newDiscount, stackability: e.target.value})}
            >
              <option value={0}>No</option>
              <option value={1}>Yes</option>
            </select>
          </div>
          <div className="form-group">
            <label>State</label>
            <select 
              value={newDiscount.state} 
              onChange={e => setNewDiscount({...newDiscount, state: e.target.value})}
            >
              <option value={0}>Not Activated</option>
              <option value={1}>Activated</option>
            </select>
          </div>
          <button className="btn-add" onClick={handleAddDiscount}>Add</button>
        </div>
      </div>

      <div className="discount-display-area">
        <h3>Available Discounts</h3>
        {discounts.length === 0 ? (
          <p>No discounts available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Percentage</th>
                <th>Stackability</th>
                <th>State</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map(discount => {
                const isEditing = editingId === discount.id;
                const isNew = String(discount.id).startsWith('temp_');
                
                // Check if updated to add dirty class
                const orig = originalDiscounts.find(od => od.id === discount.id);
                const isDirty = isNew || (orig && (
                  orig.name !== discount.name ||
                  orig.percentage !== discount.percentage ||
                  orig.stackability !== discount.stackability ||
                  orig.state !== discount.state
                ));

                return (
                  <tr key={discount.id} className={isDirty ? 'dirty-row' : ''}>
                    <td>
                      {isEditing ? (
                        <input 
                          className="edit-input"
                          type="text" 
                          value={discount.name} 
                          onChange={e => handleEditChange(discount.id, 'name', e.target.value)}
                        />
                      ) : discount.name}
                    </td>
                    <td>
                      {isEditing ? (
                        <input 
                          className="edit-input"
                          type="number" 
                          value={discount.percentage} 
                          onChange={e => handleEditChange(discount.id, 'percentage', parseFloat(e.target.value) || 0)}
                        />
                      ) : `${discount.percentage}%`}
                    </td>
                    <td>
                      {isEditing ? (
                        <select 
                          className="edit-input"
                          value={discount.stackability} 
                          onChange={e => handleEditChange(discount.id, 'stackability', parseInt(e.target.value))}
                        >
                          <option value={0}>No</option>
                          <option value={1}>Yes</option>
                        </select>
                      ) : (discount.stackability ? 'Yes' : 'No')}
                    </td>
                    <td>
                      {isEditing ? (
                        <select 
                          className="edit-input"
                          value={discount.state} 
                          onChange={e => handleEditChange(discount.id, 'state', parseInt(e.target.value))}
                        >
                          <option value={0}>Not Activated</option>
                          <option value={1}>Activated</option>
                        </select>
                      ) : (discount.state ? 'Activated' : 'Not Activated')}
                    </td>
                    <td className="actions-cell">
                      {isEditing ? (
                        <button className="btn-save" onClick={saveEdit}>Done</button>
                      ) : (
                        <>
                          <button className="btn-modify" onClick={() => startEdit(discount.id)}>Modify</button>
                          <button className="btn-remove" onClick={() => handleRemove(discount.id)}>Remove</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="page-actions">
        <button 
          className="btn-page-cancel" 
          onClick={handleCancelChanges} 
          disabled={!hasChanges}
        >
          Cancel
        </button>
        <button 
          className="btn-page-apply" 
          onClick={handleApplyChanges} 
          disabled={!hasChanges}
        >
          Apply Changes
        </button>
      </div>
    </div>
  );
}

export default AdminDiscount;
