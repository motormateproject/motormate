import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout'; // Import the new Layout component
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import ChooseServicePage from './pages/ChooseService';
import BookingPage from './pages/Booking';
import AddCarPage from './pages/AddCar';
import GarageDetailsPage from './pages/GarageDetails';
import ProfilePage from './pages/Profile';
import MyBookingsPage from './pages/MyBookings';
import ContactPage from './pages/Contact';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './components/AuthLayout';
import GarageOwnerRoute from './components/GarageOwnerRoute';
import AdminDashboardPage from './pages/AdminDashboard';
import AdminBookingsPage from './pages/AdminBookings';
import AdminProfilePage from './pages/AdminProfile';
import SearchPage from './pages/Search';
import HomeRedirect from './components/HomeRedirect';
import './App.css';
import './styles/ui.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout> {/* Use the Layout component */}
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
        </Layout> {/* Close Layout component */}
      </Router>
    </AuthProvider>
  );
}

export default App;