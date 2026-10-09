'use client';

import { AlertTriangle, FlaskConical, Database } from 'lucide-react';
import { useDemoMode } from '@/lib/demo-mode';
import { Button } from '@/components/ui/button';

export function DemoBanner() {
  const { demoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className="flex items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-6 py-1.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
      <div className="flex items-center gap-2">
        {demoMode ? (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <Database className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>
          {demoMode ? (
            <>
              <strong>DEMO</strong> — Datos simulados en memoria. Ninguna publicacion,
              inventario o integracion es real.
            </>
          ) : (
            <>
              <strong>LIVE</strong> — Conectado a la base de datos. Los datos son reales.
            </>
          )}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 gap-1.5 px-2 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-950/50"
        onClick={toggleDemoMode}
      >
        <FlaskConical className="h-3 w-3" />
        {demoMode ? 'Cambiar a Live' : 'Cambiar a Demo'}
      </Button>
    </div>
  );
}
