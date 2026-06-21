import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { createClient } from '../lib/supabase/client';

export type UserRole = 'citizen' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}

export function useProfile() {
  const { user, session, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function fetchOrCreateProfile() {
      if (authLoading) {
        return;
      }

      // Defensive checks: user and session must exist
      if (!user || !session) {
        if (active) {
          setProfile(null);
          setLoadingProfile(false);
        }
        return;
      }

      try {
        if (active) {
          setLoadingProfile(true);
        }

        // Query public.profiles correctly, using maybeSingle to handle empty results safely
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          if (active) {
            setProfile(null);
          }
        } else if (data) {
          if (active) {
            setProfile(data as UserProfile);
          }
        } else {
          // If no profile exists, automatically create one
          const fullName = user.user_metadata?.full_name || '';
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: fullName,
              role: 'citizen',
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error auto-creating profile:', {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code
            });
            if (active) {
              setProfile(null);
            }
          } else if (newProfile) {
            if (active) {
              setProfile(newProfile as UserProfile);
            }
          }
        }
      } catch (err) {
        // Remove all profile-fetching runtime errors to ensure the dashboard never crashes
        console.error('Unexpected error during profile fetch:', err);
        if (active) {
          setProfile(null);
        }
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    }

    fetchOrCreateProfile();

    return () => {
      active = false;
    };
  }, [user, session, authLoading, supabase]);

  return { profile, loadingProfile };
}
