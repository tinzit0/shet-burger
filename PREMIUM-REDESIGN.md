# SHET BURGER — Premium Redesign

## SHET Mood con más contenido — 8 de octubre de 2026

- El usuario señaló demasiado espacio blanco entre `SHET Mood` y `Nuestro lugar en el mundo / De Nonguén, con actitud`. La cabecera anterior separaba dos bloques pequeños en columnas muy amplias.
- La cabecera ahora reúne título, fotografía y origen en una franja rosa suave de tres columnas. Se agregó «Tu gente, una caja rosa y un buen motivo para juntarse», la fotografía existente `burger-playlist.jpg` y el pie «El antojo va contigo». La imagen se muestra completa, sin recortes.
- El bloque de Nonguén incorpora la dirección desde `business.pickupAddress` y un enlace real `Cómo llegar` basado en `directionsUrl`. No se fijaron direcciones nuevas ni se inventaron horarios.
- Se redujo el espacio superior y se adaptó la composición a dos columnas en tablet y una en teléfono. Las cuatro fotografías cuadradas de la galería se conservaron completas. La portada a pantalla completa y los videos no se modificaron.
- `node scripts/verify-mood-layout.mjs`: aprobado en nueve anchos de 320 a 1920 px, sin desbordes, superposiciones ni textos cortados; cinco fotografías completas y enlace accesible por teclado. Capturas en `artifacts/mood-filled/`. `npm.cmd run check`: 8 pruebas y build aprobados. Sin despliegue.

## Video a pantalla completa — preferencia vigente, 7 de octubre de 2026

- El usuario pidió reemplazar la composición dividida por un video que llene toda la pantalla, con el título al costado en computador y arriba de los ojos en teléfono. Esta decisión sustituye el encuadre vertical enmarcado y el título móvil inferior de la revisión anterior.
- `Hero.jsx` y `hero.css`: fondo de video de ancho completo y altura del viewport, sin marco hueso, filtros ni degradados oscuros. Se usa `object-fit: cover`, que conserva la proporción del archivo vertical y recorta sus bordes según la pantalla; el original no se deforma ni se modifica.
- Escritorio: título y acciones a la izquierda del ojo. Teléfono vertical: título arriba de la mirada y acciones en la parte inferior. Las pantallas bajas o apaisadas tienen ajustes propios para que los controles sigan visibles. La pausa queda en una capa independiente, accesible por toque y teclado.
- `scripts/hero-composition.mjs` proyecta la zona del ojo desde el video original para comprobar que el título no la invada. Se verificaron nueve anchos entre 320 y 1920 px, móviles bajos y orientación horizontal, además de pausa real, navegación, carrito, movimiento reducido, 8 pruebas unitarias y build.
- Capturas de esta revisión: `artifacts/fullscreen-eye-media/` y `artifacts/fullscreen-eye-responsive/`. No se tocaron precios, datos externos ni las otras secciones de la página. Sin despliegue.

## Iteración anterior: portada editorial — 7 de octubre de 2026

- Preferencia en esta iteración: mostrar el video completo junto con el título, sin tapar el ojo ni añadir hamburguesas, sellos o capas oscuras sobre él. El archivo `mirada.mp4` es vertical, de 720 × 1280; el recorte anterior provenía de `object-fit: cover` dentro de una franja horizontal.
- La portada conserva la proporción nativa 9:16 con `object-fit: contain`. En escritorio el título acompaña al video en una composición de dos columnas; en móvil queda sobre la zona inferior de la mejilla, después del 70 % del encuadre. El control de reproducción está fuera de la imagen. El título y el video pertenecen a una única portada.
- Acabado editorial: Space Grotesk con un acento en Georgia cursiva, fondo hueso, rosa suave, separadores finos y espacios más ordenados. SHET Mood y Universo SHET comparten esta dirección; se preservan las fotografías completas, los contenidos y los enlaces reales.
- Corrección de fuentes: `font-display: optional` dejaba visible Arial Narrow incluso después de descargar Space Grotesk, confirmado con las fuentes realmente renderizadas en Chrome. Se usan `swap` y precarga de las dos fuentes locales para mostrar la tipografía elegida.
- Se evitó que el logo se comprima en pantallas de 320 px, manteniendo visibles las acciones del encabezado.
- Verificación: 8 pruebas unitarias y build aprobados; pruebas de diseño y pedidos de 320 a 1920 px, pausa/reproducción por toque, mouse y teclado, movimiento reducido, fotografías completas y geometría del video sin recortes. Capturas: `artifacts/premium-eye-media/` y `artifacts/premium-eye-responsive/`.
- No se cambiaron precios, stock, pagos ni datos externos. No se realizó un despliegue. Esta sección y las siguientes registran iteraciones anteriores.

