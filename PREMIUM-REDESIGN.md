# SHET BURGER — Premium Redesign

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
- Movimiento: una familia de reveal vertical sutil. Los videos se cargan cerca del viewport y se pausan fuera de pantalla; el hero activa video tras la primera interacción para proteger LCP.

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
- Video hero después de la primera interacción; film diferido por proximidad y ambos respetan ahorro de datos/movimiento reducido.
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
