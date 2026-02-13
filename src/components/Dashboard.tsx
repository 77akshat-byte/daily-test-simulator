import { useState, useEffect, lazy, Suspense } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, CheckCircle, Clock, TrendingUp, Trophy, Award, Users, Flame, Star, Activity, History, Eye } from 'lucide-react';
import { baseUrl } from '../lib/base-url';

// Lazy load CSAT Diagnostic (heavy component)
const CSATDiagnostic = lazy(() => import('./CSATDiagnostic').then(m => ({ default: m.CSATDiagnostic })));

interface DashboardProps {
  userName: string;
  testStatus: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  totalQuestions?: number;
  onStartTest: () => void;
  onContinueTest: () => void;
  onViewResults: (attemptId?: number) => void;
  onLogout: () => void;
  token: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  isCurrentUser: boolean;
  submittedAt: string;
}

interface PlatformStats {
  totalUsers: number;
  totalTestsTaken: number;
  testsToday: number;
  averagePlatformScore: number;
}

interface PersonalStats {
  currentStreak: number;
  longestStreak: number;
  totalTestsCompleted: number;
  averageScore: number;
  bestScore: number;
  lastTestDate: string | null;
}

interface TestHistoryEntry {
  id: number;
  testDate: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  submittedAt: string;
}

export function Dashboard({
  userName,
  testStatus,
  score,
  totalQuestions,
  onStartTest,
  onContinueTest,
  onViewResults,
  onLogout,
  token,
}: DashboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardDate, setLeaderboardDate] = useState<string>('');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [testHistory, setTestHistory] = useState<TestHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadLeaderboard();
    loadStats();
    loadTestHistory();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const response = await fetch(`${baseUrl}/api/leaderboard/yesterday`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard((data as any).entries || []);
        setLeaderboardDate((data as any).date || '');
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch(`${baseUrl}/api/platform-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlatformStats((data as any).platform || null);
        setPersonalStats((data as any).personal || null);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadTestHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`${baseUrl}/api/test/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestHistory((data as any).tests || []);
      }
    } catch (error) {
      console.error('Error loading test history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const yesterdayFormatted = leaderboardDate 
    ? new Date(leaderboardDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    : 'Yesterday';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
            <p className="text-muted-foreground">{today}</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Sign Out
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Today's Test Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Test
              </CardTitle>
              <CardDescription>25 Multiple Choice Questions</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              {testStatus === 'not_started' && (
                <>
                  <div className="flex-1 space-y-4 mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Estimated time: 30-45 minutes</span>
                    </div>
                    <p className="text-sm">
                      Today's test covers various subjects including Math, Science, English, and more.
                      Answer all 25 questions to complete the test.
                    </p>
                  </div>
                  <Button onClick={onStartTest} size="lg" className="w-full">
                    Start Today's Test
                  </Button>
                </>
              )}

              {testStatus === 'in_progress' && (
                <>
                  <div className="flex-1 space-y-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        In Progress
                      </Badge>
                    </div>
                    <p className="text-sm">
                      You have started today's test. Continue where you left off.
                    </p>
                  </div>
                  <Button onClick={onContinueTest} size="lg" className="w-full">
                    Continue Test
                  </Button>
                </>
              )}

              {testStatus === 'completed' && score !== undefined && totalQuestions !== undefined && (
                <>
                  <div className="flex-1 space-y-4 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <Badge variant="default" className="text-sm">
                        Completed
                      </Badge>
                    </div>
                    <div className="bg-muted rounded-lg p-6 text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {score}/{totalQuestions}
                      </div>
                      <div className="text-lg text-muted-foreground">
                        {Math.round((score / totalQuestions) * 100)}%
                      </div>
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      Come back tomorrow for a new test!
                    </p>
                  </div>
                  <Button onClick={onViewResults} size="lg" className="w-full" variant="secondary">
                    View Detailed Results
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats - Split into two cards side by side */}
          <div className="grid grid-cols-2 gap-6">
            {/* Platform Stats Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-4 w-4" />
                  Platform Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Loading stats...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        Total Users
                      </div>
                      <div className="text-2xl font-bold">{platformStats?.totalUsers || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-green-500" />
                        Tests Today
                      </div>
                      <div className="text-2xl font-bold">{platformStats?.testsToday || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                        Platform Average
                      </div>
                      <div className="text-2xl font-bold">{platformStats?.averagePlatformScore || 0}%</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personal Stats Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-4 w-4" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Loading stats...
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5 text-orange-500" />
                          Current Streak
                        </div>
                        <div className="text-2xl font-bold">{personalStats?.currentStreak || 0} days</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          Tests Completed
                        </div>
                        <div className="text-2xl font-bold">{personalStats?.totalTestsCompleted || 0}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 text-yellow-500" />
                            Best
                          </div>
                          <div className="text-xl font-bold">{personalStats?.bestScore || 0}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                            Average
                          </div>
                          <div className="text-xl font-bold">{personalStats?.averageScore || 0}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Streak Highlight if active */}
                    {personalStats && personalStats.currentStreak >= 3 && (
                      <div className="mt-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2.5">
                        <div className="flex items-center gap-2">
                          <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-orange-900 dark:text-orange-100">
                              🔥 {personalStats.currentStreak} Day Streak!
                            </div>
                            <div className="text-[10px] text-orange-700 dark:text-orange-300">
                              Keep going!
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Longest Streak Badge */}
                    {personalStats && personalStats.longestStreak >= 5 && (
                      <div className="text-center pt-2">
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                          🏆 Best: {personalStats.longestStreak}d
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Leaderboard and CSAT Diagnostic */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Yesterday's Leaderboard
              </CardTitle>
              <CardDescription>{yesterdayFormatted}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLeaderboard ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading leaderboard...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No results for yesterday yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        entry.isCurrentUser
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border">
                        {entry.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                        {entry.rank === 2 && <Award className="h-4 w-4 text-gray-400" />}
                        {entry.rank === 3 && <Award className="h-4 w-4 text-amber-600" />}
                        {entry.rank > 3 && <span className="text-sm font-semibold">{entry.rank}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {entry.name}
                          {entry.isCurrentUser && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(entry.submittedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {entry.score}/{entry.totalQuestions}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSAT Diagnostic Engine - Real Component */}
          <Suspense fallback={
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  CSAT Diagnostic Engine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Loading diagnostic...
                </div>
              </CardContent>
            </Card>
          }>
            <CSATDiagnostic token={token} isCompact={true} />
          </Suspense>
        </div>

        {/* Your Tests History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Your Tests
            </CardTitle>
            <CardDescription>Review your past test performance</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading test history...
              </div>
            ) : testHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tests completed yet. Start your first test today!
              </div>
            ) : (
              <div className="space-y-2">
                {testHistory.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {new Date(test.testDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <Badge 
                          variant={test.percentage >= 80 ? 'default' : test.percentage >= 60 ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {test.percentage >= 80 ? 'Excellent' : test.percentage >= 60 ? 'Good' : 'Needs Work'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Submitted at {new Date(test.submittedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="text-2xl font-bold text-primary">
                        {test.percentage}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {test.score}/{test.totalQuestions}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewResults(test.id)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



















