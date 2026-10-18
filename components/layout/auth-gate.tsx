'use client';

import { useEffect, type ReactNode } from 'react';
import { Loader2, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

/**
 * Bloquea la interfaz hasta confirmar sesión y rol. El middleware ya redirige a quien
 * no tiene sesión; esto cubre sesiones que expiran o se cierran con la página abierta,
 * y usuarios autenticados sin rol asignado.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, user, error, signOut, refresh } = useAuth();

  useEffect(() => {
    if (status === 'signed-out') {
      const next = window.location.pathname + window.location.search;
      window.location.assign(`/auth/login?next=${encodeURIComponent(next)}`);
    }
  }, [status]);

  if (status === 'demo' || status === 'ready') return <>{children}</>;

  if (status === 'no-role' || status === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <section className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold">
            {status === 'no-role' ? 'Tu cuenta aún no tiene acceso' : 'No se pudo verificar tu acceso'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {status === 'no-role'
              ? `Iniciaste sesión como ${user?.email ?? 'usuario'}, pero un administrador debe asignarte un rol (admin, editor o viewer).`
              : `Error al consultar tu rol: ${error}. Comprueba que las migraciones de seguridad estén aplicadas.`}
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => void refresh()}>Reintentar</Button>
            <Button variant="ghost" onClick={() => void signOut()}>
              <LogOut className="mr-2 h-4 w-4" />Cerrar sesión
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Verificando sesión" />
    </div>
  );
}
