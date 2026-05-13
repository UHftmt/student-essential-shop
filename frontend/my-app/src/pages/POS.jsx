import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useProducts from '../hooks/useProducts';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import './POS.css';

function POS() {
  const { products, isLoading, error, refresh } = useProducts();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState([]); // [{ product, quantity }]
  const [saleStatus, setSaleStatus] = useState({ type: null, message: '', details: null });

  // Discount states
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [tempSelectedDiscounts, setTempSelectedDiscounts] = useState([]);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const res = await fetch(getApiUrl('/discounts?state=1'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableDiscounts(data);
        }
      } catch (err) {
        console.error("Failed to fetch discounts", err);
      }
    };
    if (token) fetchDiscounts();
  }, [token]);

  // Add to ticket
  const handleAdd = (product) => {
    setTicket(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // max reached
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSaleStatus({ type: null, message: '', details: null });
  };

  const handleRemove = (productId) => {
    setTicket(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearTicket = () => {
    setTicket([]);
    setSaleStatus({ type: null, message: '', details: null });
  };

  const subtotal = useMemo(() => {
    return ticket.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [ticket]);

  const discountSavings = useMemo(() => {
    let savings = 0;
    selectedDiscounts.forEach(d => {
      savings += subtotal * (d.percentage / 100);
    });
    return Math.min(savings, subtotal);
  }, [subtotal, selectedDiscounts]);

  const finalTotal = subtotal - discountSavings;

  const handleCompleteSale = async () => {
    if (ticket.length === 0) return;
    
    const confirmSale = window.confirm(`Complete sale for $${finalTotal.toFixed(2)}?`);
    if (!confirmSale) return;

    try {
      const payload = {
        items: ticket.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      const res = await fetch(getApiUrl('/pos/sale'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete sale');
      }

      // Success
      setSaleStatus({
        type: 'success',
        message: 'Sale completed successfully!',
        details: {
          items: [...ticket],
          subtotal: subtotal,
          discount: discountSavings,
          total: finalTotal,
          timestamp: new Date().toLocaleString()
        }
      });
      setTicket([]);
      setSelectedDiscounts([]);
      refresh(); // Refresh inventory
    } catch (err) {
      setSaleStatus({
        type: 'error',
        message: err.message || 'An error occurred'
      });
    }
  };

  if (isLoading) return <div className="pos-loading">Loading POS...</div>;
  if (error) return <div className="pos-error">Error: {error}</div>;

  return (
    <div className="pos-container">
      {/* Left Panel: Products */}
      <div className="pos-products">
        <h2>Products</h2>
        <div className="pos-product-list">
          {products.map(product => {
            // Find current qty in ticket to disable add if stock is met
            const ticketItem = ticket.find(i => i.product.id === product.id);
            const currentQty = ticketItem ? ticketItem.quantity : 0;
            const isOutOfStock = product.stock === 0 || currentQty >= product.stock;

            return (
              <div key={product.id} className="pos-product-row">
                <div className="pos-product-info">
                  <span className="pos-product-name">{product.name}</span>
                  <span className="pos-product-price">${Number(product.price).toFixed(2)}</span>
                  <span className={`pos-product-stock ${product.stock === 0 ? 'out' : ''}`}>
                    Stock: {product.stock}
                  </span>
                </div>
                <button 
                  className="btn-add" 
                  disabled={isOutOfStock}
                  onClick={() => handleAdd(product)}
                >
                  Add
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Sale Ticket */}
      <div className="pos-ticket">
        <h2>Sale Ticket</h2>
        
        {saleStatus.type === 'success' && saleStatus.details && (
          <div className="pos-receipt">
            <h3>Receipt</h3>
            <p>{saleStatus.details.timestamp}</p>
            <ul>
              {saleStatus.details.items.map(item => (
                <li key={item.product.id}>
                  {item.quantity}x {item.product.name} - ${(item.quantity * item.product.price).toFixed(2)}
                </li>
              ))}
            </ul>
            {saleStatus.details.discount > 0 && (
              <div className="receipt-discount">Discount: -${saleStatus.details.discount.toFixed(2)}</div>
            )}
            <h4>Total: ${saleStatus.details.total.toFixed(2)}</h4>
            <button onClick={() => setSaleStatus({ type: null, message: '', details: null })}>New Sale</button>
          </div>
        )}

        {saleStatus.type === 'error' && (
          <div className="pos-error-msg">{saleStatus.message}</div>
        )}

        {ticket.length === 0 ? (
          <p className="empty-ticket">Ticket is empty</p>
        ) : (
          <div className="ticket-items">
            {ticket.map(item => {
              const lineTotal = item.quantity * item.product.price;
              return (
                <div key={item.product.id} className="ticket-item-row">
                  <div className="ticket-item-details">
                    <span className="item-name">{item.product.name}</span>
                    <span className="item-calc">
                      {item.quantity} x ${Number(item.product.price).toFixed(2)} = ${lineTotal.toFixed(2)}
                    </span>
                  </div>
                  <button className="btn-remove" onClick={() => handleRemove(item.product.id)}>Remove</button>
                </div>
              );
            })}
          </div>
        )}

        <div className="ticket-summary">
          <div className="summary-totals">
            {discountSavings > 0 ? (
              <>
                <div className="subtotal-small">Subtotal: ${subtotal.toFixed(2)}</div>
                <div className="discount-small">Savings: -${discountSavings.toFixed(2)}</div>
                <div className="grand-total">Total: ${finalTotal.toFixed(2)}</div>
              </>
            ) : (
              <div className="grand-total">Total: ${finalTotal.toFixed(2)}</div>
            )}
          </div>
          <div className="ticket-actions">
            <button className="btn-discount" onClick={() => {
              setTempSelectedDiscounts(selectedDiscounts);
              setIsDiscountModalOpen(true);
            }}>Discount</button>
            <button className="btn-clear" onClick={clearTicket} disabled={ticket.length === 0}>Clear Ticket</button>
            <button className="btn-complete" onClick={handleCompleteSale} disabled={ticket.length === 0}>Complete Sale</button>
          </div>
        </div>
      </div>

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content discount-modal">
            <h2>Select Discounts</h2>
            
            {availableDiscounts.length === 0 ? (
              <p>No active discounts available.</p>
            ) : (
              <div className="discount-list">
                {availableDiscounts.map(discount => {
                  const isSelected = tempSelectedDiscounts.some(d => d.id === discount.id);
                  return (
                    <label key={discount.id} className="discount-option">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {
                          setTempSelectedDiscounts(prev => {
                            if (isSelected) return prev.filter(d => d.id !== discount.id);
                            if (!discount.stackability) return [discount];
                            return [...prev.filter(d => d.stackability), discount];
                          });
                        }}
                      />
                      <span className="discount-info">
                        <strong>{discount.name}</strong> ({discount.percentage}%) 
                        {!discount.stackability && <span className="badge">No Stack</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="modal-actions">
              {user?.role === 'admin' && (
                <button className="btn-modify-discount" onClick={() => navigate('/admin/discount')}>
                  Modify Discount
                </button>
              )}
              <div className="modal-right-actions">
                <button className="btn-cancel" onClick={() => setIsDiscountModalOpen(false)}>Cancel</button>
                <button className="btn-apply" onClick={() => {
                  setSelectedDiscounts(tempSelectedDiscounts);
                  setIsDiscountModalOpen(false);
                }}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default POS;
