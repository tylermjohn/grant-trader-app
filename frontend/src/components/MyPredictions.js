import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './MyPredictions.css';

function MyPredictions({ token }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/predictions/my-predictions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setPredictions(data);
    } catch (err) {
      console.error('Error fetching predictions:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const handleDelete = async (predictionId) => {
    if (!window.confirm('Are you sure you want to delete this prediction?')) {
      return;
    }

    try {
      const response = await fetch(`/api/predictions/${predictionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchPredictions();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete prediction');
      }
    } catch (err) {
      alert('Network error. Please try again.');
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

  const filteredPredictions = predictions.filter((pred) => {
    if (filterStatus === 'resolved') return pred.resolved;
    if (filterStatus === 'pending') return !pred.resolved;
    return true;
  });

  const groupedByYear = filteredPredictions.reduce((acc, pred) => {
    const year = pred.prediction_year;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(pred);
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">Loading predictions...</div>;
  }

  return (
    <div className="my-predictions">
      <h1 className="page-title">My Predictions</h1>

      <div className="predictions-filters">
        <button
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All ({predictions.length})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          Pending ({predictions.filter(p => !p.resolved).length})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'resolved' ? 'active' : ''}`}
          onClick={() => setFilterStatus('resolved')}
        >
          Resolved ({predictions.filter(p => p.resolved).length})
        </button>
      </div>

      {filteredPredictions.length === 0 ? (
        <div className="empty-state">
          <p>No predictions found. Visit the market to make predictions!</p>
          <Link to="/" className="btn btn-primary">Go to Market</Link>
        </div>
      ) : (
        Object.keys(groupedByYear)
          .sort((a, b) => b - a)
          .map((year) => (
            <div key={year} className="card">
              <h2 className="card-title">{year} Predictions</h2>
              <table>
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Funder</th>
                    <th>Predicted</th>
                    <th>Actual</th>
                    <th>Error</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByYear[year].map((pred) => (
                    <tr key={pred.id}>
                      <td>
                        <Link to={`/organization/${pred.organization_id}`}>
                          {pred.organization_name}
                        </Link>
                      </td>
                      <td>
                        <span className={`funder-badge funder-${pred.funder.toLowerCase()}`}>
                          {pred.funder === 'OP' ? 'Open Phil' : pred.funder === 'CG' ? 'Coefficient' : 'SFF'}
                        </span>
                      </td>
                      <td className="amount">{formatCurrency(pred.predicted_amount)}</td>
                      <td className="amount">
                        {pred.resolved ? formatCurrency(pred.actual_amount) : '-'}
                      </td>
                      <td>
                        {pred.resolved && pred.actual_amount !== null ? (
                          <>
                            <div className={pred.predicted_amount > pred.actual_amount ? 'negative' : pred.predicted_amount < pred.actual_amount ? 'positive' : 'neutral'}>
                              {formatCurrency(Math.abs(pred.predicted_amount - pred.actual_amount))}
                            </div>
                            {pred.actual_amount > 0 && (
                              <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                ({((Math.abs(pred.predicted_amount - pred.actual_amount) / pred.actual_amount) * 100).toFixed(1)}%)
                              </div>
                            )}
                          </>
                        ) : '-'}
                      </td>
                      <td>
                        <span className={pred.resolved ? 'resolved' : 'pending'}>
                          {pred.resolved ? 'Resolved' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        {!pred.resolved && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(pred.id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
      )}
    </div>
  );
}

export default MyPredictions;
