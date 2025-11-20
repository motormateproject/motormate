import React, { useState } from 'react';
import './Contact.css';
import { supabase } from '../../lib/supabaseClient'; // Import supabase client

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state
  const [error, setError] = useState(null);     // Add error state

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => { // Make handleSubmit async
    e.preventDefault();
    setLoading(true); // Set loading to true on submission
    setError(null);   // Clear previous errors

    try {
      const { error } = await supabase
        .from('contact_messages') // Assuming you have a table named 'contact_messages'
        .insert([formData]);

      if (error) {
        throw error;
      }

      console.log('Form submitted to Supabase:', formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' }); // Reset form

      // Clear submitted message after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);

    } catch (err) {
      console.error('Error submitting form:', err.message);
      setError('Failed to send message. Please try again.'); // Set user-friendly error message
    } finally {
      setLoading(false); // Always set loading to false
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1 className="contact-title">Contact Us</h1>
        <p className="contact-subtitle">
          Have questions, feedback, or need help with a booking? We're here to help you.
        </p>
      </div>

      <div className="contact-form-card">
        <h2 className="form-card-title">Send us a message</h2>

        {submitted && (
          <div className="success-message">
            Thank you! Your message has been sent successfully. We'll get back to you soon.
          </div>
        )}

        {error && ( // Display error message if present
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your Email"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your Number"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message" className="form-label">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Your Message"
              className="form-input form-textarea"
              rows="5"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block contact-submit" disabled={loading}>
            {loading ? 'Sending...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
