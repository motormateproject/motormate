import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const LeaveReviewPage = () => {
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { bookingId, garageId } = state || {};

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to leave a review.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: insertError } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      garage_id: garageId,
      user_id: user.id,
      rating,
      comment,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      navigate(`/garage/${garageId}`); // Redirect to garage details page
    }
    setLoading(false);
  };

  if (!bookingId || !garageId) {
    return <div>Invalid review link.</div>;
  }

  return (
    <div>
      <h1 className="page-title">Leave a Review</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label className="form-label">Rating</label>
            <select value={rating} onChange={e => setRating(e.target.value)} className="form-input">
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Comment</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} className="form-input" rows="4"></textarea>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeaveReviewPage;
