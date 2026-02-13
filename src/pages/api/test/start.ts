import type { APIRoute } from 'astro';
import { getSupabaseClientFromEnv } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    console.log('[start.ts] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('[start.ts] No auth header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized - No token provided' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[start.ts] Token length:', token.length);
    
    const supabase = getSupabaseClientFromEnv(locals?.runtime?.env);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('[start.ts] Auth error:', authError.message);
      return new Response(JSON.stringify({ 
        error: 'Unauthorized - Invalid token',
        details: authError.message 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!user) {
      console.log('[start.ts] No user found for token');
      return new Response(JSON.stringify({ error: 'Unauthorized - No user found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[start.ts] User authenticated:', user.id);

    const db = locals.runtime.env.DB;
    const today = new Date().toISOString().split('T')[0];

    // Check if already started
    const existing = await db.prepare(
      'SELECT id FROM test_attempts WHERE user_id = ? AND test_date = ?'
    ).bind(user.id, today).first();

    if (existing) {
      console.log('[start.ts] Returning existing attempt:', existing.id);
      return new Response(JSON.stringify({ attemptId: existing.id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create new attempt
    const result = await db.prepare(
      'INSERT INTO test_attempts (user_id, test_date) VALUES (?, ?) RETURNING id'
    ).bind(user.id, today).first();

    console.log('[start.ts] Created new attempt:', result.id);

    return new Response(JSON.stringify({ attemptId: result.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[start.ts] Error starting test:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to start test',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

