import assert from 'node:assert/strict';
import { test } from 'node:test';
import { actAs, database, USERS } from './support/database';
import { captureAssets } from '../lib/captures/import';
import { findCaptureMatches } from '../lib/captures/matching';
import { mockCaptures, mockProducts, mockIdentifiers, mockImages, mockVariants } from '../lib/mock/data';
import { captureMutations } from '../lib/services';

test('SQL: promoción atómica, imágenes únicas, identificadores y variante; reintentos reutilizan producto', async () => {
  const db = await database();
  try {
    await actAs(db, 'editor');
    await db.exec("INSERT INTO captures(id,source_type,captured_title,captured_upc,captured_asin,captured_mpn,captured_price,captured_currency,captured_images) VALUES ('assets','MANUAL','Importado','1234-5678-9012',' b000000001 ',' X-123 ',0,'MXN',ARRAY['https://example.com/a.png','https://example.com/a.png','javascript:alert(1)','https://example.com/b.png']);");
    const first = (await db.query<{ id: string; default_variant_id: string; primary_image_url: string }>("SELECT * FROM promote_capture_to_product('assets')")).rows[0];
    const second = (await db.query<{ id: string }>("SELECT * FROM promote_capture_to_product('assets')")).rows[0];
    assert.equal(second.id, first.id);
    const identifiers = (await db.query<{ identifier_type: string; normalized_value: string; verified: boolean; is_primary: boolean }>('SELECT * FROM product_identifiers ORDER BY id')).rows;
    assert.deepEqual(identifiers.map(i => i.identifier_type), ['UPC_A', 'ASIN', 'MPN']);
    assert.deepEqual(identifiers.map(i => i.normalized_value), ['123456789012', 'B000000001', 'X123']);
    assert.equal(identifiers.filter(i => i.is_primary).length, 1);
    assert.ok(identifiers.every(i => !i.verified));
    const images = (await db.query<{ original_url: string; image_type: string; approved: boolean; display_order: number }>('SELECT * FROM product_images ORDER BY display_order')).rows;
    assert.deepEqual(images.map(i => i.original_url), ['https://example.com/a.png', 'https://example.com/b.png']);
    assert.deepEqual(images.map(i => i.image_type), ['MAIN', 'ALTERNATE']);
    assert.ok(images.every(i => !i.approved));
    assert.equal(first.primary_image_url, images[0].original_url);
    const variant = (await db.query<{ id: string; retail_price: string; internal_sku: string }>('SELECT * FROM product_variants')).rows[0];
    assert.equal(first.default_variant_id, variant.id);
    assert.equal(Number(variant.retail_price), 0);
    assert.ok(variant.internal_sku.endsWith('-01'));
    assert.deepEqual((await db.query('SELECT status,assigned_product_id,assigned_variant_id FROM captures')).rows[0], { status: 'COMPLETED', assigned_product_id: first.id, assigned_variant_id: variant.id });
    assert.equal((await db.query('SELECT id FROM products')).rows.length, 1);
    assert.equal((await db.query<{ created_by: string }>('SELECT created_by FROM products')).rows[0].created_by, USERS.editor);
  } finally { await db.close(); }
});

test('SQL: un fallo al importar imágenes revierte producto, variante, identificadores y asignación', async () => {
  const db = await database();
  try {
    await db.exec("INSERT INTO captures(id,source_type,captured_title,captured_upc,captured_images) VALUES ('rollback','MANUAL','Rollback','123456789012',ARRAY['https://example.com/a.png']); ALTER TABLE product_images ADD CONSTRAINT simulate_failure CHECK (false);");
    await assert.rejects(db.query("SELECT * FROM promote_capture_to_product('rollback')"), /simulate_failure/);
    for (const table of ['products','product_variants','product_identifiers','product_images']) assert.equal((await db.query(`SELECT id FROM ${table}`)).rows.length, 0);
    assert.equal((await db.query<{ assigned_product_id: string | null }>('SELECT assigned_product_id FROM captures')).rows[0].assigned_product_id, null);
    await assert.rejects(db.query("SELECT * FROM promote_capture_to_product('missing')"), /Captura no encontrada/);
  } finally { await db.close(); }
});

test('SQL: captura sin códigos ni imágenes conserva un borrador válido; una captura rechazada no se convierte', async () => {
  const db = await database();
  try {
    await db.exec("INSERT INTO captures(id,source_type,captured_title,captured_images) VALUES ('empty','MANUAL','Sin imágenes',NULL); INSERT INTO captures(id,source_type,captured_title,status) VALUES ('rejected','MANUAL','Rechazada','REJECTED');");
    const p = (await db.query<{ primary_image_url: string | null; variant_count: number }>('SELECT * FROM promote_capture_to_product(\'empty\')')).rows[0];
    assert.equal(p.primary_image_url, null);
    assert.equal(p.variant_count, 1);
    assert.equal((await db.query('SELECT id FROM product_identifiers')).rows.length, 0);
    await assert.rejects(db.query("SELECT * FROM promote_capture_to_product('rejected')"), /estado actual/);
  } finally { await db.close(); }
});

test('SQL: la función de promoción respeta RLS del usuario', async () => {
  const db = await database();
  try {
    await db.exec("INSERT INTO captures(id,source_type,captured_title) VALUES ('private','MANUAL','Privada'); DROP POLICY catalog_insert ON products;");
    await actAs(db, 'editor');
    await assert.rejects(db.query("SELECT * FROM promote_capture_to_product('private')"), /row-level security/);
    await actAs(db, 'superuser');
    assert.equal((await db.query('SELECT id FROM products')).rows.length, 0);
  } finally { await db.close(); }
});

test('SQL: trigger automático por UPC/ASIN/marca+modelo, conflictos, múltiples candidatos y decisiones humanas', async () => {
  const db = await database();
  try {
    await db.exec(`
      INSERT INTO products(id,internal_product_number,title_master,normalized_title,brand_name,model,status) VALUES
      ('p1','P1','Producto 1','producto 1','Marca','M1','ACTIVE'), ('p2','P2','Producto 2','producto 2','Marca','M2','ACTIVE'),
      ('archived','P3','Archivado','archivado','Marca','M1','ARCHIVED');
      INSERT INTO product_identifiers(id,product_id,identifier_type,identifier_value) VALUES
      ('i1','p1','UPC_A','123456789012'), ('i2','p2','ASIN','B000000002');
    `);
    await actAs(db, 'editor');
    await db.exec(`
      INSERT INTO captures(id,source_type,captured_title,captured_upc) VALUES ('upc','MANUAL','UPC','0123456789012');
      INSERT INTO captures(id,source_type,captured_title,captured_asin) VALUES ('asin','MANUAL','ASIN','b000000002');
      INSERT INTO captures(id,source_type,captured_title,captured_brand,captured_model) VALUES ('brand','MANUAL','Marca',' marca ',' m1 ');
      INSERT INTO captures(id,source_type,captured_title,captured_brand,captured_model) VALUES ('brand_only','MANUAL','Solo marca','Marca','');
      INSERT INTO captures(id,source_type,captured_title,captured_upc,captured_brand) VALUES ('conflict','MANUAL','Conflicto','123456789012','Otra');
      INSERT INTO captures(id,source_type,captured_title,captured_upc,captured_asin) VALUES ('ambiguous','MANUAL','Ambigua','123456789012','B000000002');
    `);
    const statuses = (await db.query<{ id: string; status: string }>('SELECT id,status FROM captures')).rows;
    const status = (id: string) => statuses.find(c => c.id === id)?.status;
    for (const id of ['upc','asin','brand']) assert.equal(status(id), 'POSSIBLE_MATCH');
    assert.equal(status('brand_only'), 'NEW_PRODUCT_CANDIDATE');
    assert.equal(status('conflict'), 'NEEDS_REVIEW');
    assert.equal(status('ambiguous'), 'NEEDS_REVIEW');
    assert.equal((await db.query("SELECT * FROM product_matches WHERE candidate_product_id='archived'")).rows.length, 0);
    const match = (await db.query<{ confidence_percentage: string; requires_human_review: boolean; decision: string }>("SELECT * FROM product_matches WHERE capture_id='upc'")).rows[0];
    assert.equal(Number(match.confidence_percentage), 100);
    assert.equal(match.decision, 'PENDING');
    assert.equal(match.requires_human_review, true);
    await db.query("SELECT process_capture_matches('upc')");
    assert.equal((await db.query("SELECT id FROM product_matches WHERE capture_id='upc'")).rows.length, 1);
    await db.exec("UPDATE product_matches SET decision='NOT_SAME_PRODUCT',decision_source='HUMAN' WHERE capture_id='upc';");
    await db.query("SELECT process_capture_matches('upc')");
    assert.equal((await db.query<{ decision: string }>("SELECT decision FROM product_matches WHERE capture_id='upc'")).rows[0].decision, 'NOT_SAME_PRODUCT');
    assert.equal((await db.query<{ status: string }>("SELECT status FROM captures WHERE id='upc'")).rows[0].status, 'NEW_PRODUCT_CANDIDATE');
  } finally { await db.close(); }
});

test('Demo: importación normaliza códigos, filtra imágenes y promoción concurrente no duplica', async (t) => {
  // Force demo even if a developer has real Supabase variables configured.
  Object.defineProperty(globalThis, 'window', { value: { localStorage: { getItem: () => 'true' } }, configurable: true });
  t.after(() => { Reflect.deleteProperty(globalThis, 'window'); });
  const capture = { ...mockCaptures[2], id: 'test_demo', capturedUpc: '1234-5678-9012', capturedAsin: ' b000000001 ', capturedMpn: 'M-1', capturedImages: ['https://example.com/a.png','https://example.com/a.png','javascript:alert(1)'], capturedPrice: 0, status: 'RECEIVED' as const };
  const assets = captureAssets(capture, 'p', 'v', new Date().toISOString());
  assert.equal(assets.images.length, 1);
  assert.deepEqual(assets.identifiers.map(i => i.normalizedValue), ['123456789012','B000000001','M1']);
  mockCaptures.push(capture);
  const counts = [mockProducts.length,mockIdentifiers.length,mockImages.length,mockVariants.length];
  const [first,second] = await Promise.all([captureMutations.promoteToProduct(capture.id),captureMutations.promoteToProduct(capture.id)]);
  assert.equal(first?.id, second?.id);
  assert.deepEqual([mockProducts.length,mockIdentifiers.length,mockImages.length,mockVariants.length], [counts[0]+1,counts[1]+3,counts[2]+1,counts[3]+1]);
  assert.equal(capture.status, 'COMPLETED');
});

test('Demo: el matching exige evidencia no vacía, normaliza UPC/ASIN y señala conflictos', () => {
  const capture = { ...mockCaptures[0], capturedUpc: '0626789614384', capturedAsin: null };
  const matches = findCaptureMatches(capture, mockProducts, mockIdentifiers, new Date().toISOString());
  assert.equal(matches[0].candidateProductId, 'prd_001');
  assert.equal(matches[0].identifierScore, 100);
  assert.equal(matches[0].requiresHumanReview, true);
  const conflict = findCaptureMatches({ ...capture, capturedBrand: 'Otra' }, mockProducts, mockIdentifiers, new Date().toISOString());
  assert.equal(conflict[0].confidencePercentage, 50);
  assert.deepEqual(conflict[0].conflicts, ['Marca diferente']);
  assert.equal(findCaptureMatches({ ...capture, capturedUpc: null, capturedBrand: '', capturedModel: '' }, mockProducts, [], new Date().toISOString()).length, 0);
});
