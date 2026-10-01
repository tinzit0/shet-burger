# Shet Burger — actualización editorial

La segunda iteración de animaciones y fotografías está documentada en [PHOTO-MOTION.md](PHOTO-MOTION.md), incluyendo archivos finales, procedencia de los retoques con IA y prompts utilizados.

## Qué se conserva

React + Vite, logo, colores rosa/negro/crema, tipografías, hero y su video `mirada.mp4` (sin modificar `Hero.jsx` ni sus estilos), catálogo completo de `src/data.js`, variantes, precios, carrito, stock, apertura de tienda, pedidos, comprobantes, seguimiento, Google y administración. La cuenta social sigue siendo https://www.instagram.com/shetburger/.

## Archivos

- `src/App.jsx`, `src/main.jsx`: integración de secciones y estilos.
- `src/components/EditorialIntro.jsx`, `BrandManifesto.jsx`: intro y manifiesto; reutilizan copy y fotografía existente.
- `src/components/MenuSection.jsx`: filas editoriales, fotografía permanente en móvil, hover/foco en desktop; conserva categorías y compra.
- `src/components/Header.jsx`: enlaces de sección, menú móvil, Escape, foco y navegación por teclado.
- `src/components/LocationSection.jsx`, `src/config.js`: ubicación pendiente o vista previa OpenStreetMap con logo y enlace a Google Maps.
- `src/components/ReviewsSection.jsx`, `src/lib/reviews.js`, `src/lib/reviewValidation.js`: formulario, estados vacíos, errores, moderación, paginación y promedio real.
- `src/components/SocialScroll.jsx`, `FooterCTA.jsx`: galería con imágenes del catálogo y CTA al carrito existente.
- `src/components/ScrollReveals.jsx`, `src/editorial.css`: animación con IntersectionObserver, marquee y responsive. Respeta movimiento reducido.
- `src/lib/supabase.js`: acepta el alias de clave anónima; mantiene conexión existente.
- `supabase/reviews.sql`, `test/reviewValidation.test.js`: esquema y validaciones.
- `public/assets/intro-burger.webp`: versión optimizada de `hero-burger-premium.png` existente (252 KB en lugar de 2,2 MB), sin cambiar la imagen original.
- `scripts/verify-editorial.mjs`: pruebas de navegador con API simulada; capturas locales en `artifacts/editorial/` (ignoradas por Git).
- `.env.example`, `wrangler.jsonc`, `README.md`, este documento: configuración y despliegue.

Los antiguos `BurgerStory`, `Campaign` e `Ingredients` permanecen disponibles en el proyecto, pero ya no se montan en la portada. No se agregaron dependencias de producción. La galería ya no descarga los videos sociales.

## Variables

Vite expone al cliente únicamente variables con prefijo `VITE_`:

```dotenv
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_O_PUBLICABLE
VITE_REVIEWS_ENABLED=false
VITE_LOCATION_LAT=
VITE_LOCATION_LNG=
```

`SUPABASE_URL` y `SUPABASE_ANON_KEY` se corresponden aquí con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Se conserva también `VITE_SUPABASE_PUBLISHABLE_KEY`; si ambas claves están presentes, ANON tiene prioridad. Nunca usar `service_role`. La integración previa tiene una conexión pública de respaldo a su proyecto existente; no se cambiaron esas credenciales. Para otro entorno, configurar URL y clave juntas.

Mantener las variables comerciales existentes descritas en README. `.env.local` tiene precedencia sobre `.env`; revisarlo si los cambios no aparecen. Reiniciar Vite/recompilar después de cambiar variables.

## Supabase, paso a paso

1. Usar el proyecto Supabase existente o uno propio. Obtener Project URL y clave pública en su Dashboard y completar las variables anteriores.
2. Ejecutar **completo** `supabase/reviews.sql` en SQL Editor. Es una migración adicional que no modifica pedidos ni sus políticas.
3. Comprobar en Table Editor que existe `reviews`: `id`, `name`, `rating`, `comment`, `created_at`, `approved`.
4. Establecer `VITE_REVIEWS_ENABLED=true` y reiniciar/recompilar.
5. Enviar una opinión de prueba. Debe guardarse con `approved=false` y mostrar confirmación de revisión. No debe aparecer públicamente ni sumar al promedio.
6. En Dashboard → Table Editor → `reviews`, revisar el texto y establecer `approved=true`. Recargar la web: debe aparecer y actualizar promedio/cantidad. Para retirar una opinión, volver a false o eliminarla desde Dashboard.
7. Comprobar con la clave pública que un INSERT/UPDATE/DELETE directo está denegado y que un SELECT no devuelve pendientes. Probar ratings 0/6, textos vacíos y longitudes excesivas contra la función: deben fallar.

El frontend consulta páginas de seis opiniones; `review_summary()` calcula sobre **todas** las aprobadas. No se muestran números ni testimonios de ejemplo. Cuando está desactivado, el formulario es visible pero deshabilitado y explica el estado; un error de conexión no se presenta como cero opiniones.

