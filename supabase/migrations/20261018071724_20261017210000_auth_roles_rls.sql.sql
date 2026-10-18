/*
# Autenticación, roles y RLS cerrada

Reemplaza las políticas abiertas (anon + authenticated con USING (true)) por acceso
basado en roles de aplicación:

  viewer  → lectura del catálogo
  editor  → lectura + altas, ediciones y bajas del catálogo, capturas e inventario
  admin   → todo lo anterior + configuración, integraciones, usuarios y auditoría

1. Nuevas tablas
   - user_roles: rol de cada usuario de Supabase Auth (una fila por usuario).

2. Funciones
   - has_role(required): true si el usuario actual tiene ese rol o uno superior.
   - current_app_role(): rol del usuario actual (o NULL).
   Ambas son SECURITY DEFINER con search_path fijo para que las políticas no
   dependan de los permisos sobre user_roles ni se puedan secuestrar con objetos
   temporales.

3. Seguridad
   - anon pierde todo acceso a tablas y funciones de la aplicación.
   - Sin rol asignado, un usuario autenticado no ve ni modifica nada.
   - audit_logs: solo lectura para admin; inserción por editor con su propio user_id;
     nunca UPDATE ni DELETE desde la API.
   - captures.captured_by se fija en el servidor con auth.uid() (no se puede suplantar).
   - Siempre debe quedar al menos un admin.

4. Primer administrador (ejecutar una vez en el SQL Editor tras crear el usuario
   en Authentication → Users):

     INSERT INTO public.user_roles (user_id, role, display_name)
     SELECT id, 'admin', 'Sergio' FROM auth.users WHERE email = 'tu-correo@dominio.com';
*/

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.role_rank(role text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp
AS $$ SELECT CASE role WHEN 'admin' THEN 3 WHEN 'editor' THEN 2 WHEN 'viewer' THEN 1 ELSE 0 END; $$;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$ SELECT role FROM public.user_roles WHERE user_id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.has_role(required text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.role_rank(required) > 0
    AND coalesce((SELECT public.role_rank(role) FROM public.user_roles WHERE user_id = auth.uid()), 0)
        >= public.role_rank(required);
$$;

REVOKE ALL ON FUNCTION public.role_rank(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.role_rank(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;

DROP POLICY IF EXISTS user_roles_read ON public.user_roles;
CREATE POLICY user_roles_read ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.has_role('admin')));
DROP POLICY IF EXISTS user_roles_insert ON public.user_roles;
CREATE POLICY user_roles_insert ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin')));
DROP POLICY IF EXISTS user_roles_update ON public.user_roles;
CREATE POLICY user_roles_update ON public.user_roles FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin'))) WITH CHECK ((SELECT public.has_role('admin')));
DROP POLICY IF EXISTS user_roles_delete ON public.user_roles;
CREATE POLICY user_roles_delete ON public.user_roles FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin')));

REVOKE ALL ON public.user_roles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- Nunca dejar el sistema sin administrador.
CREATE OR REPLACE FUNCTION public.keep_one_admin()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.role = 'admin' AND (TG_OP = 'DELETE' OR NEW.role <> 'admin') THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin' AND user_id <> OLD.user_id) THEN
      RAISE EXCEPTION 'Debe existir al menos un administrador';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_roles_keep_one_admin ON public.user_roles;
CREATE TRIGGER user_roles_keep_one_admin BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.keep_one_admin();

-- ---------------------------------------------------------------------------
-- Reemplazo de políticas
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  p record;
  -- Lectura viewer; escritura editor.
  catalog_tables text[] := ARRAY[
    'brands', 'categories', 'category_assignments', 'products', 'product_variants',
    'product_identifiers', 'product_aliases', 'captures', 'product_matches',
    'marketplace_listings', 'warehouses', 'warehouse_locations', 'inventory_balances',
    'inventory_movements', 'suppliers', 'product_suppliers', 'product_images', 'jobs'
  ];
  -- Tablas con reglas propias (más abajo).
  special_tables text[] := ARRAY[
    'marketplace_accounts', 'audit_logs', 'dashboard_activity', 'app_settings', 'integration_configs'
  ];
BEGIN
  FOREACH t IN ARRAY catalog_tables || special_tables LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN CONTINUE; END IF;
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', t);
  END LOOP;

  FOREACH t IN ARRAY catalog_tables LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format($f$CREATE POLICY catalog_select ON public.%I FOR SELECT TO authenticated
      USING ((SELECT public.has_role('viewer')))$f$, t);
    EXECUTE format($f$CREATE POLICY catalog_insert ON public.%I FOR INSERT TO authenticated
      WITH CHECK ((SELECT public.has_role('editor')))$f$, t);
    EXECUTE format($f$CREATE POLICY catalog_update ON public.%I FOR UPDATE TO authenticated
      USING ((SELECT public.has_role('editor'))) WITH CHECK ((SELECT public.has_role('editor')))$f$, t);
    EXECUTE format($f$CREATE POLICY catalog_delete ON public.%I FOR DELETE TO authenticated
      USING ((SELECT public.has_role('editor')))$f$, t);
  END LOOP;
END $$;

-- Cuentas de marketplace: lectura viewer, cambios solo admin.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_accounts TO authenticated;
CREATE POLICY accounts_select ON public.marketplace_accounts FOR SELECT TO authenticated
  USING ((SELECT public.has_role('viewer')));
CREATE POLICY accounts_insert ON public.marketplace_accounts FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('admin')));
CREATE POLICY accounts_update ON public.marketplace_accounts FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin'))) WITH CHECK ((SELECT public.has_role('admin')));
CREATE POLICY accounts_delete ON public.marketplace_accounts FOR DELETE TO authenticated
  USING ((SELECT public.has_role('admin')));

