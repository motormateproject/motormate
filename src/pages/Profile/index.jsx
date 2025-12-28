import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';
import { Plus, Trash2 } from 'feather-icons-react';

const ProfilePage = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // const [profile, setProfile] = useState(null); // Removed local profile state
  const [vehicles, setVehicles] = useState([]);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const initializeProfileData = async () => {
      if (user && profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || ''); // Corrected column name

        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('cars')
          .select('*')
          .eq('user_id', user.id);

        if (vehiclesError) console.error('Error fetching vehicles:', vehiclesError);
        else setVehicles(vehiclesData);

        setLoading(false);
      } else if (!user) {
        setLoading(false);
      }
    };
    initializeProfileData();
  }, [user, profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Get temp location from form dataset if set
    const lat = e.target.dataset.lat;
    const lng = e.target.dataset.lng;

    const updates = {
      full_name: fullName,
      phone: phone
    };

    if (lat && lng) {
      updates.latitude = parseFloat(lat);
      updates.longitude = parseFloat(lng);
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      alert(error.message);
    } else {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      setEditing(false);
      // Force reload profile (simplest way to see changes since we don't have a setProfile method exposed from context)
      // Actually, since updates are realtime or fetched on auth change, we might need to manually trigger context refresh?
      // For now, let's just reload the page to be safe and simple
      window.location.reload();
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      const { error } = await supabase.from('cars').delete().eq('id', vehicleId);
      if (error) {
        alert(error.message);
      } else {
        setVehicles(vehicles.filter(v => v.id !== vehicleId));
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return <div className="loading-text">Loading your profile...</div>;
  }

  // If user is logged in but profile is not loaded yet
  if (user && !profile && !loading) {
    return <div className="loading-text">Fetching profile details...</div>;
  }

  // If no user, return null (redirection handled by useEffect)
  if (!user) return null;

  return (
    <div>
      {showToast && <div className="toast toast-success">Profile updated successfully!</div>}
      <h1 className="page-title">My Profile</h1>

      <div className="profile-grid">
        {/* Profile Info Section */}
        <div className="card">
          <div className="profile-section-header">
            <h2 className="section-subtitle">My Info</h2>
            {!editing && <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>}
          </div>
          {editing ? (
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Location (for nearest garages)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={async () => {
                      if (!navigator.geolocation) {
                        alert('Geolocation is not supported by your browser');
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const { latitude, longitude } = position.coords;
                          // Update backend directly? Or state? 
                          // Let's update state and let 'Save Changes' push it,
                          // but we need hidden fields or state for it.
                          // Actually, let's just save it immediately or store in a ref?
                          // For simplicity in this form, let's auto-save location or just hold it.
                          // We'll update the profile object in the submit handler.
                          // But we need state variables for them.
                          // Let's create specific hidden inputs or just handle it in state.

                          // HACK: We need to modify the component state to include lat/long
                          // Since we don't have explicit state variables for them, let's add them to the component.
                          // See instructions below to add state hooks.
                          console.log("Got location", latitude, longitude);
                          window.tempLocation = { latitude, longitude }; // Temporary storage
                          alert("Location fetched! Click 'Save Changes' to update.");
                        },
                        (err) => {
                          alert('Unable to retrieve your location');
                        }
                      );
                    }}
                  >
                    📍 Get Current Location
                  </button>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {profile?.latitude ? 'Location currently set' : 'No location set'}
                  </span>
                </div>
              </div>

              <div className="button-group">
                <button type="submit" className="btn btn-primary" onClick={(e) => {
                  // Inject temp location if set
                  if (window.tempLocation) {
                    e.target.form.dataset.lat = window.tempLocation.latitude;
                    e.target.form.dataset.lng = window.tempLocation.longitude;
                  }
                }}>Save Changes</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Full Name:</strong> {profile?.full_name || 'Not set'}</p>
              <p><strong>Phone Number:</strong> {profile?.phone || 'Not set'}</p>
              <p><strong>Location:</strong> {profile?.latitude ? '✅ Saved' : 'Not set (set this to find nearest garages)'}</p>
            </div>
          )}
        </div>

        {/* My Vehicles Section */}
        <div className="card">
          <div className="profile-section-header">
            <h2 className="section-subtitle">My Vehicles</h2>
            <Link to="/add-car" className="btn btn-primary"><Plus size={16} /> Add Vehicle</Link>
          </div>
          {vehicles.length === 0 ? (
            <p className="text-color-soft">You have no vehicles saved.</p>
          ) : (
            <ul className="vehicle-list">
              {vehicles.map(v => (
                <li key={v.id} className="vehicle-item">
                  <div>
                    <span className="vehicle-item-details">{v.year} {v.make} {v.model}</span>
                    <span className="vehicle-item-plate">{v.license_plate}</span>
                  </div>
                  <button onClick={() => handleDeleteVehicle(v.id)} className="delete-vehicle-btn">
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <button onClick={handleLogout} className="btn btn-secondary logout-button">Logout</button>
    </div>
  );
};

export default ProfilePage;
