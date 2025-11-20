import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import { Menu, X } from 'feather-icons-react';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        <Link to="/" className="logo">Motor<span>Mate</span></Link>

        {/* Desktop Navigation */}
        <nav className="nav">
          {profile?.role !== 'garage_owner' && (
            <>
              <NavLink to="/" className={({ isActive }) => isActive ? "navLink active" : "navLink"}>Home</NavLink>
              <NavLink to="/search" className={({ isActive }) => isActive ? "navLink active" : "navLink"}>Find a Garage</NavLink>
              <NavLink to="/choose-service" className={({ isActive }) => isActive ? "navLink active" : "navLink"}>Services</NavLink>
              {user && <NavLink to="/my-bookings" className={({ isActive }) => isActive ? "navLink active" : "navLink"}>My Bookings</NavLink>}
              <NavLink to="/contact" className={({ isActive }) => isActive ? "navLink active" : "navLink"}>Contact</NavLink>
            </>
          )}
          {profile?.role === 'garage_owner' && (
            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "navLink active" : "navLink"}>Garage Dashboard</NavLink>
          )}
        </nav>
        <div className="authLinks">
          {user ? (
            <>
              <NavLink to="/profile" className="navLink">Profile</NavLink>
              <button onClick={signOut} className="btn btn-secondary">Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-secondary">Login</NavLink>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>

        {/* Hamburger Menu */}
        <div className="hamburger-menu" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
          {profile?.role !== 'garage_owner' && (
            <>
              <NavLink to="/" className="navLink" onClick={toggleMobileMenu}>Home</NavLink>
              <NavLink to="/choose-service" className="navLink" onClick={toggleMobileMenu}>Services</NavLink>
              {user && <NavLink to="/my-bookings" className="navLink" onClick={toggleMobileMenu}>My Bookings</NavLink>}
              <NavLink to="/contact" className="navLink" onClick={toggleMobileMenu}>Contact</NavLink>
            </>
          )}
          {profile?.role === 'garage_owner' && (
            <NavLink to="/admin/dashboard" className="navLink" onClick={toggleMobileMenu}>Garage Dashboard</NavLink>
          )}

          <div className="authLinks">
            {user ? (
              <>
                <NavLink to="/profile" className="navLink" onClick={toggleMobileMenu}>Profile</NavLink>
                <button onClick={() => { signOut(); toggleMobileMenu(); }} className="loginButton">Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="loginButton" onClick={toggleMobileMenu}>Login</NavLink>
                <Link to="/register" className="registerButton" onClick={toggleMobileMenu}>Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;