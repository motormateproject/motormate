import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const AddCarPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to add a car.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Ensure Profile Exists (Self-healing for legacy users)
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileFetchError && profileFetchError.code === 'PGRST116') {
        // Profile missing, create it
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'User',
            phone: user.user_metadata?.phone || '',
            is_garage_owner: false
          }]);

        if (profileInsertError) throw profileInsertError;
      } else if (profileFetchError) {
        throw profileFetchError;
      }

      // 2. Insert Car
      const { error: insertError } = await supabase.from('cars').insert({
        user_id: user.id,
        make,
        model,
        year,
        license_plate: licensePlate,
      });

      if (insertError) throw insertError;

      setShowToast(true);
      setTimeout(() => navigate('/profile'), 2000);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add vehicle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {showToast && <div className="toast toast-success">Vehicle added successfully!</div>}
      <h1 className="page-title">Add a New Vehicle</h1>
      <p className="page-subtitle">Enter the details of your car to save it to your profile for faster bookings.</p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          <div className="form-group">
            <label className="form-label" htmlFor="make">Make</label>
            <input id="make" type="text" className="form-input" placeholder="e.g., Toyota" value={make} onChange={e => setMake(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="model">Model</label>
            <input id="model" type="text" className="form-input" placeholder="e.g., Camry" value={model} onChange={e => setModel(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="year">Year</label>
            <input id="year" type="number" className="form-input" placeholder="e.g., 2022" value={year} onChange={e => setYear(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="licensePlate">License Plate</label>
            <input id="licensePlate" type="text" className="form-input" placeholder="e.g., ABC-123" value={licensePlate} onChange={e => setLicensePlate(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCarPage;