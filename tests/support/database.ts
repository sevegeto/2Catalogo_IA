import { readdirSync, readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const migrationsDir = new URL('../../supabase/migrations/', import.meta.url);

export const USERS = {
  admin: '00000000-0000-4000-8000-000000000001',
  editor: '00000000-0000-4000-8000-000000000002',
  viewer: '00000000-0000-4000-8000-000000000003',
  norole: '00000000-0000-4000-8000-000000000004',
} as const;

export type Actor = keyof typeof USERS | 'anon' | 'superuser';

/**
 * PGlite con lo mínimo de Supabase: roles anon/authenticated, auth.users, auth.uid()
 * leyendo el claim sub y los privilegios por defecto que Supabase concede a anon y
 * authenticated sobre objetos nuevos del esquema public.
 */
export async function database(options: { beforeMigration?: (file: string, db: PGlite) => Promise<void> } = {}) {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
      AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
    GRANT USAGE ON SCHEMA public TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
  `);
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    await options.beforeMigration?.(file, db);
    await db.exec(readFileSync(new URL(file, migrationsDir), 'utf8'));
  }
  await db.exec(`
    INSERT INTO auth.users (id, email) VALUES
      ('${USERS.admin}', 'admin@test'), ('${USERS.editor}', 'editor@test'),
      ('${USERS.viewer}', 'viewer@test'), ('${USERS.norole}', 'norole@test');
    INSERT INTO public.user_roles (user_id, role, display_name) VALUES
      ('${USERS.admin}', 'admin', 'Admin'), ('${USERS.editor}', 'editor', 'Editor'),
      ('${USERS.viewer}', 'viewer', 'Viewer');
  `);
  return db;
}

/** Cambia la identidad de la sesión como lo haría PostgREST con el JWT del usuario. */
export async function actAs(db: PGlite, actor: Actor) {
  await db.exec('RESET ROLE;');
  if (actor === 'superuser') {
    await db.query("SELECT set_config('request.jwt.claim.sub', '', false)");
    return;
  }
  const sub = actor === 'anon' ? '' : USERS[actor];
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [sub]);
  await db.exec(`SET ROLE ${actor === 'anon' ? 'anon' : 'authenticated'};`);
}
