import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch and format profile with timeout
  const fetchProfile = async (userId, userEmail, userMetadata) => {
    try {
      // enhanced fetch with 5s timeout to prevent hanging
      const fetchPromise = (async () => {
        const [profileResult, garageResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('garages').select('id').eq('owner_id', userId).maybeSingle()
        ]);
        return { profileResult, garageResult };
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );

      const { profileResult, garageResult } = await Promise.race([fetchPromise, timeoutPromise]);

      if (profileResult.error && profileResult.error.code !== 'PGRST116') {
        console.error('[AuthContext] Profile fetch error:', profileResult.error);
      }

      let userProfile = profileResult.data;
      const garage = garageResult.data;

      // Update garage owner flag if needed
      if (garage && userProfile && !userProfile.is_garage_owner) {
        console.log('[AuthContext] Updating garage owner flag');
        await supabase
          .from('profiles')
          .update({ is_garage_owner: true })
          .eq('id', userId);
        userProfile.is_garage_owner = true;
      }

      const role = (userProfile?.is_garage_owner || userMetadata?.is_garage_owner) ? 'garage_owner' : 'customer';

      // CACHE THE ROLE
      localStorage.setItem('motormate_role', role);

      const finalProfile = {
        id: userId,
        full_name: userProfile?.full_name || userMetadata?.full_name || '',
        email: userEmail,
        phone: userProfile?.phone || userMetadata?.phone || '',
        role: role,
        is_garage_owner: userProfile?.is_garage_owner ?? false
      };

      return finalProfile;
    } catch (profileError) {
      console.error('[AuthContext] Error fetching profile:', profileError.message);

      // Try to recover role from localStorage if fetch fails
      const cachedRole = localStorage.getItem('motormate_role') || 'customer';

      return {
        id: userId,
        email: userEmail,
        full_name: userMetadata?.full_name || '',
        phone: userMetadata?.phone || '',
        role: cachedRole,
        is_garage_owner: cachedRole === 'garage_owner'
      };
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Failsafe: Force loading to false after 4 seconds max
    const failsafeTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[AuthContext] Failsafe triggered: forcing loading to false');
        setLoading(false);
      }
    }, 4000);

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && isMounted) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
          if (isMounted) setProfile(profileData);
        }
      } catch (error) {
        console.error('[AuthContext] Initialization error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('[AuthContext] Auth event:', event);

        if (session?.user) {
          setUser(session.user);
          // Only fetch profile if not already loaded or if user changed
          if (!profile || profile.id !== session.user.id) {
            const profileData = await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            if (isMounted) setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
          localStorage.removeItem('motormate_role'); // Clear cache on logout
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(failsafeTimeout);
      authListener.subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    signUp: async (data) => {
      const { data: authData, error: authError } = await supabase.auth.signUp(data);

      if (authError) {
        return { user: null, session: null, error: authError };
      }

      if (authData.user) {
        const { full_name, phone, is_garage_owner } = data.options.data;
        const role = is_garage_owner ? 'garage_owner' : 'customer';

        // Cache role immediately on signup
        localStorage.setItem('motormate_role', role);

        setProfile({
          id: authData.user.id,
          full_name: full_name,
          email: authData.user.email,
          phone: phone,
          role: role,
        });
      }
      return { user: authData.user, session: authData.session, error: null };
    },
    signIn: async (data) => {
      const { data: authData, error } = await supabase.auth.signInWithPassword(data);

      if (authData?.user && !authData.user.email_confirmed_at) {
        const isFirstLogin = !authData.user.last_sign_in_at ||
          authData.user.last_sign_in_at === authData.user.created_at;

        if (isFirstLogin) {
          return {
            user: null,
            session: null,
            error: {
              message: 'Please verify your email before logging in. Check your inbox for the verification link.',
              code: 'email_not_verified'
            }
          };
        }
      }

      return { data: authData, error };
    },
    signOut: async () => {
      setUser(null);
      setProfile(null);
      return await supabase.auth.signOut();
    },
    resendVerificationEmail: async (email) => {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      return { error };
    },
    user,
    profile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
