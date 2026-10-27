# Experiencias interactivas SHET

Estas experiencias se conservan como prototipos en el código, pero no se montan en `HomePage`: **El sabor, al desnudo**, **Sigue tu antojo** y la galería ampliable. La portada activa usa una composición editorial estática centrada en la fotografía real de SHET. No se agregan dependencias de producción.

## Comportamiento

- **El sabor, al desnudo** (`#ritual`): siete ingredientes del archivo `src/data.js`, selección con información de cada capa, control de separación y botón para unir la burger. La inclinación con mouse utiliza el controlador existente de `ScrollReveals`; no hay movimiento automático nuevo.
- **Sigue tu antojo** (`#tu-antojo`): cuatro perfiles de sabor seleccionan Cowboy Smoke, Bacon Trip, Onion SHET o Blue Hit. Las imágenes, variantes y precios proceden del catálogo. El botón usa el carrito de `App` y respeta los estados de tienda y stock. Cambiar de perfil conserva la preferencia simple/doble.
- **Galería SHET Mood**: las cuatro fotos se pueden ampliar en un diálogo cargado bajo demanda. Incluye flechas, indicadores, navegación con teclado, Escape, deslizamiento horizontal, bloqueo de scroll y recuperación del foco. Las fotografías mantienen su encuadre completo.

## Archivos

- `src/components/BurgerAtelier.jsx`: estado y presentación de las capas.
- `src/components/FlavorFinder.jsx`: perfiles de sabor y conexión al pedido.
- `src/components/MoodLightbox.jsx`: galería modal y controles.
- `src/design/experience.css`: composición, interacción y adaptación a móviles.
- `src/components/HomePage.jsx`, `src/components/HomeMedia.jsx`, `src/App.jsx`, `src/main.jsx`: integración.
- `public/assets/atelier/*.webp`: siete copias optimizadas de los PNG transparentes existentes. Los originales se conservan. Total aproximado: 641 KB.

## Verificación

```powershell
npm.cmd run check
node scripts/verify-experience.mjs
```

El verificador usa Playwright disponible en el entorno de desarrollo y Chrome. Por defecto abre `http://127.0.0.1:5173`; se puede cambiar con `TEST_URL`. Simula Supabase, bloquea escrituras remotas y comprueba:

- Diseños de 320, 390, 540, 768, 1024, 1440 y 1920 px, carga de imágenes y texto sin recortes.
- Separación real de las capas, control con teclado y selección de ingredientes.
- Las cuatro recomendaciones, variantes, precio del carrito, stock agotado y tienda cerrada.
- Galería con teclado y touch, cierre, foco y navegación circular.
- Cambio de preferencia de movimiento reducido durante la sesión y navegación hacia la carta.

Las capturas de revisión se guardan en `artifacts/interactive-experience/`, ignorado por Git. Los WebP pueden regenerarse con `node scripts/optimize-atelier-layers.mjs`.

Validación final: ocho pruebas unitarias y build de producción aprobados; verificador de interacción completo aprobado en Chrome, incluida la emulación móvil; regresión de SHET Mood aprobada en nueve anchos entre 320 y 1920 px. Sin errores de ejecución en los flujos nuevos. La vista local queda disponible en el servidor de desarrollo; no se realizó un despliegue remoto.

## Notas de implementación

- Los hijos sin clase y los selectores más específicos del diálogo necesitan reglas explícitas de movimiento reducido: la regla global basada en `[class]` no alcanza todas las animaciones.
- El diálogo nativo hace inerte el contenido de fondo; el recorrido de Tab también se controla para mantener el foco en los botones de la galería.
- Los botones de la galería usan `touch-action: manipulation` para responder al toque inmediatamente después de un deslizamiento.
- Engram no estaba disponible en esta sesión: no se expusieron sus herramientas y el comando `engram setup codex` no existe en el entorno. Este documento conserva las decisiones y hallazgos del trabajo.
