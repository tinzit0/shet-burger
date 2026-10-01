# Fotografías y movimiento — segunda iteración

## Fotos

Se usó la herramienta integrada image_gen (habilidad imagegen) para retocar las siete fotos existentes. Son reconstrucciones asistidas por IA, no fotografías originales nuevas ni una recuperación garantizada de detalles reales. Se revisaron visualmente para conservar producto, ingredientes, número de carnes, silueta y encuadre. Los originales en public/assets/menu no se sobrescribieron.

Los archivos del PDF incluyen imágenes de apenas 308 × 461 px (y otras dimensiones); varios WebP previos ya estaban ampliados. Ampliarlos nuevamente no recuperaría detalle real.

Versiones finales: public/assets/menu/hd/{producto}-v2-640.webp y {producto}-v2-1024.webp. Calidad WebP .91, ancho máximo 1024 sin ampliar los resultados. El navegador selecciona con srcset/sizes. Versiones 640: 64–130 KB; versiones 1024: 120–275 KB. Los PNG maestros están en artifacts/image-restoration (ignorados por Git); las versiones WebP finales sí pertenecen al proyecto.

BurgerPhoto.jsx aplica las imágenes al menú y a la galería, con lazy loading y fallback a la foto previa si falla el archivo. Las promociones mantienen sus fotografías originales. Catálogo, precios y recetas no cambian. El encuadre de las burgers pasa a casi cuadrado para evitar cortes excesivos.

| Producto | Fuente original | Archivo final (prefijo) |
| --- | --- | --- |
| bbq-beast | public/assets/menu/page-2-3.webp | public/assets/menu/hd/bbq-beast-v2 |
| onion-shet | public/assets/menu/page-2-4.webp | public/assets/menu/hd/onion-shet-v2 |
| bacon-trip | public/assets/menu/page-2-2.webp | public/assets/menu/hd/bacon-trip-v2 |
| cowboy-smoke | public/assets/menu/page-2-1.webp | public/assets/menu/hd/cowboy-smoke-v2 |
| blue-hit | public/assets/menu/page-3-1.webp | public/assets/menu/hd/blue-hit-v2 |
| clasica-bacon | public/assets/menu/page-3-2.webp | public/assets/menu/hd/clasica-bacon-v2 |
| cheeseburger-bacon | public/assets/menu/page-3-3.webp | public/assets/menu/hd/cheeseburger-bacon-v2 |

## Animaciones

- Entrada de títulos con desplazamiento e inclinación suave.
- Productos por partes: fotografía, texto y acción con desfase.
- Nuevas categorías y reseñas reciben animación mediante MutationObserver.
- Parallax de la imagen introductoria, desplazamiento del manifiesto y rotación del sello según scroll.
- Inclinación de fotografías según cursor solo con mouse; zoom moderado en hover.
- Galería escalonada, estrellas con respuesta visual y microinteracciones de botones.
- Barra superior de avance de lectura.

Sin dependencias nuevas. IntersectionObserver limita los elementos activos; requestAnimationFrame se solicita únicamente con eventos. Se limpian listeners y observadores. prefers-reduced-motion detiene parallax, inclinación, entradas y barra, incluso al cambiar la preferencia durante la sesión. Hero intacto respecto de la iteración anterior.

## Prompts exactos (modo integrado, sin CLI/API externa)

Verificación: build y cinco pruebas unitarias aprobados; layouts 375/390/430/1440/1920 sin desbordamiento; imágenes HD cargadas en catálogo; inclinación con mouse, entrada al cambiar categoría, scroll, cambio de movimiento reducido durante la sesión, carrito, stock y reseñas con API simulada. También se comprobó un móvil táctil de 390 px con densidad 3: selecciona la imagen de 1024 px y no activa inclinación con mouse. No se desplegó al sitio público.

### bbq-beast

Use case: precise-object-edit. Edit target: the supplied existing Shet Burger BBQ Beast product photograph. Restore this exact low-resolution photograph for a real restaurant catalog. Improve only image clarity, natural microtexture and resolution, remove compression softness. Preserve the identical burger silhouette, ingredient count, bun, single patty, cheddar, bacon, onion rings, pickle positions, sauces, proportions, camera angle, pale lavender background and lighting. No restyling, no new ingredients, no taller or more perfect burger, no text or logo. Output a crisp high-resolution portrait photograph with the same framing. Faithful restrained photo restoration, not a new product photo.

