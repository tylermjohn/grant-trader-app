import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Market.css';

function Admin({ token }) {
  const [mergeSourceIds, setMergeSourceIds] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [splitOrgId, setSplitOrgId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!token) {
    return (
      <div className="container" style={{ maxWidth: '800px', margin: '40px auto' }}>
        <h1>Admin Tools</h1>
        <p>Please login to access admin tools.</p>
      </div>
    );
  }

  const handleMerge = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const sourceIds = mergeSourceIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      const targetId = parseInt(mergeTargetId.trim());

      if (sourceIds.length === 0 || isNaN(targetId)) {
        setError('Invalid organization IDs');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/organizations/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sourceIds, targetId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to merge organizations');
      }

      setMessage(`Successfully merged organizations into ID ${data.targetId}`);
      setMergeSourceIds('');
      setMergeTargetId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSplit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(false);

    try {
      const orgId = parseInt(splitOrgId.trim());

      if (isNaN(orgId)) {
        setError('Invalid organization ID');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/organizations/${orgId}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ splitBy: 'funder' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to split organization');
      }

      setMessage(`Successfully split organization. New org IDs: ${Object.values(data.newOrganizations).join(', ')}`);
      setSplitOrgId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '40px auto' }}>
      <h1 className="page-title">Admin Tools</h1>

      {message && (
        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          border: '1px solid #2ecc71',
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#2ecc71'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '30px' }}>
        <h2 className="card-title">Merge Organizations</h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          Merge multiple organizations into one. All grants, predictions, and funders will be combined.
        </p>

        <form onSubmit={handleMerge}>
          <div className="form-group">
            <label>Source Organization IDs (comma-separated)</label>
            <input
              type="text"
              value={mergeSourceIds}
              onChange={(e) => setMergeSourceIds(e.target.value)}
              placeholder="e.g., 123, 456, 789"
              required
            />
            <small style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginTop: '5px' }}>
              These organizations will be merged and deleted
            </small>
          </div>

          <div className="form-group">
            <label>Target Organization ID</label>
            <input
              type="text"
              value={mergeTargetId}
              onChange={(e) => setMergeTargetId(e.target.value)}
              placeholder="e.g., 100"
              required
            />
            <small style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginTop: '5px' }}>
              All data will be merged into this organization
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Merging...' : 'Merge Organizations'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="card-title">Split Organization by Funder</h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          Split an organization that has grants from multiple funders into separate organizations per funder.
        </p>

        <form onSubmit={handleSplit}>
          <div className="form-group">
            <label>Organization ID to Split</label>
            <input
              type="text"
              value={splitOrgId}
              onChange={(e) => setSplitOrgId(e.target.value)}
              placeholder="e.g., 100"
              required
            />
            <small style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginTop: '5px' }}>
              This organization will be split into separate orgs for each funder
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Splitting...' : 'Split Organization'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '4px', border: '1px solid #333' }}>
        <h3 style={{ marginTop: 0, color: '#e0e0e0' }}>How to Find Organization IDs</h3>
        <ol style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.6' }}>
          <li>Go to the <a href="/market" style={{ color: '#3498db' }}>Market</a> page</li>
          <li>Click on an organization to view its details</li>
          <li>The organization ID is in the URL: <code style={{ backgroundColor: '#0a0a0a', padding: '2px 6px', borderRadius: '3px', color: '#2ecc71' }}>/organization/[ID]</code></li>
        </ol>
      </div>
    </div>
  );
}

export default Admin;
