import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// import { supabase } from '../../lib/supabaseClient'; // No longer needed here

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isGarageOwner, setIsGarageOwner] = useState(false); // New state for user type
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { signUp } = useAuth(); // Get signUp from AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError('');
    setLoading(true);

    // Use the signUp function from AuthContext
    const { user, error } = await signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          is_garage_owner: isGarageOwner // Use the state variable here
        }
      }
    });

    if (error) {
      setError(error.message || JSON.stringify(error));
    } else if (user) {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="form-container text-center">
        <h2 className="page-title">Check your email!</h2>
        <p className="page-subtitle">We've sent a confirmation link to <strong>{email}</strong>. Please click the link to complete your registration.</p>
        <Link to="/login" className="btn btn-primary" style={{marginTop: '20px'}}>Back to Login</Link>
      </div>
    )
  }

  return (
    <div className="form-container text-center">
      <h2 className="page-title">Create Your Account</h2>
      <p className="page-subtitle">Start your journey with MotorMate.</p>
      
      {error && <p className="error-message">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="fullName">Full Name</label>
          <input id="fullName" type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="phone">Phone Number</label>
          <input id="phone" type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <input id="email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input id="password" type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
          <input id="confirmPassword" type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>

        {/* Role Selection */}
        <div className="form-group text-left">
          <label className="form-label">Register as:</label>
          <div className="radio-group" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
            <label>
              <input
                type="radio"
                name="userType"
                value="customer"
                checked={!isGarageOwner}
                onChange={() => setIsGarageOwner(false)}
              /> Customer
            </label>
            <label>
              <input
                type="radio"
                name="userType"
                value="garageOwner"
                checked={isGarageOwner}
                onChange={() => setIsGarageOwner(true)}
              /> Garage Owner
            </label>
          </div>
        </div>
        
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <p className="text-color-soft" style={{ marginTop: '30px', fontSize: '14px' }}>
        Already have an account? <Link to="/login" style={{ fontWeight: '600', color: 'var(--primary-color)' }}>Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
