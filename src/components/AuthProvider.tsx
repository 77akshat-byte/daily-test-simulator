import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const client = getSupabaseClient();
      setSupabase(client);
      
      // Only get initial session, don't validate yet
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          setToken(session.access_token);
        }
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, session) => {
        setToken(session?.access_token ?? null);
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize authentication');
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const getToken = async (): Promise<string | null> => {
    try {
      console.log('[AuthProvider] Getting fresh token...');
      
      // Always get a fresh session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AuthProvider] Session error:', error.message);
        return null;
      }

      if (!session?.access_token) {
        console.error('[AuthProvider] No access token in session');
        return null;
      }

      console.log('[AuthProvider] Fresh token obtained, length:', session.access_token.length);
      setToken(session.access_token);
      return session.access_token;
    } catch (error) {
      console.error('[AuthProvider] Error getting token:', error);
      return null;
    }
  };

  const validateAndRefreshToken = async (): Promise<string | null> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        return null;
      }

      if (session?.access_token) {
        setToken(session.access_token);
        return session.access_token;
      }

      return null;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-destructive/10 border border-destructive rounded-lg p-6">
          <h2 className="text-xl font-bold text-destructive mb-2">Configuration Error</h2>
          <p className="text-sm mb-4">{error}</p>
          <p className="text-xs text-muted-foreground">
            Please check that your Supabase credentials are properly configured in the .env file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, getToken, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}





