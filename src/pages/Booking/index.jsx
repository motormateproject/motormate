import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { createBooking, fetchUserVehicles, fetchGarageServices, fetchGaragesByService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';


// import './Booking.css'; // Keep if custom styles are needed, otherwise remove

const BookingPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Initialize bookingInfo.
  const [bookingInfo, setBookingInfo] = useState(
    state?.bookingDetails ||
    (state?.serviceId ? {
      // Adapting legacy single service state to new structure if needed, 
      // but for now let's just use it to pre-fill available contexts
      serviceId: state.serviceId
    } : null)
  );

  const [vehicles, setVehicles] = useState([]);
  const [availableServices, setAvailableServices] = useState([]); // List of all services in garage
  const [selectedServiceIds, setSelectedServiceIds] = useState([]); // Array of IDs
  const [availableGarages, setAvailableGarages] = useState([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/booking' } });
      return;
    }

    if (!bookingInfo || (!bookingInfo.garageId && !bookingInfo.serviceId)) {
      setError('No booking details found. Please select a garage or a service.');
      setLoading(false);
      return;
    }

    const initData = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Fetch User Vehicles
        const userVehicles = await fetchUserVehicles(user.id);
        setVehicles(userVehicles);
        if (userVehicles.length > 0) {
          setSelectedVehicleId(userVehicles[0].id);
        }

        // 2. Scenario A: Garage known
        if (bookingInfo.garageId) {
          const services = await fetchGarageServices(bookingInfo.garageId);
          setAvailableServices(services);
          // If a service was pre-selected (via "Book Now" on a service card?), select it
          if (bookingInfo.serviceId) {
            setSelectedServiceIds([bookingInfo.serviceId]);
          }
        }
        // 3. Scenario B: Service known, Garage unknown
        else if (bookingInfo.serviceId) {
          const garages = await fetchGaragesByService(bookingInfo.serviceId);
          setAvailableGarages(garages);
          setSelectedServiceIds([bookingInfo.serviceId]); // Pre-select the service
        }

      } catch (err) {
        setError('Failed to load booking data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [user, bookingInfo, navigate]);

  const handleVehicleChange = (e) => {
    setSelectedVehicleId(e.target.value);
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleGarageSelect = async (e) => {
    const garageId = e.target.value;
    if (!garageId) return;

    const garage = availableGarages.find(g => g.id === garageId);
    if (garage) {
      // Update info and fetch services for this garage so user can add more
      setBookingInfo(prev => ({
        ...prev,
        garageId: garage.id,
        garageName: garage.name,
      }));
      setLoading(true);
      try {
        const services = await fetchGarageServices(garage.id);
        setAvailableServices(services);
        // Keep the originally selected service selected
      } catch (e) { console.error(e); }
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  // Calculate Total Price
  const totalPrice = selectedServiceIds.reduce((sum, id) => {
    const s = availableServices.find(service => service.id === id);
    return sum + (s ? Number(s.price) : 0);
  }, 0);

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to book a service.');
      return;
    }
    if (!bookingInfo || !bookingInfo.garageId) {
      setError('Please select a garage.');
      return;
    }
    if (selectedServiceIds.length === 0) {
      setError('Please select at least one service.');
      return;
    }
    if (!selectedVehicleId) {
      setError('Please select a vehicle for the service.');
      return;
    }
    if (!selectedDate || !selectedTime) {
      setError('Please select both a date and time for your booking.');
      return;
    }

    // Validate Date/Time (Prevent Past)
    const now = new Date();
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);

    // Safety buffer of 1 minute
    if (selectedDateTime < now) {
      setError('You cannot book a service in the past. Please select a future date and time.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      // Create a booking for EACH selected service
      const bookingPromises = selectedServiceIds.map(serviceId => {
        const service = availableServices.find(s => s.id === serviceId);
        const newBooking = {
          user_id: user.id,
          garage_id: bookingInfo.garageId,
          service_id: serviceId,
          car_id: selectedVehicleId,
          booking_date: selectedDate,
          booking_time: selectedTime,
          total_amount: service ? service.price : 0,
          status: 'pending',
          notes: ''
        };
        return createBooking(newBooking);
      });

      await Promise.all(bookingPromises);

      setSuccessMessage('Booking(s) confirmed successfully! Redirecting to your bookings...');
      setTimeout(() => navigate('/my-bookings'), 2500);
    } catch (err) {
      setError('Failed to confirm booking. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p>Loading booking details...</p>;
  }

  if (error && (!bookingInfo || (!bookingInfo.garageId && !bookingInfo.serviceId))) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!bookingInfo) {
    return <p>No booking details available.</p>;
  }

  return (
    <div>
      <div className="card">
        <h1 className="page-title">Confirm Your Booking</h1>
        {error && <p style={{ color: 'var(--red-color, red)', fontWeight: 'bold' }}>{error}</p>}
        {successMessage && <p style={{ color: 'var(--green-color, green)', fontWeight: 'bold' }}>{successMessage}</p>}

        <div className="section-spacing">
          <h2 className="section-subtitle">Booking Summary</h2>

          {bookingInfo.garageName ? (
            <p><strong>Garage:</strong> {bookingInfo.garageName}</p>
          ) : (
            <p><strong>Garage:</strong> <em>Please select a garage below</em></p>
          )}

          <p><strong>Total Price:</strong> <span style={{ fontSize: '1.2em', color: 'var(--primary-color)' }}>₹{totalPrice.toFixed(2)}</span></p>
        </div>

        <form onSubmit={handleConfirmBooking}>

          {/* Garage Selection (if not already selected) */}
          {!bookingInfo.garageId && availableGarages.length > 0 && (
            <div className="form-group">
              <label className="form-label" htmlFor="garage-select">Select Garage:</label>
              <select
                id="garage-select"
                className="form-input"
                value={bookingInfo.garageId || ''}
                onChange={handleGarageSelect}
                required
              >
                <option value="">-- Choose a Garage --</option>
                {availableGarages.map(garage => (
                  <option key={garage.id} value={garage.id}>
                    {garage.name} ({garage.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Multiple Service Selection */}
          <div className="form-group">
            <label className="form-label">Select Services:</label>
            {availableServices.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px', marginTop: '5px' }}>
                {availableServices.map(service => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceToggle(service.id)}
                    style={{
                      border: selectedServiceIds.includes(service.id) ? '2px solid var(--primary-color)' : '1px solid #ccc',
                      borderRadius: '8px',
                      padding: '10px',
                      cursor: 'pointer',
                      backgroundColor: selectedServiceIds.includes(service.id) ? 'var(--primary-color-light, #e6f7ff)' : 'white',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{service.name}</span>
                    <span style={{ fontWeight: 'bold' }}>₹{service.price}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No services available for this garage yet.</p>
            )}
            {selectedServiceIds.length === 0 && <small style={{ color: 'red' }}>Please select at least one service.</small>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="vehicle-select">Select Your Vehicle:</label>
            {vehicles.length > 0 ? (
              <select
                id="vehicle-select"
                className="form-input"
                value={selectedVehicleId}
                onChange={handleVehicleChange}
                disabled={submitting}
                required
              >
                <option value="">Select a car</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <p>You don't have any vehicles added yet.</p>
                <Link to="/add-car" className="btn btn-primary">Add a Car</Link>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="booking-date">Select Date:</label>
            <input
              type="date"
              id="booking-date"
              className="form-input"
              value={selectedDate}
              onChange={handleDateChange}
              min={today}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="booking-time">Select Time:</label>
            <input
              type="time"
              id="booking-time"
              className="form-input"
              value={selectedTime}
              onChange={handleTimeChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || selectedServiceIds.length === 0 || !selectedVehicleId || !selectedDate || !selectedTime || !bookingInfo.garageId}
            style={{ marginTop: '20px', width: '100%', fontSize: '1.2rem' }}
          >
            {submitting ? 'Confirming...' : `Confirm Booking • ₹${totalPrice.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;