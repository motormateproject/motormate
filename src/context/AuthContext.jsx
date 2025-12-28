import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getSessionAndProfile = async () => {
      try {
        console.log('[AuthContext] Starting session check...');
        console.log('[AuthContext] Supabase URL configured:', process.env.REACT_APP_SUPABASE_URL ? 'YES' : 'NO');

        // 1. Load cached data immediately for instant UI
        const cachedProfile = localStorage.getItem('motormate_profile');
        const cachedSessionTime = localStorage.getItem('motormate_session_time');

        if (cachedProfile && cachedSessionTime) {
          try {
            const parsed = JSON.parse(cachedProfile);
            const sessionTime = parseInt(cachedSessionTime);
            // Use cache if less than 30 minutes old
            if (Date.now() - sessionTime < 1000 * 60 * 30) {
              console.log('[AuthContext] Using cached profile (instant load)');
              setProfile(parsed);
              setUser({ id: parsed.id, email: parsed.email });
              setLoading(false); // Show UI immediately
            }
          } catch (e) {
            console.error('[AuthContext] Cache parse error:', e);
          }
        }

        // 2. Verify session with timeout protection
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 8000)
        );

        let session, sessionError;
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          session = result.data?.session;
          sessionError = result.error;
          console.log('[AuthContext] Session check completed');
        } catch (timeoutError) {
          console.error('[AuthContext] Session check timed out!');
          console.error('[AuthContext] This usually means Supabase env vars are not set correctly');

          // Keep cached data if timeout
          if (cachedProfile && cachedSessionTime) {
            console.log('[AuthContext] Using cached session due to timeout');
            return;
          }
          throw new Error('Cannot connect to authentication server. Please check your internet connection.');
        }

        if (sessionError) {
          console.error('[AuthContext] Session error:', sessionError.message);
          localStorage.removeItem('motormate_profile');
          localStorage.removeItem('motormate_session_time');
          setUser(null);
          setProfile(null);
          if (isMounted) setLoading(false);
          return;
        }

        if (!session?.user) {
          console.log('[AuthContext] No active session');
          localStorage.removeItem('motormate_profile');
          localStorage.removeItem('motormate_session_time');
          setUser(null);
          setProfile(null);
          if (isMounted) setLoading(false);
          return;
        }

        console.log('[AuthContext] Active session found for:', session.user.email);
        setUser(session.user);

        // 3. Fetch profile with error handling
        try {
          const [profileResult, garageResult] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', session.user.id).single(),
            supabase.from('garages').select('id').eq('owner_id', session.user.id).maybeSingle()
          ]);

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
              .eq('id', session.user.id);
            userProfile.is_garage_owner = true;
          }

          const finalProfile = {
            id: session.user.id,
            full_name: userProfile?.full_name || session.user.user_metadata?.full_name || '',
            email: session.user.email,
            phone: userProfile?.phone || session.user.user_metadata?.phone || '',
            role: (userProfile?.is_garage_owner || session.user.user_metadata?.is_garage_owner) ? 'garage_owner' : 'customer',
            is_garage_owner: userProfile?.is_garage_owner ?? false
          };

          setProfile(finalProfile);
          localStorage.setItem('motormate_profile', JSON.stringify(finalProfile));
          localStorage.setItem('motormate_session_time', Date.now().toString());

          console.log('[AuthContext] ✓ Profile loaded:', finalProfile.role);
        } catch (profileError) {
          console.error('[AuthContext] Error fetching profile:', profileError.message);

          // Fallback to basic profile
          const basicProfile = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || '',
            phone: session.user.user_metadata?.phone || '',
            role: 'customer',
            is_garage_owner: false
          };
          setProfile(basicProfile);
          localStorage.setItem('motormate_profile', JSON.stringify(basicProfile));
          localStorage.setItem('motormate_session_time', Date.now().toString());
        }
      } catch (error) {
        console.error('[AuthContext] CRITICAL ERROR:', error.message);

        // Keep cached data on errors
        const cachedProfile = localStorage.getItem('motormate_profile');
        if (!cachedProfile) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('[AuthContext] Session check complete');
        }
      }
    };

    getSessionAndProfile();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth event:', event);

        try {
          if (!session?.user) {
            setUser(null);
            setProfile(null);
            localStorage.removeItem('motormate_profile');
            localStorage.removeItem('motormate_session_time');
            setLoading(false);
            return;
          }

          setUser(session.user);

          const [profileResult, garageResult] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', session.user.id).single(),
            supabase.from('garages').select('id').eq('owner_id', session.user.id).maybeSingle()
          ]);

          let userProfile = profileResult.data;
          const garage = garageResult.data;

          if (garage && userProfile && !userProfile.is_garage_owner) {
            await supabase
              .from('profiles')
              .update({ is_garage_owner: true })
              .eq('id', session.user.id);
            userProfile.is_garage_owner = true;
          }

          const refreshedProfile = {
            id: session.user.id,
            full_name: userProfile?.full_name || session.user.user_metadata?.full_name || '',
            email: session.user.email,
            phone: userProfile?.phone || session.user.user_metadata?.phone || '',
            role: (userProfile?.is_garage_owner || session.user.user_metadata?.is_garage_owner) ? 'garage_owner' : 'customer',
            is_garage_owner: userProfile?.is_garage_owner ?? false
          };

          setProfile(refreshedProfile);
          localStorage.setItem('motormate_profile', JSON.stringify(refreshedProfile));
          localStorage.setItem('motormate_session_time', Date.now().toString());
        } catch (error) {
          console.error('[AuthContext] Auth state change error:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    signUp: async (data) => {
      const { data: authData, error: authError } = await supabase.auth.signUp(data);

      if (authError) {
        return { user: null, session: null, error: authError };
      }

      if (authData.user) {
        const { full_name, phone, is_garage_owner } = data.options.data;
        const role = is_garage_owner ? 'garage_owner' : 'customer';

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
    signOut: () => supabase.auth.signOut(),
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
