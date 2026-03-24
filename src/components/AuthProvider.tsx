import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'faculty' | null;

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async (currentUser: User | null) => {
      if (!currentUser?.email) {
        setRole(null);
        return;
      }
      try {
        const { data, error } = await (supabase as any)
          .from('faculty')
          .select('id')
          .eq('email', currentUser.email)
          .maybeSingle();
        
        if (data) {
          setRole('faculty');
        } else {
          setRole('admin');
        }
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole('admin'); // Fallback or handle appropriately
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        await fetchRole(currentSession?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        await fetchRole(currentSession?.user ?? null);
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
