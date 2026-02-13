import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Zap,
  BookOpen,
  Loader2,
  CheckCircle2,
  Minus,
  AlertCircle,
  Award
} from 'lucide-react';
import { baseUrl } from '../lib/base-url';

interface SubjectStats {
  subject: string;
  correct: number;
  incorrect: number;
  total: number;
  percentage: number;
  accuracy: number;
  avgTime: number;
}

interface DiagnosticData {
  overallAccuracy: number;
  totalAttempts: number;
  totalQuestions: number;
  totalAnswered: number;
  avgTimePerQuestion: number;
  averageScore: number;
  trend: number;
  subjectBreakdown: SubjectStats[];
  weakestSubject: string;
  strongestSubject: string;
  speedAnalysis: {
    questionsPerMinute: number;
    accuracyVsSpeed: string;
  };
  conceptVsSpeed: {
    issue: 'concepts' | 'speed' | 'accuracy' | 'balanced';
    recommendation: string;
  };
  recentPerformance: {
    date: string;
    score: number;
    total: number;
    percentage: number;
  }[];
}

interface CSATDiagnosticProps {
  token: string;
  isCompact?: boolean;
}

export function CSATDiagnostic({ token, isCompact = false }: CSATDiagnosticProps) {
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showDetailed, setShowDetailed] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('overall');

  useEffect(() => {
    loadDiagnostic();
  }, [token]);

  const loadDiagnostic = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${baseUrl}/api/diagnostic`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError((data as any).message || 'No test history found');
        } else {
          const errorMsg = (data as any).error || 'Failed to load diagnostic';
          const details = (data as any).details ? ` - ${(data as any).details}` : '';
          setError(errorMsg + details);
          console.error('[CSATDiagnostic] Error response:', JSON.stringify(data, null, 2));
          console.error('[CSATDiagnostic] Full error object:', data);
        }
        return;
      }

      console.log('[CSATDiagnostic] Diagnostic loaded:', data);
      setDiagnostic(data as DiagnosticData);
    } catch (err) {
      console.error('Error loading diagnostic:', err);
      setError(`Failed to load diagnostic analysis: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            CSAT Diagnostic Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Analyzing your performance...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !diagnostic) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            CSAT Diagnostic Engine
          </CardTitle>
          <CardDescription>AI-Powered Performance Analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-900 dark:text-red-100">
                <div className="font-semibold mb-1">Failed to load diagnostic</div>
                <div className="text-sm">{error || 'Complete your first test to see diagnostic analysis'}</div>
              </AlertDescription>
            </Alert>
            {error && (
              <Button onClick={loadDiagnostic} variant="outline" className="w-full">
                <Loader2 className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIssueIcon = (issue: string) => {
    switch (issue) {
      case 'concepts':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'speed':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'accuracy':
        return <Target className="h-4 w-4 text-yellow-500" />;
      case 'balanced':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getIssueColor = (issue: string) => {
    switch (issue) {
      case 'concepts':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
      case 'speed':
        return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100';
      case 'accuracy':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100';
      case 'balanced':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100';
      default:
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
    }
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      'Mathematics': 'bg-blue-500',
      'Math': 'bg-blue-500',
      'Reasoning': 'bg-green-500',
      'Logic': 'bg-green-500',
      'Science': 'bg-purple-500',
      'English': 'bg-pink-500',
      'Comprehension': 'bg-indigo-500',
      'General Knowledge': 'bg-orange-500',
      'GK': 'bg-orange-500',
      'Current Affairs': 'bg-red-500',
    };
    
    for (const key in colors) {
      if (subject.toLowerCase().includes(key.toLowerCase())) {
        return colors[key];
      }
    }
    return 'bg-gray-500';
  };

  if (isCompact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            CSAT Diagnostic Engine
          </CardTitle>
          <CardDescription>AI-Powered Performance Analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Accuracy</span>
              </div>
              <div className="text-2xl font-bold">{diagnostic.overallAccuracy}%</div>
              <div className="text-xs text-muted-foreground">
                {diagnostic.totalAttempts} test{diagnostic.totalAttempts !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {diagnostic.trend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : diagnostic.trend < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-sm font-medium">Trend</span>
              </div>
              <div className="text-2xl font-bold">
                {diagnostic.trend > 0 ? '+' : ''}{diagnostic.trend}%
              </div>
              <div className="text-xs text-muted-foreground">vs previous</div>
            </div>
          </div>

          <div className="space-y-3">
            {diagnostic.subjectBreakdown.map((subject) => (
              <div key={subject.subject}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{subject.subject}</span>
                  <span className="font-medium">
                    {subject.correct}/{subject.total} ({subject.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getSubjectColor(subject.subject)}`} 
                    style={{ width: `${subject.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <Alert className={getIssueColor(diagnostic.conceptVsSpeed.issue)}>
            <AlertDescription>
              <div className="font-semibold mb-1.5">
                {diagnostic.conceptVsSpeed.issue === 'concepts' && 'Focus Area: Concepts'}
                {diagnostic.conceptVsSpeed.issue === 'speed' && 'Focus Area: Speed'}
                {diagnostic.conceptVsSpeed.issue === 'accuracy' && 'Focus Area: Accuracy'}
                {diagnostic.conceptVsSpeed.issue === 'balanced' && 'Performance: Balanced'}
              </div>
              <div className="text-sm leading-relaxed">
                {diagnostic.conceptVsSpeed.recommendation}
              </div>
            </AlertDescription>
          </Alert>

          {diagnostic.speedAnalysis.questionsPerMinute > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Speed Analysis</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {diagnostic.speedAnalysis.questionsPerMinute} questions/min
                {diagnostic.speedAnalysis.accuracyVsSpeed === 'too_fast' && (
                  <Badge variant="destructive" className="ml-2 text-xs">Too Fast</Badge>
                )}
                {diagnostic.speedAnalysis.accuracyVsSpeed === 'too_slow' && (
                  <Badge variant="secondary" className="ml-2 text-xs">Too Slow</Badge>
                )}
                {diagnostic.speedAnalysis.accuracyVsSpeed === 'balanced' && (
                  <Badge variant="default" className="ml-2 text-xs">Good Pace</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full detailed view
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            CSAT Diagnostic Engine
          </CardTitle>
          <CardDescription>
            AI-Powered Analysis • Based on {diagnostic.totalAttempts} test{diagnostic.totalAttempts !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {diagnostic.overallAccuracy}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Accuracy</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold mb-1">
                {diagnostic.trend > 0 ? '+' : ''}{diagnostic.trend}%
              </div>
              <div className="text-sm text-muted-foreground">Recent Trend</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold mb-1">
                {diagnostic.averageScore}
              </div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold mb-1">
                {diagnostic.speedAnalysis.questionsPerMinute > 0 
                  ? diagnostic.speedAnalysis.questionsPerMinute 
                  : '—'}
              </div>
              <div className="text-sm text-muted-foreground">Q's per Min</div>
            </div>
          </div>

          {/* Main Issue Alert */}
          <Alert className={getIssueColor(diagnostic.conceptVsSpeed.issue)}>
            <AlertDescription>
              <div className="font-semibold mb-1.5">
                {diagnostic.conceptVsSpeed.issue === 'concepts' && 'Primary Issue: Conceptual Understanding'}
                {diagnostic.conceptVsSpeed.issue === 'speed' && 'Primary Issue: Problem-Solving Speed'}
                {diagnostic.conceptVsSpeed.issue === 'accuracy' && 'Primary Issue: Answer Accuracy'}
                {diagnostic.conceptVsSpeed.issue === 'balanced' && 'Performance Status: Well-Balanced'}
              </div>
              <div className="leading-relaxed">
                {diagnostic.conceptVsSpeed.recommendation}
              </div>
            </AlertDescription>
          </Alert>

          {/* Topic-wise Analysis */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Topic-wise Performance</h3>
            
            {/* Topic Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTopic === 'overall' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTopic('overall')}
              >
                Overall
              </Button>
              {diagnostic.subjectBreakdown.map((subject) => (
                <Button
                  key={subject.subject}
                  variant={selectedTopic === subject.subject ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTopic(subject.subject)}
                >
                  {subject.subject}
                </Button>
              ))}
            </div>

            {/* Topic Stats Display */}
            <Card>
              <CardContent className="pt-6">
                {selectedTopic === 'overall' ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Questions Answered</div>
                      <div className="text-2xl font-bold">
                        {diagnostic.totalAnswered || 0}/{diagnostic.totalQuestions || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {diagnostic.totalQuestions > 0 
                          ? ((diagnostic.totalAnswered / diagnostic.totalQuestions) * 100).toFixed(0)
                          : 0}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Accuracy</div>
                      <div className="text-2xl font-bold">
                        {diagnostic.overallAccuracy?.toFixed(1) || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        of answered questions
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Avg Time</div>
                      <div className="text-2xl font-bold">
                        {diagnostic.avgTimePerQuestion?.toFixed(0) || 0}s
                      </div>
                      <div className="text-sm text-muted-foreground">
                        per question
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {diagnostic.subjectBreakdown
                      .filter((subject) => subject.subject === selectedTopic)
                      .map((subject) => (
                        <div key={subject.subject} className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Questions Answered</div>
                            <div className="text-2xl font-bold">
                              {subject.correct + subject.incorrect}/{subject.total}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {(((subject.correct + subject.incorrect) / subject.total) * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Accuracy</div>
                            <div className="text-2xl font-bold">
                              {subject.accuracy.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {subject.correct} correct
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Avg Time</div>
                            <div className="text-2xl font-bold">
                              {subject.avgTime.toFixed(0)}s
                            </div>
                            <div className="text-sm text-muted-foreground">
                              per question
                            </div>
                          </div>
                        </div>
                      ))}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Trend */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Performance Trend
            </h3>
            <div className="space-y-2">
              {diagnostic.recentPerformance.map((perf, index) => (
                <div 
                  key={perf.date}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? 'default' : 'outline'}>
                      {new Date(perf.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {perf.score}/{perf.total}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{perf.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
















