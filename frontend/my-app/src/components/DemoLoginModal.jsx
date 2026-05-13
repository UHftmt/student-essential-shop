import React, { useState } from 'react';
import { getApiUrl } from '../utils/api';
import './DemoLoginModal.css';

function DemoLoginModal({ onClose, onLoginSuccess }) {
  const [code, setCode] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'admin', label: '🛡️ Admin', desc: 'Full access' },
    { value: 'cashier', label: '💳 Cashier', desc: 'POS access' },
    { value: 'customer', label: '🛒 Customer', desc: 'Shop & order' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/auth/demo_login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo_code: code, role: selectedRole }),
      });

      const data = await res.json();

      if (res.ok) {
        onLoginSuccess(data.user, data.token);
        onClose();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="demo-modal-overlay" onClick={onClose}>
      <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
        <button className="demo-modal-close" onClick={onClose}>✕</button>
        <h2 className="demo-modal-title">Demo Login</h2>
        <p className="demo-modal-subtitle">Enter the demo code to test the app</p>

        <form onSubmit={handleSubmit}>
          <div className="demo-roles">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                className={`demo-role-btn ${selectedRole === role.value ? 'active' : ''}`}
                onClick={() => setSelectedRole(role.value)}
              >
                <span className="demo-role-icon">{role.label}</span>
                <span className="demo-role-desc">{role.desc}</span>
              </button>
            ))}
          </div>

          <input
            type="password"
            className="demo-code-input"
            placeholder="Enter demo code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />

          {error && <p className="demo-error">{error}</p>}

          <button
            type="submit"
            className="demo-submit-btn"
            disabled={loading || !code.trim()}
          >
            {loading ? 'Logging in...' : `Log in as ${selectedRole}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default DemoLoginModal;
