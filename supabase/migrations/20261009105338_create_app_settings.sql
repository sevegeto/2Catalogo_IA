/*
# Create app_settings table

1. New Tables
- `app_settings` — single-row key/value store for system preferences
  - `id` (int, primary key, always 1)
  - `rate_limiting` (boolean, default true)
  - `csrf_protection` (boolean, default true)
  - `audit_logging` (boolean, default true)
  - `notif_jobs_failed` (boolean, default true)
  - `notif_duplicates` (boolean, default true)
  - `updated_at` (timestamptz)

2. Security
- RLS enabled, anon + authenticated CRUD (single-tenant app)
*/

CREATE TABLE IF NOT EXISTS app_settings (
  id int PRIMARY KEY DEFAULT 1,
  rate_limiting boolean NOT NULL DEFAULT true,
  csrf_protection boolean NOT NULL DEFAULT true,
  audit_logging boolean NOT NULL DEFAULT true,
  notif_jobs_failed boolean NOT NULL DEFAULT true,
  notif_duplicates boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON app_settings;
CREATE POLICY "anon_select_settings" ON app_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_settings" ON app_settings;
CREATE POLICY "anon_insert_settings" ON app_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_settings" ON app_settings;
CREATE POLICY "anon_update_settings" ON app_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_settings" ON app_settings;
CREATE POLICY "anon_delete_settings" ON app_settings FOR DELETE TO anon, authenticated USING (true);

INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
