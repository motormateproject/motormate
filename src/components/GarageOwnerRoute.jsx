import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const GarageOwnerRoute = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || profile?.role !== 'garage_owner') {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default GarageOwnerRoute;
