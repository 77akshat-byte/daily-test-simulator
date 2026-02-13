import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { baseUrl } from '../lib/base-url';

interface Stats {
  totalQuestions: number;
  totalAttempts: number;
  totalDailySets: number;
  recentAttempts: Array<{
    test_date: string;
    attempts: number;
    avg_score: number;
    max_score: number;
    min_score: number;
  }>;
  userAttempts: Array<{
    user_id: string;
    test_date: string;
    score: number;
    total_questions: number;
    completed_at: string;
    started_at: string;
  }>;
  topPerformers: Array<{
    user_id: string;
    tests_taken: number;
    avg_score: number;
    best_score: number;
    lowest_score: number;
  }>;
  subjectBreakdown: Array<{
    subject: string;
    count: number;
  }>;
}

export function StatsView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/admin/stats`);
      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Test Simulator Statistics</h1>
        <p className="text-muted-foreground">Overview of system usage and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Questions</CardTitle>
            <CardDescription>Available in database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalQuestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Attempts</CardTitle>
            <CardDescription>Tests taken by students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalAttempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Sets</CardTitle>
            <CardDescription>Unique test days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalDailySets}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Students ranked by average score</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topPerformers.length === 0 ? (
              <p className="text-muted-foreground">No test results yet</p>
            ) : (
              <div className="space-y-3">
                {stats.topPerformers.map((performer, index) => (
                  <div key={performer.user_id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={index < 3 ? "default" : "outline"}>
                          #{index + 1}
                        </Badge>
                        <span className="font-mono text-sm">{performer.user_id.substring(0, 8)}...</span>
                      </div>
                      <Badge variant="secondary">{performer.tests_taken} tests</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Average</div>
                        <div className="font-bold text-lg">{performer.avg_score.toFixed(1)}/25</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Best</div>
                        <div className="font-semibold">{performer.best_score}/25</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Lowest</div>
                        <div className="font-semibold">{performer.lowest_score}/25</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Test Submissions</CardTitle>
            <CardDescription>Last 100 completed tests</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.userAttempts.length === 0 ? (
              <p className="text-muted-foreground">No completed tests yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stats.userAttempts.map((attempt, index) => (
                  <div key={`${attempt.user_id}-${attempt.test_date}-${index}`} className="border-b pb-2 flex justify-between items-center">
                    <div>
                      <div className="font-mono text-sm">{attempt.user_id.substring(0, 12)}...</div>
                      <div className="text-xs text-muted-foreground">
                        {attempt.test_date} • {new Date(attempt.completed_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {attempt.score}/{attempt.total_questions}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {((attempt.score / attempt.total_questions) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Questions by Subject</CardTitle>
            <CardDescription>Distribution of available questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.subjectBreakdown.map((item) => (
                <div key={item.subject} className="flex justify-between items-center">
                  <Badge variant="outline">{item.subject}</Badge>
                  <span className="font-semibold">{item.count} questions</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Test Performance</CardTitle>
            <CardDescription>Last 10 test days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentAttempts.length === 0 ? (
                <p className="text-muted-foreground">No completed tests yet</p>
              ) : (
                stats.recentAttempts.map((item) => (
                  <div key={item.test_date} className="border-b pb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">{item.test_date}</span>
                      <Badge>{item.attempts} attempts</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground grid grid-cols-3 gap-2">
                      <div>
                        Avg: <span className="font-semibold">{item.avg_score?.toFixed(1)}/25</span>
                      </div>
                      <div>
                        Max: <span className="font-semibold">{item.max_score}/25</span>
                      </div>
                      <div>
                        Min: <span className="font-semibold">{item.min_score}/25</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Quick Tips</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Add more questions to increase variety: <code className="bg-background px-1 rounded">npm run db:query</code></li>
          <li>• Questions are randomly selected each day to create unique tests</li>
          <li>• Visit <code className="bg-background px-1 rounded">/stats</code> to view these statistics anytime</li>
        </ul>
      </div>
    </div>
  );
}

