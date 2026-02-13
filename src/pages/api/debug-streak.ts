import type { APIRoute } from 'astro';
import { getSupabaseClientFromEnv } from '../../lib/supabase';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
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

    // Get user tests
    const userTestsQuery = await db.prepare(`
      SELECT 
        test_date,
        score,
        total_questions,
        completed_at
      FROM test_attempts
      WHERE user_id = ?
        AND completed_at IS NOT NULL
      ORDER BY test_date DESC
    `).bind(user.id).all();

    const userTests = userTestsQuery.results || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Get unique dates
    const uniqueDates = Array.from(
      new Set(userTests.map((t: any) => t.test_date))
    ).sort();

    // Calculate days since last test
    let daysSinceLastTest = null;
    if (uniqueDates.length > 0) {
      const lastTestDate = uniqueDates[uniqueDates.length - 1];
      const lastTest = new Date(lastTestDate + 'T00:00:00');
      lastTest.setHours(0, 0, 0, 0);
      
      daysSinceLastTest = Math.floor(
        (today.getTime() - lastTest.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return new Response(JSON.stringify({ 
      userId: user.id,
      today: todayStr,
      totalTests: userTests.length,
      uniqueDates,
      lastTestDate: uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : null,
      daysSinceLastTest,
      rawTests: userTests.map((t: any) => ({
        date: t.test_date,
        score: t.score,
        completedAt: t.completed_at
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[debug-streak.ts] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch debug info',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
