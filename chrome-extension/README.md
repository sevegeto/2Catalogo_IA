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
2. Ingresa la URL de tu proyecto de Supabase (`https://<proyecto>.supabase.co`, solo HTTPS)
3. Ingresa la Anon Key de Supabase (Project Settings > API). Es la clave publica; **nunca** uses la `service_role`
4. Haz clic en "Guardar configuracion"
5. En **Cuenta**, inicia sesion con tu usuario de CatalogAI. Necesita rol `editor` o `admin`

La extension guarda solo los tokens de sesion en `chrome.storage.local` (nunca la contraseña) y los renueva
automaticamente. Si cambias la URL o la clave, la sesion se descarta. El autor de cada captura lo fija la base
de datos con tu usuario; no se puede indicar otro desde la extension.

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
3. El icono muestra ✓ si se envio o ! si fallo (pasa el cursor para ver el motivo, p. ej. sesion cerrada)

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
