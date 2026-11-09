**Actualización vigente: fotografías de la portada del menú**

El cambio se limita a las fotografías del carrusel de Pedir. Se reemplazaron los recortes de silueta por ventanas fotográficas con encuadre por producto. BBQ Beast y Cheeseburger Bacon reutilizan fotografías reales existentes de campaña; los demás productos conservan sus fotos originales. Las imágenes cambiadas desde administración tienen prioridad. No se modificaron el fondo, textos, precios, navegación, catálogo ni Supabase.

Archivos de esta revisión: src/components/MenuHeroPhoto.jsx (nuevo), src/components/MenuCover.jsx, src/design/menu-cover.css y scripts/verify-editorial-cover.mjs. Sin assets nuevos ni placeholders. Las notas siguientes describen etapas anteriores.

---
**SHET BURGER ? informe de implementaci?n, 9 de noviembre de 2026**

**Versi?n vigente ? fotograf?a natural y composici?n cercana a la referencia**

Se retiraron de la presentaci?n las reconstrucciones generativas que exageraban brillo y detalle. BurgerPhoto vuelve a utilizar las fotograf?as originales del cat?logo en las tarjetas, el personalizador y el carrito. Para la portada, los originales se integran mediante encuadres SVG sin reconstruir pan, carnes ni ingredientes; las im?genes WebP originales se incrustan sin modificar sus p?xeles. El borde utiliza una m?scara SVG y transparencia, sin rect?ngulo de estudio ni sombras artificiales.

La primera diapositiva ahora es BBQ Beast y utiliza la fotograf?a propia assets/videos shet o fotos/foto8.jpeg, de 4000 ? 6000 px, optimizada proporcionalmente antes del encuadre. Se conservan el papel y el resto de productos. La composici?n presenta una foto de tama?o m?s contenido a la izquierda, nombre al centro y descripci?n, precio y bot?n a la derecha, siguiendo la referencia menu.png. En m?vil se apila. Algunas fotos restantes proceden del PDF y conservan la compresi?n del archivo de origen: no se inventaron detalles para simular mayor resoluci?n.

Archivos: src/components/BurgerPhoto.jsx, src/components/MenuCover.jsx, src/design/menu-cover.css, src/lib/originalMenuPhotos.json, scripts/prepare-original-menu-photos.mjs y scripts/verify-editorial-cover.mjs. Los encuadres se guardan en public/assets/menu/original-editorial/. Los recortes generados de la etapa descartada se archivaron en artifacts/rejected-generated-cutouts/, fuera de los recursos p?blicos. No se modificaron precios ni Supabase; Extras sigue como ?ltimo bloque del men?.

Verificaci?n: build correcto y revisi?n del carrusel con los diez productos, sus precios y personalizadores en 320, 390, 768 y 1440 px; sin errores de consola ni desplazamiento horizontal. Se comprueban fotograf?as originales, esquinas transparentes, encuadre completo, ampliaci?n contenida, flechas y gesto t?ctil. Capturas en artifacts/editorial-cover/ y artifacts/pedir-refinement/.

Las descripciones posteriores corresponden a versiones anteriores y no describen la fotograf?a actualmente utilizada.


**?ltimo ajuste ? exclusivamente Pedir**

Se ampli? la fotograf?a de la portada y se pas? a dos columnas, con nombre, descripci?n, precio y compra en un ?nico bloque vertical. Se retir? el corte inclinado de la imagen, se mejor? la legibilidad de la descripci?n, se destac? el precio y se ajust? el bot?n rosado y la alineaci?n de los indicadores. Se mantienen los patrones existentes, los diez productos, sus precios y toda la navegaci?n del carrusel.

Se elimin? ?ntegramente el bloque rosado ?Hecho en Nongu?n?, junto con sus imports y estilos sin uso. Extras es la ?ltima categor?a del men?, seguida solo por el footer habitual. No se modificaron el inicio ni los datos de Supabase.

Archivos: src/components/DeliveryPage.jsx, src/design/menu-cover.css, src/design/delivery.css y scripts/verify-editorial-cover.mjs. Build correcto y revisi?n de navegador en 320, 390, 768 y 1440 px para los diez productos, precios, personalizadores, flechas y navegaci?n t?ctil, adem?s de la eliminaci?n del bloque y la posici?n final de Extras. Capturas en artifacts/editorial-cover/ y artifacts/pedir-refinement/.

Las descripciones siguientes corresponden a etapas anteriores.


**Actualizaci?n vigente ? Muerde la tentaci?n, portada de Pedir y bebidas**

La foto central del bloque donde estuvo el formulario ahora utiliza el archivo original assets/fotos burger/muerde la tentacion.jpeg mediante un import de Vite, con su proporci?n preservada y recorte responsive.

