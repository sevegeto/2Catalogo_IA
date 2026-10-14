'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured } from '@/lib/runtime-config';
import { getSupabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCheckingSession(false);
      return;
    }
    let mounted = true;

    const checkSession = async () => {
      const { data } = await getSupabase().auth.getSession();
      if (mounted) {
        setHasRecoverySession(Boolean(data.session));
        setCheckingSession(false);
      }
    };

    void checkSession();

    const { data: listener } = getSupabase().auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasRecoverySession(true);
        setCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await getSupabase().auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError('El enlace ya caducó o ya fue utilizado. Solicita un enlace nuevo.');
      return;
    }

    setMessage('Tu contraseña se actualizó correctamente.');
    setTimeout(() => router.push('/dashboard'), 1200);
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Comprobando enlace" />
      </main>
    );
  }

  if (!hasRecoverySession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <section className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold">Enlace no disponible</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Este enlace de recuperación caducó o ya fue utilizado. Solicita un enlace nuevo desde la pantalla de recuperación de contraseña.
          </p>
          <Button className="mt-6 w-full" onClick={() => router.push('/auth/forgot-password')}>
            Solicitar un enlace nuevo
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <section className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">Crear una contraseña nueva</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Usa una contraseña de al menos 8 caracteres para proteger tu cuenta.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmation">Repetir contraseña</Label>
            <Input
              id="confirmation"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? (
            <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </p>
          ) : null}
          <Button className="w-full" type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar contraseña
          </Button>
        </form>
      </section>
    </main>
  );
}
