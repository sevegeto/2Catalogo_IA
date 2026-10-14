import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/runtime-config';

let client: SupabaseClient | undefined;

// Initialize only when a real operation is requested, so demo mode works offline.
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY para usar datos reales.');
  }
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
