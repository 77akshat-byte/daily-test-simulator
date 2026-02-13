import type { APIRoute } from 'astro';
import { getSupabaseClientFromEnv } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);
    
    const supabase = getSupabaseClientFromEnv(locals?.runtime?.env);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    console.log('Auth result - user:', !!user, 'error:', authError?.message);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized', 
        details: authError?.message || 'Invalid token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { attemptId } = await request.json();

    if (!attemptId) {
      return new Response(JSON.stringify({ error: 'Missing attempt ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = locals.runtime.env.DB;

    // Verify the attempt belongs to the user
    const attempt = await db.prepare(
      'SELECT id, completed_at, test_date, score FROM test_attempts WHERE id = ? AND user_id = ?'
    ).bind(attemptId, user.id).first();

    if (!attempt) {
      return new Response(JSON.stringify({ error: 'Attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let score = attempt.score || 0;

    // If already completed, just return the results (for review mode)
    if (!attempt.completed_at) {
      // Calculate score for new submission
      const scoreResult = await db.prepare(
        'SELECT COUNT(*) as score FROM user_answers WHERE attempt_id = ? AND is_correct = 1'
      ).bind(attemptId).first();

      score = scoreResult?.score || 0;

      // Mark as completed
      await db.prepare(
        'UPDATE test_attempts SET completed_at = CURRENT_TIMESTAMP, score = ? WHERE id = ?'
      ).bind(score, attemptId).run();
    }

    // Get detailed results
    // First, get the question IDs for this test date
    const dailySet = await db.prepare(
      'SELECT question_ids FROM daily_question_sets WHERE test_date = ?'
    ).bind(attempt.test_date).first();

    if (!dailySet) {
      return new Response(JSON.stringify({ error: 'Test questions not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const questionIds = JSON.parse(dailySet.question_ids as string);
    const placeholders = questionIds.map(() => '?').join(',');

    // Get all questions with their answers (or null if not answered)
    const results = await db.prepare(`
      SELECT 
        q.id as question_id,
        ua.user_answer,
        ua.is_correct,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        q.explanation,
        q.subject,
        q.image_url,
        q.video_url,
        q.video_type
      FROM questions q
      LEFT JOIN user_answers ua ON q.id = ua.question_id AND ua.attempt_id = ?
      WHERE q.id IN (${placeholders})
      ORDER BY q.id
    `).bind(attemptId, ...questionIds).all();

    return new Response(JSON.stringify({
      score,
      totalQuestions: 25,
      percentage: Math.round((score / 25) * 100),
      testDate: attempt.test_date,
      results: results.results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Detailed error:', { errorMessage, errorStack });
    
    return new Response(JSON.stringify({ 
      error: 'Failed to submit test',
      details: errorMessage,
      debug: import.meta.env.DEV ? errorStack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};