## Ajuste de portada, fotografías y videos — octubre 2026

- Preferencia confirmada: el ojo debe verse sin imágenes, sellos ni oscurecimientos encima. Se eliminó el degradado negro y el bloque inferior ahora usa el fondo hueso del sitio. También se retiró la frase «Costra crujiente, cheddar fundido y ese desorden perfecto. El antojo tiene nombre».
- `SHET Mood` presenta cuatro marcos cuadrados iguales. Las fotografías se muestran completas con `object-fit: contain`, sin zoom ni desplazamiento sobre la imagen; las etiquetas quedan debajo. `La mesa` pasó a `Buena compañía`.
- `Universo SHET` usa `Actitud SHET` en lugar de `02 · El código`, incorpora detalles gráficos de marca y el bloque `El plan lo pones tú`, con enlaces reales para delivery, compartir y retiro.
- Causa de la pausa inaccesible: el botón del film estaba dentro de una capa con `z-index: -2`, cubierta por `.film__copy`. El control ahora es un elemento hermano por encima de las capas visuales, con icono y texto visibles también en móvil.
- `src/lib/useVideoPlayback.js` coordina ambos videos. La pausa manual se conserva al salir y volver al viewport; los cambios de visibilidad no reinician los efectos ni sobrescriben la última elección con rechazos de `play()`. Se respeta el movimiento reducido y el ahorro de datos, con reproducción manual disponible.
- QA: `node scripts/verify-home-media.mjs` prueba clic, toque, teclado, tiempo de reproducción detenido, pausa persistente y movimiento reducido. Capturas en `artifacts/home-media-refresh/`. `verify-premium.mjs` aprobó de 320 a 1920 px; capturas actualizadas en `artifacts/home-media-responsive/`.

## Inicio y pedidos con más vida — octubre 2026

- Inicio: por preferencia del usuario, el ojo queda despejado en una franja de video propia. Se retiraron la hamburguesa, el sello de papas incluidas, el halo y los textos decorativos superpuestos. `Fat Smash Burgers`, el título y las acciones quedan debajo del video, con encuadre adaptado a móvil y escritorio y control para pausar/reproducir.
- `Pedir ahora` vuelve a tener contraste y permanece visible en la cabecera móvil. La causa era la mayor especificidad de `.brand-header__utilities button`, que imponía un fondo transparente, y la ocultación de toda la zona de utilidades hasta 980 px.
- Con el carrito vacío, el botón abre `/delivery` o baja al menú si ya se está en esa página. Con productos, muestra `Mi pedido` y abre el carrito.
- Pedidos: nueva portada fotográfica, precios obtenidos del catálogo, accesos a las cinco categorías y tarjetas con fotos grandes, variantes y acciones de ancho completo. Los accesos desplazan la página; no filtran ni ocultan productos.
- Los estilos de pedidos se agrupan en `src/design/delivery.css`. Se reutilizan las imágenes locales; no se agregan dependencias ni se modifican precios, stock, pagos o la integración con Supabase.
- Se corrigió la prioridad del estilo de movimiento reducido para que las hojas cargadas después no reactiven las animaciones.
- Verificación: `npm.cmd run check` y `scripts/verify-premium.mjs`, con capturas en `artifacts/life-refresh/`. La revisión cubre de 320 a 1920 px, contraste/visibilidad del botón, navegación, variantes, carrito, video, movimiento reducido, agotados y tienda cerrada. Las respuestas de disponibilidad se simulan solo dentro del navegador de prueba.
- No se ha realizado un despliegue. Los resultados Lighthouse más abajo corresponden al rediseño anterior.

## Actualización del inicio — ritmo editorial

