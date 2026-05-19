import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Market.css';

function Market({ user, token }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [funderFilter, setFunderFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, [funderFilter, searchTerm]);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (funderFilter) params.append('funder', funderFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/organizations?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
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
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="market">
      <h1 className="page-title">Grant Market</h1>

      <div className="market-filters">
        <div className="filter-group">
          <label>Funder</label>
          <select value={funderFilter} onChange={(e) => setFunderFilter(e.target.value)}>
            <option value="">All Funders</option>
            <option value="CG">Coefficient Giving</option>
            <option value="SFF">Survival and Flourishing Fund</option>
            <option value="Manifund">Manifund</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading organizations...</div>
      ) : organizations.length === 0 ? (
        <div className="empty-state">
          <p>No organizations found. Try adjusting your filters or run the scrapers to populate data.</p>
        </div>
      ) : (
        <div className="market-table-container">
          <table className="market-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Funder</th>
                <th>Total Funding</th>
                <th>Grants</th>
                <th>Last Grant</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td>
                    <Link to={`/organization/${org.id}`} className="org-name">
                      {org.name}
                    </Link>
                  </td>
                  <td>
                    <span className={`funder-badge funder-${org.funder.toLowerCase()}`}>
                      {org.funder === 'OP' ? 'Open Phil' :
                       org.funder === 'CG' ? 'Coefficient' :
                       org.funder === 'SFF' ? 'SFF' :
                       org.funder}
                    </span>
                  </td>
                  <td className="amount">{formatCurrency(org.total_funding)}</td>
                  <td>{org.grant_count || 0}</td>
                  <td>{formatDate(org.last_grant_date)}</td>
                  <td>
                    <Link to={`/organization/${org.id}`} className="btn btn-primary btn-sm">
                      View / Predict
                    </Link>
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

export default Market;
