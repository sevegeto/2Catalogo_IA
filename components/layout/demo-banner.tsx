import { AlertTriangle } from 'lucide-react';

export function DemoBanner() {
  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-1.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>
        <strong>DEMO</strong> — Datos simulados en fase 1. Ninguna publicacion,
        inventario o integracion es real.
      </span>
    </div>
  );
}
