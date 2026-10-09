/*
# CatalogAI - Full Schema Creation

Creates all tables for the CatalogAI PIM system:
- brands, categories, category_assignments
- products, product_variants, product_identifiers, product_aliases
- captures, product_matches
- marketplace_accounts, marketplace_listings
- warehouses, warehouse_locations, inventory_balances, inventory_movements
- suppliers, product_suppliers
- product_images
- jobs, audit_logs, dashboard_activity

Security:
- RLS enabled on all tables
- Single-tenant app (no auth): policies allow anon + authenticated CRUD
*/

-- ---- Brands ----
CREATE TABLE IF NOT EXISTS brands (
  id text PRIMARY KEY,
  name text NOT NULL,
  normalized_name text NOT NULL,
  aliases text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_brands" ON brands;
CREATE POLICY "anon_select_brands" ON brands FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_brands" ON brands;
CREATE POLICY "anon_insert_brands" ON brands FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_brands" ON brands;
CREATE POLICY "anon_update_brands" ON brands FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_brands" ON brands;
CREATE POLICY "anon_delete_brands" ON brands FOR DELETE TO anon, authenticated USING (true);

-- ---- Categories ----
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  parent_id text REFERENCES categories(id),
  name text NOT NULL,
  slug text NOT NULL,
  path text NOT NULL,
  active boolean DEFAULT true
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE TO anon, authenticated USING (true);

-- ---- Category Assignments ----
CREATE TABLE IF NOT EXISTS category_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  category_id text NOT NULL REFERENCES categories(id),
  is_primary boolean DEFAULT false
);

ALTER TABLE category_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_cat_assign" ON category_assignments;
CREATE POLICY "anon_select_cat_assign" ON category_assignments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cat_assign" ON category_assignments;
CREATE POLICY "anon_insert_cat_assign" ON category_assignments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cat_assign" ON category_assignments;
CREATE POLICY "anon_update_cat_assign" ON category_assignments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cat_assign" ON category_assignments;
CREATE POLICY "anon_delete_cat_assign" ON category_assignments FOR DELETE TO anon, authenticated USING (true);

-- ---- Products ----
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  internal_product_number text NOT NULL,
  title_master text NOT NULL,
  normalized_title text NOT NULL,
  description_master text,
  brand_id text REFERENCES brands(id),
  brand_name text,
  model text,
  manufacturer text,
  product_type text,
  condition text NOT NULL DEFAULT 'NEW',
  status text NOT NULL DEFAULT 'DRAFT',
  launch_date date,
  tax_product_code text,
  tax_unit_code text,
  tax_object_code text,
  default_variant_id text,
  primary_image_url text,
  variant_count int DEFAULT 0,
  total_inventory int DEFAULT 0,
  listing_count int DEFAULT 0,
  created_by text,
  updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  archived_at timestamptz
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE TO anon, authenticated USING (true);

