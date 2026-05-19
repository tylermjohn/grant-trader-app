import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import Market from './components/Market';
import OrganizationDetail from './components/OrganizationDetail';
import Profile from './components/Profile';
import MyPredictions from './components/MyPredictions';
import SubmitOrganization from './components/SubmitOrganization';
import UserSubmitted from './components/UserSubmitted';
import Admin from './components/Admin';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Invalid token');
        })
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        });
    }
  }, [token]);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <Header user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route
              path="/login"
              element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />}
            />
            <Route
              path="/register"
              element={!user ? <Register onRegister={handleLogin} /> : <Navigate to="/" />}
            />
            <Route path="/" element={<Market user={user} token={token} />} />
            <Route
              path="/organization/:id"
              element={<OrganizationDetail user={user} token={token} />}
            />
            <Route
              path="/profile/:userId"
              element={<Profile token={token} />}
            />
            <Route
              path="/my-predictions"
              element={user ? <MyPredictions token={token} /> : <Navigate to="/login" />}
            />
            <Route
              path="/submit-organization"
              element={user ? <SubmitOrganization /> : <Navigate to="/login" />}
            />
            <Route
              path="/user-submitted"
              element={user ? <UserSubmitted /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin"
              element={<Admin token={token} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