Si una instalación anterior tiene `reviews` sin `approved`, la migración actual agrega esa columna antes de crear el índice. Los registros existentes quedan pendientes (`false`) y se conservan. `CREATE TABLE IF NOT EXISTS` por sí solo no agrega columnas a tablas existentes. Una política restrictiva adicional impide que antiguas políticas de lectura expongan reseñas pendientes. Si faltan otras columnas o hay tipos/restricciones diferentes, inspeccionar la estructura existente antes de modificarla; no eliminar la tabla para resolverlo.

### Moderación y antispam

La tabla usa RLS y solo concede lectura pública de aprobadas. Los envíos pasan por `submit_review`, una función con permisos limitados que valida nombre 1–80 caracteres, comentario 1–1000 y rating entero 1–5, y fuerza `approved=false`. Los visitantes no pueden aprobar ni editar reseñas. Moderar desde Dashboard; no desde el acceso demo del admin de pedidos.

Incluye honeypot, tiempo mínimo del formulario, bloqueo de doble envío y cooldown **en servidor** de cinco minutos por identificador de navegador, con bloqueo transaccional contra carreras. Es protección básica: borrar almacenamiento/rotar tokens puede eludir ese cooldown. Para tráfico abusivo, agregar una Edge Function con Turnstile verificado en servidor y rate limiting por IP antes de abrir el endpoint; no confundir controles del cliente con protección fuerte. La migración incluye una consulta opcional de limpieza de tokens antiguos.

No se ejecutó la migración en una base remota ni se escribieron opiniones reales durante el desarrollo. Las pruebas de interfaz usan respuestas simuladas.

## Ubicación pendiente

**TODO: insertar coordenadas exactas de Shet Burger.** No se usó la dirección DEMO del proyecto ni se inventaron coordenadas. Nonguén/Concepción provienen de las indicaciones de la marca para esta actualización.

Completar `VITE_LOCATION_LAT` y `VITE_LOCATION_LNG` con coordenadas verificadas y recompilar. Entonces aparecerán una vista previa gratuita de OpenStreetMap en monocromo, pin con logo, atribución y botón de Google Maps. La vista previa no permite desplazar el mapa; el botón abre navegación en Maps. Sin coordenadas hay una composición tipográfica claramente pendiente y el botón está deshabilitado. No se incluyen horarios ni nuevas direcciones.

## Ejecutar, verificar y desplegar

```sh
npm install
npm run dev
npm run check
npm run build
npm run preview
```

En PowerShell con scripts bloqueados, usar `npm.cmd` en lugar de `npm`. No sobrescribir `.env`/`.env.local` existentes con el archivo de ejemplo.

El resultado es `dist/`. Configurar las variables VITE en el entorno **antes de compilar**, no solo como bindings del Worker. Para Cloudflare Workers Static Assets:

```sh
npx wrangler login
npm run build
npx wrangler deploy
```

`wrangler.jsonc` usa el nombre del Worker actual y fallback SPA para `/admin` y `/admin/analytics`. Verificar la cuenta Cloudflare y el nombre antes de publicar; no se publicó automáticamente. Si el Worker existente usa un pipeline propio, conservarlo y apuntar sus assets a `dist/`. Para Vercel se mantiene `vercel.json`.

Tras aplicar la migración y desplegar, verificar un pedido real controlado, OAuth y moderación. No se afirma un score Lighthouse: medir sobre el sitio desplegado con sus servicios y red reales.

### Verificación realizada

- `npm.cmd run check`: cinco pruebas unitarias aprobadas y build de producción correcto.
- Chrome/Playwright: 375, 390, 430, 1440 y 1920 px, sin overflow horizontal; fotografías cargadas y títulos revelados.
- Interacciones con API simulada: menú móvil/Escape/foco, estrellas por teclado, selección de variante y carrito, envío pendiente, listado aprobado y paginación, error y reintento, tienda cerrada, producto agotado, movimiento reducido y ruta `/admin`.
- La prueba no envía pedidos ni reseñas a Supabase. Los servicios remotos y las políticas SQL requieren la verificación posterior a migración descrita arriba.

Para repetir la prueba visual, tener Playwright disponible en desarrollo, iniciar Vite con `VITE_REVIEWS_ENABLED=true` en puerto 5174 y ejecutar `node scripts/verify-editorial.mjs`. En PowerShell: `$env:VITE_REVIEWS_ENABLED='true'; npm.cmd run dev -- --port 5174`; en otra consola ejecutar el script. El valor de esa consola no modifica los archivos `.env`.

Referencias técnicas: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [funciones de Postgres](https://supabase.com/docs/guides/database/functions), [atribución OpenStreetMap](https://www.openstreetmap.org/copyright). La referencia estética es [SoyJetset](https://www.soyjetset.cl/); no se reutilizaron sus assets ni código.
El despliegue sigue la [configuración SPA de Cloudflare](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).