-- Auditoría: append-only desde la API.
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
CREATE POLICY audit_select ON public.audit_logs FOR SELECT TO authenticated
  USING ((SELECT public.has_role('admin')));
CREATE POLICY audit_insert ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('editor')) AND user_id = (SELECT auth.uid())::text);

-- Actividad del dashboard: lectura viewer, inserción editor.
GRANT SELECT, INSERT ON public.dashboard_activity TO authenticated;
CREATE POLICY activity_select ON public.dashboard_activity FOR SELECT TO authenticated
  USING ((SELECT public.has_role('viewer')));
CREATE POLICY activity_insert ON public.dashboard_activity FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.has_role('editor')));

-- Configuración general: lectura viewer, cambios admin (la fila única ya existe).
GRANT SELECT, UPDATE ON public.app_settings TO authenticated;
CREATE POLICY settings_select ON public.app_settings FOR SELECT TO authenticated
  USING ((SELECT public.has_role('viewer')));
CREATE POLICY settings_update ON public.app_settings FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin'))) WITH CHECK ((SELECT public.has_role('admin')));

-- Integraciones (configuración no sensible; los secretos van en otra tabla).
GRANT SELECT, UPDATE ON public.integration_configs TO authenticated;
CREATE POLICY integrations_select ON public.integration_configs FOR SELECT TO authenticated
  USING ((SELECT public.has_role('viewer')));
CREATE POLICY integrations_update ON public.integration_configs FOR UPDATE TO authenticated
  USING ((SELECT public.has_role('admin'))) WITH CHECK ((SELECT public.has_role('admin')));

-- ---------------------------------------------------------------------------
-- Autoría de capturas: la fija el servidor.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_capture_author()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.captured_by := auth.uid()::text;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS captures_set_author ON public.captures;
CREATE TRIGGER captures_set_author BEFORE INSERT ON public.captures
  FOR EACH ROW EXECUTE FUNCTION public.set_capture_author();

-- ---------------------------------------------------------------------------
-- Funciones RPC: solo usuarios autenticados (RLS decide el resto).
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.promote_capture_to_product(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_capture_to_product(text) TO authenticated;
REVOKE ALL ON FUNCTION public.process_capture_matches(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_capture_matches(text) TO authenticated;

-- Las tablas que se creen después no quedan abiertas a anon por defecto.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
