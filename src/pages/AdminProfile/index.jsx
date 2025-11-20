import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOwnerGarage, createGarage, updateGarageDetails, updateProfile } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';

const AdminProfilePage = () => {
  const { user, profile } = useAuth(); // Assuming refreshProfile is available
  const navigate = useNavigate();

  const [garageId, setGarageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state for garage details
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState(''); // Changed from zipCode
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');

  useEffect(() => {
    const getGarageProfile = async () => {
      if (!user) {
        setLoading(false);
        setError('Please log in to manage your garage profile.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const ownerGarage = await fetchOwnerGarage(user.id);
        if (ownerGarage) {
          setGarageId(ownerGarage.id);
          setName(ownerGarage.name || '');
          setAddress(ownerGarage.address || '');
          setCity(ownerGarage.city || '');
          setState(ownerGarage.state || '');
          setPincode(ownerGarage.pincode || ''); // Changed from zip_code
          setPhoneNumber(ownerGarage.phone_number || '');
          setEmail(ownerGarage.email || '');
          setDescription(ownerGarage.description || '');
          setLatitude(ownerGarage.latitude || '');
          setLongitude(ownerGarage.longitude || '');
          setOpeningTime(ownerGarage.opening_time || '');
          setClosingTime(ownerGarage.closing_time || '');
        }
      } catch (err) {
        console.error('Error fetching garage profile:', err);
        setError('Failed to load garage profile.');
      } finally {
        setLoading(false);
      }
    };

    getGarageProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to manage your garage profile.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    const garageData = {
      name,
      address,
      city,
      state,
      pincode: pincode, // Changed from zip_code
      phone_number: phoneNumber,
      email,
      description,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      opening_time: openingTime,
      closing_time: closingTime,
    };

    try {
      if (garageId) {
        // Update existing garage
        await updateGarageDetails(garageId, garageData);
        setSuccessMessage('Garage profile updated successfully!');
      } else {
        // Create new garage
        const newGarage = await createGarage({ ...garageData, owner_id: user.id });
        setGarageId(newGarage[0].id); // Set the new garage ID

        // Update user profile to mark as garage owner
        await updateProfile(user.id, { role: 'garage_owner' }); // Update role to 'garage_owner'
        // refreshProfile(); // Removed, AuthContext should handle state updates
        setSuccessMessage('Garage created successfully! Redirecting to dashboard...');
      }
      setTimeout(() => navigate('/admin/dashboard'), 2000);
    } catch (err) {
      console.error('Error saving garage profile:', err);
      setError('Failed to save garage profile. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (error && !user) {
    return <p className="error-message">{error}</p>;
  }

  // Ensure only garage owners (or potential owners) can access
  if (!user || (profile && profile.role !== 'garage_owner' && garageId === null)) { // Check role
    return <p className="error-message">Access Denied: You are not authorized to manage a garage.</p>;
  }

  return (
    <div>
      <h1 className="page-title">{garageId ? 'Manage Garage Profile' : 'Register Your Garage'}</h1>
      <div className="card">
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Garage Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input type="text" value={state} onChange={e => setState(e.target.value)} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Pincode</label> {/* Changed from Zip Code */}
            <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="form-input" rows="3"></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Opening Time</label>
            <input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label">Closing Time</label>
            <input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} className="form-input" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : (garageId ? 'Update Profile' : 'Register Garage')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminProfilePage;