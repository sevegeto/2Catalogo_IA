-- Matching in the database covers all insert sources, including the Chrome extension.
CREATE OR REPLACE FUNCTION public.catalog_match_text(value text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$ SELECT lower(regexp_replace(btrim(coalesce(value, '')), '[[:space:]]+', ' ', 'g')); $$;

CREATE OR REPLACE FUNCTION public.catalog_match_barcode(value text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$ SELECT CASE WHEN public.normalize_catalog_identifier(value) ~ '^([0-9]{8}|[0-9]{12}|[0-9]{13}|[0-9]{14})$'
  THEN lpad(public.normalize_catalog_identifier(value), 14, '0') ELSE '' END; $$;

CREATE INDEX IF NOT EXISTS capture_matches_capture_idx ON public.product_matches(capture_id);
CREATE INDEX IF NOT EXISTS catalog_identifiers_product_idx ON public.product_identifiers(product_id);
CREATE INDEX IF NOT EXISTS catalog_identifiers_lookup_idx ON public.product_identifiers
  (identifier_type, public.normalize_catalog_identifier(identifier_value));
CREATE INDEX IF NOT EXISTS catalog_brand_model_idx ON public.products
  (public.catalog_match_text(brand_name), public.catalog_match_text(model));

CREATE OR REPLACE FUNCTION public.process_capture_matches(p_capture_id text)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  c public.captures%ROWTYPE;
  candidate record;
  reasons text[];
  conflicts_found text[];
  score integer;
  best public.product_matches%ROWTYPE;
  match_count integer;
BEGIN
  SELECT * INTO c FROM public.captures WHERE id = p_capture_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Captura no encontrada'; END IF;
  IF c.assigned_product_id IS NOT NULL OR c.status IN ('REJECTED', 'COMPLETED', 'MATCHED') THEN RETURN 0; END IF;
  DELETE FROM public.product_matches WHERE capture_id = p_capture_id AND decision = 'PENDING';
  FOR candidate IN
    SELECT p.*,
      public.catalog_match_text(c.captured_brand) <> '' AND public.catalog_match_text(c.captured_brand) = public.catalog_match_text(p.brand_name) AS brand_match,
      public.catalog_match_text(c.captured_model) <> '' AND public.catalog_match_text(c.captured_model) = public.catalog_match_text(p.model) AS model_match,
      ids.upcs, ids.asins, ids.first_upc,
      public.catalog_match_barcode(c.captured_upc) <> '' AND public.catalog_match_barcode(c.captured_upc) = ANY(ids.upcs) AS upc_match,
      public.normalize_catalog_identifier(c.captured_asin) <> '' AND public.normalize_catalog_identifier(c.captured_asin) = ANY(ids.asins) AS asin_match
    FROM public.products p
    CROSS JOIN LATERAL (
      SELECT coalesce(array_agg(public.catalog_match_barcode(i.identifier_value)) FILTER (
        WHERE i.identifier_type IN ('UPC_A', 'EAN_8', 'EAN_13', 'GTIN_12', 'GTIN_13', 'GTIN_14')
          AND public.catalog_match_barcode(i.identifier_value) <> ''), ARRAY[]::text[]) AS upcs,
        coalesce(array_agg(public.normalize_catalog_identifier(i.identifier_value)) FILTER (WHERE i.identifier_type = 'ASIN'), ARRAY[]::text[]) AS asins,
        min(i.identifier_value) FILTER (WHERE i.identifier_type IN ('UPC_A', 'EAN_8', 'EAN_13', 'GTIN_12', 'GTIN_13', 'GTIN_14')) AS first_upc
      FROM public.product_identifiers i WHERE i.product_id = p.id AND i.verification_status IS DISTINCT FROM 'REJECTED'
    ) ids
    WHERE p.status NOT IN ('ARCHIVED', 'REJECTED') AND p.archived_at IS NULL
  LOOP
    IF NOT (candidate.upc_match OR candidate.asin_match OR (candidate.brand_match AND candidate.model_match)) THEN CONTINUE; END IF;
    -- Preserve human decisions, including explicitly rejected candidates.
    IF EXISTS (SELECT 1 FROM public.product_matches m WHERE m.capture_id = p_capture_id
      AND m.candidate_product_id = candidate.id AND m.decision <> 'PENDING') THEN CONTINUE; END IF;
    reasons := ARRAY[]::text[];
    conflicts_found := ARRAY[]::text[];
    IF candidate.upc_match THEN reasons := array_append(reasons, 'UPC / EAN / GTIN exacto'); END IF;
    IF candidate.asin_match THEN reasons := array_append(reasons, 'ASIN exacto'); END IF;
    IF candidate.brand_match AND candidate.model_match THEN reasons := array_append(reasons, 'Marca y modelo exactos'); END IF;
    IF public.catalog_match_text(c.captured_brand) <> '' AND public.catalog_match_text(candidate.brand_name) <> '' AND NOT candidate.brand_match THEN
      conflicts_found := array_append(conflicts_found, 'Marca diferente'); END IF;
    IF public.catalog_match_text(c.captured_model) <> '' AND public.catalog_match_text(candidate.model) <> '' AND NOT candidate.model_match THEN
      conflicts_found := array_append(conflicts_found, 'Modelo diferente'); END IF;
    IF public.catalog_match_barcode(c.captured_upc) <> '' AND cardinality(candidate.upcs) > 0 AND NOT candidate.upc_match THEN
      conflicts_found := array_append(conflicts_found, 'UPC / EAN / GTIN diferente'); END IF;
    IF public.normalize_catalog_identifier(c.captured_asin) <> '' AND cardinality(candidate.asins) > 0 AND NOT candidate.asin_match THEN
      conflicts_found := array_append(conflicts_found, 'ASIN diferente'); END IF;
    score := CASE WHEN cardinality(conflicts_found) > 0 THEN 50 WHEN candidate.upc_match OR candidate.asin_match THEN 100 ELSE 80 END;
    INSERT INTO public.product_matches (id, capture_id, capture_title, capture_source_domain,
      capture_upc, capture_brand, capture_model, capture_image_url, candidate_product_id,
      candidate_title, candidate_brand, candidate_model, candidate_upc, candidate_image_url,
      total_score, confidence_percentage, identifier_score, brand_score, model_score,
      attribute_score, text_score, image_score, ai_score, match_reasons, positive_evidence,
      conflicts, decision, decision_source, recommendation, requires_human_review)
    VALUES ('match_' || md5(p_capture_id || ':' || candidate.id), p_capture_id, c.captured_title,
      c.source_domain, c.captured_upc, c.captured_brand, c.captured_model, c.captured_images[1],
      candidate.id, candidate.title_master, candidate.brand_name, candidate.model,
      candidate.first_upc, candidate.primary_image_url, score, score,
      CASE WHEN candidate.upc_match OR candidate.asin_match THEN 100 ELSE 0 END,
      CASE WHEN candidate.brand_match THEN 100 ELSE 0 END, CASE WHEN candidate.model_match THEN 100 ELSE 0 END,
      0, 0, 0, 0, reasons, reasons, conflicts_found, 'PENDING', 'SYSTEM',
      CASE WHEN cardinality(conflicts_found) > 0 THEN 'NEEDS_HUMAN_REVIEW' ELSE 'LINK_EXISTING_PRODUCT' END, true);
  END LOOP;
  SELECT count(*) INTO match_count FROM public.product_matches
    WHERE capture_id = p_capture_id AND decision NOT IN ('REJECTED', 'NOT_SAME_PRODUCT');
  SELECT * INTO best FROM public.product_matches
    WHERE capture_id = p_capture_id AND decision NOT IN ('REJECTED', 'NOT_SAME_PRODUCT')
    ORDER BY total_score DESC, candidate_product_id LIMIT 1;
  UPDATE public.captures SET
    status = CASE WHEN match_count = 0 THEN 'NEW_PRODUCT_CANDIDATE'
      WHEN match_count > 1 OR best.recommendation = 'NEEDS_HUMAN_REVIEW' THEN 'NEEDS_REVIEW' ELSE 'POSSIBLE_MATCH' END,
    best_match_product_id = best.candidate_product_id, best_match_confidence = best.confidence_percentage,
    best_match_recommendation = CASE WHEN match_count = 0 THEN 'CREATE_NEW_PRODUCT'
      WHEN match_count > 1 THEN 'NEEDS_HUMAN_REVIEW' ELSE best.recommendation END,
    processed_at = now() WHERE id = p_capture_id;
  RETURN match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_inserted_capture()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$ BEGIN PERFORM public.process_capture_matches(NEW.id); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS match_capture_after_insert ON public.captures;
CREATE TRIGGER match_capture_after_insert AFTER INSERT ON public.captures
  FOR EACH ROW EXECUTE FUNCTION public.match_inserted_capture();

REVOKE ALL ON FUNCTION public.process_capture_matches(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_capture_matches(text) TO anon, authenticated;
