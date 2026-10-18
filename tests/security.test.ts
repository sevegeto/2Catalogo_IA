import assert from 'node:assert/strict';
import { test } from 'node:test';
import { actAs, database, USERS } from './support/database';

const PRODUCT = "INSERT INTO products(id,internal_product_number,title_master,normalized_title) VALUES ('p_sec','P-SEC','Seguro','seguro')";

test('RLS: anon no puede leer, escribir ni ejecutar funciones del catálogo', async () => {
  const db = await database();
  try {
    await db.exec(PRODUCT);
    await actAs(db, 'anon');
    for (const table of ['products', 'captures', 'integration_configs', 'app_settings', 'audit_logs', 'user_roles']) {
      await assert.rejects(db.query(`SELECT * FROM ${table}`), /permission denied/, table);
    }
    await assert.rejects(db.exec("INSERT INTO captures(id,source_type,captured_title) VALUES ('x','MANUAL','x')"), /permission denied/);
    await assert.rejects(db.query("SELECT * FROM promote_capture_to_product('x')"), /permission denied/);
    await assert.rejects(db.query("SELECT set_integration_secrets('mercadolibre', '{}'::jsonb)"), /permission denied/);
  } finally { await db.close(); }
});

test('RLS: un usuario autenticado sin rol no ve ni modifica nada', async () => {
  const db = await database();
  try {
    await db.exec(PRODUCT);
    await actAs(db, 'norole');
    assert.equal((await db.query('SELECT id FROM products')).rows.length, 0);
    assert.equal((await db.query('SELECT id FROM integration_configs')).rows.length, 0);
    assert.equal((await db.query<{ r: string | null }>('SELECT current_app_role() AS r')).rows[0].r, null);
    await assert.rejects(db.exec("INSERT INTO captures(id,source_type,captured_title) VALUES ('x','MANUAL','x')"), /row-level security/);
  } finally { await db.close(); }
});

test('RLS: viewer lee el catálogo pero no escribe, ni ve auditoría ni secretos', async () => {
  const db = await database();
  try {
    await db.exec(PRODUCT);
    await actAs(db, 'viewer');
    assert.equal((await db.query('SELECT id FROM products')).rows.length, 1);
    assert.equal((await db.query('SELECT id FROM integration_configs')).rows.length, 5);
    await assert.rejects(db.exec("INSERT INTO captures(id,source_type,captured_title) VALUES ('x','MANUAL','x')"), /row-level security/);
    await db.exec("UPDATE products SET title_master = 'hackeado' WHERE id = 'p_sec'");
    await db.exec("DELETE FROM products WHERE id = 'p_sec'");
    assert.equal((await db.query<{ title_master: string }>("SELECT title_master FROM products WHERE id='p_sec'")).rows[0].title_master, 'Seguro');
    assert.equal((await db.query('SELECT id FROM audit_logs')).rows.length, 0);
    await assert.rejects(db.query('SELECT * FROM integration_secrets'), /permission denied/);
    await assert.rejects(db.query("SELECT set_integration_secrets('mercadolibre', '{\"clientSecret\":\"x\"}'::jsonb)"), /administrador/);
    assert.equal((await db.query("SELECT user_id FROM user_roles")).rows.length, 1, 'solo su propio rol');
  } finally { await db.close(); }
});

test('RLS: editor captura con autoría forzada y no toca configuración ni roles', async () => {
  const db = await database();
  try {
    await actAs(db, 'editor');
    await db.exec(`INSERT INTO captures(id,source_type,captured_title,captured_by) VALUES ('c1','EXTENSION','Captura','${USERS.admin}')`);
    assert.equal((await db.query<{ captured_by: string }>("SELECT captured_by FROM captures WHERE id='c1'")).rows[0].captured_by, USERS.editor);
    await db.exec('UPDATE app_settings SET audit_logging = false');
    await db.exec("UPDATE integration_configs SET enabled = false WHERE id = 'mercadolibre'");
    // Con RLS, un UPDATE sin filas permitidas no falla: se verifica abajo que nada cambió.
    await db.exec(`UPDATE user_roles SET role = 'admin' WHERE user_id = '${USERS.editor}'`);
    await assert.rejects(db.exec(`INSERT INTO user_roles(user_id,role) VALUES ('${USERS.norole}','admin')`), /row-level security/);
    await actAs(db, 'superuser');
    assert.equal((await db.query<{ audit_logging: boolean }>('SELECT audit_logging FROM app_settings')).rows[0].audit_logging, true);
    assert.equal((await db.query<{ enabled: boolean }>("SELECT enabled FROM integration_configs WHERE id='mercadolibre'")).rows[0].enabled, true);
    assert.equal((await db.query<{ role: string }>(`SELECT role FROM user_roles WHERE user_id='${USERS.editor}'`)).rows[0].role, 'editor');
  } finally { await db.close(); }
});

