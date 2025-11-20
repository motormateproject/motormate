import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { Facebook, Twitter, Instagram, Linkedin } from 'feather-icons-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-about">
          <h3 className="footer-logo">Motor<span>Mate</span></h3>
          <p>Motor Mate: Fast, reliable service and wash bookings near you.</p>
          <div className="footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook size={20} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin size={20} />
            </a>
          </div>
        </div>
        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/choose-service">Services</Link></li>
            <li><Link to="/booking">Book a Slot</Link></li>
            <li><Link to="/contact">Contact us</Link></li>
          </ul>
        </div>
        <div className="footer-contact">
          <h4>Contact Info</h4>
          <p>9999888822</p>
          <p>motormate@gmail.com</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} All rights reserved</p>
      </div>
    </footer>
  );
};

export default Footer;
