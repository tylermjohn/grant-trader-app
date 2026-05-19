import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header({ user, onLogout }) {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>Grant Trader</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Market</Link>
          {user && <Link to="/user-submitted" className="nav-link">User Submitted</Link>}
          {user && <Link to="/admin" className="nav-link">Admin</Link>}
          {user ? (
            <>
              <Link to="/my-predictions" className="nav-link">My Predictions</Link>
              <Link to={`/profile/${user.id}`} className="nav-link">Profile</Link>
              <button onClick={onLogout} className="btn btn-secondary">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
