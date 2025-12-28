import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // New state for user profile
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Fail-safe timeout to prevent permanent white screen
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Session loading timed out after 10 seconds');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    const getSessionAndProfile = async () => {
      try {
        setLoading(true);
        console.log('Starting session check...');

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        console.log('Session retrieved:', session?.user ? 'User found' : 'No user');
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('Fetching profile for user:', session.user.id);

          // Run queries in parallel to speed up loading
          const [profileResult, garageResult] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', session.user.id).single(),
            supabase.from('garages').select('id').eq('owner_id', session.user.id).maybeSingle()
          ]);

          if (profileResult.error) {
            console.error('Profile query error:', profileResult.error);
          }

          let userProfile = profileResult.data;
          const garage = garageResult.data;

          // 3. If owner but flag is false, fix it
          if (garage && userProfile && !userProfile.is_garage_owner) {
            console.log('Updating garage owner flag');
            await supabase
              .from('profiles')
              .update({ is_garage_owner: true })
              .eq('id', session.user.id);

            // Update local variable
            userProfile.is_garage_owner = true;
          }

          setProfile({
            id: session.user.id,
            full_name: userProfile?.full_name || session.user.user_metadata?.full_name || '',
            email: session.user.email,
            phone: userProfile?.phone || session.user.user_metadata?.phone || '',
            // Derive role from the boolean flag
            role: (userProfile?.is_garage_owner || session.user.user_metadata?.is_garage_owner) ? 'garage_owner' : 'customer',
            is_garage_owner: userProfile?.is_garage_owner ?? false
          });
          console.log('Profile loaded successfully');
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('CRITICAL ERROR loading auth session:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        setUser(null);
        setProfile(null);
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
          console.log('Session loading complete');
        }
      }
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setUser(session?.user ?? null);
          if (session?.user) {
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

            setProfile({
              id: session.user.id,
              full_name: userProfile?.full_name || session.user.user_metadata?.full_name || '',
              email: session.user.email,
              phone: userProfile?.phone || session.user.user_metadata?.phone || '',
              role: (userProfile?.is_garage_owner || session.user.user_metadata?.is_garage_owner) ? 'garage_owner' : 'customer',
              is_garage_owner: userProfile?.is_garage_owner ?? false
            });
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
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
        // Profile is created automatically by database trigger on auth.users
        const { full_name, phone, is_garage_owner } = data.options.data;
        const role = is_garage_owner ? 'garage_owner' : 'customer';

        // Update the local profile state
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

      // Only check email verification if user has never logged in before
      // (email_confirmed_at exists but no previous sessions)
      if (authData?.user && !authData.user.email_confirmed_at) {
        // Check if this is truly first login by checking last_sign_in_at
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
    profile, // Provide profile in the context
    loading, // Provide loading state
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
