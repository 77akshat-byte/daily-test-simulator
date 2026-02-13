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

    // Check if user is admin
    const db = locals.runtime.env.DB;
    const adminCheck = await db.prepare(`
      SELECT is_admin FROM users WHERE id = ?
    `).bind(user.id).first();

    if (!adminCheck || !adminCheck.is_admin) {
      return new Response(JSON.stringify({ error: 'Access denied. Admin only.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get total questions
    const totalQuery = await db.prepare(`
      SELECT COUNT(*) as count FROM questions
    `).first();

    // Get breakdown by subject
    const subjectQuery = await db.prepare(`
      SELECT subject, COUNT(*) as count 
      FROM questions 
      GROUP BY subject
      ORDER BY subject
    `).all();

    // Get breakdown by difficulty
    const difficultyQuery = await db.prepare(`
      SELECT difficulty, COUNT(*) as count 
      FROM questions 
      GROUP BY difficulty
      ORDER BY 
        CASE difficulty
          WHEN 'easy' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'hard' THEN 3
        END
    `).all();

    const bySubject: Record<string, number> = {};
    for (const row of subjectQuery.results) {
      bySubject[(row as any).subject] = (row as any).count;
    }

    const byDifficulty: Record<string, number> = {};
    for (const row of difficultyQuery.results) {
      byDifficulty[(row as any).difficulty] = (row as any).count;
    }

    return new Response(JSON.stringify({
      total: (totalQuery?.count as number) || 0,
      bySubject,
      byDifficulty
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[question-stats.ts] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
