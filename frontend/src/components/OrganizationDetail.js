import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import './OrganizationDetail.css';

function OrganizationDetail({ user, token }) {
  const { id } = useParams();
  const [organization, setOrganization] = useState(null);
  const [grants, setGrants] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPredictionForm, setShowPredictionForm] = useState(false);
  const [predictionYear, setPredictionYear] = useState(new Date().getFullYear() + 1);
  const [predictedAmount, setPredictedAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [orgRes, grantsRes] = await Promise.all([
        fetch(`/api/organizations/${id}`),
        fetch(`/api/organizations/${id}/grants`),
      ]);

      const orgData = await orgRes.json();
      const grantsData = await grantsRes.json();

      setOrganization(orgData);
      setGrants(grantsData);

      if (token) {
        const predsRes = await fetch(`/api/organizations/${id}/predictions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const predsData = await predsRes.json();
        setPredictions(predsData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePredictionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('Please login to make predictions');
      return;
    }

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizationId: id,
          funder: organization.funder,
          predictionYear: parseInt(predictionYear),
          predictedAmount: parseFloat(predictedAmount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Prediction submitted successfully!');
        setPredictedAmount('');
        setShowPredictionForm(false);
        fetchData();
      } else {
        setError(data.error || 'Failed to submit prediction');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!organization) {
    return <div className="error-message">Organization not found</div>;
  }

  return (
    <div className="organization-detail">
      <div className="org-header">
        <div>
          <h1 className="page-title">{organization.name}</h1>
          <span className={`funder-badge funder-${organization.funder.toLowerCase()}`}>
            {organization.funder === 'OP' ? 'Open Philanthropy' :
             organization.funder === 'CG' ? 'Coefficient Giving' :
             organization.funder === 'SFF' ? 'Survival and Flourishing Fund' :
             organization.funder}
          </span>
        </div>
        {user && (
          <button
            className="btn btn-success"
            onClick={() => setShowPredictionForm(!showPredictionForm)}
          >
            {showPredictionForm ? 'Cancel' : 'Make Prediction'}
          </button>
        )}
      </div>

      <div className="org-stats">
        <div className="stat-card">
          <div className="stat-label">Total Funding</div>
          <div className="stat-value">{formatCurrency(organization.total_funding)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Number of Grants</div>
          <div className="stat-value">{organization.grant_count || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Last Grant</div>
          <div className="stat-value">
            {organization.last_grant_date ? formatDate(organization.last_grant_date) : 'Never'}
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showPredictionForm && (
        <div className="card">
          <h2 className="card-title">Make a Prediction</h2>
          <form onSubmit={handlePredictionSubmit}>
            <div className="form-group">
              <label>Prediction Year</label>
              <select
                value={predictionYear}
                onChange={(e) => setPredictionYear(e.target.value)}
                required
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() + i + 1;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
            <div className="form-group">
              <label>Predicted Amount (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={predictedAmount}
                onChange={(e) => setPredictedAmount(e.target.value)}
                placeholder="Enter predicted grant amount"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Submit Prediction</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Grant History</h2>
        {grants.length === 0 ? (
          <p className="empty-state">No grants recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Year</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => (
                <tr key={grant.id}>
                  <td>{formatDate(grant.grant_date)}</td>
                  <td>{grant.grant_year}</td>
                  <td className="amount">{formatCurrency(grant.amount)}</td>
                  <td>{grant.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {token && (
        <div className="card">
          <h2 className="card-title">Community Predictions</h2>
          {predictions.length === 0 ? (
            <p className="empty-state">No predictions yet. Be the first to predict!</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Year</th>
                  <th>Predicted</th>
                  <th>Actual</th>
                  <th>Status</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred) => (
                  <tr key={pred.id}>
                    <td>
                      <Link to={`/profile/${pred.user_id}`}>{pred.username}</Link>
                    </td>
                    <td>{pred.prediction_year}</td>
                    <td className="amount">{formatCurrency(pred.predicted_amount)}</td>
                    <td className="amount">
                      {pred.resolved ? formatCurrency(pred.actual_amount) : '-'}
                    </td>
                    <td>
                      <span className={pred.resolved ? 'resolved' : 'pending'}>
                        {pred.resolved ? 'Resolved' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {pred.resolved && pred.actual_amount !== null ? (
                        <span className={pred.predicted_amount > pred.actual_amount ? 'negative' : pred.predicted_amount < pred.actual_amount ? 'positive' : 'neutral'}>
                          {formatCurrency(Math.abs(pred.predicted_amount - pred.actual_amount))}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default OrganizationDetail;
