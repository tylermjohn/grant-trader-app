import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onRegister(data.token, data.user);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="card" style={{ maxWidth: '400px', margin: '40px auto' }}>
        <h2 className="card-title">Register</h2>
        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(241, 196, 15, 0.1)',
          border: '1px solid #f1c40f',
          borderRadius: '4px',
          marginBottom: '15px',
          color: '#f1c40f',
          fontSize: '0.9rem'
        }}>
          ⚠️ <strong>Security Notice:</strong> Do not reuse passwords. This is a demo application and passwords are not encrypted to production standards.
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Register
          </button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center', color: '#888' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
