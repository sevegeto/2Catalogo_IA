/*
# Secretos de integraciones fuera del navegador

Antes: integration_configs.credentials (jsonb) se podía leer con la clave anon.

Ahora:
  - integration_secrets guarda los secretos. RLS activa, SIN políticas y sin
    permisos para anon/authenticated: solo service_role (Edge Functions, worker)
    puede leerla.
  - integration_configs conserva solo configuración no sensible y la lista
    secret_fields con los NOMBRES de los secretos configurados (nunca los valores).
  - set_integration_secrets(id, jsonb): escritura para admin. Es de solo escritura:
    no existe ninguna función que devuelva valores al cliente.
      · clave con texto  → guarda o reemplaza
      · clave con null   → elimina ese secreto
      · clave con ''     → no cambia nada (campo dejado en blanco en el formulario)
  - Cada cambio se registra en audit_logs con los nombres de los campos, sin valores.

Los datos existentes se migran: clientId, sellerId y serviceAccountEmail pasan a
settings (no son secretos); el resto pasa a integration_secrets. Después se elimina
la columna credentials.
*/

CREATE TABLE IF NOT EXISTS public.integration_secrets (
  integration_id text PRIMARY KEY REFERENCES public.integration_configs(id) ON DELETE CASCADE,
  secrets jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.integration_secrets FROM PUBLIC, anon, authenticated;

ALTER TABLE public.integration_configs
  ADD COLUMN IF NOT EXISTS secret_fields text[] NOT NULL DEFAULT '{}';

-- Migración de credenciales existentes.
DO $$
DECLARE
  public_keys text[] := ARRAY['clientId', 'sellerId', 'serviceAccountEmail'];
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'integration_configs'
               AND column_name = 'credentials') THEN

    UPDATE public.integration_configs ic
    SET settings = coalesce(ic.settings, '{}'::jsonb) || coalesce((
      SELECT jsonb_object_agg(key, value) FROM jsonb_each(ic.credentials)
      WHERE key = ANY(public_keys) AND jsonb_typeof(value) = 'string' AND btrim(value #>> '{}') <> ''
    ), '{}'::jsonb)
    WHERE ic.credentials IS NOT NULL AND ic.credentials <> '{}'::jsonb;

    INSERT INTO public.integration_secrets (integration_id, secrets)
    SELECT ic.id, s.secrets
    FROM public.integration_configs ic
    CROSS JOIN LATERAL (
      SELECT jsonb_object_agg(key, value) AS secrets FROM jsonb_each(ic.credentials)
      WHERE NOT (key = ANY(public_keys)) AND jsonb_typeof(value) = 'string' AND btrim(value #>> '{}') <> ''
    ) s
    WHERE s.secrets IS NOT NULL
    ON CONFLICT (integration_id) DO UPDATE SET secrets = public.integration_secrets.secrets || EXCLUDED.secrets;

    ALTER TABLE public.integration_configs DROP COLUMN credentials;
  END IF;
END $$;

UPDATE public.integration_configs ic
SET secret_fields = coalesce((SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(s.secrets) AS k), '{}')
FROM public.integration_secrets s
WHERE s.integration_id = ic.id;

-- Escritura de secretos (solo admin).
CREATE OR REPLACE FUNCTION public.set_integration_secrets(p_integration_id text, p_secrets jsonb)
RETURNS text[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  allowed text[] := ARRAY['clientSecret', 'refreshToken', 'accessToken', 'privateKey', 'apiKey', 'workerToken'];
  current_secrets jsonb;
  entry record;
  changed text[] := ARRAY[]::text[];
  fields text[];
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Solo un administrador puede modificar credenciales' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.integration_configs WHERE id = p_integration_id) THEN
    RAISE EXCEPTION 'Integración no encontrada';
  END IF;
  IF p_secrets IS NULL OR jsonb_typeof(p_secrets) <> 'object' THEN
    RAISE EXCEPTION 'Formato de credenciales inválido';
  END IF;

  SELECT secrets INTO current_secrets FROM public.integration_secrets
    WHERE integration_id = p_integration_id FOR UPDATE;
  current_secrets := coalesce(current_secrets, '{}'::jsonb);

  FOR entry IN SELECT key, value FROM jsonb_each(p_secrets) LOOP
    IF NOT (entry.key = ANY(allowed)) THEN
      RAISE EXCEPTION 'Campo de credencial no permitido: %', entry.key;
    END IF;
    IF jsonb_typeof(entry.value) = 'null' THEN
      IF current_secrets ? entry.key THEN
        current_secrets := current_secrets - entry.key;
        changed := array_append(changed, entry.key);
      END IF;
    ELSIF jsonb_typeof(entry.value) = 'string' THEN
      IF btrim(entry.value #>> '{}') = '' THEN CONTINUE; END IF;
      IF length(entry.value #>> '{}') > 16384 THEN
        RAISE EXCEPTION 'La credencial % es demasiado larga', entry.key;
      END IF;
      current_secrets := current_secrets || jsonb_build_object(entry.key, entry.value #>> '{}');
      changed := array_append(changed, entry.key);
    ELSE
      RAISE EXCEPTION 'La credencial % debe ser texto', entry.key;
    END IF;
  END LOOP;

  IF cardinality(changed) > 0 THEN
    INSERT INTO public.integration_secrets (integration_id, secrets, updated_at, updated_by)
    VALUES (p_integration_id, current_secrets, now(), auth.uid())
    ON CONFLICT (integration_id) DO UPDATE
      SET secrets = EXCLUDED.secrets, updated_at = now(), updated_by = auth.uid();

    INSERT INTO public.audit_logs (id, user_id, user_name, action, entity_type, entity_id, after)
    VALUES ('aud_' || gen_random_uuid()::text, auth.uid()::text,
      (SELECT display_name FROM public.user_roles WHERE user_id = auth.uid()),
      'INTEGRATION_SECRETS_UPDATED', 'integration_config', p_integration_id,
      jsonb_build_object('fields', to_jsonb(changed)));
  END IF;

  SELECT coalesce(array_agg(k ORDER BY k), '{}') INTO fields FROM jsonb_object_keys(current_secrets) AS k;
  UPDATE public.integration_configs SET secret_fields = fields, updated_at = now()
    WHERE id = p_integration_id;
  RETURN fields;
END;
$$;

REVOKE ALL ON FUNCTION public.set_integration_secrets(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_integration_secrets(text, jsonb) TO authenticated;

-- secret_fields solo cambia a través de la función anterior.
REVOKE UPDATE ON public.integration_configs FROM authenticated;
GRANT UPDATE (enabled, settings, last_connected_at, last_error, updated_at, name)
  ON public.integration_configs TO authenticated;
