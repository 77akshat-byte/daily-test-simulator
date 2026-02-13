import type {MiddlewareHandler} from 'astro';
import { getSupabaseClientFromEnv } from './lib/supabase';

export const onRequest: MiddlewareHandler = async (ctx, next) => {
  const {request, locals} = ctx;
  const url = new URL(request.url);

  if (import.meta.env.DEV && url.pathname === '/-wf/ready') {
    const resHeaders = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });

    return new Response(JSON.stringify({ready: true}), {
      headers: resHeaders,
    });
  }

  // Protect admin routes (page)
  if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api/admin')) {
    // For admin page, we'll check authentication on client-side
    // This allows the page to load and handle auth/redirect in React
    return next();
  }

  // API admin routes are already protected in individual endpoints
  // No additional middleware needed as each endpoint checks auth + admin status

  return next();
};

