import type { APIRoute } from 'astro';
import { getSupabaseClientFromEnv } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
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
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = locals.runtime.env.DB;

    // Get user's test history
    const history = await db.prepare(`
      SELECT 
        id,
        test_date,
        started_at,
        completed_at,
        score,
        total_questions
      FROM test_attempts
      WHERE user_id = ? AND completed_at IS NOT NULL
      ORDER BY test_date DESC
      LIMIT 30
    `).bind(user.id).all();

    const tests = (history.results || []).map((test: any) => ({
      id: test.id,
      testDate: test.test_date,
      score: test.score,
      totalQuestions: test.total_questions,
      percentage: Math.round((test.score / test.total_questions) * 100),
      submittedAt: test.completed_at
    }));

    return new Response(JSON.stringify({
      tests
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch history' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


