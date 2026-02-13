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

    // Get recent sync logs
    const logsQuery = await db.prepare(`
      SELECT 
        id,
        questions_added,
        questions_updated,
        errors,
        synced_at
      FROM sync_logs
      ORDER BY synced_at DESC
      LIMIT 10
    `).all();

    return new Response(JSON.stringify({
      logs: logsQuery.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[sync-logs.ts] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch sync logs',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
