# SHET: HOME / DELIVERY / NUESTRO LOCAL

## Organización

- `/`: hero original, composición FAT / JUICY / SHET, video de campaña a pantalla amplia, cuatro fotografías en una composición asimétrica, marquee, segundo video sticky, reseñas originales, ubicación compacta y CTA hacia Delivery.
- `/delivery`: presentación de compra y `MenuSection` original con sus cinco categorías, variantes, precios, disponibilidad y conexión al carrito. Cierre con ubicación e Instagram.
- `/admin` y `/admin/analytics`: mismos componentes, autorización y operaciones existentes.
- NUESTRO LOCAL: enlace externo compartido, generado en `src/config.js`. Solo se habilita si ambas coordenadas son números válidos. Utiliza `target="_blank" rel="noreferrer"`.

`src/lib/navigation.js` usa History API y `popstate`, sin instalar un router. Solo intercepta enlaces públicos con `data-route`; conserva abrir en otra pestaña con Ctrl/Cmd. El estado de carrito, usuario, tienda y pedidos permanece en `App`. Los enlaces del admin conservan su navegación original. El carrito vacío puede abrir Delivery desde HOME.

## Archivos

Nuevos: `HomePage.jsx`, `DeliveryPage.jsx`, `HomeMedia.jsx`, `src/lib/navigation.js`, `src/campaign.css`, `scripts/verify-campaign.mjs` y este documento.

Adaptados: `App.jsx`, `Header.jsx`, `Hero.jsx`, `LocationSection.jsx`, `FooterCTA.jsx`, `CartDrawer.jsx` (solo acción del carrito vacío), `src/config.js`, `src/main.jsx` y README.

Se conservan los componentes anteriores de marca y SocialScroll en el repositorio. `MenuSection`, `ReviewsSection`, `data.js`, los servicios de Supabase, SQL y los componentes administrativos no fueron reemplazados. Los estilos nuevos se cargan después de los originales; la campaña se limita a las páginas públicas.

## Material audiovisual

Los originales siguen intactos en `assets/videos shet o fotos/`; **no se movieron ni duplicaron**. `HomeMedia.jsx` los importa directamente. Vite emite los seis archivos con nombres con hash dentro de `dist/assets/` y actualiza las URLs automáticamente. No usar rutas literales hacia la carpeta fuente en producción. Incluir esta carpeta en Git al publicar: estaba sin seguimiento al iniciar el trabajo.

| Material | Dimensiones | Tamaño aproximado | Duración |
| --- | --- | --- | --- |
| foto1.jpg | 1170 × 1560 | 214 KB | — |
| foto2.jpg | 1170 × 1560 | 415 KB | — |
| foto3.jpg | 1170 × 1560 | 101 KB | — |
| foto4.jpg | 1170 × 1560 | 204 KB | — |
| video1.mp4 | 720 × 1280 | 2,17 MB | 12,56 s |
| video2.mp4 | 720 × 1280 | 2,31 MB | 8,24 s |

Los videos ya son pequeños: no se recomprimieron. Se optimiza la carga, no su contenido. Los nuevos videos no reciben `src` hasta estar cerca del viewport; usan metadata, muted, loop y playsInline, y se pausan fuera de pantalla o al ocultar la pestaña. Hay posters con las fotos reales y un control discreto de pausa. Con movimiento reducido o ahorro de datos no se cargan automáticamente; pueden reproducirse voluntariamente. El video original del hero también pausa al salir de pantalla y con movimiento reducido.

Las imágenes usan dimensiones, lazy loading y decoding async. Los reveals, parallax y tilt reutilizan `ScrollReveals`, IntersectionObserver y requestAnimationFrame. El marquee se puede pausar; `prefers-reduced-motion` desactiva movimiento automático. No se agregaron dependencias.

## Configuración pendiente

- `VITE_LOCATION_LAT` y `VITE_LOCATION_LNG`: faltan las coordenadas exactas. No se agregaron valores ficticios. Al definir ambas y reconstruir, se habilitan Header, HOME y Delivery con `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG`.
- `VITE_REVIEWS_ENABLED=true`: activar únicamente si `supabase/reviews.sql` ya está aplicado. En el entorno actual no está activado; se conserva el aviso existente.
- Se mantienen `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_ANON_KEY`, datos bancarios y dirección de retiro. Las variables bancarias y de retiro locales ya tienen valores; se deben configurar también en el hosting.
- No se introdujeron secretos ni nuevas variables. Google OAuth, políticas RLS y Realtime siguen usando la configuración previa. Consultar README para la preparación administrativa existente antes de publicar.

## Ejecutar y comprobar

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

En PowerShell con ejecución de scripts restringida, usar `npm.cmd` en lugar de `npm`. Desarrollo abre normalmente `http://localhost:5173`; preview usa `http://localhost:4173`.

Prueba de navegador, si Playwright está disponible en el entorno de desarrollo:

```powershell
$env:TEST_URL='http://127.0.0.1:4173'
node scripts/verify-campaign.mjs
```

El nuevo verificador cubre HOME/DELIVERY a 375, 390, 430, 768, 1440 y 1920 px, cargas y reproducción, recarga directa, historial del navegador, menú móvil/teclado, carrito y variantes, checkout con comprobante, tracking, categorías, stock, cierre de tienda, cuenta/historial, admin y analytics. Intercepta Supabase con respuestas simuladas y nunca publica pedidos reales. Para probar reseñas activadas, iniciar Vite con `$env:VITE_REVIEWS_ENABLED='true'` y apuntar `TEST_URL` a ese servidor. Espera coordenadas pendientes, como el entorno actual.

Las capturas están en `artifacts/campaign/`. El script histórico `verify-editorial.mjs` corresponde al diseño anterior de una sola página; usar `verify-campaign.mjs` para la nueva separación de rutas.

El build y las pruebas locales no validan las credenciales OAuth reales ni las políticas, permisos de Storage o entrega de eventos Realtime del proyecto remoto. Esa verificación necesita una sesión real autorizada. No se modificó ni escribió en la base real durante las pruebas.

## Deploy

1. Incluir el código y los seis originales en el repositorio.
2. Configurar las variables existentes y las coordenadas exactas en el hosting. Las variables Vite se incorporan durante el build: reconstruir al cambiarlas.
3. Vercel: preset Vite, comando `npm run build`, salida `dist`. `vercel.json` ya contiene el rewrite SPA que cubre `/delivery`, `/admin` y `/admin/analytics`.
4. Cloudflare Workers Static Assets: `npm run build` y `npx wrangler deploy` desde una terminal autenticada. `wrangler.jsonc` ya apunta a `./dist` con `not_found_handling: "single-page-application"`. Para otro hosting estático, configurar fallback a `index.html`.
5. Mantener el dominio y las URLs de retorno autorizadas en Supabase/Google; revisar las instrucciones OAuth y producción del README.
6. Abrir y recargar las cuatro rutas directamente tras desplegar. Verificar Google Maps una vez configurado el punto exacto.

No se ejecutó un deploy remoto. Respaldo local del código original versionado: `artifacts/before-home-delivery.zip` (commit base `c4fdc25`). Los originales audiovisuales no se alteraron.
