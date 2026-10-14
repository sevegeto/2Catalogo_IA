export const DEMO_STORAGE_KEY = 'catalogai-demo-mode';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
);

export function isDemoMode(): boolean {
  if (!isSupabaseConfigured) return true;
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}
