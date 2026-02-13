import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, RefreshCw, Database, FileSpreadsheet, CheckCircle, AlertCircle, Clock, ShieldAlert } from 'lucide-react';

interface SyncResult {
  success: boolean;
  added: number;
  updated: number;
  total: number;
  validationErrors?: string[];
  syncErrors?: string[];
  message: string;
}

interface SyncLog {
  id: number;
  questions_added: number;
  questions_updated: number;
  synced_at: string;
  errors: string;
}

interface QuestionStats {
  total: number;
  bySubject: Record<string, number>;
  byDifficulty: Record<string, number>;
}

export function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [recentSyncs, setRecentSyncs] = useState<SyncLog[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('supabase_token');
      
      if (!token) {
        // Not logged in, redirect to home
        window.location.href = '/';
        return;
      }

      // Try to access admin stats endpoint to verify admin status
      const response = await fetch('/api/admin/question-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        // Not authorized or not admin
        alert('Access denied. Admin privileges required.');
        window.location.href = '/';
        return;
      }

      if (response.ok) {
        // User is admin, load data
        setIsAdmin(true);
        const data = await response.json();
        setStats(data);
        await loadRecentSyncs();
      }
    } catch (err) {
      console.error('Failed to check admin access:', err);
      alert('Failed to verify admin access.');
      window.location.href = '/';
    } finally {
      setCheckingAuth(false);
      setLoadingStats(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('supabase_token');
      const response = await fetch('/api/admin/question-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadRecentSyncs = async () => {
    try {
      const token = localStorage.getItem('supabase_token');
      const response = await fetch('/api/admin/sync-logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecentSyncs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load sync logs:', err);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const token = localStorage.getItem('supabase_token');
      
      const response = await fetch(`${baseUrl}/api/admin/sync-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId, sheetName })
      });
      const data = await response.json() as SyncResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync questions');
      }

      setSyncResult(data);
      
      // Reload stats after successful sync
      await loadStats();
      await loadRecentSyncs();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not admin (shouldn't reach here due to redirect, but as fallback)
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>Access Denied</strong>
            <p className="mt-2">You do not have permission to access this page.</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage questions from Google Sheets</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {stats ? Object.keys(stats.bySubject).length : 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-sm">
                {recentSyncs.length > 0 
                  ? formatDate(recentSyncs[0].synced_at)
                  : 'Never'
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync Button */}
      <Card>
        <CardHeader>
          <CardTitle>Sync from Google Sheets</CardTitle>
          <CardDescription>
            Import or update questions from your Google Sheet. New questions will be added, existing questions (by ID) will be updated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleSync} 
            disabled={isLoading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Questions
              </>
            )}
          </Button>

          {/* Success Message */}
          {syncResult && syncResult.success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>{syncResult.message}</strong>
                <div className="mt-2 text-sm">
                  <div>✓ {syncResult.added} questions added</div>
                  <div>✓ {syncResult.updated} questions updated</div>
                </div>
                {syncResult.validationErrors && syncResult.validationErrors.length > 0 && (
                  <div className="mt-2 text-sm">
                    <strong>Validation warnings:</strong>
                    <ul className="list-disc list-inside">
                      {syncResult.validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Sync failed:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Question Breakdown */}
      {stats && !loadingStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>By Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.bySubject).map(([subject, count]) => (
                  <div key={subject} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{subject}</span>
                    <span className="text-sm text-muted-foreground">{count} questions</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.byDifficulty).map(([difficulty, count]) => (
                  <div key={difficulty} className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{difficulty}</span>
                    <span className="text-sm text-muted-foreground">{count} questions</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Syncs */}
      {recentSyncs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sync History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSyncs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="text-sm font-medium">{formatDate(log.synced_at)}</div>
                    <div className="text-xs text-muted-foreground">
                      +{log.questions_added} added, {log.questions_updated} updated
                    </div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Google Sheets Setup</CardTitle>
          <CardDescription>Follow these steps if you haven't set up Google Sheets yet</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Create a Google Sheet with columns: id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, difficulty, video_url, video_type</li>
            <li>Create a Google Cloud Project and enable Google Sheets API</li>
            <li>Create a Service Account and download the JSON credentials</li>
            <li>Share your Google Sheet with the service account email</li>
            <li>Add GOOGLE_SHEETS_CREDENTIALS and GOOGLE_SHEET_ID to Cloudflare environment variables</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}