- La portada del ojo y la navegación se conservaron como elementos centrales de marca.
- Se agregó una franja de acciones inmediata para pedir o recorrer las burgers insignia.
- La promesa y el diario fotográfico se unificaron en el collage editorial `SHET MOOD`, con escalas y encuadres más expresivos.
- Una franja gráfica de alto contraste y el bloque `Universo SHET` incorporan movimiento, cultura de marca e Instagram sin alterar el flujo de compra.
- Se retiró `Cuatro formas de caer` del inicio; las hamburguesas siguen disponibles en la página de pedidos.
- Los títulos dentro de tarjetas ahora escalan según el ancho real de cada caja, evitando cortes y desbordes en móvil y tablet.
- Las nuevas fotografías se sirven en WebP optimizado; el patrón pesa 233 KB y la escena exterior 175 KB.
- El menú, carrito, pedidos, cuenta, seguimiento y administración mantienen su comportamiento anterior.

## Resultado

El sitio público fue reconstruido como una experiencia editorial gastronómica con una narrativa más corta y clara: **Hero → Promesa → Burgers insignia → Film/Ambiente → Prueba social → Ubicación/Delivery → Cierre**. La lógica de catálogo, precios, carrito, despacho, pedidos, seguimiento, autenticación, stock y administración se conserva.

## Fase 0 — Estado base

- `npm install`: dependencias al día. En PowerShell se usa `npm.cmd` por la política local de ejecución.
- Tests: 8/8 aprobados.
- Build: correcto, con un warning inicial por un chunk JS de 500,57 kB.
- Lighthouse móvil base:

| Ruta | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 53 | 92 | 100 | 92 | 60,2 s | 0 | 160 ms |
| `/delivery` | 55 | 96 | 100 | 92 | 55,4 s | 0 | 70 ms |

Las esperas de base provenían principalmente del `@import` bloqueante de Google Fonts dentro del CSS. Las capturas originales están en `artifacts/premium-before/`.

### Componentes confirmados en uso

- Shell público: `App`, `Header`, `ScrollReveals`.
- Home: `HomePage`, `Hero`, `HomeMedia`, `ShetSignature`, `ReviewsSection`, `LocationSection`, `FooterCTA`.
- Delivery: `DeliveryPage`, `MenuSection`, `BurgerPhoto`, `CartDrawer`.
- Cuenta/pedido: `CustomerAuth`, `CustomerAccount`, `OrderTracker`.
- Privado: `AdminPanel`, `AdminAnalytics`, `StoreSwitch`, `ReceiptInbox`.

### Código muerto confirmado y eliminado

- Componentes no importados: `BrandManifesto`, `BurgerStory`, `Campaign`, `EditorialIntro`, `Ingredients`, `SocialScroll`.
- CSS antiguo asociado a Hero v3, BurgerStory, Campaign, manifiesto y SocialScroll.
- Las hojas monolíticas `styles.css`, `editorial.css` y `campaign.css`, junto con sus overrides repetidos y reglas minificadas.

## Dirección visual

- Paleta: negro grafito y hueso cálido como base; rosa SHET como color de acción; dorado limitado a rating/foco.
- Tipografía: Space Grotesk para display y DM Sans para lectura/UI. Se autoalojan en WOFF2 con `font-display: optional`; Georgia se usa solo como gesto editorial puntual.
- Fotografía: marcos rectos, proporciones consistentes, fondos controlados y menos tilt/marquee. Las burgers usan las restauraciones HD existentes.
- Movimiento: una familia de reveal vertical sutil. El hero usa exclusivamente el video de la mirada y se pausa fuera de pantalla; el film se carga cerca del viewport.

## Tokens

`src/design/tokens.css` concentra:

- Colores de marca y neutros.
- Escala tipográfica fluida con `clamp()`.
- Escala de espacios basada en 4/8 px.
- Radios `sm/md/lg/pill`.
- Sombras suaves y flotantes.
- Duraciones `fast/base/slow` y curvas estándar.
- Familias display, body y editorial.

Todo texto visible supera 11 px; cuerpo y campos usan 15–16 px o más. Botones y controles táctiles relevantes tienen al menos 44 px.

## Arquitectura CSS

