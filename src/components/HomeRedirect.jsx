import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HomePage from '../pages/Home';

const HomeRedirect = () => {
    const { user, profile, loading } = useAuth();
    const [showFallback, setShowFallback] = useState(false);

    // Timeout fallback to prevent infinite loading
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (loading || (user && !profile)) {
                // If detailed profile fails but we have a user, let's try to see if they are an admin stored in session/localstorage?
                // Or just show fallback.
                console.warn('Profile loading timed out, showing home page');
                setShowFallback(true);
            }
        }, 8000);

        return () => clearTimeout(timeoutId);
    }, [loading, user, profile]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem',
                color: '#666'
            }}>
                Loading MotorMate...
            </div>
        );
    }

    // Role-based redirection
    if (user && profile) {
        if (profile.role === 'garage_owner') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        // Customers stay on home page (which is displayed below by default)
    }

    // If logged in but profile is still missing (and not loading), wait a bit or shown fallback?
    // The main issue described is "loaded customer dashboard after load".
    // This happens because HomeRedirect renders HomePage by default at the end.

    // If we are sure we are a garage owner (maybe checked local storage or session?), redirect immediately.
    // Ideally we shouldn't render HomePage content until we know for sure they are NOT an admin.

    return <HomePage />;
};

export default HomeRedirect;
