# CatalogAI

Sistema PIM para centralizar productos, variantes, identificadores, capturas,
inventario y publicaciones por marketplace.

## Estado actual

El proyecto incluye una interfaz administrativa en Next.js 13.5.1, React 18,
TypeScript, Tailwind y shadcn/ui; una capa de servicios con datos demo y consultas
reales a Supabase; migraciones SQL de PostgreSQL; y una extensión Chrome Manifest V3.

**No está terminado para producción.** Hay pantallas funcionales, operaciones
reales de base de datos, inicio de sesión, roles y políticas RLS cerradas (ver
[Seguridad y acceso](#seguridad-y-acceso)). Faltan procesamiento de trabajos e
integraciones operativas.

`prisma/schema.prisma` conserva una propuesta anterior para MySQL. La aplicación
actual no utiliza Prisma ni tiene API Routes implementadas. El despliegue existente
está configurado para Netlify en `netlify.toml`.

## Arranque local

Requiere Node.js 22 y npm. Desde la carpeta del proyecto:

```bash
npm ci
npm run dev
```

Abre http://localhost:3000. Sin variables de Supabase, el catálogo arranca en DEMO
con datos simulados, sin conectarse a una base de datos. Los cambios demo viven en
memoria y se pierden al recargar; algunas operaciones todavía son simulaciones.

Para habilitar el acceso a Supabase:

1. Copia `.env.example` a `.env.local`.
2. Completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Reinicia el servidor; en builds de producción, vuelve a compilar.
4. Cambia a Live desde la barra superior si habías seleccionado Demo.

Usa exclusivamente la clave pública anon en el navegador y en la extensión.
Nunca coloques una clave `service_role` en variables `NEXT_PUBLIC_*`.
El indicador Live describe el modo de consulta; no certifica que la conexión haya
sido probada. Cambiar de modo recarga la página para renovar las consultas.

Con Supabase configurado, la aplicación exige iniciar sesión (salvo en modo demo).
Antes de usar datos reales aplica las migraciones de seguridad y crea el primer
administrador como se explica en [Seguridad y acceso](#seguridad-y-acceso).

## Validación

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

El build incluye revisión de tipos y lint. Las funciones de Supabase usan Deno y
quedan excluidas del chequeo TypeScript de Next.js; necesitan validación propia.

`npm test` ejecuta las pruebas de base de datos (PGlite con todas las migraciones),
de permisos por rol y del modo demo.

## Estructura

- `app/`: dashboard, capturas, productos, coincidencias, duplicados, publicaciones,
  inventario, almacenes, proveedores, imágenes, trabajos, integraciones, auditoría,
  configuración, inicio de sesión y recuperación de contraseñas.
- `middleware.ts`: exige sesión en las rutas del catálogo cuando Supabase está configurado.
- `lib/auth.tsx` y `components/layout/auth-gate.tsx`: sesión, rol y bloqueo de la interfaz.
- `components/products/tabs/`: editor de producto y sus diez pestañas.
- `lib/services/index.ts`: consultas, mapeo SQL → dominio y mutaciones.
- `lib/mock/data.ts`: datos de demostración.
- `lib/runtime-config.ts` y `lib/demo-mode.tsx`: selección de fuente de datos.
- `lib/supabase/client.ts`: cliente (sesión en cookies) inicializado al solicitar una operación real.
- `supabase/migrations/`: esquema PostgreSQL, configuración y políticas RLS.
- `supabase/functions/test-ollama/`: prueba de conectividad (solo admin, destinos validados).
- `chrome-extension/`: lector de productos; inicia sesión y envía a `captures` con el usuario.
- `tests/`: pruebas de capturas, matching y permisos (`tests/support/database.ts` simula Supabase).
- `types/index.ts`: tipos del dominio.
- `prisma/schema.prisma`: propuesta histórica, sin uso en ejecución.

## Revisión inicial del código — 14 de octubre de 2026

Copia obtenida de `sevegeto/2Catalogo_IA`, rama `main`, commit inicial `e726e2e`.

### Problemas corregidos en la copia local

- El cliente Supabase lanzaba un error al importar cualquier pantalla sin variables
  de entorno: impedía compilar y explorar el proyecto. Ahora se inicializa al usar
  datos reales y el modo demo funciona sin credenciales.
- Contexto y servicios consultan la misma regla de modo demo. Sin configuración,
  no se puede activar Live; cambiar de modo recarga los datos.
- La plantilla de variables ahora incluye la configuración real de Supabase.
- Se corrigieron errores de lint en Configuración y se eliminó la opción que
  ignoraba lint durante el build.
- Las pantallas de recuperación manejan la ausencia de configuración de Supabase.

### Verificación de esta revisión

- `npm run typecheck`: correcto.
- `npm run build`: correcto, incluye lint y tipos; genera las 20 páginas estáticas.
- Prueba de selección de modo: sin configuración, Live configurado, Demo elegido,
  configuración parcial y almacenamiento bloqueado; cinco casos correctos.
- Servidor de producción local y navegador: lista demo con tres productos y
  editor del producto `prd_001` cargan sin errores de consola observados.
- Quedan avisos existentes de lint (imágenes y efecto), Browserslist y empaquetado
  de Supabase Realtime. No se verificaron servicios externos ni base de datos real.

### Pendientes para terminar el proyecto

1. ~~**Autenticación y permisos.**~~ Resuelto el 17 de octubre de 2026: login,
   middleware, roles `admin`/`editor`/`viewer` y RLS cerrada. Ver
   [Seguridad y acceso](#seguridad-y-acceso).
2. ~~**Secretos de integraciones.**~~ Resuelto el 17 de octubre de 2026: los secretos
   viven en `integration_secrets`, sin acceso desde el navegador.
3. **Edición de captura.** La vista individual permite revisar datos y crear un
   borrador con imágenes, identificadores y SKU. Queda por implementar la corrección
   de campos antes de la conversión.
4. **Matching avanzado y decisiones.** Existe matching básico por códigos y
   marca/modelo. Faltan embeddings/IA y una operación transaccional para
   aprobar/enlazar una coincidencia junto con sus estados relacionados.
5. **Worker Fedora/Ollama.** Hay una prueba HTTP de `/api/tags`, pero no un worker
   que consuma trabajos. `localhost` desde Supabase apunta al servidor de Supabase,
   no al equipo Fedora. Preferir un worker local que consulte la cola con permisos
   limitados. La función `test-ollama` ya exige admin y valida destinos.
6. **Inventario y variantes.** Completar altas/edición y movimientos con balances
   consistentes, validación y auditoría. Hay varias acciones demo que solo esperan
   y regresan sin modificar datos.
7. **Integraciones.** Mercado Libre, Sheets y Drive tienen formularios de
   configuración, pero no sincronización implementada. Activar una configuración
   no demuestra conectividad real.
8. **Calidad y mantenimiento.** Ampliar pruebas de flujos críticos, manejo visible
   de errores de guardado en el resto de pantallas, ocultar acciones de edición a
   `viewer` y actualización planificada de dependencias.
   Quedan avisos de lint sobre imágenes y una dependencia de un efecto de React.

La conexión a una instancia real, las migraciones remotas, la extracción en Chrome,
las integraciones y los jobs necesitan verificarse con sus entornos respectivos.

## Seguridad y acceso

Implementado el 17 de octubre de 2026 (rama `feature/seguridad-auth-rls`).

### Roles

| Rol | Puede |
| --- | --- |
| `viewer` | Leer catálogo, capturas, inventario, publicaciones e integraciones (sin secretos). |
| `editor` | Lo anterior, más altas, ediciones y bajas del catálogo, capturas, coincidencias, inventario y trabajos. |
| `admin` | Todo lo anterior, más configuración, integraciones, credenciales, cuentas de marketplace, usuarios y auditoría. |

- `anon` (sin sesión) no tiene acceso a ninguna tabla ni función.
- Un usuario autenticado sin fila en `user_roles` no ve nada y la app le muestra un aviso.
- `audit_logs` solo admite inserciones (con el propio `user_id`); nadie la edita ni la borra por la API.
- `captures.captured_by` lo fija la base con `auth.uid()`.
- Siempre debe quedar al menos un `admin`.

### Credenciales de integraciones

- Se guardan en `integration_secrets`, con RLS y sin permisos para `anon` ni
  `authenticated`: solo `service_role` (Edge Functions o un worker) puede leerlas.
- La pantalla Configuración solo envía valores nuevos mediante
  `set_integration_secrets` (admin). Muestra qué campos están guardados, nunca su valor.
- Cada cambio queda en auditoría con los nombres de los campos, sin valores.
- `clientId`, `sellerId` y `serviceAccountEmail` no son secretos y viven en `settings`.

### Activar en Supabase (en este orden)

1. Si aún no lo hiciste, aplica `20261014140000_promote_capture.sql` y
   `20261014141000_capture_matching.sql`.
2. Aplica `supabase/migrations/20261017210000_auth_roles_rls.sql`.
3. Aplica `supabase/migrations/20261017211000_integration_secrets.sql`. Migra las
   credenciales existentes y elimina la columna `credentials`.
4. En **Authentication → Providers → Email**, desactiva *Allow new users to sign up*.
5. Crea tu usuario en **Authentication → Users → Add user** (marca *Auto Confirm User*).
6. Asígnate el rol en el **SQL Editor**:

   ```sql
   INSERT INTO public.user_roles (user_id, role, display_name)
   SELECT id, 'admin', 'Sergio' FROM auth.users WHERE email = 'tu-correo@dominio.com';
   ```

   Para otros usuarios usa `'editor'` o `'viewer'`.
7. En **Authentication → URL Configuration**, agrega la URL del sitio y
   `https://TU-SITIO/auth/reset-password` en *Redirect URLs*.
8. Si usas la prueba del worker, vuelve a desplegar la función:
   `supabase functions deploy test-ollama`.
9. Vuelve a compilar y desplegar la app. Recarga la extensión Chrome (versión 1.1.0)
   e inicia sesión en ella.

Hasta aplicar los pasos 2 y 3, la base sigue con las políticas abiertas anteriores.
Después de aplicarlos, cualquier versión anterior de la app o de la extensión que use
solo la clave anon dejará de poder leer o escribir.

### Verificación

- `npm test`: 15 pruebas correctas (7 de capturas/matching/demo y 8 de permisos:
  anon, sin rol, viewer, editor, auditoría, secretos, migración de credenciales y roles).
- `npm run typecheck` y `npm run lint`: correctos (quedan los avisos previos de `<img>`
  y de un efecto en `matches/[id]`).
- `npm run build`: correcto, 21 páginas y middleware.
- Servidor de producción configurado como Live: `/dashboard` y `/products?q=x` sin
  sesión redirigen a `/auth/login?next=…`; las páginas `/auth/*` responden 200; con la
  cookie de demo, `/dashboard` responde 200; una cookie de sesión falsa no da acceso.
- Lógica de sesión de la extensión probada con un simulador: rechaza URL no HTTPS,
  no guarda la contraseña, renueva el token al expirar o ante 401 y descarta la sesión
  al cambiar de proyecto.
- No se verificó contra una instancia real de Supabase ni en Chrome real.

## Flujo de capturas implementado

La conversión de captura ahora crea un borrador, una variante con SKU generado,
identificadores UPC/EAN/GTIN, ASIN y MPN y registros de imágenes en una sola
transacción. Las URLs repetidas se deduplican; solo se aceptan imágenes HTTP/HTTPS,
la primera es principal y todas quedan pendientes de aprobación. Los identificadores
conservan su valor de origen, incluyen una versión normalizada y quedan sin verificar.
No se descargan archivos ni se certifica validez GS1 de los códigos.

La captura queda `COMPLETED` con producto y variante asignados. Repetir la operación
reutiliza el producto existente. Las conversiones de capturas ya asignadas de la
versión anterior no se reconstruyen automáticamente.

La lista enlaza a `/captures/[id]`, que muestra descripción, atributos, datos de
origen, imágenes completas, payload original y coincidencias. Los errores de
conversión/descartado ahora se muestran y descartar utiliza el estado `REJECTED`.

### Activar las funciones en Supabase

La interfaz y las pruebas locales están listas. Para el modo Live, aplica estas
migraciones **en este orden**, mediante tu flujo de migraciones o el SQL Editor:

1. `supabase/migrations/20261014140000_promote_capture.sql`
2. `supabase/migrations/20261014141000_capture_matching.sql`

Requieren el esquema previo del proyecto. No se aplicaron a una instancia remota
durante esta revisión. Las funciones usan `SECURITY INVOKER`: respetan los permisos
y las políticas RLS del usuario; no requieren una clave de servicio en el cliente.
El procedimiento usa el patrón de [funciones de base de datos de Supabase](https://supabase.com/docs/guides/database/functions).

El matching se ejecuta al insertar cualquier captura, incluida la extensión Chrome,
mediante un trigger. También puede repetirse desde el detalle con **Buscar
coincidencias**, para capturas anteriores o después de ampliar el catálogo.

- Compara UPC/EAN/GTIN normalizados (incluyendo ceros de relleno), ASIN y marca+modelo.
- UPC-E no se expande ni se compara con UPC-A.
- No compara códigos rechazados ni productos archivados/rechazados.
- Código exacto: 100; marca+modelo: 80; evidencia con conflicto: 50.
- Los puntajes son reglas de evidencia, no probabilidades calibradas ni resultados IA.
- Sin candidatos: `NEW_PRODUCT_CANDIDATE`; un candidato: `POSSIBLE_MATCH`;
  múltiples candidatos o conflictos: `NEEDS_REVIEW`.
- Genera decisiones pendientes para revisión humana; nunca enlaza automáticamente.
- Al repetirlo reemplaza únicamente propuestas pendientes y preserva decisiones revisadas.

### Prueba con la base de datos real

Configura en `.env.local` (archivo excluido de Git):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
```

Para preparar una verificación Live se necesita:

- URL del proyecto y clave pública anon. No hace falta una clave `service_role`
  para las operaciones de la interfaz actual.
- Confirmar si la instancia contiene datos de producción o es un entorno de prueba.
- Las dos migraciones anteriores aplicadas y el esquema previo existente.
- Una captura de prueba sin producto asignado, con códigos e imágenes conocidos.

Reinicia el servidor de desarrollo o recompila y reinicia el servidor de producción
tras modificar las variables. Selecciona Live desde la barra superior.

El recorrido de verificación es: insertar una captura de prueba; comprobar el
estado y las coincidencias generadas; abrir su detalle; crear el borrador; revisar
imágenes, identificadores, variante y SKU; repetir la conversión y confirmar que
se recupera el mismo producto. Esta prueba crea registros en la instancia elegida.

La aplicación no ejecuta migraciones desde el navegador. Puedes aplicarlas desde
SQL Editor; para aplicarlas mediante CLI se necesita acceso administrativo al
proyecto o una conexión PostgreSQL configurada localmente. No guardes contraseñas,
tokens administrativos ni claves de servicio en el repositorio.

### Pruebas del flujo

```bash
npm test
```

Las pruebas usan PGlite (PostgreSQL embebido) con las migraciones reales. Cubren
importación de imágenes/códigos, generación de SKU, idempotencia, rollback ante
fallos, respeto de RLS, trigger de matching, conflictos, candidatos múltiples y
preservación de decisiones humanas; además del modo demo. Las siete pruebas pasan.
No usan datos remotos.

La prueba en navegador verificó detalle de captura, recálculo de coincidencias,
conversión a borrador, SKU y códigos importados en Variantes e identificadores,
e imagen principal pendiente en Media. La compilación con lint y tipos pasa.

## Extensión Chrome

Consulta `chrome-extension/README.md` para instalarla como extensión descomprimida.
Su configuración actual usa URL y clave anon de Supabase. El flujo de autenticación
de la extensión deberá adaptarse junto con las políticas del catálogo.

## Licencia

Propietario. Uso interno.
