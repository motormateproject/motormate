import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { createBooking, fetchUserVehicles, fetchGarageServices, fetchGaragesByService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';


// import './Booking.css'; // Keep if custom styles are needed, otherwise remove

const BookingPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Initialize bookingInfo. If state has bookingDetails, use it. 
  // If state has serviceId (from ChooseService), use it.
  const [bookingInfo, setBookingInfo] = useState(
    state?.bookingDetails ||
    (state?.serviceId ? { serviceId: state.serviceId } : null)
  );

  const [vehicles, setVehicles] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [availableGarages, setAvailableGarages] = useState([]); // New state for garages
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

    // We need either a garageId OR a serviceId to proceed
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
          setSelectedVehicleId(userVehicles[0].id); // Pre-select the first vehicle
        }

        // 2. Scenario A: Garage is selected, but Service is missing (from Search -> Booking)
        if (bookingInfo.garageId && !bookingInfo.serviceId) {
          const services = await fetchGarageServices(bookingInfo.garageId);
          setAvailableServices(services);
        }

        // 3. Scenario B: Service is selected, but Garage is missing (from ChooseService -> Booking)
        if (bookingInfo.serviceId && !bookingInfo.garageId) {
          const garages = await fetchGaragesByService(bookingInfo.serviceId);
          setAvailableGarages(garages);
        }

      } catch (err) {
        setError('Failed to load booking data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [user, bookingInfo?.garageId, bookingInfo?.serviceId, navigate]); // Check specific properties to avoid infinite loop if object ref changes

  const handleVehicleChange = (e) => {
    setSelectedVehicleId(e.target.value);
  };

  const handleServiceSelect = (e) => {
    const serviceId = e.target.value;
    if (!serviceId) return;

    const service = availableServices.find(s => s.id === serviceId);
    if (service) {
      setBookingInfo(prev => ({
        ...prev,
        serviceId: service.id,
        serviceName: service.name,
        totalPrice: service.price
      }));
    }
  };

  const handleGarageSelect = (e) => {
    const garageId = e.target.value;
    if (!garageId) return;

    const garage = availableGarages.find(g => g.id === garageId);
    if (garage) {
      setBookingInfo(prev => ({
        ...prev,
        garageId: garage.id,
        garageName: garage.name,
        totalPrice: garage.price // Price comes from the garage_service link
      }));
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

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
    if (!bookingInfo.serviceId) {
      setError('Please select a service.');
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

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const newBooking = {
        user_id: user.id,
        garage_id: bookingInfo.garageId,
        service_id: bookingInfo.serviceId,
        car_id: selectedVehicleId, // Include selected car ID
        booking_date: selectedDate, // Selected by user
        booking_time: selectedTime, // Selected by user
        total_amount: bookingInfo.totalPrice, // Map to total_amount
        status: 'pending', // Default status
        notes: '' // Optionally add a free text field for notes
      };

      await createBooking(newBooking);
      setSuccessMessage('Booking confirmed successfully! Redirecting to your bookings...');
      setTimeout(() => navigate('/my-bookings'), 3000);
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
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

        <div className="section-spacing"> {/* Use a class for spacing */}
          <h2 className="section-subtitle">Booking Summary</h2>

          {bookingInfo.garageName ? (
            <p><strong>Garage:</strong> {bookingInfo.garageName}</p>
          ) : (
            <p><strong>Garage:</strong> <em>Please select a garage below</em></p>
          )}

          {bookingInfo.serviceName ? (
            <>
              <p><strong>Service:</strong> {bookingInfo.serviceName}</p>
              <p><strong>Price:</strong> ₹{bookingInfo.totalPrice?.toFixed(2)}</p>
            </>
          ) : (
            <p><strong>Service:</strong> <em>Please select a service below</em></p>
          )}
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
                    {garage.name} ({garage.city}) - ₹{garage.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Service Selection (if not already selected) */}
          {!bookingInfo.serviceId && availableServices.length > 0 && (
            <div className="form-group">
              <label className="form-label" htmlFor="service-select">Select Service:</label>
              <select
                id="service-select"
                className="form-input"
                value={bookingInfo.serviceId || ''}
                onChange={handleServiceSelect}
                required
              >
                <option value="">-- Choose a Service --</option>
                {availableServices.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - ₹{service.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group"> {/* Removed inline style */}
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
                <Link to="/add-car" className="btn btn-primary">Add a Car</Link> {/* Used global btn class */}
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
            className="btn btn-primary" /* Used global btn class */
            disabled={submitting || !selectedVehicleId || !selectedDate || !selectedTime || !bookingInfo.serviceId || !bookingInfo.garageId}
            style={{ marginTop: '20px' }} /* Keep this for specific button spacing */
          >
            {submitting ? 'Confirming...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;