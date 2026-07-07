import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import './Profile.css';

function Profile({ token }) {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [userRes, statsRes, predsRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/users/${userId}/stats`),
          fetch(`/api/predictions/user/${userId}`),
        ]);

        const userData = await userRes.json();
        const statsData = await statsRes.json();
        const predsData = await predsRes.json();

        setUser(userData);
        setStats(statsData);
        setPredictions(predsData);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

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

  const getChartData = () => {
    return predictions
      .filter((p) => p.resolved)
      .map((p) => ({
        year: p.prediction_year,
        organization: p.organization_name,
        predicted: p.predicted_amount,
        actual: p.actual_amount,
        error: Math.abs(p.predicted_amount - p.actual_amount),
        errorPercent:
          p.actual_amount > 0
            ? ((Math.abs(p.predicted_amount - p.actual_amount) / p.actual_amount) * 100).toFixed(1)
            : 0,
      }))
      .sort((a, b) => a.year - b.year);
  };

  const getAccuracyData = () => {
    const chartData = getChartData();
    const yearGroups = {};

    chartData.forEach((item) => {
      if (!yearGroups[item.year]) {
        yearGroups[item.year] = { year: item.year, totalError: 0, count: 0 };
      }
      yearGroups[item.year].totalError += parseFloat(item.errorPercent);
      yearGroups[item.year].count += 1;
    });

    return Object.values(yearGroups).map((group) => ({
      year: group.year,
      avgErrorPercent: (group.totalError / group.count).toFixed(1),
    }));
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!user) {
    return <div className="error-message">User not found</div>;
  }

  const chartData = getChartData();
  const accuracyData = getAccuracyData();

  return (
    <div className="profile">
      <div className="profile-header">
        <div>
          <h1 className="page-title">{user.username}</h1>
          <p style={{ color: '#888' }}>Member since {formatDate(user.created_at)}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-label">Total Predictions</div>
          <div className="stat-value">{stats.total_predictions || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolved</div>
          <div className="stat-value">{stats.resolved_predictions || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Error</div>
          <div className="stat-value">
            {stats.avg_error ? formatCurrency(stats.avg_error) : '-'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average % Error</div>
          <div className="stat-value">
            {stats.avg_percent_error ? `${stats.avg_percent_error.toFixed(1)}%` : '-'}
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <>
          <div className="card">
            <h2 className="card-title">Prediction Accuracy Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="year" stroke="#888" />
                <YAxis stroke="#888" label={{ value: 'Avg % Error', angle: -90, position: 'insideLeft', fill: '#888' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="avgErrorPercent" fill="#4a9eff" name="Average % Error" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="card-title">Predictions vs Actuals</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="year" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Line type="monotone" dataKey="predicted" stroke="#4a9eff" name="Predicted" />
                <Line type="monotone" dataKey="actual" stroke="#27ae60" name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="card">
        <h2 className="card-title">All Predictions</h2>
        {predictions.length === 0 ? (
          <p className="empty-state">No predictions yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Year</th>
                <th>Predicted</th>
                <th>Actual</th>
                <th>Error</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((pred) => (
                <tr key={pred.id}>
                  <td>
                    <Link to={`/organization/${pred.organization_id}`}>
                      {pred.organization_name}
                    </Link>
                  </td>
                  <td>{pred.prediction_year}</td>
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
                  <td>{formatDate(pred.prediction_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Profile;