### onion-shet

Use case: precise-object-edit. Edit target: supplied existing Shet Burger onion-shet product photograph. Restore this exact low-resolution photo for a real restaurant catalog. Improve only clarity, resolution, natural photographic microtexture and soft lighting exposure. Preserve the identical burger silhouette, number of meat patties, bun, ingredient arrangement, sauces, cheese type, proportions, camera angle, background color and framing. Do not invent details that change the product. No extra ingredients, no taller burger, no retouch into a different recipe, no text/logo. Preserve original aspect ratio (square when square, portrait when portrait). High-resolution faithful photo restoration, realistic and appetizing without plastic texture.

### bacon-trip

Use case: precise-object-edit. Edit target: supplied existing Shet Burger bacon-trip product photograph. Restore this exact low-resolution photo for a real restaurant catalog. Improve only clarity, resolution, natural photographic microtexture and soft lighting exposure. Preserve the identical burger silhouette, number of meat patties, bun, ingredient arrangement, sauces, cheese type, proportions, camera angle, background color and framing. Do not invent details that change the product. No extra ingredients, no taller burger, no retouch into a different recipe, no text/logo. Preserve original aspect ratio (square when square, portrait when portrait). High-resolution faithful photo restoration, realistic and appetizing without plastic texture.

### cowboy-smoke

Use case: precise-object-edit. Edit target: supplied existing Shet Burger cowboy-smoke product photograph. Restore this exact low-resolution photo for a real restaurant catalog. Improve only clarity, resolution, natural photographic microtexture and soft lighting exposure. Preserve the identical burger silhouette, number of meat patties, bun, ingredient arrangement, sauces, cheese type, proportions, camera angle, background color and framing. Do not invent details that change the product. No extra ingredients, no taller burger, no retouch into a different recipe, no text/logo. Preserve original aspect ratio (square when square, portrait when portrait). High-resolution faithful photo restoration, realistic and appetizing without plastic texture.

### blue-hit

Use case: precise-object-edit. Edit target: supplied existing Shet Burger blue-hit product photograph. Restore this exact low-resolution photo for a real restaurant catalog. Improve only clarity, resolution, natural photographic microtexture and soft lighting exposure. Preserve the identical burger silhouette, number of meat patties, bun, ingredient arrangement, sauces, cheese type, proportions, camera angle, background color and framing. Do not invent details that change the product. No extra ingredients, no taller burger, no retouch into a different recipe, no text/logo. Preserve original aspect ratio (square when square, portrait when portrait). High-resolution faithful photo restoration, realistic and appetizing without plastic texture.

### clasica-bacon

Use case: precise-object-edit. Edit target: supplied existing Shet Burger clasica-bacon product photograph. Restore this exact low-resolution photo for a real restaurant catalog. Improve only clarity, resolution, natural photographic microtexture and soft lighting exposure. Preserve the identical burger silhouette, number of meat patties, bun, ingredient arrangement, sauces, cheese type, proportions, camera angle, background color and framing. Do not invent details that change the product. No extra ingredients, no taller burger, no retouch into a different recipe, no text/logo. Preserve original aspect ratio (square when square, portrait when portrait). High-resolution faithful photo restoration, realistic and appetizing without plastic texture.

### cheeseburger-bacon

Use case: precise-object-edit. Edit target: supplied existing Shet Burger cheeseburger-bacon product photograph. Restore this exact low-resolution photo for a real restaurant catalog. Improve only clarity, resolution, natural photographic microtexture and soft lighting exposure. Preserve the identical burger silhouette, number of meat patties, bun, ingredient arrangement, sauces, cheese type, proportions, camera angle, background color and framing. Do not invent details that change the product. No extra ingredients, no taller burger, no retouch into a different recipe, no text/logo. Preserve original aspect ratio (square when square, portrait when portrait). High-resolution faithful photo restoration, realistic and appetizing without plastic texture.
