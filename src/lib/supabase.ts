import { createClient } from '@supabase/supabase-js';
import { config } from '@/shared/config';

export const supabase = createClient(
  config.database.url,
  config.database.anon_key,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Enhanced security settings
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
      debug: config.app.environment === 'development',
    },
    global: {
      headers: {
        'X-Client-Info': 'pha-v2-web',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
