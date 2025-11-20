import React from 'react';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="app-layout">
      <Navbar />
      <main className={`app-main-content ${isHomePage ? 'home-main-content' : ''}`}>
        {isHomePage ? (
          children
        ) : (
          <div className="app-content-container">
            {children}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