-- ---- Product Variants ----
CREATE TABLE IF NOT EXISTS product_variants (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  internal_sku text NOT NULL,
  sku_alias text,
  variant_name text,
  color text,
  size text,
  material text,
  capacity text,
  package_quantity int,
  unit_of_measure text,
  package_weight_grams int,
  package_length_cm int,
  package_width_cm int,
  package_height_cm int,
  purchase_cost numeric(12,2),
  retail_price numeric(12,2),
  currency text DEFAULT 'USD',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_variants" ON product_variants;
CREATE POLICY "anon_select_variants" ON product_variants FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_variants" ON product_variants;
CREATE POLICY "anon_insert_variants" ON product_variants FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_variants" ON product_variants;
CREATE POLICY "anon_update_variants" ON product_variants FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_variants" ON product_variants;
CREATE POLICY "anon_delete_variants" ON product_variants FOR DELETE TO anon, authenticated USING (true);

-- ---- Product Identifiers ----
CREATE TABLE IF NOT EXISTS product_identifiers (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id text REFERENCES product_variants(id) ON DELETE CASCADE,
  identifier_type text NOT NULL,
  identifier_value text NOT NULL,
  normalized_value text,
  country_code text,
  source text,
  verified boolean DEFAULT false,
  verification_status text DEFAULT 'UNVERIFIED',
  verification_notes text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_identifiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_identifiers" ON product_identifiers;
CREATE POLICY "anon_select_identifiers" ON product_identifiers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_identifiers" ON product_identifiers;
CREATE POLICY "anon_insert_identifiers" ON product_identifiers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_identifiers" ON product_identifiers;
CREATE POLICY "anon_update_identifiers" ON product_identifiers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_identifiers" ON product_identifiers;
CREATE POLICY "anon_delete_identifiers" ON product_identifiers FOR DELETE TO anon, authenticated USING (true);

-- ---- Product Aliases ----
CREATE TABLE IF NOT EXISTS product_aliases (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id text REFERENCES product_variants(id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text,
  language text DEFAULT 'es',
  source text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_aliases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_aliases" ON product_aliases;
CREATE POLICY "anon_select_aliases" ON product_aliases FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_aliases" ON product_aliases;
CREATE POLICY "anon_insert_aliases" ON product_aliases FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_aliases" ON product_aliases;
CREATE POLICY "anon_update_aliases" ON product_aliases FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_aliases" ON product_aliases;
CREATE POLICY "anon_delete_aliases" ON product_aliases FOR DELETE TO anon, authenticated USING (true);

-- ---- Captures ----
CREATE TABLE IF NOT EXISTS captures (
  id text PRIMARY KEY,
  source_type text NOT NULL,
  source_url text,
  source_domain text,
  external_reference text,
  captured_title text NOT NULL,
  captured_description text,
  captured_brand text,
  captured_model text,
  captured_mpn text,
  captured_upc text,
  captured_asin text,
  captured_price numeric(12,2),
  captured_currency text,
  captured_attributes jsonb DEFAULT '{}',
  captured_images text[] DEFAULT '{}',
  raw_payload jsonb,
  status text NOT NULL DEFAULT 'RECEIVED',
  assigned_product_id text REFERENCES products(id),
  assigned_variant_id text REFERENCES product_variants(id),
  best_match_product_id text,
  best_match_confidence numeric(5,2),
  best_match_recommendation text,
  captured_by text,
  captured_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE captures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_captures" ON captures;
CREATE POLICY "anon_select_captures" ON captures FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_captures" ON captures;
CREATE POLICY "anon_insert_captures" ON captures FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_captures" ON captures;
CREATE POLICY "anon_update_captures" ON captures FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_captures" ON captures;
CREATE POLICY "anon_delete_captures" ON captures FOR DELETE TO anon, authenticated USING (true);

-- ---- Product Matches ----
CREATE TABLE IF NOT EXISTS product_matches (
  id text PRIMARY KEY,
  capture_id text NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
  capture_title text,
  capture_source_domain text,
  capture_upc text,
  capture_brand text,
  capture_model text,
  capture_image_url text,
  candidate_product_id text NOT NULL,
  candidate_variant_id text,
  candidate_title text,
  candidate_brand text,
  candidate_model text,
  candidate_upc text,
  candidate_image_url text,
  total_score numeric(5,2),
  confidence_percentage numeric(5,2),
  identifier_score int,
  brand_score int,
  model_score int,
  attribute_score int,
  text_score int,
  image_score int,
  ai_score int DEFAULT 0,
  match_reasons text[] DEFAULT '{}',
  conflicts text[] DEFAULT '{}',
  missing_fields text[] DEFAULT '{}',
  positive_evidence text[] DEFAULT '{}',
  decision text NOT NULL DEFAULT 'PENDING',
  decision_source text DEFAULT 'SYSTEM',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  recommendation text,
  requires_human_review boolean DEFAULT false
);

ALTER TABLE product_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_matches" ON product_matches;
CREATE POLICY "anon_select_matches" ON product_matches FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_matches" ON product_matches;
CREATE POLICY "anon_insert_matches" ON product_matches FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_matches" ON product_matches;
CREATE POLICY "anon_update_matches" ON product_matches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_matches" ON product_matches;
CREATE POLICY "anon_delete_matches" ON product_matches FOR DELETE TO anon, authenticated USING (true);

-- ---- Marketplace Accounts ----
CREATE TABLE IF NOT EXISTS marketplace_accounts (
  id text PRIMARY KEY,
  marketplace text NOT NULL,
  account_name text NOT NULL,
  seller_identifier text,
  active boolean DEFAULT true,
  configuration jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_accounts" ON marketplace_accounts;
CREATE POLICY "anon_select_accounts" ON marketplace_accounts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_accounts" ON marketplace_accounts;
CREATE POLICY "anon_insert_accounts" ON marketplace_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_accounts" ON marketplace_accounts;
CREATE POLICY "anon_update_accounts" ON marketplace_accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_accounts" ON marketplace_accounts;
CREATE POLICY "anon_delete_accounts" ON marketplace_accounts FOR DELETE TO anon, authenticated USING (true);

-- ---- Marketplace Listings ----
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id text REFERENCES product_variants(id) ON DELETE CASCADE,
  account_id text NOT NULL REFERENCES marketplace_accounts(id),
  account_name text,
  marketplace text NOT NULL,
  marketplace_listing_id text,
  marketplace_catalog_id text,
  seller_sku text,
  listing_title text,
  listing_url text,
  listing_status text NOT NULL DEFAULT 'DRAFT',
  marketplace_category_id text,
  price numeric(12,2),
  currency text DEFAULT 'MXN',
  available_quantity int,
  listing_type text,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_listings" ON marketplace_listings;
CREATE POLICY "anon_select_listings" ON marketplace_listings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_listings" ON marketplace_listings;
CREATE POLICY "anon_insert_listings" ON marketplace_listings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_listings" ON marketplace_listings;
CREATE POLICY "anon_update_listings" ON marketplace_listings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_listings" ON marketplace_listings;
CREATE POLICY "anon_delete_listings" ON marketplace_listings FOR DELETE TO anon, authenticated USING (true);

-- ---- Warehouses ----
CREATE TABLE IF NOT EXISTS warehouses (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL,
  street text,
  city text,
  state text,
  country text,
  is_default boolean DEFAULT false,
  active boolean DEFAULT true
);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_warehouses" ON warehouses;
CREATE POLICY "anon_select_warehouses" ON warehouses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_warehouses" ON warehouses;
CREATE POLICY "anon_insert_warehouses" ON warehouses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_warehouses" ON warehouses;
CREATE POLICY "anon_update_warehouses" ON warehouses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_warehouses" ON warehouses;
CREATE POLICY "anon_delete_warehouses" ON warehouses FOR DELETE TO anon, authenticated USING (true);

-- ---- Warehouse Locations ----
CREATE TABLE IF NOT EXISTS warehouse_locations (
  id text PRIMARY KEY,
  warehouse_id text NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  location_code text NOT NULL,
  aisle text,
  shelf text,
  bin text,
  description text,
  active boolean DEFAULT true
);

ALTER TABLE warehouse_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_wh_locations" ON warehouse_locations;
CREATE POLICY "anon_select_wh_locations" ON warehouse_locations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wh_locations" ON warehouse_locations;
CREATE POLICY "anon_insert_wh_locations" ON warehouse_locations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wh_locations" ON warehouse_locations;
CREATE POLICY "anon_update_wh_locations" ON warehouse_locations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wh_locations" ON warehouse_locations;
CREATE POLICY "anon_delete_wh_locations" ON warehouse_locations FOR DELETE TO anon, authenticated USING (true);

-- ---- Inventory Balances ----
CREATE TABLE IF NOT EXISTS inventory_balances (
  id text PRIMARY KEY,
  variant_id text NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  variant_sku text,
  warehouse_id text NOT NULL REFERENCES warehouses(id),
  warehouse_name text,
  location_id text REFERENCES warehouse_locations(id),
  location_code text,
  on_hand int DEFAULT 0,
  available int DEFAULT 0,
  reserved int DEFAULT 0,
  occupied int DEFAULT 0,
  damaged int DEFAULT 0,
  incoming int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_inventory" ON inventory_balances;
CREATE POLICY "anon_select_inventory" ON inventory_balances FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_inventory" ON inventory_balances;
CREATE POLICY "anon_insert_inventory" ON inventory_balances FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_inventory" ON inventory_balances;
CREATE POLICY "anon_update_inventory" ON inventory_balances FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_inventory" ON inventory_balances;
CREATE POLICY "anon_delete_inventory" ON inventory_balances FOR DELETE TO anon, authenticated USING (true);

-- ---- Inventory Movements ----
CREATE TABLE IF NOT EXISTS inventory_movements (
  id text PRIMARY KEY,
  variant_id text NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  variant_sku text,
  warehouse_id text NOT NULL REFERENCES warehouses(id),
  warehouse_name text,
  location_id text,
  movement_type text NOT NULL,
  quantity int NOT NULL,
  previous_quantity int,
  resulting_quantity int,
  reference_type text,
  reference_id text,
  notes text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_movements" ON inventory_movements;
CREATE POLICY "anon_select_movements" ON inventory_movements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_movements" ON inventory_movements;
CREATE POLICY "anon_insert_movements" ON inventory_movements FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_movements" ON inventory_movements;
CREATE POLICY "anon_update_movements" ON inventory_movements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_movements" ON inventory_movements;
CREATE POLICY "anon_delete_movements" ON inventory_movements FOR DELETE TO anon, authenticated USING (true);

-- ---- Suppliers ----
CREATE TABLE IF NOT EXISTS suppliers (
  id text PRIMARY KEY,
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  website text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_suppliers" ON suppliers;
CREATE POLICY "anon_select_suppliers" ON suppliers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_suppliers" ON suppliers;
CREATE POLICY "anon_insert_suppliers" ON suppliers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_suppliers" ON suppliers;
CREATE POLICY "anon_update_suppliers" ON suppliers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_suppliers" ON suppliers;
CREATE POLICY "anon_delete_suppliers" ON suppliers FOR DELETE TO anon, authenticated USING (true);

-- ---- Product Suppliers ----
CREATE TABLE IF NOT EXISTS product_suppliers (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id text REFERENCES product_variants(id) ON DELETE CASCADE,
  supplier_id text NOT NULL REFERENCES suppliers(id),
  supplier_name text,
  supplier_sku text,
  supplier_url text,
  purchase_cost numeric(12,2),
  currency text DEFAULT 'USD',
  minimum_order_quantity int,
  purchase_multiple int,
  lead_time_days int,
  is_default boolean DEFAULT false,
  active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_prod_suppliers" ON product_suppliers;
CREATE POLICY "anon_select_prod_suppliers" ON product_suppliers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_prod_suppliers" ON product_suppliers;
CREATE POLICY "anon_insert_prod_suppliers" ON product_suppliers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_prod_suppliers" ON product_suppliers;
CREATE POLICY "anon_update_prod_suppliers" ON product_suppliers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_prod_suppliers" ON product_suppliers;
CREATE POLICY "anon_delete_prod_suppliers" ON product_suppliers FOR DELETE TO anon, authenticated USING (true);

-- ---- Product Images ----
CREATE TABLE IF NOT EXISTS product_images (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id text REFERENCES product_variants(id) ON DELETE CASCADE,
  original_url text,
  storage_provider text,
  storage_file_id text,
  storage_path text,
  public_delivery_url text,
  mime_type text,
  original_filename text,
  file_size_bytes bigint,
  width int,
  height int,
  sha256 text,
  perceptual_hash text,
  image_type text DEFAULT 'MAIN',
  display_order int DEFAULT 0,
  alt_text text,
  source text,
  status text DEFAULT 'URL_CAPTURED',
  approved boolean DEFAULT false,
  generated_by_ai boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_images" ON product_images;
CREATE POLICY "anon_select_images" ON product_images FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_images" ON product_images;
CREATE POLICY "anon_insert_images" ON product_images FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_images" ON product_images;
CREATE POLICY "anon_update_images" ON product_images FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_images" ON product_images;
CREATE POLICY "anon_delete_images" ON product_images FOR DELETE TO anon, authenticated USING (true);

-- ---- Jobs ----
CREATE TABLE IF NOT EXISTS jobs (
  id text PRIMARY KEY,
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  priority int DEFAULT 5,
  payload jsonb DEFAULT '{}',
  result jsonb,
  assigned_worker text,
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  scheduled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  heartbeat_at timestamptz,
  error_message text,
  entity_label text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_jobs" ON jobs;
CREATE POLICY "anon_select_jobs" ON jobs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_jobs" ON jobs;
CREATE POLICY "anon_insert_jobs" ON jobs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_jobs" ON jobs;
CREATE POLICY "anon_update_jobs" ON jobs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_jobs" ON jobs;
CREATE POLICY "anon_delete_jobs" ON jobs FOR DELETE TO anon, authenticated USING (true);

-- ---- Audit Logs ----
CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  user_id text,
  user_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  before jsonb,
  after jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_audit" ON audit_logs;
CREATE POLICY "anon_select_audit" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_audit" ON audit_logs;
CREATE POLICY "anon_insert_audit" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_audit" ON audit_logs;
CREATE POLICY "anon_update_audit" ON audit_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_audit" ON audit_logs;
CREATE POLICY "anon_delete_audit" ON audit_logs FOR DELETE TO anon, authenticated USING (true);

-- ---- Dashboard Activity ----
CREATE TABLE IF NOT EXISTS dashboard_activity (
  id text PRIMARY KEY,
  activity_type text NOT NULL,
  description text NOT NULL,
  timestamp timestamptz NOT NULL,
  user_name text
);

ALTER TABLE dashboard_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_activity" ON dashboard_activity;
CREATE POLICY "anon_select_activity" ON dashboard_activity FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_activity" ON dashboard_activity;
CREATE POLICY "anon_insert_activity" ON dashboard_activity FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_activity" ON dashboard_activity;
CREATE POLICY "anon_update_activity" ON dashboard_activity FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_activity" ON dashboard_activity;
CREATE POLICY "anon_delete_activity" ON dashboard_activity FOR DELETE TO anon, authenticated USING (true);

-- ---- Indexes ----
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_identifiers_product ON product_identifiers(product_id);
CREATE INDEX IF NOT EXISTS idx_listings_product ON marketplace_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variant ON inventory_balances(variant_id);
CREATE INDEX IF NOT EXISTS idx_movements_variant ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_matches_capture ON product_matches(capture_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
