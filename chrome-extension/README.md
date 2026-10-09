# CatalogAI Capture Extension

Extension de Chrome para capturar productos desde cualquier pagina web y enviarlos directamente a CatalogAI.

## Instalacion

1. Abre Chrome y navega a `chrome://extensions/`
2. Activa el "Modo desarrollador" (esquina superior derecha)
3. Haz clic en "Cargar descomprimida"
4. Selecciona la carpeta `chrome-extension/` de este proyecto
5. La extension aparecera en tu barra de herramientas

## Configuracion

1. Haz clic en el icono de CatalogAI en la barra de herramientas
2. Ingresa la URL de tu proyecto de Supabase (ej. `https://ddtdgakvjospwoopdjds.supabase.co`)
3. Ingresa la Anon Key de Supabase (la encuentras en Project Settings > API)
4. Haz clic en "Guardar configuracion"

## Uso

### Desde el popup
1. Navega a una pagina de producto (MercadoLibre, Amazon, etc.)
2. Haz clic en el icono de CatalogAI
3. Haz clic en "Capturar producto de esta pagina"
4. La extension extraera automaticamente: titulo, descripcion, marca, modelo, precio, imagenes y atributos
5. Revisa la vista previa y el producto se enviara a CatalogAI

### Desde el menu contextual
1. Haz clic derecho en cualquier pagina de producto
2. Selecciona "Capturar producto en CatalogAI"
3. El producto se enviara silenciosamente a CatalogAI

## Que se extrae

- **Titulo**: desde meta tags, h1 o elementos de producto
- **Descripcion**: desde meta tags o contenedores de descripcion
- **Marca**: desde microdata o elementos especificos
- **Modelo**: desde atributos de producto
- **Identificadores**: MPN, UPC/GTIN, ASIN (en Amazon)
- **Precio y moneda**: desde elementos de precio
- **Imagenes**: desde galerias de producto (maximo 10)
- **Atributos**: desde tablas de especificaciones
- **Referencia externa**: MLM-xxx en MercadoLibre, ASIN en Amazon

## Sitios compatibles

La extension funciona en cualquier sitio web. La extraccion es mas precisa en sitios con microdata (schema.org) o estructura de producto estandar:
- MercadoLibre / MercadoLivre
- Amazon
- Sitios con microdata de Product
- Tiendas online con marcado estandar
