import { createClient } from '@supabase/supabase-js';
import { config } from '@/shared/config';

// For client-side contexts, we may not have the service role key
// In that case, we'll create a fallback client with the anon key
export const supabaseServer = config.database.service_role_key
  ? createClient(config.database.url, config.database.service_role_key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : (() => {
      console.warn(
        'Supabase service role key not available, falling back to anon key'
      );
      return createClient(config.database.url, config.database.anon_key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    })();
