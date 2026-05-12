import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';
import './AdminOrders.css';

function AdminOrders() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(getApiUrl('/admin/customers'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch customers');
        const data = await res.json();
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchCustomers();
  }, [token]);

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(c =>
      c.id.toString().includes(query) ||
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  // Fetch specific customer orders
  const handleCustomerClick = async (customer) => {
    setSelectedCustomer(customer);
    setOrdersLoading(true);
    setCustomerOrders([]);
    setError('');

    try {
      const res = await fetch(getApiUrl(`/admin/orders/${customer.id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch customer orders');
      const data = await res.json();
      setCustomerOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleReturn = () => {
    setSelectedCustomer(null);
    setCustomerOrders([]);
    setError('');
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div><p>Loading customers...</p></div>;

  return (
    <div className="admin-orders-container">
      {!selectedCustomer ? (
        <>
          <div className="admin-header">
            <h2>Customer Orders Oversight</h2>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by ID, Name, or Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="customers-list">
            <div className="list-header">
              <span>ID</span>
              <span>Name</span>
              <span>Email</span>
            </div>
            {filteredCustomers.length === 0 ? (
              <div className="no-results">No customers found.</div>
            ) : (
              filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  className="customer-row"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <span>{customer.id}</span>
                  <span>{customer.name}</span>
                  <span>{customer.email}</span>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className="admin-header">
            <h2>Orders for {selectedCustomer.name}</h2>
            <button className="return-btn" onClick={handleReturn}>&larr; Return to Customers</button>
          </div>

          <div className="customer-details-card">
            <p><strong>Email:</strong> {selectedCustomer.email}</p>
            <p><strong>Customer ID:</strong> {selectedCustomer.id}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {ordersLoading ? (
            <div className="admin-loading"><div className="spinner"></div><p>Loading orders...</p></div>
          ) : (
            <div className="customer-orders-list">
              {customerOrders.length === 0 ? (
                <p className="no-orders">This customer has no orders.</p>
              ) : (
                customerOrders.map(order => (
                  <div key={order.id} className="admin-order-card">
                    <div className="order-header">
                      <div>
                        <span className="order-id">Order #{order.id}</span>
                        <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="order-status-total">
                        <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
                        <span className="order-total">${order.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="order-items">
                      {order.items.map(item => (
                        <div key={item.id} className="order-item">
                          <span className="item-name">{item.name}</span>
                          <span className="item-qty">Qty: {item.quantity}</span>
                          <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminOrders;