La portada de Pedir sigue la composici?n de assets/como quiero el menu/menu.png: fotograf?a grande a la izquierda, nombre condensado al centro y descripci?n, precio y bot?n a la derecha. Se sustituyeron las tres composiciones alternas por una sola estructura coherente y se retiraron el sello, los fondos de tarjetas y sus sombras. Los papeles originales siguen altern?ndose, centrados y sin mosaicos; se aplica una capa oscura uniforme para hacer legible el contenido sobre el patr?n. Se mantienen los diez productos reales, los precios, el carrusel autom?tico, las flechas que se ocultan, el deslizamiento t?ctil y los personalizadores. No se a?adi? pause/play.

Se a?adieron im?genes locales para Coca Cola, Coca Cola Zero, Sprite, Sprite Zero, Fanta, Kem y Jugo Jumex. Se descargaron fotograf?as de los envases desde cat?logos comerciales, revisadas visualmente y optimizadas a WebP con un m?ximo de 480 px; las siete suman 116734 bytes. La procedencia de cada imagen est? documentada en public/assets/drinks/sources.json. El selector de sabor de Jumex conserva las cuatro opciones actuales. La imagen de Durazno es la presentaci?n referencial del producto, sin cambiar los sabores disponibles.

src/lib/productImages.js resuelve las fotograf?as por los identificadores existentes. Una imagen configurada desde administraci?n tiene prioridad; no se editaron registros ni precios en Supabase. La misma resoluci?n se usa en el men?, el personalizador y el carrito. Las bebidas conservan sus controles de cantidad, estados de stock y botones de compra. Se ajustaron sus tarjetas para que la foto, el texto y los controles no se superpongan en celular.

Archivos de esta etapa: src/components/HomeCommunity.jsx, MenuCover.jsx, MenuSection.jsx, BurgerPhoto.jsx, ProductConfigurator.jsx y CartDrawer.jsx; src/lib/productImages.js; src/design/menu-cover.css, menu-update.css y headings.css; public/assets/drinks/; scripts/prepare-drink-images.mjs y scripts/verify-drink-images.mjs. Este informe tambi?n se actualiz?. Los originales descargados se guardaron en artifacts/drink-originals/; no se sirven ni se duplican en la compilaci?n.

Verificaci?n: npm run check pas? con 45 pruebas y build correcto. scripts/verify-editorial-cover.mjs pas? en 320, 390, 768 y 1440 px, verificando los diez productos, precios, apertura de personalizadores, controles y navegaci?n t?ctil. scripts/verify-drink-images.mjs pas? en 375, 768 y 1280 px, verificando las siete im?genes, ausencia de solapamientos y prueba local con tres Coca-Cola y dos Jumex sabor Mango. No se confirmaron ni guardaron pedidos. Cero errores de consola y sin desbordes horizontales. Evidencias: artifacts/editorial-cover/ y artifacts/menu-reference/. Cambios locales, sin publicar un despliegue.

Los apartados siguientes documentan versiones anteriores de estas secciones.


**Ajustes vigentes del inicio ? simplificaci?n de elementos**

Se retiraron el logo dentro de la O de MOOD, la segunda cinta inclinada, el formulario, TikTok y los controles visibles de pausa/reproducci?n del ojo y del feed. El componente conservado del video vertical tambi?n queda sin controles visibles. El ojo mantiene su reproducci?n autom?tica y el feed su desplazamiento, pausa por hover y preferencia de movimiento reducido.

Los dos GIF se centraron juntos en una franja crema entre el collage y la textura. Se reemplaz? el formulario por la fotograf?a original triple-cheddar.jpg, que aparece una sola vez en el inicio. La frase lateral ahora es ?CRUJIENTE. JUGOSA. DESORDENADA.?. Los enlaces PEDIR, INSTAGRAM y ADMINISTRACI?N se alinean a la izquierda y se reserva espacio para WhatsApp tambi?n en el footer del men?.

Archivos de esta etapa: HomeMedia.jsx, HomePage.jsx, HomeCommunity.jsx, InstagramFeed.jsx, Hero.jsx, LocationVideo.jsx, home.css, footer.css y scripts/verify-street-home.mjs. No se agregaron assets, dependencias ni cambios de base de datos.

Comprobaciones: build de producci?n correcto y navegador en 375, 768 y 1280 px, verificando ausencia de controles y formulario, GIF centrados, foto ?nica, reproducci?n del ojo, acceso PEDIR, movimiento reducido y ausencia de superposici?n entre WhatsApp y los enlaces en inicio y men?. Capturas y resultados en artifacts/home-refinement/. Esta etapa sustituye las descripciones anteriores de los elementos retirados.


**Composici?n densa desde el marquee ? actualizaci?n vigente**

Se reh?zo la distribuci?n inferior del inicio. El marquee existente permanece igual. MOOD ahora es un collage sin gaps ni radios, con dos fotos peque?as de 260 px, una central de 420 px y un bloque lateral con el copy existente y una cuarta foto de los assets. El t?tulo usa Anton de al menos 128 px en escritorio, con el logo real dentro de una O; los GIF se colocan sobre el collage. En m?vil la foto principal pasa arriba y las fotos peque?as ocupan dos columnas.