test('Auditoría: solo inserción con el propio usuario; nunca actualización ni borrado', async () => {
  const db = await database();
  try {
    await actAs(db, 'editor');
    await db.exec(`INSERT INTO audit_logs(id,user_id,action,entity_type) VALUES ('a1','${USERS.editor}','TEST','x')`);
    await assert.rejects(db.exec(`INSERT INTO audit_logs(id,user_id,action,entity_type) VALUES ('a2','${USERS.admin}','FALSO','x')`), /row-level security/);
    await actAs(db, 'admin');
    assert.equal((await db.query('SELECT id FROM audit_logs')).rows.length, 1);
    await assert.rejects(db.exec("UPDATE audit_logs SET action = 'BORRADO'"), /permission denied/);
    await assert.rejects(db.exec('DELETE FROM audit_logs'), /permission denied/);
  } finally { await db.close(); }
});

test('Secretos: admin escribe sin poder leerlos; mezcla, borra, valida campos y audita sin valores', async () => {
  const db = await database();
  try {
    await actAs(db, 'admin');
    const fields = async (json: string) =>
      (await db.query<{ f: string[] }>('SELECT set_integration_secrets($1, $2::jsonb) AS f', ['mercadolibre', json])).rows[0].f;
    assert.deepEqual(await fields('{"clientSecret":"s3cr3t","refreshToken":"TG-1"}'), ['clientSecret', 'refreshToken']);
    assert.deepEqual(await fields('{"clientSecret":"","refreshToken":"TG-2"}'), ['clientSecret', 'refreshToken']);
    assert.deepEqual(await fields('{"refreshToken":null}'), ['clientSecret']);
    await assert.rejects(fields('{"password":"x"}'), /no permitido/);
    await assert.rejects(fields('{"clientSecret":123}'), /debe ser texto/);
    await assert.rejects(db.query('SELECT * FROM integration_secrets'), /permission denied/);
    await assert.rejects(db.exec("UPDATE integration_configs SET secret_fields = '{}' WHERE id='mercadolibre'"), /permission denied/);
    const config = (await db.query<Record<string, unknown>>("SELECT * FROM integration_configs WHERE id='mercadolibre'")).rows[0];
    assert.equal('credentials' in config, false);
    assert.deepEqual(config.secret_fields, ['clientSecret']);
    const audit = (await db.query<{ after: { fields: string[] }; user_id: string }>("SELECT after,user_id FROM audit_logs WHERE action='INTEGRATION_SECRETS_UPDATED' ORDER BY created_at")).rows;
    assert.equal(audit.length, 3);
    assert.equal(audit[0].user_id, USERS.admin);
    assert.ok(!JSON.stringify(audit).includes('s3cr3t') && !JSON.stringify(audit).includes('TG-'));
    await actAs(db, 'superuser');
    assert.deepEqual((await db.query<{ secrets: Record<string, string> }>('SELECT secrets FROM integration_secrets')).rows[0].secrets, { clientSecret: 's3cr3t' });
  } finally { await db.close(); }
});

test('Migración: credenciales previas pasan a secretos y la configuración pública conserva lo no sensible', async () => {
  const db = await database({
    beforeMigration: async (file, d) => {
      if (file !== '20261017211000_integration_secrets.sql') return;
      await d.exec(`UPDATE integration_configs SET credentials = '{"clientId":"123","clientSecret":"abc","refreshToken":"TG-x","sellerId":"999","privateKey":""}'::jsonb WHERE id='mercadolibre';`);
    },
  });
  try {
    const config = (await db.query<{ settings: Record<string, string>; secret_fields: string[] }>("SELECT settings,secret_fields FROM integration_configs WHERE id='mercadolibre'")).rows[0];
    assert.equal(config.settings.clientId, '123');
    assert.equal(config.settings.sellerId, '999');
    assert.equal(config.settings.site, 'MLM');
    assert.deepEqual(config.secret_fields, ['clientSecret', 'refreshToken']);
    assert.deepEqual((await db.query<{ secrets: Record<string, string> }>("SELECT secrets FROM integration_secrets WHERE integration_id='mercadolibre'")).rows[0].secrets, { clientSecret: 'abc', refreshToken: 'TG-x' });
  } finally { await db.close(); }
});

test('Roles: solo admin los administra y siempre queda al menos un admin', async () => {
  const db = await database();
  try {
    await actAs(db, 'admin');
    assert.equal((await db.query('SELECT user_id FROM user_roles')).rows.length, 3);
    await db.exec(`UPDATE user_roles SET role='editor' WHERE user_id='${USERS.viewer}'`);
    await db.exec(`INSERT INTO user_roles(user_id,role) VALUES ('${USERS.norole}','viewer')`);
    await assert.rejects(db.exec(`UPDATE user_roles SET role='editor' WHERE user_id='${USERS.admin}'`), /al menos un administrador/);
    await assert.rejects(db.exec(`DELETE FROM user_roles WHERE user_id='${USERS.admin}'`), /al menos un administrador/);
    await actAs(db, 'editor');
    await db.exec(`DELETE FROM user_roles WHERE user_id='${USERS.norole}'`);
    await actAs(db, 'superuser');
    assert.equal((await db.query('SELECT user_id FROM user_roles')).rows.length, 4);
  } finally { await db.close(); }
});
