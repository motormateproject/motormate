import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { fetchUserBookings, updateBookingStatus } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import {
  createBookingEvent,
  generateICS,
  downloadICS,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL
} from '../../lib/calendarUtils';
import './MyBookings.css';
import moment from 'moment';
import { Calendar, CheckCircle, Clock, MapPin, Inbox, XCircle } from 'feather-icons-react';

const MyBookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCalendarDropdown, setOpenCalendarDropdown] = useState(null);

  useEffect(() => {
    const getBookings = async () => {
      if (user) {
        setLoading(true);
        setError('');
        try {
          const userBookings = await fetchUserBookings(user.id);
          setBookings(userBookings);
        } catch (err) {
          console.error('Error fetching bookings:', err);
          setError('Failed to fetch your bookings.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError('Please log in to view your bookings.');
      }
    };

    getBookings();
  }, [user]);

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await updateBookingStatus(bookingId, 'cancelled');
        // Refresh bookings list locally
        setBookings(prevBookings =>
          prevBookings.map(b =>
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
          )
        );
      } catch (err) {
        console.error('Error cancelling booking:', err);
        alert('Failed to cancel booking. Please try again.');
      }
    }
  };

  const handleAddToCalendar = (booking, type) => {
    const event = createBookingEvent(booking);

    switch (type) {
      case 'google':
        window.open(generateGoogleCalendarURL(event), '_blank');
        break;
      case 'outlook':
        window.open(generateOutlookCalendarURL(event), '_blank');
        break;
      case 'ics':
        const icsContent = generateICS(event);
        downloadICS(icsContent, `booking-${booking.id}.ics`);
        break;
      default:
        break;
    }

    setOpenCalendarDropdown(null);
  };

  const StatusBadge = ({ status }) => (
    <span className={`booking-status status-${status?.toLowerCase()}`}>
      {status}
    </span>
  );

  if (loading) {
    return <div className="loading-text">Loading your bookings...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div>
      <h1 className="page-title">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="empty-bookings">
          <Inbox className="empty-bookings-icon" size={48} />
          <h2>No Bookings Yet</h2>
          <p>You haven't scheduled any services. Ready to get started?</p>
          <Link to="/search" className="btn btn-primary">Find a Garage</Link>
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-card-header">
                <h2 className="booking-service-name">{booking.services?.name || 'Service'}</h2>
                <StatusBadge status={booking.status} />
              </div>

              <div className="booking-detail">
                <Calendar className="booking-detail-icon" size={20} />
                <div className="booking-detail-info">
                  <strong>{new Date(booking.booking_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </div>
              </div>

              <div className="booking-detail">
                <Clock className="booking-detail-icon" size={20} />
                <div className="booking-detail-info">
                  <strong>
                    {booking.booking_time ? moment(booking.booking_time, 'HH:mm:ss').format('hh:mm A') : 'N/A'}
                  </strong>
                </div>
              </div>

              <div className="booking-detail">
                <MapPin className="booking-detail-icon" size={20} />
                <div className="booking-detail-info">
                  <strong>{booking.garages?.name || 'N/A'}</strong>
                  <span> ({booking.garages?.address || 'N/A'})</span>
                </div>
              </div>

              {booking.cars && (
                <div className="booking-detail">
                  <Inbox className="booking-detail-icon" size={20} /> {/* Reusing Inbox icon for car */}
                  <div className="booking-detail-info">
                    <strong>{booking.cars.make} {booking.cars.model}</strong>
                    <span> ({booking.cars.license_plate})</span>
                  </div>
                </div>
              )}

              {/* Add to Calendar Button */}
              {booking.status !== 'cancelled' && (
                <div style={{ marginTop: '15px', position: 'relative' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setOpenCalendarDropdown(openCalendarDropdown === booking.id ? null : booking.id)}
                    style={{
                      backgroundColor: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      width: '100%',
                      marginBottom: '10px'
                    }}
                  >
                    <Calendar size={16} /> Add to Calendar
                  </button>

                  {/* Calendar Dropdown */}
                  {openCalendarDropdown === booking.id && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      marginBottom: '8px',
                      zIndex: 10,
                      overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => handleAddToCalendar(booking, 'google')}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'white',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          borderBottom: '1px solid var(--border-color)'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        📅 Google Calendar
                      </button>
                      <button
                        onClick={() => handleAddToCalendar(booking, 'outlook')}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'white',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          borderBottom: '1px solid var(--border-color)'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        📆 Outlook Calendar
                      </button>
                      <button
                        onClick={() => handleAddToCalendar(booking, 'ics')}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'white',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        💾 Download .ics File
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancelBooking(booking.id)}
                    style={{
                      backgroundColor: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      width: '100%'
                    }}
                  >
                    <XCircle size={16} /> Cancel Booking
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;