Despu?s aparecen una cinta negra inclinada de 110 vw recortada por su contenedor, la textura nativa public/assets/campaign/textura.svg de 220 px de altura y tres paneles pegados de 520 px en escritorio: fotograf?a con llamada a la carta, formulario rosa y feed de fotos. El feed conserva su bucle CSS y sus controles. La ubicaci?n pasa debajo, sobre negro con t?tulos blanco/rosa, mapa y bloque de retiro sin radios. El footer es negro y compacto.

Se reutilizaron las fotos, el logo, los GIF y los textos existentes; las dos llamadas nuevas y las etiquetas del formulario son las solicitadas en el ?ltimo encargo. No se modificaron los archivos de navbar, hero, WhatsApp ni los tokens existentes: se verificaron sus hashes antes y despu?s del ajuste.

Archivos de esta etapa: src/components/HomePage.jsx, src/components/HomeMedia.jsx, src/components/HomeCommunity.jsx, src/design/home.css, public/assets/campaign/textura.svg y scripts/verify-street-home.mjs, adem?s de este informe. No se a?adieron librer?as ni hubo cambios de Supabase.

Pendientes deliberados: el formulario es solo visual y tiene TODO para conectar el backend; no guarda ni env?a datos ni anuncia una suscripci?n exitosa. TikTok se muestra como icono sin enlace hasta disponer de la cuenta real, con TODO en el c?digo. La textura SVG est? terminada y puede reemplazarse por otra; no hay fotos ficticias ni placeholders visuales.

Verificaci?n terminada: npm run check pas? con 45 pruebas y build de producci?n correcto. El navegador pas? en 375, 768 y 1280 px: fotos y paneles pegados, radio cero, tama?o de t?tulo, feed con pausa, ausencia de peticiones al enviar el formulario visual, movimiento reducido, mapa y CTA operativos, cero errores de consola y sin overflow horizontal. Evidencia: artifacts/dense-home/. Sin publicar un despliegue.

Los apartados posteriores corresponden a etapas previas y quedan sustituidos en lo relativo a esta nueva distribuci?n.


**Reajuste street food de la p?gina de inicio**

Se conservaron el hero del ojo y sus controles, el navbar y WhatsApp. El trabajo se limit? a las secciones inferiores de la p?gina existente en React/Vite. Se a?adieron las variables de paleta solicitadas sin reemplazar las variables que usa la portada protegida.

- Marquee negro con tipograf?a condensada, separadores rosados, bucle CSS continuo y pausa al pasar el cursor.
- MOOD sobre crema, t?tulo negro/magenta en Anton, tres fotograf?as originales con borde de 2 px y sus etiquetas existentes. En escritorio las fotos comparten altura con el feed lateral; en m?vil el feed pasa debajo a todo el ancho con altura de 320 px.
- Feed visual de doce fotos reales del proyecto, en tres columnas y con un segundo grupo id?ntico para el bucle vertical. Pausa al pasar el cursor, al enfocar controles y mediante un bot?n. Se conserva el enlace real a @SHETBURGER. No usa una conexi?n de Instagram ni muestra publicaciones en directo.
- Los dos GIF originales se copiaron sin cambios a public/assets/caricaturas/abrazo.gif y tocino.gif. Sus versiones est?ticas abrazo-still.png y tocino-still.png se muestran cuando se solicita movimiento reducido.
- Ubicaci?n con el mapa y direcci?n actuales en una caja de dos columnas: mapa y bloque rosado de delivery/retiro, apilados en m?vil. La composici?n anterior de tres columnas con video junto al mapa se sustituye por esta distribuci?n solicitada; el archivo original del video y su componente permanecen en el proyecto.
- Anton se sirve localmente desde Google Fonts, acompa?ada de su licencia OFL. No se a?adieron dependencias.

Archivos de este reajuste: src/components/HomeMedia.jsx, src/components/InstagramFeed.jsx, src/components/LocationSection.jsx, src/design/home.css, src/design/menu-update.css y src/design/tokens.css. Se a?adi? scripts/verify-street-home.mjs para sustituir la comprobaci?n anterior del video junto al mapa, que ya no representa la distribuci?n solicitada.

Assets a?adidos: los dos GIF renombrados, dos fotogramas PNG est?ticos y public/assets/fonts/anton-regular.ttf con anton-OFL.txt. No hay placeholders: todas las im?genes proceden de los assets reales de SHET.

Verificaci?n: scripts/verify-street-home.mjs pas? en 375, 768 y 1280 px. Se comprobaron el bot?n PEDIR, presencia del hero original, fuente Anton cargada, feed continuo, pausa por hover/bot?n, foco de teclado visible, GIF id?nticos a sus originales, sustituci?n est?tica con movimiento reducido, mapa y enlace de ubicaci?n, ausencia de desbordes horizontales y cero errores de consola. Capturas y resultados: artifacts/street-home/. El build de producci?n pas?. No se modific? Supabase ni se public? un despliegue.

Los apartados siguientes documentan etapas anteriores; este reajuste sustituye su descripci?n de la distribuci?n del inicio.


