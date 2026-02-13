import type { APIRoute } from 'astro';
import { getSupabaseClientFromEnv } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    console.log('=== /api/test/today called ===');
    
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized - No auth header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabaseClientFromEnv(locals?.runtime?.env);
    
    console.log('Verifying user with Supabase...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('User authenticated:', user.id);

    // Check DB binding
    if (!locals?.runtime?.env?.DB) {
      console.error('DB binding not found!');
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = locals.runtime.env.DB;
    const today = new Date().toISOString().split('T')[0];
    console.log('Test date:', today);

    // Check if daily question set exists
    console.log('Checking for existing daily question set...');
    let dailySet = await db.prepare(
      'SELECT question_ids FROM daily_question_sets WHERE test_date = ?'
    ).bind(today).first();

    let questionIds: number[];

    if (!dailySet) {
      console.log('No daily set found, generating new one...');
      // Generate new daily question set (25 random questions)
      const allQuestions = await db.prepare(
        'SELECT id FROM questions ORDER BY RANDOM() LIMIT 25'
      ).all();

      console.log('Questions fetched:', allQuestions.results.length);

      if (!allQuestions.results || allQuestions.results.length === 0) {
        console.error('No questions found in database!');
        return new Response(JSON.stringify({ 
          error: 'No questions available. Please initialize the database with questions.' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      questionIds = allQuestions.results.map((q: any) => q.id);
      console.log('Question IDs:', questionIds);
      
      // Store the daily question set
      console.log('Storing daily question set...');
      await db.prepare(
        'INSERT INTO daily_question_sets (test_date, question_ids) VALUES (?, ?)'
      ).bind(today, JSON.stringify(questionIds)).run();
    } else {
      console.log('Using existing daily question set');
      questionIds = JSON.parse(dailySet.question_ids as string);
    }

    console.log('Fetching questions...');
    // Get the questions
    const placeholders = questionIds.map(() => '?').join(',');
    const questions = await db.prepare(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, subject, difficulty 
       FROM questions WHERE id IN (${placeholders})`
    ).bind(...questionIds).all();

    console.log('Questions loaded:', questions.results.length);

    // Check if user has already started this test
    console.log('Checking for existing attempt...');
    const existingAttempt = await db.prepare(
      'SELECT id, score, completed_at FROM test_attempts WHERE user_id = ? AND test_date = ?'
    ).bind(user.id, today).first();

    console.log('Existing attempt:', existingAttempt?.id || 'none');

    const response = {
      questions: questions.results,
      attemptId: existingAttempt?.id || null,
      isCompleted: !!existingAttempt?.completed_at,
      score: existingAttempt?.score || null,
      testDate: today
    };

    console.log('=== Success - returning data ===');
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('=== ERROR in /api/test/today ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch test',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