- `src/design/tokens.css`: variables y fuentes.
- `src/design/base.css`: reset, tipografía, botones, enlaces, foco y motion.
- `src/design/header.css`: navegación desktop/móvil.
- `src/design/hero.css`: hero y media crítica.
- `src/design/home.css`: promesa, insignias, film, ubicación y cabeceras.
- `src/design/menu.css`: categorías y tarjetas de producto.
- `src/design/reviews.css`: formulario y testimonios.
- `src/design/footer.css`: CTA y footer.
- `src/design/overlays.css`: carrito, checkout, seguimiento y cuenta.
- `src/design/admin.css`: scope visual de las rutas privadas para evitar contaminación desde el sistema público.

No quedan `@import`, tamaños de texto de 10 px o menos ni `!important` en la capa visual.

## Rendimiento y SEO

- Space Grotesk y DM Sans autoalojadas; sin solicitudes a Google Fonts.
- Poster crítico WebP responsive de 480/640/960 px y capa HTML inicial estable.
- Fotos editoriales WebP con `srcset`, `sizes`, dimensiones, lazy loading y decoding async.
- Fotos de burgers servidas por `BurgerPhoto` desde `public/assets/menu/hd/*-v2-640.webp` y `*-1024.webp`; los recortes PDF quedan solo como fallback y para productos sin restauración dedicada.
- Supabase, admin, carrito, cuenta, seguimiento y reseñas cargan en chunks diferidos.
- Hero con el video de la mirada como único fondo, sin poster de hamburguesa; pausa fuera de pantalla y respeto por ahorro de datos y movimiento reducido.
- Diario fotográfico editorial con cuatro escenas reales, encuadres controlados y proporciones consistentes en todos los viewports.
- Menú completo en flujo vertical: Hamburguesas, Promociones, Fritos, Bebidas y Extras aparecen seguidos, sin botones de filtro.
- Se eliminaron pies de foto, numeraciones y etiquetas editoriales decorativas; los nombres de las burgers insignia se integran sobre la fotografía y el contenido pequeño restante es exclusivamente funcional.
- Metadata Open Graph/Twitter, theme color, favicon/apple icon, JSON-LD `Restaurant` y `robots.txt`.
- Imagen OG real de 1200×630 en `public/assets/og-shet.png`.
- Los fallbacks SPA existentes de Vercel y Cloudflare se conservaron.

## QA final

Build reproducible con el lockfile (`vite 8.2.2`):

- `npm test`: 8/8.
- `npm run build`: aprobado y sin warnings.
- Viewports: 360, 390, 430, 768, 1024, 1440 y 1920 px.
- Sin overflow horizontal ni texto visible menor a 11 px.
- Verificados: menú móvil/focus trap/Escape, imágenes HD, Simple/Doble, agregar al carrito, recarga directa de `/delivery`, `/admin` y `/admin/analytics`, y guards privados.
- Capturas finales: `artifacts/premium-after/`.

| Ruta | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 99 | 100 | 100 | 100 | 1,8 s | 0 | 50 ms |
| `/delivery` | 99 | 100 | 100 | 100 | 1,8 s | 0 | 0 ms |

Los JSON completos están en `artifacts/premium-after/lighthouse-home.json` y `lighthouse-delivery.json`.

## Archivos funcionales adaptados

- `src/App.jsx`: carga diferida de integraciones/paneles, sin cambiar estado ni reglas de negocio.
- `src/components/Header.jsx`, `Hero.jsx`, `HomePage.jsx`, `HomeMedia.jsx`, `ShetSignature.jsx`.
- `src/components/DeliveryPage.jsx`, `MenuSection.jsx`, `CartDrawer.jsx`.
- `src/components/LocationSection.jsx`, `FooterCTA.jsx`.
- `src/main.jsx`, `index.html`.
- `scripts/verify-premium.mjs`, `scripts/optimize-public-images.mjs`.

## Pendientes de negocio

- Confirmar horarios públicos para incorporarlos al footer y al JSON-LD; no se inventaron.
- Confirmar el dominio final para agregar URL canónica y convertir las URLs OG/JSON-LD a absolutas.
- Confirmar coordenadas exactas `VITE_LOCATION_LAT` / `VITE_LOCATION_LNG`; el mapa actual usa la dirección verificada Río Loa 130.
- Promociones, fritos, bebidas y extras no tienen fotografía HD dedicada. Sus recortes existentes se conservaron sin simular nuevas fotos de producto.
