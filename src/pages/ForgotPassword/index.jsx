import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('If an account with this email exists, a password reset link has been sent.');
    }
    setLoading(false);
  };

  return (
    <div className="form-container text-center">
      <h2 className="page-title">Forgot Your Password?</h2>
      <p className="page-subtitle">No problem. Enter your email below to receive a reset link.</p>
      
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      
      {!message && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
      
      <p className="text-color-soft" style={{ marginTop: '30px', fontSize: '14px' }}>
        Remembered your password? <Link to="/login" style={{ fontWeight: '600', color: 'var(--primary-color)' }}>Login</Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
