

import type { APIRoute } from 'astro';
import { getSupabaseClientFromEnv } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    console.log('[yesterday.ts] Auth header present:', !!authHeader);
    
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
      console.error('[yesterday.ts] Auth error:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = locals.runtime.env.DB;
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log('[yesterday.ts] Getting leaderboard for:', yesterdayStr);

    // Get top 10 scores from yesterday
    const leaderboard = await db.prepare(`
      SELECT 
        ta.user_id,
        ta.score,
        ta.total_questions,
        ta.completed_at,
        ROUND((CAST(ta.score AS REAL) / ta.total_questions) * 100, 1) as percentage
      FROM test_attempts ta
      WHERE ta.test_date = ?
        AND ta.completed_at IS NOT NULL
      ORDER BY ta.score DESC, ta.completed_at ASC
      LIMIT 10
    `).bind(yesterdayStr).all();

    console.log('[yesterday.ts] Found', leaderboard.results?.length || 0, 'entries');

    // Get user emails from Supabase for the leaderboard
    const entries = await Promise.all(
      (leaderboard.results || []).map(async (entry: any, index: number) => {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(entry.user_id);
          return {
            rank: index + 1,
            email: userData?.user?.email || 'Anonymous',
            name: userData?.user?.email?.split('@')[0] || 'Anonymous',
            score: entry.score,
            totalQuestions: entry.total_questions,
            percentage: entry.percentage,
            isCurrentUser: entry.user_id === user.id,
            submittedAt: entry.completed_at
          };
        } catch (err) {
          console.error('[yesterday.ts] Error getting user data:', err);
          return {
            rank: index + 1,
            email: 'Anonymous',
            name: 'Anonymous',
            score: entry.score,
            totalQuestions: entry.total_questions,
            percentage: entry.percentage,
            isCurrentUser: entry.user_id === user.id,
            submittedAt: entry.completed_at
          };
        }
      })
    );

    return new Response(JSON.stringify({ 
      date: yesterdayStr,
      entries 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[yesterday.ts] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch leaderboard',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


