import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HomePage from '../pages/Home';

const HomeRedirect = () => {
    const { user, profile, loading } = useAuth();
    const [showFallback, setShowFallback] = useState(false);

    // Timeout fallback
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (loading || (user && !profile)) {
                // Determine if we should really show fallback or just logout?
                console.warn('Profile loading slow');
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

    // AUTHENTICATED USER HANDLING
    if (user) {
        // If we have a user but no profile yet, WAIT. Do not show HomePage.
        if (!profile) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div className="spinner"></div> {/* Or text "Verifying account..." */}
                </div>
            );
        }

        // We have user and profile
        if (profile.role === 'garage_owner') {
            return <Navigate to="/admin/dashboard" replace />;
        }

        // If customer, show homepage (which is below).
        // BUT current structure returns HomePage at the end.
        // We can just fall through.
    }

    // Standard Homepage for Visitors and Customers
    return <HomePage />;
};

export default HomeRedirect;
