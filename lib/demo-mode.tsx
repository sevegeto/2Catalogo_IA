'use client';

import { isDemoMode, isSupabaseConfigured, persistDemoMode } from '@/lib/runtime-config';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
interface DemoModeContextValue { demoMode: boolean; setDemoMode: (value: boolean) => void; toggleDemoMode: () => void; }
const DemoModeContext = createContext<DemoModeContextValue>({ demoMode: !isSupabaseConfigured, setDemoMode: () => {}, toggleDemoMode: () => {} });
export function DemoModeProvider({ children }: { children: ReactNode }) { const [demoMode, setDemoModeState] = useState(!isSupabaseConfigured); useEffect(() => { const current = isDemoMode(); setDemoModeState(current); if (isSupabaseConfigured && !document.cookie.includes('catalogai-demo=')) persistDemoMode(current); }, []); const setDemoMode = (value: boolean) => { if (!value && !isSupabaseConfigured) return; if (!persistDemoMode(value)) return; window.location.reload(); }; const toggleDemoMode = () => setDemoMode(!demoMode); return <DemoModeContext.Provider value={{ demoMode, setDemoMode, toggleDemoMode }}>{children}</DemoModeContext.Provider>; }
export function useDemoMode() { return useContext(DemoModeContext); }
