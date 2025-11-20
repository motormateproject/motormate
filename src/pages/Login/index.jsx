import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendLink, setShowResendLink] = useState(false);
  const { signIn, resendVerificationEmail } = useAuth(); // Get both functions at component level
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn({ email, password });

    if (result.error) {
      if (result.error.code === 'email_not_verified') {
        setError(result.error.message);
        setShowResendLink(true);
      } else {
        setError(result.error.message);
      }
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    const { error } = await resendVerificationEmail(email);

    if (error) {
      setError('Failed to resend verification email. Please try again.');
    } else {
      setError('');
      alert('Verification email sent! Please check your inbox.');
    }
    setLoading(false);
  };

  return (
    <div className="form-container text-center">
      <h2 className="page-title">Welcome Back</h2>
      <p className="page-subtitle">Login to your MotorMate account.</p>

      {error && <p className="error-message">{error}</p>}
      {showResendLink && (
        <button
          onClick={handleResendVerification}
          className="btn btn-secondary"
          style={{ marginBottom: '15px', fontSize: '14px' }}
          disabled={loading || !email}
        >
          Resend Verification Email
        </button>
      )}
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
        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="text-right" style={{ marginBottom: 'var(--spacing-md)' }}>
          <Link to="/forgot-password" style={{ fontSize: '14px', color: 'var(--primary-color)' }}>Forgot Password?</Link>
        </div>
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="text-color-soft" style={{ marginTop: 'var(--spacing-xl)', fontSize: '14px' }}>
        Don't have an account? <Link to="/register" style={{ fontWeight: '600', color: 'var(--primary-color)' }}>Register</Link>
      </p>
    </div>
  );
};

export default LoginPage;
