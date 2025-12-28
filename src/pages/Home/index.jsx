import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { MapPin, FileText, Truck, Clipboard } from 'feather-icons-react';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const id = `faq-${question.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="faq-item">
      <button
        className={`faq-question ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={id}
      >
        {question}
      </button>
      <div id={id} className={`faq-answer ${isOpen ? 'open' : ''}`}>
        <p>{answer}</p>
      </div>
    </div>
  );
};

const HomePage = () => {
  return (
    <div className="home-page-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">From Engine to Exterior — We've Got You <span>Covered.</span></h1>
          <p className="hero-subtitle">Book effortless car servicing with pickup & drop, real-time tracking and reliable professionals.</p>
          <Link to="/choose-service" className="hero-cta">Book a Slot</Link>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-us-section">
        <div className="app-content-container">
          <h2 className="section-title">Why Choose <span>Us?</span></h2>
          <div className="why-choose-us-container">
            {/* Center Logo */}
            <div className="center-logo">
              <div className="center-logo-text">Motor<span>Mate</span></div>
            </div>

            {/* Top Left */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Truck className="feature-icon" size={28} />
              </div>
              <h3 className="feature-title">Pickup & Drop Service</h3>
              <p className="feature-desc">We'll pick up and drop off your vehicle — no more waiting.</p>
            </div>

            {/* Top Right */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Clipboard className="feature-icon" size={28} />
              </div>
              <h3 className="feature-title">Multiple Service types</h3>
              <p className="feature-desc">Washing, Engine Checkup, Tire Replacement, and more.</p>
            </div>

            {/* Bottom Left */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <MapPin className="feature-icon" size={28} />
              </div>
              <h3 className="feature-title">Garage Locator</h3>
              <p className="feature-desc">Choose a garage near you for faster service.</p>
            </div>

            {/* Bottom Right */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <FileText className="feature-icon" size={28} />
              </div>
              <h3 className="feature-title">Digital Records</h3>
              <p className="feature-desc">Track all your services and bookings in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="app-content-container">
          <h2 className="section-title">Services <span>Available</span></h2>
          <div className="services-grid">
            <div className="service-card black">
              <div className="service-number">01</div>
              <h3 className="service-title">Vehicle Washing</h3>
              <p className="service-desc">Exterior and interior cleaning with eco-friendly solutions.</p>
            </div>
            <div className="service-card blue">
              <div className="service-number">02</div>
              <h3 className="service-title">Routine Maintenance</h3>
              <p className="service-desc">Periodic inspections, oil changes, and fluid top-ups for optimal vehicle health.</p>
            </div>
            <div className="service-card black">
              <div className="service-number">03</div>
              <h3 className="service-title">Engine Diagnostics</h3>
              <p className="service-desc">Complete engine check with computerized diagnostics.</p>
            </div>
            <div className="service-card blue">
              <div className="service-number">04</div>
              <h3 className="service-title">AC & Brake Service</h3>
              <p className="service-desc">AC gas refill, filter replacement, and brake pad inspection or replacement.</p>
            </div>
            <div className="service-card black">
              <div className="service-number">05</div>
              <h3 className="service-title">Tire & Oil Change</h3>
              <p className="service-desc">Tire alignment, rotation, and fresh oil change with quality-grade lubricants.</p>
            </div>
            <div className="service-card blue">
              <div className="service-number">06</div>
              <h3 className="service-title">Pickup & Drop Service</h3>
              <p className="service-desc">Can't make it? We'll pick your car up and drop it after the service — safe and reliable.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="app-content-container">
          <h2 className="section-title">How <span>Motor Mate</span> Works?</h2>
          <div className="how-it-works-content">
            <div className="how-it-works-steps">
              <div className="how-it-works-step">
                <div className="step-number">1.</div>
                <div className="step-details">
                  <h3>Login or Register</h3>
                  <p>Create your account in just a few seconds</p>
                </div>
              </div>
              <div className="how-it-works-step">
                <div className="step-number">2.</div>
                <div className="step-details">
                  <h3>Choose a Service</h3>
                  <p>Select from our wide range of services</p>
                </div>
              </div>
              <div className="how-it-works-step">
                <div className="step-number">3.</div>
                <div className="step-details">
                  <h3>Select Garage or Pickup</h3>
                  <p>Choose a nearby garage or opt for home pickup</p>
                </div>
              </div>
              <div className="how-it-works-step">
                <div className="step-number">4.</div>
                <div className="step-details">
                  <h3>Book Time & Confirm</h3>
                  <p>Pick a convenient time slot and confirm your booking</p>
                </div>
              </div>
              <div className="how-it-works-step">
                <div className="step-number">5.</div>
                <div className="step-details">
                  <h3>Track Status & Completion</h3>
                  <p>Get real-time updates on your service progress</p>
                </div>
              </div>
            </div>
            <div className="how-it-works-visual">
              <svg className="car-illustration" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Simple Car Illustration */}
                <rect x="80" y="120" width="240" height="80" rx="8" fill="#111827" />
                <rect x="100" y="100" width="200" height="60" rx="8" fill="#1F2937" />
                <circle cx="140" cy="200" r="30" fill="#111827" />
                <circle cx="140" cy="200" r="18" fill="#4B5563" />
                <circle cx="280" cy="200" r="30" fill="#111827" />
                <circle cx="280" cy="200" r="18" fill="#4B5563" />
                <rect x="120" y="110" width="60" height="40" rx="4" fill="#60A5FA" opacity="0.3" />
                <rect x="240" y="110" width="60" height="40" rx="4" fill="#60A5FA" opacity="0.3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="app-content-container">
          <h2 className="section-title">What Vehicle Owners <span>Say?</span></h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-header">
                <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Ritika P." className="testimonial-img" />
                <div className="testimonial-author">
                  <h4>Ritika P., Hyderabad</h4>
                </div>
              </div>
              <p className="testimonial-body">"Booked a car wash with pickup and drop — super smooth and hassle-free! My vehicle was returned on time and looked spotless."</p>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-header">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Aamir K." className="testimonial-img" />
                <div className="testimonial-author">
                  <h4>Aamir K., Mumbai</h4>
                </div>
              </div>
              <p className="testimonial-body">"Affordable pricing and great service! I've used Motor Mate twice already."</p>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-header">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Sneha D." className="testimonial-img" />
                <div className="testimonial-author">
                  <h4>Sneha D., Banglore</h4>
                </div>
              </div>
              <p className="testimonial-body">"Loved the easy booking process. Everything was smooth and fast"</p>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-header">
                <img src="https://randomuser.me/api/portraits/men/46.jpg" alt="Vishal R." className="testimonial-img" />
                <div className="testimonial-author">
                  <h4>Vishal R., Banjara Hills</h4>
                </div>
              </div>
              <p className="testimonial-body">"Digital service records were a game-changer for me. No more searching for paper receipts."</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="app-content-container">
          <h2 className="section-title">FAQ's</h2>
          <div className="faq-container">
            <FAQItem
              question="What are the charges for basic car service?"
              answer="Charges depend on the service type and your vehicle model. You will see a detailed estimate before confirming your booking."
            />
            <FAQItem
              question="How to book my car service with Motor Mate?"
              answer="Simply register or login, choose your desired service, select a garage or pickup option, pick a time slot, and confirm your booking."
            />
            <FAQItem
              question="Why should I choose Motor Mate for my vehicle?"
              answer="We offer convenient pickup & drop service, transparent pricing, a wide range of services, and a network of trusted garages with digital service records."
            />
            <FAQItem
              question="What type of services do you offer?"
              answer="We offer vehicle washing, routine maintenance, engine diagnostics, AC & brake service, tire & oil change, and convenient pickup & drop service."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
