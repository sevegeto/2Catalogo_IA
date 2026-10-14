# CatalogAI

Sistema PIM para centralizar productos, variantes, identificadores, capturas,
inventario y publicaciones por marketplace.

## Estado actual

El proyecto incluye una interfaz administrativa en Next.js 13.5.1, React 18,
TypeScript, Tailwind y shadcn/ui; una capa de servicios con datos demo y consultas
reales a Supabase; migraciones SQL de PostgreSQL; y una extensión Chrome Manifest V3.

**No está terminado para producción.** Hay pantallas funcionales y operaciones
reales de base de datos, pero faltan autenticación completa, permisos adecuados,
procesamiento de trabajos e integraciones operativas.

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

**Antes de conectar datos sensibles**, corrige las políticas de acceso descritas
abajo. Las migraciones actuales permiten acceso anónimo amplio.

## Validación

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

El build incluye revisión de tipos y lint. Las funciones de Supabase usan Deno y
quedan excluidas del chequeo TypeScript de Next.js; necesitan validación propia.

## Estructura

- `app/`: dashboard, capturas, productos, coincidencias, duplicados, publicaciones,
  inventario, almacenes, proveedores, imágenes, trabajos, integraciones, auditoría,
  configuración y recuperación de contraseñas.
- `components/products/tabs/`: editor de producto y sus diez pestañas.
- `lib/services/index.ts`: consultas, mapeo SQL → dominio y mutaciones.
- `lib/mock/data.ts`: datos de demostración.
- `lib/runtime-config.ts` y `lib/demo-mode.tsx`: selección de fuente de datos.
- `lib/supabase/client.ts`: cliente inicializado al solicitar una operación real.
- `supabase/migrations/`: esquema PostgreSQL, configuración y políticas RLS.
- `supabase/functions/test-ollama/`: prueba de conectividad desde Supabase.
- `chrome-extension/`: lector de productos y envío directo a la tabla `captures`.
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

1. **Autenticación y permisos.** Existen recuperación y cambio de contraseña, pero
   no login completo ni protección de las rutas del catálogo. Las migraciones
   conceden SELECT/INSERT/UPDATE/DELETE a `anon` y `authenticated` con condiciones
   abiertas. Definir usuarios autorizados y roles antes de cerrar las políticas.
2. **Secretos de integraciones.** `integration_configs.credentials` guarda claves
   y tokens en JSON y puede leerse desde el cliente con las políticas actuales.
   Mover secretos al servidor o un almacén privado y exponer solo configuración
   no sensible. El cifrado del disco no restringe el acceso por la API.
3. **Edición de captura.** La vista individual permite revisar datos y crear un
   borrador con imágenes, identificadores y SKU. Queda por implementar la corrección
   de campos antes de la conversión.
4. **Matching avanzado y decisiones.** Existe matching básico por códigos y
   marca/modelo. Faltan embeddings/IA y una operación transaccional para
   aprobar/enlazar una coincidencia junto con sus estados relacionados.
5. **Worker Fedora/Ollama.** Hay una prueba HTTP de `/api/tags`, pero no un worker
   que consuma trabajos. `localhost` desde Supabase apunta al servidor de Supabase,
   no al equipo Fedora. Preferir un worker local que consulte la cola con permisos
   limitados. La función actual también necesita limitar destinos y validar
   solicitudes antes de desplegarla.
6. **Inventario y variantes.** Completar altas/edición y movimientos con balances
   consistentes, validación y auditoría. Hay varias acciones demo que solo esperan
   y regresan sin modificar datos.
7. **Integraciones.** Mercado Libre, Sheets y Drive tienen formularios de
   configuración, pero no sincronización implementada. Activar una configuración
   no demuestra conectividad real.
8. **Calidad y mantenimiento.** Incorporar pruebas de los flujos críticos, manejo
   visible de errores de guardado y actualización planificada de dependencias.
   Quedan avisos de lint sobre imágenes y una dependencia de un efecto de React.

La conexión a una instancia real, las migraciones remotas, la extracción en Chrome,
las integraciones y los jobs necesitan verificarse con sus entornos respectivos.

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
