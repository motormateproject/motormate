import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { fetchOwnerGarage, fetchGarageBookings, updateBookingStatus } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import moment from 'moment';
import './AdminBookings.css'; // Import the new CSS file

const AdminBookingsPage = () => {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [garage, setGarage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getGarageAndBookings = async () => {
      if (!user || !profile || profile.role !== 'garage_owner') { // Check role
        setLoading(false);
        setError('You are not authorized to view this page.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const ownerGarage = await fetchOwnerGarage(user.id);
        if (!ownerGarage) {
          setError('No garage found for your account. Please set up your garage profile.');
          setLoading(false);
          return;
        }
        setGarage(ownerGarage);

        const garageBookings = await fetchGarageBookings(ownerGarage.id);
        setBookings(garageBookings);

      } catch (err) {
        console.error('Error fetching garage or bookings:', err);
        setError('Failed to load bookings data.');
      } finally {
        setLoading(false);
      }
    };

    getGarageAndBookings();
  }, [user, profile]);

  const handleStatusChange = async (bookingId, newStatus) => {
    setError('');
    try {
      await updateBookingStatus(bookingId, newStatus);
      // Re-fetch to ensure everything is in sync
      const updatedBookings = await fetchGarageBookings(garage.id);
      setBookings(updatedBookings);
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('Failed to update booking status.');
    }
  };

  if (loading) {
    return <p>Loading bookings...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!garage) {
    return (
      <div>
        <p className="error-message">No garage found for your account. Please set up your garage profile.</p>
        <Link to="/admin/profile" className="btn btn-primary">Set Up Garage Profile</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Manage Bookings for {garage.name}</h1>
      {bookings.length === 0 ? (
        <p>No bookings found for your garage.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="bookings-table">
            <thead>
              <tr>
                <th className="bookings-th">Customer</th>
                <th className="bookings-th">Contact</th>
                <th className="bookings-th">Service</th>
                <th className="bookings-th">Date</th>
                <th className="bookings-th">Status</th>
                <th className="bookings-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td className="bookings-td" data-label="Customer">
                    <div className="customer-info">
                      <span className="customer-name">{booking.users?.full_name || 'N/A'}</span>
                      <span className="customer-email-mobile">{booking.users?.email}</span>
                    </div>
                  </td>
                  <td className="bookings-td" data-label="Contact">
                    {booking.users?.phone || 'N/A'}
                  </td>
                  <td className="bookings-td" data-label="Service">
                    <div className="service-info">
                      <span className="service-name">{booking.services?.name || 'N/A'}</span>
                      <span className="service-price">₹{booking.total_amount}</span>
                    </div>
                  </td>
                  <td className="bookings-td" data-label="Date">
                    {new Date(booking.booking_date).toLocaleDateString()}
                    <br />
                    <span className="time-label">{booking.booking_time ? moment(booking.booking_time, 'HH:mm:ss').format('hh:mm A') : ''}</span>
                  </td>
                  <td className="bookings-td" data-label="Status">
                    <span className={`booking-status status-${booking.status?.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="bookings-td" data-label="Actions">
                    <select
                      value={booking.status}
                      onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                      className="form-input status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;