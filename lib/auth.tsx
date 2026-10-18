'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { isDemoMode, isSupabaseConfigured } from '@/lib/runtime-config';
import { getSupabase } from '@/lib/supabase/client';

export type AppRole = 'admin' | 'editor' | 'viewer';
type AuthStatus = 'loading' | 'demo' | 'signed-out' | 'no-role' | 'ready' | 'error';
interface AuthContextValue { status: AuthStatus; user: User | null; role: AppRole | null; error: string; can: (required: AppRole) => boolean; signOut: () => Promise<void>; refresh: () => Promise<void>; }
const RANK: Record<AppRole, number> = { viewer: 1, editor: 2, admin: 3 };
const AuthContext = createContext<AuthContextValue>({ status: 'loading', user: null, role: null, error: '', can: () => false, signOut: async () => {}, refresh: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async (sessionUser?: User | null) => {
    if (!isSupabaseConfigured || isDemoMode()) { setStatus('demo'); return; }
    const supabase = getSupabase(); let current = sessionUser;
    if (current === undefined) { const { data } = await supabase.auth.getUser(); current = data.user; }
    setUser(current ?? null);
    if (!current) { setRole(null); setStatus('signed-out'); return; }
    const { data, error: roleError } = await supabase.rpc('current_app_role');
    if (roleError) { setRole(null); setError(roleError.message); setStatus('error'); return; }
    const value = (data as AppRole | null) ?? null; setRole(value); setError(''); setStatus(value ? 'ready' : 'no-role');
  }, []);
  useEffect(() => { void load(); if (!isSupabaseConfigured || isDemoMode()) return; const { data: listener } = getSupabase().auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'USER_UPDATED') void load(session?.user ?? null); }); return () => listener.subscription.unsubscribe(); }, [load]);
  const signOut = useCallback(async () => { if (status !== 'demo') await getSupabase().auth.signOut(); window.location.assign('/auth/login'); }, [status]);
  const can = useCallback((required: AppRole) => status === 'demo' || (role !== null && RANK[role] >= RANK[required]), [role, status]);
  return <AuthContext.Provider value={{ status, user, role, error, can, signOut, refresh: () => load() }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
export function safeNextPath(value: string | null | undefined): string { if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\') || value.startsWith('/auth/')) return '/dashboard'; return value; }
