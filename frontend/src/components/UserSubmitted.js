import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function UserSubmitted() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserOrganizations();
  }, []);

  const fetchUserOrganizations = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    if (!token) {
      setError('You must be logged in to view user-submitted organizations');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/organizations/user-submitted/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="container">Loading user-submitted organizations...</div>;
  }

  return (
    <div className="container">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>User-Submitted Organizations</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/submit-organization')}
        >
          + Submit Organization
        </button>
      </div>

      <div style={{
        padding: '12px',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        border: '1px solid #3498db',
        borderRadius: '4px',
        marginBottom: '20px',
        color: '#3498db',
        fontSize: '0.9rem'
      }}>
        ℹ️ These organizations have been submitted by users. You can make predictions about them just like any other organization!
      </div>

      {error && <div className="error-message">{error}</div>}

      {organizations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#888', marginBottom: '20px' }}>
            No user-submitted organizations yet. Be the first to submit one!
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/submit-organization')}
          >
            Submit Organization
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Expected Funder</th>
                <th>Submitted By</th>
                <th>Grants</th>
                <th>Total Funding</th>
                <th>Last Grant</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td>
                    <Link
                      to={`/organizations/${org.id}`}
                      style={{ color: '#3498db', textDecoration: 'none' }}
                    >
                      {org.name}
                    </Link>
                    {org.description && (
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#888',
                        marginTop: '4px'
                      }}>
                        {org.description.substring(0, 100)}
                        {org.description.length > 100 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      backgroundColor: org.funder === 'OP' ? 'rgba(46, 204, 113, 0.2)' :
                                     org.funder === 'SFF' ? 'rgba(52, 152, 219, 0.2)' :
                                     org.funder === 'Manifund' ? 'rgba(155, 89, 182, 0.2)' :
                                     'rgba(149, 165, 166, 0.2)',
                      color: org.funder === 'OP' ? '#2ecc71' :
                            org.funder === 'SFF' ? '#3498db' :
                            org.funder === 'Manifund' ? '#9b59b6' :
                            '#95a5a6'
                    }}>
                      {org.funder === 'User' ? 'General' : org.funder}
                    </span>
                  </td>
                  <td>{org.submitted_by_username || 'Unknown'}</td>
                  <td>{org.grant_count || 0}</td>
                  <td>{formatCurrency(org.total_funding)}</td>
                  <td>{formatDate(org.last_grant_date)}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/predict/${org.id}`)}
                      style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                    >
                      Predict
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserSubmitted;
