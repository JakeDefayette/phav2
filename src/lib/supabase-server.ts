import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

// Create a conditional export that doesn't fail if service key is missing
// This allows the app to start without crashing, though server-side features won't work
export const supabaseServer = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Helper function to ensure server client is available
export function requireServerClient() {
  if (!supabaseServer) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for server operations. Please add it to your .env.local file.'
    );
  }
  return supabaseServer;
}
