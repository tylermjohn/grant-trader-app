import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SubmitOrganization() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [funder, setFunder] = useState('User');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const navigate = useNavigate();

  // Check for duplicates as user types
  const checkDuplicates = async (orgName) => {
    if (!orgName || orgName.length < 3) {
      setDuplicates([]);
      return;
    }

    setCheckingDuplicates(true);
    try {
      const response = await fetch(`/api/organizations/check-duplicates/${encodeURIComponent(orgName)}`);
      if (response.ok) {
        const data = await response.json();
        setDuplicates(data);
      }
    } catch (err) {
      console.error('Error checking duplicates:', err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    checkDuplicates(newName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to submit an organization');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          website,
          funder
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit organization');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate(`/organizations/${data.id}`);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '40px auto' }}>
      <div className="card">
        <h2 className="card-title">Submit Organization</h2>

        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          border: '1px solid #3498db',
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#3498db',
          fontSize: '0.9rem'
        }}>
          ℹ️ Submit organizations you'd like to track and make predictions about.
          Your submission will be visible to all users.
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '15px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            border: '1px solid #2ecc71',
            borderRadius: '4px',
            marginBottom: '15px',
            color: '#2ecc71'
          }}>
            ✓ Organization submitted successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Organization Name *</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g., AI Safety Institute"
              required
            />
            {checkingDuplicates && (
              <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                Checking for similar organizations...
              </small>
            )}
          </div>

          {duplicates.length > 0 && (
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(241, 196, 15, 0.1)',
              border: '1px solid #f1c40f',
              borderRadius: '4px',
              marginBottom: '15px',
              color: '#f1c40f',
              fontSize: '0.9rem'
            }}>
              <strong>⚠️ Similar organizations found:</strong>
              <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
                {duplicates.map((dup) => (
                  <li key={dup.id} style={{ marginTop: '4px' }}>
                    <a
                      href={`/organizations/${dup.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#f1c40f', textDecoration: 'underline' }}
                    >
                      {dup.name}
                    </a>
                    {' '}({dup.funder}) - {Math.round(dup.similarity * 100)}% match
                  </li>
                ))}
              </ul>
              <small style={{ display: 'block', marginTop: '8px' }}>
                Please check if one of these is the organization you want to add.
              </small>
            </div>
          )}

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this organization do?"
              rows="4"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#e0e0e0',
                fontSize: '1rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div className="form-group">
            <label>Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.org"
            />
          </div>

          <div className="form-group">
            <label>Expected Funder *</label>
            <select
              value={funder}
              onChange={(e) => setFunder(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#e0e0e0',
                fontSize: '1rem'
              }}
              required
            >
              <option value="User">User Submitted (General)</option>
              <option value="CG">Coefficient Giving</option>
              <option value="SFF">Survival and Flourishing Fund</option>
              <option value="Manifund">Manifund</option>
            </select>
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
              Which grantmaker do you think might fund this organization?
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '10px'
            }}
          >
            {loading ? 'Submitting...' : 'Submit Organization'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/market')}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '10px',
              backgroundColor: '#333',
              border: '1px solid #444'
            }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default SubmitOrganization;
