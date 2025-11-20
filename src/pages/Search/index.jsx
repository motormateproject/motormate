import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchGarages } from '../../services/bookingService';
import { getCurrentLocation, sortGaragesByDistance } from '../../lib/geolocation';
import { MapPin } from 'feather-icons-react';
import './Search.css';

const SearchPage = () => {
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const navigate = useNavigate();

  // Filter states
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(0);
  const [serviceCategory, setServiceCategory] = useState(''); // Not yet implemented for filtering
  const [sortByDistance, setSortByDistance] = useState(false);

  useEffect(() => {
    const getGarages = async () => {
      setLoading(true);
      try {
        // Pass filters directly to fetchGarages
        const fetchedGarages = await fetchGarages(city, rating);

        // Sort by distance if user location is available and sorting is enabled
        if (sortByDistance && userLocation) {
          const sortedGarages = sortGaragesByDistance(fetchedGarages, userLocation);
          setGarages(sortedGarages);
        } else {
          setGarages(fetchedGarages);
        }
      } catch (error) {
        console.error('Error fetching garages:', error);
      } finally {
        setLoading(false);
      }
    };

    getGarages();
  }, [city, rating, sortByDistance, userLocation]); // Re-run effect when filters change

  const handleGetLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      setSortByDistance(true);
    } catch (error) {
      setLocationError(error.message);
      console.error('Error getting location:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <div className="search-page-wrapper">
      <h1 className="page-title">Find a Garage</h1>

      <div className="search-layout">
        {/* Filter Sidebar */}
        <aside className="search-sidebar card">
          <h2>Filters</h2>

          {/* Location Button */}
          <div className="form-group">
            <button
              onClick={handleGetLocation}
              className="btn btn-primary btn-block"
              disabled={locationLoading}
              style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <MapPin size={18} />
              {locationLoading ? 'Getting Location...' : userLocation ? 'Location Enabled ✓' : 'Find Nearby Garages'}
            </button>
            {locationError && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{locationError}</p>}
            {userLocation && (
              <p style={{ fontSize: '12px', color: 'var(--text-color-soft)', marginTop: '5px' }}>
                Showing garages sorted by distance
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="city-filter">City</label>
            <input
              id="city-filter"
              type="text"
              className="form-input"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g., Metropolis"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="rating-filter">Minimum Rating</label>
            <select
              id="rating-filter"
              className="form-input"
              value={rating}
              onChange={e => setRating(e.target.value)}
            >
              <option value="0">Any</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Star</option>
            </select>
          </div>
          {/* Add more filter options here if needed */}
        </aside>

        {/* Garage Listings */}
        <main className="search-results">
          {loading ? (
            <p>Searching for garages...</p>
          ) : (
            <div className="garage-list">
              {garages.length === 0 ? (
                <p className="no-results">No garages found matching your criteria.</p>
              ) : (
                garages.map(garage => (
                  <div
                    key={garage.id}
                    className="garage-card card"
                    onClick={() => navigate('/booking', { state: { bookingDetails: { garageId: garage.id, garageName: garage.name } } })}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={garage.image_url || 'https://via.placeholder.com/300x200?text=Garage+Image'} alt={garage.name} className="garage-card-image" />
                    <div className="garage-card-content">
                      <h3>{garage.name}</h3>
                      <p className="garage-address">{garage.address}, {garage.city}</p>
                      <p className="garage-rating">Rating: {garage.rating ? `${garage.rating} / 5.0` : 'N/A'}</p>
                      {garage.distance && (
                        <p style={{ color: 'var(--primary-color)', fontWeight: '600', fontSize: '14px' }}>
                          📍 {garage.distance} km away
                        </p>
                      )}
                      <p className="garage-description">{garage.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchPage;
