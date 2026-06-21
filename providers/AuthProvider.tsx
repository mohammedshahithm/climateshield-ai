"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useAuth } from '../hooks/useAuth';
import { useProfile, UserProfile } from '../hooks/useProfile';
import { createClient } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, session, loading: authLoading } = useAuth();
  const { profile, loadingProfile } = useProfile();
  const router = useRouter();
  const supabase = createClient();

  const loading = authLoading || loadingProfile;

  const logout = useCallback(async () => {
    console.log("Logout started");
    const toastId = toast.loading("Logging out...");
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log("Logout success");
      toast.success("Successfully logged out", { id: toastId });
      
      // Clear cached data locally
      localStorage.clear();
      sessionStorage.clear();
      
      // Navigate to login and refresh to clear server components cache
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      console.log("Logout failed");
      toast.error("Failed to log out", { id: toastId });
    }
  }, [router, supabase]);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
