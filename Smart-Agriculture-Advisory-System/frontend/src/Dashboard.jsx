import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function Dashboard() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [farms, setFarms] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch regional stats
      const statsResponse = await fetch(`${API_BASE_URL}/dashboard/regional-stats?district=Kaira`);
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const stats = await statsResponse.json();
      setDashboardStats(stats);

      // Fetch farms
      const farmsResponse = await fetch(`${API_BASE_URL}/dashboard/farms?district=Kaira&limit=50`);
      if (!farmsResponse.ok) throw new Error('Failed to fetch farms');
      const farmsData = await farmsResponse.json();
      setFarms(farmsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFarmSelect = (farm) => {
    setSelectedFarm(selectedFarm?.id === farm.id ? null : farm);
  };

  if (loading) return <div className="loading"></div>;

  return (
    <div>
      <header>
        <h1>🌾 Smart Agriculture Advisory System</h1>
        <p>Agrometeorological guidance for smallholder farmers</p>
      </header>

      <div className="container">
        {error && <div className="error-message">Error: {error}</div>}

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardStats && (
          <div>
            <div className="dashboard-grid">
              <div className="card">
                <h3>📊 Total Farms</h3>
                <div className="stat-value">{dashboardStats.total_farms}</div>
                <div className="stat-label">Active advisory region</div>
              </div>

              <div className="card">
                <h3>👨‍🌾 Total Farmers</h3>
                <div className="stat-value">{dashboardStats.total_farmers}</div>
                <div className="stat-label">Registered users</div>
              </div>

              <div className="card">
                <h3>📢 Active Advisories</h3>
                <div className="stat-value">{dashboardStats.active_advisories_count}</div>
                <div className="stat-label">Last 7 days</div>
              </div>

              <div className="card">
                <h3>📈 Engagement Rate</h3>
                <div className="stat-value">{dashboardStats.avg_engagement_rate}%</div>
                <div className="stat-label">Farmer interaction</div>
              </div>
            </div>

            {/* Advisory Type Distribution */}
            <div className="card">
              <h3>📋 Advisories by Type</h3>
              <div style={{ marginTop: '15px' }}>
                {Object.entries(dashboardStats.advisory_type_distribution || {}).map(([type, count]) => (
                  <div key={type} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Farms List Tab */}
        {activeTab === 'farms' && (
          <div>
            <div className="card">
              <h3>Farm Directory</h3>
              <div className="advisory-list" style={{ marginTop: '15px' }}>
                {farms.map((farm) => (
                  <div key={farm.id} className="advisory-item" onClick={() => handleFarmSelect(farm)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <strong>{farm.farm_name}</strong>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          🌾 {farm.crop_name} | 📍 {farm.village} | 📐 {farm.area_hectares} ha
                        </div>
                      </div>
                      {farm.last_advisory && (
                        <span className="advisory-type">{farm.last_advisory.advisory_type}</span>
                      )}
                    </div>

                    {selectedFarm?.id === farm.id && farm.last_advisory && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                        <strong>Latest Advisory:</strong>
                        <div className="advisory-message">{farm.last_advisory.message}</div>
                        <div className="advisory-confidence">
                          Confidence: {(farm.last_advisory.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Farmer Registration Tab */}
        {activeTab === 'register' && (
          <FarmerRegistrationForm onSuccess={() => { setActiveTab('farms'); fetchDashboardData(); }} />
        )}

        {/* Tabs */}
        <div style={{ marginTop: '30px', display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <button onClick={() => setActiveTab('overview')} style={{ background: activeTab === 'overview' ? '#2d7c3e' : '#ccc' }}>
            📊 Overview
          </button>
          <button onClick={() => setActiveTab('farms')} style={{ background: activeTab === 'farms' ? '#2d7c3e' : '#ccc' }}>
            🌾 Farms
          </button>
          <button onClick={() => setActiveTab('register')} style={{ background: activeTab === 'register' ? '#2d7c3e' : '#ccc' }}>
            ➕ Register Farmer
          </button>
        </div>
      </div>
    </div>
  );
}

function FarmerRegistrationForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    village: '',
    district: 'Kaira',
    state: 'Gujarat',
    latitude: '',
    longitude: '',
    crop_name: 'Rice',
    sowing_date: '',
    area_hectares: '',
    consented_advisory: false,
    consented_data_use: false,
  });

  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      setMessage({ type: 'success', text: 'Farmer registered successfully!' });
      setTimeout(onSuccess, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="form-section">
      <h2>Register New Farmer</h2>
      {message && (
        <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" placeholder="+919876543210" value={formData.phone} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" placeholder="Farmer Name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Village</label>
            <input type="text" name="village" placeholder="Village Name" value={formData.village} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Crop</label>
            <select name="crop_name" value={formData.crop_name} onChange={handleChange}>
              <option value="Rice">Rice</option>
              <option value="Wheat">Wheat</option>
              <option value="Maize">Maize</option>
              <option value="Cotton">Cotton</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sowing Date</label>
            <input type="date" name="sowing_date" value={formData.sowing_date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Area (hectares)</label>
            <input type="number" name="area_hectares" placeholder="1.5" step="0.5" value={formData.area_hectares} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Latitude</label>
            <input type="number" name="latitude" placeholder="22.3707" step="0.0001" value={formData.latitude} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Longitude</label>
            <input type="number" name="longitude" placeholder="72.3694" step="0.0001" value={formData.longitude} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>
            <input type="checkbox" name="consented_advisory" checked={formData.consented_advisory} onChange={handleChange} required />
            {' '}I consent to receive advisories via SMS
          </label>
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" name="consented_data_use" checked={formData.consented_data_use} onChange={handleChange} required />
            {' '}I consent to data use for improving advisories
          </label>
        </div>

        <button type="submit">Register Farmer</button>
      </form>
    </div>
  );
}

export default Dashboard;
