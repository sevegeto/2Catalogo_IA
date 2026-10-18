export const DEMO_STORAGE_KEY = 'catalogai-demo-mode';
/** Cookie espejo del modo demo para que el middleware no exija sesión con datos simulados. */
export const DEMO_COOKIE = 'catalogai-demo';

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

/** Guarda la elección de modo en localStorage y en la cookie que lee el middleware. */
export function persistDemoMode(value: boolean): boolean {
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, String(value));
  } catch {
    return false;
  }
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${DEMO_COOKIE}=${value ? 'true' : 'false'}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  return true;
}
