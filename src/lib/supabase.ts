import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient(supabaseUrl?: string, supabaseAnonKey?: string) {
  const url = supabaseUrl || import.meta.env.PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Supabase configuration missing!', {
      hasUrl: !!url,
      hasKey: !!key,
      urlValue: url ? `${url.substring(0, 20)}...` : 'undefined',
      keyValue: key ? `${key.substring(0, 20)}...` : 'undefined'
    });
    throw new Error('Missing Supabase configuration. Please check PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set.');
  }

  console.log('Creating Supabase client with:', {
    url: `${url.substring(0, 30)}...`,
    keyLength: key.length
  });

  return createClient(url, key);
}

export function getSupabaseClientFromEnv(env: any) {
  return getSupabaseClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
}

// Lazy-initialized client for client-side use (prevents SSR build errors)
let _supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClientSingleton() {
  if (!_supabaseClient) {
    try {
      _supabaseClient = getSupabaseClient();
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      throw error;
    }
  }
  return _supabaseClient;
}

// Default client for client-side use
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null as any;



