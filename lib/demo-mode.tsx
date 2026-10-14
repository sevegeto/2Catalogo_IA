'use client';

import { DEMO_STORAGE_KEY, isDemoMode, isSupabaseConfigured } from '@/lib/runtime-config';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoModeContextValue {
  demoMode: boolean;
  setDemoMode: (value: boolean) => void;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextValue>({
  demoMode: !isSupabaseConfigured,
  setDemoMode: () => {},
  toggleDemoMode: () => {},
});

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoModeState] = useState(!isSupabaseConfigured);

  useEffect(() => {
    setDemoModeState(isDemoMode());
  }, []);

  const setDemoMode = (value: boolean) => {
    if (!value && !isSupabaseConfigured) return;
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, String(value));
    } catch {
      return;
    }
    // Reload queries and discard state from the previous data source.
    window.location.reload();
  };

  const toggleDemoMode = () => setDemoMode(!demoMode);

  return (
    <DemoModeContext.Provider value={{ demoMode, setDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
