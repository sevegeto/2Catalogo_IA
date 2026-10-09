/*
# Create integration_configs table

1. New Tables
- `integration_configs` — stores configuration for each external integration
  - `id` (text, primary key — slug like 'mercadolibre', 'google_sheets', etc.)
  - `name` (text, display name)
  - `category` (text — 'marketplace', 'storage', 'sheets', 'ai_worker', 'extension')
  - `enabled` (boolean, default false)
  - `credentials` (jsonb, stores API keys, tokens, URLs — encrypted at rest by Supabase)
  - `settings` (jsonb, stores non-secret settings like sync intervals, site codes)
  - `last_connected_at` (timestamptz, last successful connection)
  - `last_error` (text, last error message if connection failed)
  - `created_at` / `updated_at` (timestamptz)

2. Security
- RLS enabled, anon + authenticated CRUD (single-tenant app, no auth)
*/

CREATE TABLE IF NOT EXISTS integration_configs (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  credentials jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  last_connected_at timestamptz,
  last_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_integrations" ON integration_configs;
CREATE POLICY "anon_select_integrations" ON integration_configs FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_integrations" ON integration_configs;
CREATE POLICY "anon_insert_integrations" ON integration_configs FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_integrations" ON integration_configs;
CREATE POLICY "anon_update_integrations" ON integration_configs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_integrations" ON integration_configs;
CREATE POLICY "anon_delete_integrations" ON integration_configs FOR DELETE
  TO anon, authenticated USING (true);

-- Seed default integration rows
INSERT INTO integration_configs (id, name, category, enabled, settings) VALUES
  ('mercadolibre', 'MercadoLibre', 'marketplace', true, '{"site": "MLM", "accountName": "MITIENDOTA"}'::jsonb),
  ('google_sheets', 'Google Sheets', 'sheets', false, '{}'::jsonb),
  ('google_drive', 'Google Drive', 'storage', false, '{}'::jsonb),
  ('chrome_extension', 'Extension Chrome', 'extension', false, '{}'::jsonb),
  ('ollama_worker', 'Ollama Worker', 'ai_worker', false, '{"host": "localhost", "port": 11434}'::jsonb)
ON CONFLICT (id) DO NOTHING;
