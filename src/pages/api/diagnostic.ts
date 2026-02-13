




import type { APIRoute } from 'astro';
import { getSupabaseClientFromEnv } from '../../lib/supabase';

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
  trend: number; // percentage change from previous tests
  subjectBreakdown: SubjectStats[];
  weakestSubject: string;
  strongestSubject: string;
  speedAnalysis: {
    questionsPerMinute: number;
    accuracyVsSpeed: string; // 'balanced' | 'too_fast' | 'too_slow'
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

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    console.log('[diagnostic.ts] Starting diagnostic generation...');
    
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabaseClientFromEnv(locals?.runtime?.env);
    
    console.log('[diagnostic.ts] Verifying user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[diagnostic.ts] Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[diagnostic.ts] User verified:', user.id);
    const db = locals.runtime.env.DB;

    // Get all user's completed tests (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateLimit = thirtyDaysAgo.toISOString().split('T')[0];

    console.log('[diagnostic.ts] Fetching user tests since:', dateLimit);
    const userTests = await db.prepare(`
      SELECT id, score, total_questions, test_date, completed_at, started_at
      FROM test_attempts
      WHERE user_id = ?
        AND completed_at IS NOT NULL
        AND test_date >= ?
      ORDER BY test_date DESC
    `).bind(user.id, dateLimit).all();

    console.log('[diagnostic.ts] Found tests:', userTests.results?.length || 0);
    
    if (!userTests.results || userTests.results.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No test history found',
        message: 'Complete at least one test to see your diagnostic analysis'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate overall stats
    console.log('[diagnostic.ts] Calculating overall stats...');
    const totalTests = userTests.results.length;
    const totalScore = userTests.results.reduce((sum: number, test: any) => sum + test.score, 0);
    const totalQuestions = userTests.results.reduce((sum: number, test: any) => sum + test.total_questions, 0);
    const overallAccuracy = Math.round((totalScore / totalQuestions) * 100);
    const averageScore = Math.round(totalScore / totalTests);

    // Calculate trend (compare last 3 tests vs previous 3 tests)
    console.log('[diagnostic.ts] Calculating trend...');
    let trend = 0;
    if (totalTests >= 4) {
      const recent3 = userTests.results.slice(0, 3);
      const previous3 = userTests.results.slice(3, 6);
      
      const recentAvg = recent3.reduce((sum: number, t: any) => 
        sum + (t.score / t.total_questions), 0) / recent3.length * 100;
      const previousAvg = previous3.reduce((sum: number, t: any) => 
        sum + (t.score / t.total_questions), 0) / previous3.length * 100;
      
      trend = Math.round(recentAvg - previousAvg);
    }

    // Get subject-wise breakdown from most recent test
    console.log('[diagnostic.ts] Fetching subject breakdown...');
    const latestTest = userTests.results[0] as any;
    const subjectStats = await db.prepare(`
      SELECT 
        q.subject,
        COUNT(*) as total,
        SUM(CASE WHEN ua.is_correct = 1 THEN 1 ELSE 0 END) as correct,
        SUM(CASE WHEN ua.is_correct = 0 THEN 1 ELSE 0 END) as incorrect
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      WHERE ua.attempt_id = ?
      GROUP BY q.subject
    `).bind(latestTest.id).all();

    console.log('[diagnostic.ts] Subject stats:', subjectStats.results?.length || 0, 'subjects');

    const subjectBreakdown: SubjectStats[] = (subjectStats.results || []).map((stat: any) => {
      const answered = stat.correct + stat.incorrect;
      return {
        subject: stat.subject,
        correct: stat.correct,
        incorrect: stat.incorrect,
        total: stat.total,
        percentage: Math.round((stat.correct / stat.total) * 100),
        accuracy: answered > 0 ? Math.round((stat.correct / answered) * 100) : 0,
        avgTime: 0 // Not tracked in current schema
      };
    });

    console.log('[diagnostic.ts] Subject breakdown calculated:', subjectBreakdown.length);

    // Find weakest and strongest subjects
    const sortedSubjects = [...subjectBreakdown].sort((a, b) => a.percentage - b.percentage);
    const weakestSubject = sortedSubjects[0]?.subject || 'None';
    const strongestSubject = sortedSubjects[sortedSubjects.length - 1]?.subject || 'None';

    // Speed analysis (calculate time per question)
    console.log('[diagnostic.ts] Calculating speed analysis...');
    let questionsPerMinute = 0;
    let accuracyVsSpeed: 'balanced' | 'too_fast' | 'too_slow' = 'balanced';
    let avgTimePerQuestion = 0;
    
    if (latestTest.started_at && latestTest.completed_at) {
      const startTime = new Date(latestTest.started_at).getTime();
      const endTime = new Date(latestTest.completed_at).getTime();
      const durationMinutes = (endTime - startTime) / 1000 / 60;
      const durationSeconds = (endTime - startTime) / 1000;
      questionsPerMinute = Math.round((latestTest.total_questions / durationMinutes) * 10) / 10;
      avgTimePerQuestion = Math.round(durationSeconds / latestTest.total_questions);
      
      const accuracy = (latestTest.score / latestTest.total_questions) * 100;
      
      // Ideal: ~1 question per minute with >70% accuracy
      if (questionsPerMinute > 1.5 && accuracy < 70) {
        accuracyVsSpeed = 'too_fast';
      } else if (questionsPerMinute < 0.5 && accuracy < 70) {
        accuracyVsSpeed = 'too_slow';
      }
    }

    // Calculate total answered across all attempts in the latest test
    console.log('[diagnostic.ts] Counting answered questions...');
    const answeredStats = await db.prepare(`
      SELECT COUNT(*) as total_answered
      FROM user_answers
      WHERE attempt_id = ?
    `).bind(latestTest.id).first();
    
    const totalAnswered = (answeredStats as any)?.total_answered || 0;
    console.log('[diagnostic.ts] Total answered:', totalAnswered, 'out of', latestTest.total_questions);

    // Concept vs Speed vs Accuracy diagnosis
    let issue: 'concepts' | 'speed' | 'accuracy' | 'balanced' = 'balanced';
    let recommendation = '';

    const latestAccuracy = (latestTest.score / latestTest.total_questions) * 100;

    if (latestAccuracy < 60) {
      // Low accuracy indicates concept issues
      issue = 'concepts';
      recommendation = `Your accuracy is ${Math.round(latestAccuracy)}%. Focus on strengthening fundamentals in ${weakestSubject}. Review basic concepts before attempting more questions.`;
    } else if (questionsPerMinute > 0 && questionsPerMinute < 0.7 && latestAccuracy < 80) {
      // Slow and not very accurate = need more practice
      issue = 'speed';
      recommendation = `You're taking too long per question. Practice more to improve speed while maintaining accuracy. Try timed practice sessions.`;
    } else if (accuracyVsSpeed === 'too_fast') {
      // Fast but inaccurate = rushing
      issue = 'accuracy';
      recommendation = `You're rushing through questions. Slow down and read carefully. Accuracy is more important than speed in CSAT.`;
    } else if (latestAccuracy >= 80 && questionsPerMinute >= 0.8) {
      issue = 'balanced';
      recommendation = `Great job! Your performance is well-balanced. Keep practicing to maintain consistency. Focus on ${weakestSubject} to reach 90%+.`;
    } else {
      // Mixed performance
      issue = 'accuracy';
      recommendation = `Work on accuracy in ${weakestSubject}. Review incorrect answers and understand why you got them wrong.`;
    }

    // Recent performance history
    const recentPerformance = userTests.results.slice(0, 5).map((test: any) => ({
      date: test.test_date,
      score: test.score,
      total: test.total_questions,
      percentage: Math.round((test.score / test.total_questions) * 100)
    }));

    console.log('[diagnostic.ts] Building diagnostic response...');
    const diagnosticData: DiagnosticData = {
      overallAccuracy,
      totalAttempts: totalTests,
      totalQuestions: latestTest.total_questions,
      totalAnswered,
      avgTimePerQuestion,
      averageScore,
      trend,
      subjectBreakdown,
      weakestSubject,
      strongestSubject,
      speedAnalysis: {
        questionsPerMinute,
        accuracyVsSpeed
      },
      conceptVsSpeed: {
        issue,
        recommendation
      },
      recentPerformance
    };

    console.log('[diagnostic.ts] Diagnostic generated successfully');
    return new Response(JSON.stringify(diagnosticData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[diagnostic.ts] Error:', error);
    console.error('[diagnostic.ts] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(JSON.stringify({ 
      error: 'Failed to generate diagnostic',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};







