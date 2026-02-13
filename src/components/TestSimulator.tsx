import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import type { User } from '@supabase/supabase-js';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { baseUrl } from '../lib/base-url';
import { ArrowLeft } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  subject: string;
  difficulty: string;
  image_url?: string;
  video_url?: string;
  video_type?: string;
}

interface TestData {
  questions: Question[];
  attemptId: number | null;
  isCompleted: boolean;
  score: number | null;
  testDate: string;
}

interface TestResult {
  question_id: number;
  user_answer: string;
  is_correct: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  subject: string;
  image_url: string | null;
  video_url: string | null;
  video_type: 'youtube' | 'stream' | null;
}

interface TestSimulatorProps {
  user: User;
  onLogout: () => void;
  onBackToDashboard: () => void;
  onTestStatusChange: (status: 'not_started' | 'in_progress' | 'completed', score?: { score: number; total: number }) => void;
  reviewAttemptId?: number;
}

export function TestSimulator({ user, onLogout, onBackToDashboard, onTestStatusChange, reviewAttemptId }: TestSimulatorProps) {
  const { getToken } = useAuth();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (reviewAttemptId) {
      loadTestReview(reviewAttemptId);
    } else {
      loadTodaysTest();
    }
  }, [reviewAttemptId]);

  const loadTodaysTest = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading today\'s test...');
      const token = await getToken();
      console.log('Token obtained:', token ? 'yes' : 'no');
      
      const url = `${baseUrl}/api/test/today`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Failed to load test (${response.status})`);
      }

      const data = await response.json();
      console.log('Test data loaded:', data);
      setTestData(data);

      if (data.isCompleted) {
        console.log('Test already completed, loading results');
        setShowResults(true);
        onTestStatusChange('completed', { score: data.score || 0, total: data.questions.length });
        await loadResults(data.attemptId);
      } else if (!data.attemptId) {
        console.log('No attempt yet, starting new test');
        onTestStatusChange('not_started');
        await startTest();
      } else {
        console.log('Test in progress');
        onTestStatusChange('in_progress');
      }
    } catch (err: any) {
      console.error('Error in loadTodaysTest:', err);
      setError(err.message || 'Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  const loadTestReview = async (attemptId: number) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading test review for attempt:', attemptId);
      const token = await getToken();
      
      const response = await fetch(`${baseUrl}/api/test/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attemptId }),
      });

      if (!response.ok) {
        throw new Error('Failed to load test results');
      }

      const data = await response.json() as {
        score: number;
        totalQuestions: number;
        percentage: number;
        testDate: string;
        results: TestResult[];
      };
      console.log('Review data loaded:', data);
      
      setResults(data);
      setShowResults(true);
      onTestStatusChange('completed', { score: data.score, total: data.totalQuestions });
      
      // Set test data for the results view
      setTestData({
        questions: [],
        attemptId: attemptId,
        isCompleted: true,
        score: data.score,
        testDate: data.testDate || 'Unknown'
      });
    } catch (err: any) {
      console.error('Error in loadTestReview:', err);
      setError(err.message || 'Failed to load test review');
    } finally {
      setLoading(false);
    }
  };

  const startTest = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${baseUrl}/api/test/start`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to start test');

      const data = await response.json();
      setTestData((prev) => (prev ? { ...prev, attemptId: data.attemptId } : null));
      onTestStatusChange('in_progress');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAnswerChange = async (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    try {
      const token = await getToken();
      await fetch(`${baseUrl}/api/test/answer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptId: testData?.attemptId,
          questionId,
          answer,
        }),
      });
    } catch (err) {
      console.error('Error saving answer:', err);
    }
  };

  const handleSubmit = async () => {
    const unanswered = testData?.questions.filter((q) => !answers[q.id]).length || 0;
    
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    setError(''); // Clear previous errors
    try {
      console.log('Getting fresh token for submission...');
      const token = await getToken();
      console.log('Token obtained:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('Attempt ID:', testData?.attemptId);
      
      const response = await fetch(`${baseUrl}/api/test/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptId: testData?.attemptId,
        }),
      });

      const data = await response.json();
      console.log('Submit response:', response.status, data);
      
      if (!response.ok) {
        console.error('Submit error:', data);
        throw new Error(data.details || data.error || 'Failed to submit test');
      }

      setResults(data);
      setShowResults(true);
      onTestStatusChange('completed', { score: data.score, total: data.totalQuestions });
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const loadResults = async (attemptId: number) => {
    try {
      const token = await getToken();
      const response = await fetch(`${baseUrl}/api/test/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attemptId }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (err) {
      console.error('Error loading results:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl">Loading today's test...</div>
        </div>
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

  if (showResults && results) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBackToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Test Results</h1>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Sign Out
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Score</CardTitle>
            <CardDescription>Test Date: {testData?.testDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">
                {results.score}/{results.totalQuestions}
              </div>
              <div className="text-2xl text-muted-foreground mb-4">
                {results.percentage}%
              </div>
              <Progress value={results.percentage} className="h-4" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Question Review</h2>
          {results.results.map((result: TestResult, index: number) => (
            <Card key={result.question_id} className={result.is_correct ? 'border-green-500' : 'border-red-500'}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    Question {index + 1}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{result.subject}</Badge>
                    <Badge variant={result.is_correct ? 'default' : 'destructive'}>
                      {result.is_correct ? 'Correct' : 'Incorrect'}
                    </Badge>
                  </div>
                </div>
                <CardDescription>{result.question_text}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-border">
                    <img 
                      src={result.image_url} 
                      alt="Question diagram" 
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  {['A', 'B', 'C', 'D'].map((option) => {
                    const optionText = result[`option_${option.toLowerCase()}` as keyof TestResult] as string;
                    const isUserAnswer = result.user_answer === option;
                    const isCorrect = result.correct_answer === option;
                    
                    return (
                      <div
                        key={option}
                        className={`p-3 rounded border ${
                          isCorrect
                            ? 'bg-green-50 border-green-500'
                            : isUserAnswer
                            ? 'bg-red-50 border-red-500'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{option}.</span>
                          <span>{optionText}</span>
                          {isCorrect && <Badge variant="default">Correct Answer</Badge>}
                          {isUserAnswer && !isCorrect && (
                            <Badge variant="destructive">Your Answer</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {result.explanation && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <svg
                          className="h-5 w-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1.5">Explanation</div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {result.video_url && result.video_type && (
                  <VideoPlayer
                    videoUrl={result.video_url}
                    videoType={result.video_type}
                    title={`Solution for Question ${index + 1}`}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center text-muted-foreground">
          <p>Come back tomorrow for a new test!</p>
        </div>
      </div>
    );
  }

  if (!testData) return null;

  const currentQuestion = testData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / testData.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Daily Test</h1>
        </div>
        <Button variant="outline" onClick={onLogout}>
          Sign Out
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                Question {currentQuestionIndex + 1} of {testData.questions.length}
              </CardTitle>
              <CardDescription>
                Answered: {answeredCount}/{testData.questions.length}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{currentQuestion.subject}</Badge>
              <Badge variant="secondary">{currentQuestion.difficulty}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-4" />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">{currentQuestion.question_text}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentQuestion.image_url && (
            <div className="mb-6 rounded-lg overflow-hidden border border-border">
              <img 
                src={currentQuestion.image_url} 
                alt="Question diagram" 
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          )}
          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
          >
            {['A', 'B', 'C', 'D'].map((option) => (
              <div key={option} className="flex items-center space-x-2 p-3 rounded hover:bg-muted">
                <RadioGroupItem value={option} id={`option-${option}`} />
                <Label htmlFor={`option-${option}`} className="flex-1 cursor-pointer">
                  <span className="font-semibold mr-2">{option}.</span>
                  {currentQuestion[`option_${option.toLowerCase()}` as keyof Question]}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex < testData.questions.length - 1 ? (
            <Button
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(testData.questions.length - 1, prev + 1)
                )
              }
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              variant="default"
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap gap-2">
          {testData.questions.map((q, index) => (
            <Button
              key={q.id}
              variant={answers[q.id] ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentQuestionIndex(index)}
              className={currentQuestionIndex === index ? 'ring-2 ring-ring' : ''}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}













