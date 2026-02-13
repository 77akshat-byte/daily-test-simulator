import { useState, useEffect, lazy, Suspense } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClientSingleton } from '../lib/supabase';
import { AuthProvider } from './AuthProvider';

// Lazy load heavy components
const LandingPage = lazy(() => import('./LandingPage').then(m => ({ default: m.LandingPage })));
const LoginForm = lazy(() => import('./LoginForm').then(m => ({ default: m.LoginForm })));
const Dashboard = lazy(() => import('./Dashboard').then(m => ({ default: m.Dashboard })));
const TestSimulator = lazy(() => import('./TestSimulator').then(m => ({ default: m.TestSimulator })));

type View = 'dashboard' | 'test';

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export function TestApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [testStatus, setTestStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [testScore, setTestScore] = useState<{ score: number; total: number } | null>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [reviewAttemptId, setReviewAttemptId] = useState<number | undefined>(undefined);
  const [showTest, setShowTest] = useState(false);

  useEffect(() => {
    console.log('TestApp mounted - starting auth check');
    
    const timeoutId = setTimeout(() => {
      console.error('Auth check timeout - forcing continue');
      setLoading(false);
      setError('Connection timeout. You can still try to sign in.');
    }, 5000);

    // Check for existing session
    const checkSession = async () => {
      try {
        const supabase = getSupabaseClientSingleton();
        const { data: { session } } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        console.log('Session check complete:', session ? 'User logged in' : 'No session');
        setUser(session?.user ?? null);
        setAuthToken(session?.access_token || '');
        setLoading(false);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Session error:', err);
        setError('Failed to check login status. You can still try to sign in.');
        setLoading(false);
      }
    };

    checkSession();

    return () => clearTimeout(timeoutId);
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClientSingleton();
      await supabase.auth.signOut();
      setUser(null);
      setShowLogin(false);
      setCurrentView('dashboard');
      setAuthToken('');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleUserLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView('dashboard');
    // Get fresh token after login
    const supabase = getSupabaseClientSingleton();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthToken(session?.access_token || '');
    });
  };

  const handleViewResults = (attemptId?: number) => {
    setReviewAttemptId(attemptId);
    setCurrentView('test');
  };

  console.log('TestApp render - loading:', loading, 'user:', !!user, 'showLogin:', showLogin, 'currentView:', currentView);

  if (loading) {
    console.log('Rendering loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
          <p className="text-xs text-muted-foreground mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (!showLogin) {
      console.log('Rendering landing page');
      try {
        return (
          <div>
            {error && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 text-sm">
                {error}
              </div>
            )}
            <Suspense fallback={<LoadingFallback />}>
              <LandingPage onGetStarted={() => {
                console.log('Get Started clicked - setting showLogin to true');
                setShowLogin(true);
                console.log('showLogin is now:', true);
              }} />
            </Suspense>
          </div>
        );
      } catch (err) {
        console.error('Error rendering landing page:', err);
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Landing Page</h1>
              <p className="text-sm mb-4">{String(err)}</p>
              <button 
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                Skip to Login
              </button>
            </div>
          </div>
        );
      }
    }
    console.log('showLogin is true, rendering login form wrapped in AuthProvider');
    return (
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <LoginForm onSuccess={handleUserLogin} />
        </Suspense>
      </AuthProvider>
    );
  }

  console.log('User exists, currentView:', currentView);

  if (currentView === 'dashboard') {
    return (
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Dashboard
            userName={user.email?.split('@')[0] || 'Student'}
            testStatus={testStatus}
            score={testScore?.score}
            totalQuestions={testScore?.total}
            onStartTest={() => setCurrentView('test')}
            onContinueTest={() => setCurrentView('test')}
            onViewResults={handleViewResults}
            onLogout={handleLogout}
            token={authToken}
          />
        </Suspense>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      {currentView === 'test' && user && (
        <Suspense fallback={<LoadingFallback />}>
          <TestSimulator 
            user={user} 
            onLogout={handleLogout}
            onBackToDashboard={() => {
              setReviewAttemptId(undefined);
              setCurrentView('dashboard');
            }}
            onTestStatusChange={(status, score) => {
              setTestStatus(status);
              if (score) setTestScore(score);
            }}
            reviewAttemptId={reviewAttemptId}
          />
        </Suspense>
      )}
    </AuthProvider>
  );
}














