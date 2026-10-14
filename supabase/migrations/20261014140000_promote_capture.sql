-- Atomic promotion. Runs with caller permissions and existing RLS policies.
CREATE OR REPLACE FUNCTION public.normalize_catalog_identifier(value text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$ SELECT upper(regexp_replace(btrim(coalesce(value, '')), '[[:space:]-]+', '', 'g')); $$;

CREATE OR REPLACE FUNCTION public.promote_capture_to_product(p_capture_id text)
RETURNS SETOF public.products LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  c public.captures%ROWTYPE;
  v_product_id text := 'prd_' || gen_random_uuid()::text;
  v_variant_id text := 'var_' || gen_random_uuid()::text;
  ipn text := 'IPN-' || gen_random_uuid()::text;
  first_image text;
BEGIN
  SELECT * INTO c FROM public.captures WHERE id = p_capture_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Captura no encontrada'; END IF;
  IF c.assigned_product_id IS NOT NULL THEN
    RETURN QUERY SELECT * FROM public.products WHERE id = c.assigned_product_id;
    RETURN;
  END IF;
  IF c.status IN ('REJECTED', 'COMPLETED', 'MATCHED') THEN
    RAISE EXCEPTION 'La captura no puede convertirse en producto en su estado actual';
  END IF;
  IF btrim(c.captured_title) = '' THEN RAISE EXCEPTION 'El titulo es obligatorio'; END IF;

  INSERT INTO public.products (id, internal_product_number, title_master, normalized_title,
    description_master, brand_name, model, manufacturer, condition, status,
    default_variant_id, variant_count, created_by, updated_by)
  VALUES (v_product_id, ipn, c.captured_title, lower(c.captured_title),
    coalesce(c.captured_description, ''), coalesce(c.captured_brand, ''),
    coalesce(c.captured_model, ''), coalesce(c.captured_brand, ''), 'NEW', 'DRAFT',
    v_variant_id, 1, coalesce(c.captured_by, 'system'), coalesce(c.captured_by, 'system'));

  INSERT INTO public.product_variants (id, product_id, internal_sku, variant_name, retail_price, currency)
  VALUES (v_variant_id, v_product_id, ipn || '-01', 'Predeterminada', c.captured_price,
    coalesce(nullif(c.captured_currency, ''), 'MXN'));

  INSERT INTO public.product_identifiers (id, product_id, variant_id, identifier_type,
    identifier_value, normalized_value, source, verified, verification_status, is_primary)
  SELECT v_product_id || '_identifier_' || (row_number() OVER (ORDER BY position) - 1)::text,
    v_product_id, v_variant_id,
    CASE WHEN kind = 'BARCODE' THEN
      CASE WHEN public.normalize_catalog_identifier(value) ~ '^[0-9]+$' THEN
        CASE length(public.normalize_catalog_identifier(value))
          WHEN 8 THEN 'EAN_8' WHEN 12 THEN 'UPC_A' WHEN 13 THEN 'EAN_13'
          WHEN 14 THEN 'GTIN_14' ELSE 'OTHER' END
        ELSE 'OTHER' END
      ELSE kind END,
    btrim(value), public.normalize_catalog_identifier(value),
    coalesce(nullif(c.source_url, ''), c.source_type), false, 'UNVERIFIED',
    row_number() OVER (ORDER BY position) = 1
  FROM (VALUES (0, 'BARCODE', c.captured_upc), (1, 'ASIN', c.captured_asin),
    (2, 'MPN', c.captured_mpn)) AS identifiers(position, kind, value)
  WHERE nullif(btrim(value), '') IS NOT NULL;

  INSERT INTO public.product_images (id, product_id, variant_id, original_url,
    storage_provider, image_type, display_order, alt_text, source, status, approved)
  SELECT v_product_id || '_image_' || (row_number() OVER (ORDER BY first_position) - 1)::text,
    v_product_id, v_variant_id, url, 'EXTERNAL_URL',
    CASE WHEN row_number() OVER (ORDER BY first_position) = 1 THEN 'MAIN' ELSE 'ALTERNATE' END,
    (row_number() OVER (ORDER BY first_position) - 1)::int, c.captured_title,
    coalesce(nullif(c.source_url, ''), c.source_type), 'URL_CAPTURED', false
  FROM (
    SELECT btrim(value) AS url, min(position) AS first_position
    FROM unnest(c.captured_images) WITH ORDINALITY AS urls(value, position)
    WHERE btrim(value) ~* '^https?://[^[:space:]/?#@]+([/?#][^[:space:]]*)?$'
    GROUP BY btrim(value)
  ) AS images;

  SELECT original_url INTO first_image FROM public.product_images
    WHERE product_images.product_id = v_product_id ORDER BY display_order LIMIT 1;
  UPDATE public.products SET primary_image_url = first_image WHERE id = v_product_id;
  UPDATE public.captures SET status = 'COMPLETED', assigned_product_id = v_product_id,
    assigned_variant_id = v_variant_id, processed_at = now() WHERE id = p_capture_id;
  RETURN QUERY SELECT * FROM public.products WHERE id = v_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_capture_to_product(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_capture_to_product(text) TO anon, authenticated;
