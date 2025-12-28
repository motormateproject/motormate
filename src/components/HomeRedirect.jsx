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
                console.warn('Profile loading timed out, showing home page');
                setShowFallback(true);
            }
        }, 10000); // 10 second timeout

        return () => clearTimeout(timeoutId);
    }, [loading, user, profile]);

    // Wait for profile to load if user is logged in
    if ((loading || (user && !profile)) && !showFallback) {
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

    if (user && profile?.role === 'garage_owner') {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return <HomePage />;
};

export default HomeRedirect;
