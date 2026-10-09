'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoModeContextValue {
  demoMode: boolean;
  setDemoMode: (value: boolean) => void;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextValue>({
  demoMode: false,
  setDemoMode: () => {},
  toggleDemoMode: () => {},
});

const STORAGE_KEY = 'catalogai-demo-mode';

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoModeState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setDemoModeState(stored === 'true');
    }
  }, []);

  const setDemoMode = (value: boolean) => {
    setDemoModeState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
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
