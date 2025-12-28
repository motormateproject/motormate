import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HomePage from '../pages/Home';

const HomeRedirect = () => {
    const { user, profile, loading } = useAuth();

    // Check cached role immediately to prevent flash of wrong content
    const cachedRole = localStorage.getItem('motormate_role');

    // AUTHENTICATED USER HANDLING
    if (user) {
        // 1. Trust Profile First
        if (profile?.role === 'garage_owner') {
            return <Navigate to="/admin/dashboard" replace />;
        }

        // 2. Trust Cache if Profile is loading/missing (FAST PATH)
        if (!profile && cachedRole === 'garage_owner') {
            return <Navigate to="/admin/dashboard" replace />;
        }

        // 3. If we have a user but no profile and no cache yet, WAIT.
        if (!profile && loading) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div className="spinner"></div>
                </div>
            );
        }

        // 4. Default: Render HomePage (Customer)
        // If profile is loaded and role is NOT garage_owner, we fall through here.
    } else if (loading) {
        // No user detected yet, but loading...
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

    // Standard Homepage for Visitors and Customers
    return <HomePage />;
};

export default HomeRedirect;
