import type { APIRoute } from 'astro';
import { getSupabaseClientFromEnv } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    console.log('Answer API - Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Answer API - Token extracted, length:', token.length);
    
    const supabase = getSupabaseClientFromEnv(locals?.runtime?.env);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    console.log('Answer API - Auth result - user:', !!user, 'error:', authError?.message);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized', 
        details: authError?.message || 'Invalid token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { attemptId, questionId, answer } = await request.json();

    if (!attemptId || !questionId || !answer) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = locals.runtime.env.DB;

    // Verify the attempt belongs to the user
    const attempt = await db.prepare(
      'SELECT id, completed_at FROM test_attempts WHERE id = ? AND user_id = ?'
    ).bind(attemptId, user.id).first();

    if (!attempt) {
      return new Response(JSON.stringify({ error: 'Attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (attempt.completed_at) {
      return new Response(JSON.stringify({ error: 'Test already completed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the correct answer
    const question = await db.prepare(
      'SELECT correct_answer FROM questions WHERE id = ?'
    ).bind(questionId).first();

    if (!question) {
      return new Response(JSON.stringify({ error: 'Question not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isCorrect = answer === question.correct_answer;

    // Check if answer already exists
    const existingAnswer = await db.prepare(
      'SELECT id FROM user_answers WHERE attempt_id = ? AND question_id = ?'
    ).bind(attemptId, questionId).first();

    if (existingAnswer) {
      // Update existing answer
      await db.prepare(
        'UPDATE user_answers SET user_answer = ?, is_correct = ? WHERE id = ?'
      ).bind(answer, isCorrect ? 1 : 0, existingAnswer.id).run();
    } else {
      // Insert new answer
      await db.prepare(
        'INSERT INTO user_answers (attempt_id, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?)'
      ).bind(attemptId, questionId, answer, isCorrect ? 1 : 0).run();
    }

    return new Response(JSON.stringify({ success: true, isCorrect }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Detailed error:', { errorMessage, errorStack });
    
    return new Response(JSON.stringify({ 
      error: 'Failed to submit answer',
      details: errorMessage,
      debug: import.meta.env.DEV ? errorStack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


