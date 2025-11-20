import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchOwnerGarage, fetchGarageBookings } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, Calendar, CheckCircle, Clock, MapPin, Phone, Mail, Edit } from 'feather-icons-react';
import './AdminDashboard.css';

const AdminDashboardPage = () => {
  const { user, profile } = useAuth();
  const [garage, setGarage] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getOwnerData = async () => {
      if (!user || !profile || profile.role !== 'garage_owner') {
        setLoading(false);
        setError('You are not authorized to view this page.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const ownerGarage = await fetchOwnerGarage(user.id);
        setGarage(ownerGarage);

        if (ownerGarage) {
          const garageBookings = await fetchGarageBookings(ownerGarage.id);
          setBookings(garageBookings);
        }
      } catch (err) {
        console.error('Error fetching owner data:', err);
        setError('Failed to load garage data.');
      } finally {
        setLoading(false);
      }
    };

    getOwnerData();
  }, [user, profile]);

  if (loading) return <div className="loading-screen">Loading dashboard...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!profile || profile.role !== 'garage_owner') return <div className="error-message">Access Denied</div>;

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const totalBookings = bookings.length;

  // Calculate Revenue (Confirmed + Completed)
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Garage Dashboard</h1>
          <p className="welcome-text">Welcome back, {profile.full_name || user.email}</p>
        </div>
        <div className="date-display">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </header>

      {garage ? (
        <>
          {/* Stats Grid */}
          <div className="dashboard-grid">
            {/* Revenue Card */}
            <div className="stat-card revenue">
              <div className="stat-header">
                <span className="stat-label">Total Revenue</span>
                <DollarSign className="stat-icon" size={24} />
              </div>
              <div className="stat-value">₹{totalRevenue.toLocaleString()}</div>
              <div className="stat-subtext">From {confirmedBookings + completedBookings} confirmed services</div>
            </div>

            {/* Total Bookings */}
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Total Bookings</span>
                <Calendar className="stat-icon" size={24} />
              </div>
              <div className="stat-value">{totalBookings}</div>
              <div className="stat-subtext">All time</div>
            </div>

            {/* Pending */}
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Pending</span>
                <Clock className="stat-icon" size={24} color="#f59e0b" />
              </div>
              <div className="stat-value">{pendingBookings}</div>
              <div className="stat-subtext">Requires action</div>
            </div>

            {/* Completed */}
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Completed</span>
                <CheckCircle className="stat-icon" size={24} color="#10b981" />
              </div>
              <div className="stat-value">{completedBookings}</div>
              <div className="stat-subtext">Successfully served</div>
            </div>
          </div>

          {/* Garage Profile Section */}
          <div className="garage-profile-card">
            <div className="garage-image-container">
              {garage.image_url ? (
                <img src={garage.image_url} alt={garage.name} className="garage-image" />
              ) : (
                <div className="garage-placeholder">No Image</div>
              )}
            </div>
            <div className="garage-info">
              <h2>{garage.name}</h2>
              <div className="garage-details-grid">
                <div className="detail-item">
                  <MapPin size={18} />
                  <span>{garage.address}, {garage.city}</span>
                </div>
                <div className="detail-item">
                  <Phone size={18} />
                  <span>{garage.phone_number || 'No phone added'}</span>
                </div>
                <div className="detail-item">
                  <Mail size={18} />
                  <span>{garage.email || 'No email added'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="action-bar">
            <Link to="/admin/bookings" className="action-btn btn-primary">
              <Calendar size={18} />
              Manage Bookings
            </Link>
            <Link to="/admin/profile" className="action-btn btn-secondary">
              <Edit size={18} />
              Edit Garage Profile
            </Link>
          </div>
        </>
      ) : (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <h2>Setup Your Garage</h2>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>You haven't registered your garage yet. Create your profile to start accepting bookings.</p>
          <Link to="/admin/profile" className="action-btn btn-primary">Register Garage</Link>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;