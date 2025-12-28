import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './components/AuthLayout';
import GarageOwnerRoute from './components/GarageOwnerRoute';
import HomeRedirect from './components/HomeRedirect';
import './App.css';
import './styles/ui.css';

// Lazy load pages
const HomePage = lazy(() => import('./pages/Home'));
const LoginPage = lazy(() => import('./pages/Login'));
const RegisterPage = lazy(() => import('./pages/Register'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPassword'));
const ChooseServicePage = lazy(() => import('./pages/ChooseService'));
const BookingPage = lazy(() => import('./pages/Booking'));
const AddCarPage = lazy(() => import('./pages/AddCar'));
const GarageDetailsPage = lazy(() => import('./pages/GarageDetails'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const MyBookingsPage = lazy(() => import('./pages/MyBookings'));
const ContactPage = lazy(() => import('./pages/Contact'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboard'));
const AdminBookingsPage = lazy(() => import('./pages/AdminBookings'));
const AdminProfilePage = lazy(() => import('./pages/AdminProfile'));
const SearchPage = lazy(() => import('./pages/Search'));

// Loading component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
    width: '100%'
  }}>
    <div className="spinner"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/choose-service" element={<ChooseServicePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/garage-details/:id" element={<GarageDetailsPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/add-car" element={<AddCarPage />} />
                <Route path="/my-bookings" element={<MyBookingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Garage Owner Admin Routes */}
              <Route element={<GarageOwnerRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/bookings" element={<AdminBookingsPage />} />
                <Route path="/admin/profile" element={<AdminProfilePage />} />
              </Route>
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;