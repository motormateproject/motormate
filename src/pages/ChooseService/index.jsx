import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './ChooseService.css';
import { Tool, Truck, GitCommit, Sliders, Award, Heart } from 'feather-icons-react';

const serviceIcons = {
  "General Maintenance": <Tool />,
  "Full Body Wash": <Truck />,
  "Tire & Wheel Care": <GitCommit />,
  "Engine Diagnostics": <Sliders />,
  "AC & Heating": <Award />,
  "Detailing & Polishing": <Heart />,
};

const ChooseServicePage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*');
      
      if (error) {
        setError(error.message);
      } else {
        setServices(data);
      }
      setLoading(false);
    };

    fetchServices();
  }, []);

  return (
    <div>
      <h1 className="page-title">Choose a Service</h1>
      <p className="page-subtitle">Select the service you need for your vehicle. All services include a complimentary interior vacuum.</p>
      
      {loading && <div className="loading-text">Loading services...</div>}
      {error && <div className="error-message">Error: {error}</div>}
      
      {!loading && !error && (
        <div className="services-grid">
          {services.map((service) => (
            <Link to={`/booking`} state={{ serviceId: service.id }} key={service.id} className="service-card-link">
              <div className="service-card">
                <div className="service-icon">
                  {serviceIcons[service.name] || <Tool />}
                </div>
                <div className="service-info">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChooseServicePage;
