import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchGarageDetails, fetchGarageServices, fetchAvailableSlots } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';

const GarageDetailsPage = () => {
  const { id: garageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [garage, setGarage] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  // const [selectedDate, setSelectedDate] = useState(''); // Removed
  // const [availableSlots, setAvailableSlots] = useState([]); // Removed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getGarageData = async () => {
      try {
        setLoading(true);
        const garageData = await fetchGarageDetails(garageId);
        setGarage(garageData);

        const garageServicesData = await fetchGarageServices(garageId);
        setServices(garageServicesData);

        if (garageServicesData.length > 0) {
          setSelectedService(garageServicesData[0]); // Select the first service by default
        }
      } catch (err) {
        setError('Failed to fetch garage details or services.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getGarageData();
  }, [garageId]);

  // Removed useEffect for fetching available slots

  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    const service = services.find(s => s.id === serviceId); // Corrected access
    setSelectedService(service);
    // setAvailableSlots([]); // Removed
  };

  // Removed handleDateChange

  const handleBookService = () => { // Renamed from handleSlotSelect
    if (!user) {
      alert('Please log in to book a service.');
      navigate('/login');
      return;
    }
    if (!selectedService) {
      alert('Please select a service first.');
      return;
    }

    // Prepare booking details to pass to the booking page
    const bookingDetails = {
      garageId: garage.id,
      garageName: garage.name,
      serviceId: selectedService.id, // Corrected access
      serviceName: selectedService.name, // Corrected access
      totalPrice: selectedService.price,
      userId: user.id,
    };

    navigate('/booking', { state: { bookingDetails } });
  };

  if (loading) return <p>Loading garage details...</p>;
  if (error) return <p style={{color: 'red'}}>{error}</p>;
  if (!garage) return <p>Garage not found.</p>;

  // const today = new Date().toISOString().split('T')[0]; // Removed

  return (
    <div>
      <div className="card">
        <h1 className="page-title">{garage.name}</h1>
        <p>{garage.address}, {garage.city}, {garage.state} {garage.pincode}</p>
        <p>Phone: {garage.phone_number}</p>
        <p>Email: {garage.email}</p>
        <p>Description: {garage.description}</p>
        <p>Hours: {garage.opening_time} - {garage.closing_time}</p>
        {/* Add rating display if available */}

        <h2 className="section-subtitle">Services Offered</h2>
        {services.length > 0 ? (
          <div className="form-group">
            <label className="form-label" htmlFor="service-select">Select a Service:</label>
            <select 
              id="service-select" 
              className="form-input" 
              onChange={handleServiceChange} 
              value={selectedService ? selectedService.id : ''}
            >
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - ₹{service.price.toFixed(2)} ({service.duration_minutes} mins)
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p>No services available for this garage.</p>
        )}

        {selectedService && (
          <div style={{marginTop: '20px'}}> {/* Adjusted margin-top */}
            <button className="btn btn-primary" onClick={handleBookService}>Book Service</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GarageDetailsPage;