import React, { useState, useMemo } from 'react';
import useProducts from '../hooks/useProducts';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import './POS.css';

function POS() {
  const { products, isLoading, error, refresh } = useProducts();
  const { token } = useAuth();
  
  const [ticket, setTicket] = useState([]); // [{ product, quantity }]
  const [saleStatus, setSaleStatus] = useState({ type: null, message: '', details: null });

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

  const grandTotal = useMemo(() => {
    return ticket.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [ticket]);

  const handleCompleteSale = async () => {
    if (ticket.length === 0) return;
    
    const confirmSale = window.confirm(`Complete sale for $${grandTotal.toFixed(2)}?`);
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
          total: grandTotal,
          timestamp: new Date().toLocaleString()
        }
      });
      setTicket([]);
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
          <div className="grand-total">Total: ${grandTotal.toFixed(2)}</div>
          <div className="ticket-actions">
            <button className="btn-clear" onClick={clearTicket} disabled={ticket.length === 0}>Clear Ticket</button>
            <button className="btn-complete" onClick={handleCompleteSale} disabled={ticket.length === 0}>Complete Sale</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default POS;
