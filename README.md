# CatalogAI

Sistema PIM (Product Information Management) para administracion centralizada de productos, variantes, identificadores, inventario, publicaciones por marketplace, coincidencias inteligentes y deteccion de duplicados.

## Estado actual: Fase 1

Esta fase incluye la estructura base del proyecto, layout administrativo, navegacion lateral, tema claro/oscuro, dashboard funcional, pantalla de productos, editor de producto con pestañas, pantalla de coincidencias con comparacion lado a lado, pantalla de publicaciones, pantalla de trabajos, tipos TypeScript, datos simulados centralizados, capa de servicios, schema de Prisma y documentacion.

**Todos los datos son simulados (DEMO).** Ninguna publicacion, inventario o integracion es real.

## Tecnologias

- **Frontend:** Next.js 13, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend:** Next.js API Routes (preparado para extraer a NestJS/Fastify)
- **Base de datos:** MySQL via Prisma ORM (preparado para PostgreSQL)
- **IA:** Ollama en servidor Fedora (worker local, no publico)

## Estructura del proyecto

```
catalog-ai/
  app/                    # Paginas y rutas (Next.js App Router)
    dashboard/            # Dashboard principal
    products/             # Lista de productos + editor por producto
    captures/             # Capturas de extension/importacion
    matches/              # Coincidencias + comparacion lado a lado
    duplicates/           # Duplicados detectados
    listings/             # Publicaciones por marketplace
    inventory/            # Inventario global
    warehouses/           # Almacenes
    suppliers/            # Proveedores
    images/               # Galeria de imagenes
    jobs/                 # Cola de trabajos
    integrations/         # Integraciones
    audit/                # Auditoria
    settings/             # Configuracion
  components/
    ui/                   # Componentes shadcn/ui
    layout/               # Layout: sidebar, topbar, theme, banners
    products/             # Componentes del editor de producto
  lib/
    mock/                 # Datos simulados centralizados
    services/             # Capa de servicios (mock ahora, API despues)
    utils.ts              # Utilidades
  prisma/
    schema.prisma         # Esquema de base de datos
  types/
    index.ts              # Tipos TypeScript del dominio
  .env.example            # Plantilla de variables de entorno
```

## Producto demo

El sistema incluye un producto de demostracion:

- **Producto:** Pechera Mariconera Concealed Carry Crossbody Bag for Men
- **UPC:** 626789614384
- **Numero interno:** SP3S16909
- **SKU interno:** 56/200
- **Publicaciones enlazadas:** MLM2273587807, MLM2285684119, MLMU3107328826
- **Tienda:** MITIENDOTA
- **Canal:** Mercado Libre

Este producto demuestra que tres publicaciones no equivalen a tres productos: todas estan enlazadas al mismo producto.

## Comandos

### Ejecutar en desarrollo

```bash
npm run dev
```

### Verificar TypeScript

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

### Build de produccion

```bash
npm run build
```

## Rutas disponibles

| Ruta | Descripcion |
|------|-------------|
| `/dashboard` | Dashboard con estadisticas y actividad reciente |
| `/captures` | Lista de capturas con estado y confianza |
| `/products` | Lista de productos con filtros |
| `/products/[id]` | Editor de producto con 10 pestañas |
| `/matches` | Lista de coincidencias |
| `/matches/[id]` | Comparacion lado a lado con evidencia y conflictos |
| `/duplicates` | Duplicados detectados (placeholder) |
| `/listings` | Publicaciones por marketplace |
| `/inventory` | Inventario global (placeholder) |
| `/warehouses` | Almacenes (placeholder) |
| `/suppliers` | Proveedores (placeholder) |
| `/images` | Galeria global (placeholder) |
| `/jobs` | Cola de trabajos con detalle expandible |
| `/integrations` | Estado de integraciones |
| `/audit` | Registro de auditoria |
| `/settings` | Configuracion del sistema |

## Modelo de datos

El esquema completo esta en `prisma/schema.prisma` e incluye:

- Users, Brands, Categories
- Products, ProductVariants, ProductIdentifiers, ProductAliases
- Captures, ProductMatches
- MarketplaceAccounts, MarketplaceListings, ListingVariantMappings
- Warehouses, WarehouseLocations, InventoryBalances, InventoryMovements
- Suppliers, ProductSuppliers
- ProductImages
- Jobs, AiReviews
- AuditLogs

## Arquitectura de servicios

La capa `lib/services/` abstrae el acceso a datos. En la fase 1 devuelve datos mock. En fases posteriores, estas funciones se reemplazaran por llamadas a la API real sin cambiar los componentes de la interfaz.

## Pendientes para la fase 2

1. **Autenticacion real:** Login con correo y contrasena, sesiones con cookies HTTP-only.
2. **Conexion a base de datos:** Configurar Prisma con MySQL en SiteGround.
3. **API REST/GraphQL:** Implementar endpoints para reemplazar mocks.
4. **Captura desde extension Chrome:** Endpoint para recibir capturas.
5. **Worker Fedora/Ollama:** Implementar worker local con cola de trabajos.
6. **Sincronizacion Google Sheets:** API de sincronizacion bidireccional.
7. **Almacenamiento Google Drive:** Implementar StorageProvider.
8. **Matching real:** Integrar embeddings y Ollama en el motor de coincidencias.
9. **Inventario global:** Vista consolidada de inventario con movimientos.
10. **Pantallas faltantes:** Duplicates, Inventory, Warehouses, Suppliers, Images con datos reales.

## Despliegue

1. Subir el repositorio a GitHub (rama `main` para produccion, `develop` para integracion).
2. Configurar variables de entorno en SiteGround.
3. SiteGround desplegara el proyecto Node.js desde GitHub.
4. Ejecutar migraciones de Prisma: `npx prisma migrate deploy`.
5. Ejecutar seed de demostracion: `npx prisma db seed`.

## Licencia

Propietario. Uso interno.
