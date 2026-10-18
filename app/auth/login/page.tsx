'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { FlaskConical, Loader2, LogIn } from 'lucide-react';
import { isSupabaseConfigured, persistDemoMode } from '@/lib/runtime-config';
import { getSupabase } from '@/lib/supabase/client';
import { safeNextPath } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [next, setNext] = useState('/dashboard');

  useEffect(() => {
    setNext(safeNextPath(new URLSearchParams(window.location.search).get('next')));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!isSupabaseConfigured) {
      setError('Supabase no está configurado. Usa el modo demo.');
      return;
    }
    setSigningIn(true);
    const { error: signInError } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setSigningIn(false);
      setError(
        /confirm/i.test(signInError.message)
          ? 'Confirma tu correo antes de iniciar sesión.'
          : 'Correo o contraseña incorrectos.'
      );
      return;
    }
    persistDemoMode(false);
    // Navegación completa para que el middleware lea la cookie de sesión nueva.
    window.location.assign(next);
  };

  const enterDemo = () => {
    persistDemoMode(true);
    window.location.assign('/dashboard');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <section className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LogIn className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Accede a CatalogAI con la cuenta que te asignó el administrador.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={!isSupabaseConfigured}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={!isSupabaseConfigured}
            />
          </div>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={signingIn || !isSupabaseConfigured}>
            {signingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Entrar
          </Button>
        </form>

        <div className="mt-6 border-t pt-4">
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={enterDemo}>
            <FlaskConical className="mr-2 h-4 w-4" />
            Explorar en modo demo (datos simulados)
          </Button>
        </div>
      </section>
    </main>
  );
}
