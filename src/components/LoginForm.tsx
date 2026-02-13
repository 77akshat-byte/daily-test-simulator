import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClientSingleton } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface LoginFormProps {
  onSuccess: (user: User) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  console.log('LoginForm rendering');
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug environment variables on mount
  useEffect(() => {
    console.log('🔍 Environment Variables Check:', {
      hasSupabaseUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      urlPreview: import.meta.env.PUBLIC_SUPABASE_URL 
        ? `${import.meta.env.PUBLIC_SUPABASE_URL.substring(0, 30)}...` 
        : 'MISSING',
      keyLength: import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.length || 0
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting', isLogin ? 'login' : 'signup');
      
      const supabase = getSupabaseClientSingleton();
      
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          console.log('Login successful');
          onSuccess(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          console.log('Signup successful');
          onSuccess(data.user);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Better error messages
      let errorMessage = err.message || 'Authentication failed';
      
      if (errorMessage.includes('Missing Supabase configuration')) {
        errorMessage = '⚠️ Configuration Error: Supabase is not properly configured. Please check your environment variables.';
      } else if (errorMessage.includes('Invalid API key')) {
        errorMessage = '⚠️ Invalid API Key: The Supabase API key is incorrect. Please check your PUBLIC_SUPABASE_ANON_KEY.';
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  console.log('LoginForm render state - isLogin:', isLogin, 'loading:', loading);

  try {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{isLogin ? 'Sign In' : 'Sign Up'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Welcome back! Sign in to continue.' : 'Create an account to get started.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  console.log('Toggle form to', isLogin ? 'signup' : 'login');
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-primary hover:underline"
                disabled={loading}
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (err) {
    console.error('Error rendering LoginForm:', err);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Login Form</h1>
          <p className="text-sm">{String(err)}</p>
        </div>
      </div>
    );
  }
}






