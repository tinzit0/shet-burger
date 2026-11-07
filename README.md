# SHET BURGER

## Cupones y promociones

En `/admin`, la pestaña **PROMOCIONES** permite crear códigos con porcentaje, monto fijo, lleva X y paga Y (2×1, 3×2), descuento por cantidad y delivery gratis. El dueño puede definir nombre, descripción, productos o categoría participante, compra mínima y vencimiento opcional. Se pueden pausar y reactivar. La opción **Mostrar en la página de pedidos** anuncia la promoción en `/delivery`; las demás se comparten por código. Solo se aplica un código por pedido. El despacho se conserva salvo en la promoción de delivery gratis.

Los 2×1 y 3×2 se repiten por cada grupo completo y bonifican las unidades participantes de menor precio. Los descuentos por categoría incluyen los productos seleccionados al crear la promoción; los agregados posteriores requieren una nueva promoción. Las unidades internas de combos no se cuentan individualmente.

El carrito muestra el descuento, actualiza el monto de transferencia y guarda el código y el ahorro en el pedido, el seguimiento y el historial. Supabase vuelve a validar disponibilidad, vencimiento, compra mínima y precios al confirmar. La administración requiere la cuenta autorizada o un token vigente del panel existente.

Para otra instalación, ejecutar `supabase/coupons.sql` y después `supabase/promotions.sql`, tras las migraciones de pedidos y administración. El soporte ya fue aplicado al proyecto Supabase configurado en este repositorio. Comprobación local: `npm run check`.

## Portada del menú

La portada de `/delivery` usa la composición de la referencia `assets/como quiero el menu/Captura de pantalla 2026-11-07 153339.png`: foto grande, nombre central y botón para personalizar el producto. Alterna hamburguesas y combos cada 11 segundos, con cinco fondos, fundidos de 2,4 segundos y un acercamiento lento de la fotografía. Incluye navegación y pausa; se detiene al personalizar, al usar el teclado dentro del carrusel o al ocultar la pestaña. Respeta la preferencia de movimiento reducido. En móvil, la foto aparece arriba del nombre y del botón para pedir.

Prueba de navegador: `node scripts/verify-promotions-cover.mjs`, con el sitio local en el puerto 5173 y Chromium con depuración remota en el puerto 9225. Usa respuestas simuladas para promociones y administración, sin guardar datos de prueba en Supabase; captura imágenes en `artifacts/menu-campaign`.

La portada abre con el ojo de SHET y pasa directo al universo de marca: un collage de fotos reales, una franja gráfica, video de cocina y la información de Nonguén. Los prototipos interactivos anteriores se conservan fuera del flujo activo y están documentados en [INTERACTIVE-EXPERIENCE.md](INTERACTIVE-EXPERIENCE.md).

La separación **INICIO / PEDIR / PUNTO DE RETIRO** está documentada en [HOME-DELIVERY.md](HOME-DELIVERY.md): composición audiovisual, rutas, archivos originales, pruebas y despliegue. El carrito y la integración existente con Supabase se conservan.

La actualización visual y el sistema de reseñas están documentados en [EDITORIAL.md](EDITORIAL.md): archivos, variables, migración Supabase, moderación, ubicación pendiente y despliegue en Cloudflare.

Sitio de pedidos construido con React, Vite y Supabase. Incluye catálogo, carrito, transferencia con comprobante, seguimiento, acceso de clientes con Google y panel administrativo. Para el boceto, el panel conserva el acceso demo `shet.burger@gmail.com` / `shet2026`; reemplázalo por autenticación real antes de aceptar pedidos en producción.

## Desarrollo

1. Copia `.env.example` como `.env` y completa los valores.
2. Instala dependencias con `npm install`.
3. Inicia el proyecto con `npm run dev`.
4. Compila con `npm run build`.

## Configuración inicial de Supabase

1. Ejecuta `supabase/schema.sql` si la tabla de pedidos todavía no existe.
2. Ejecuta `supabase/customer-google.sql` para habilitar el historial personal de clientes.
3. Configura Google OAuth siguiendo la sección correspondiente.
4. Inicia sesión una vez con Google usando la cuenta del dueño.
5. Revisa el correo indicado al final de `supabase/production-hardening.sql`.
6. Para producción, ejecuta completo `supabase/production-hardening.sql` en SQL Editor.
7. Confirma con `select * from public.admin_users;` que el administrador fue creado.

La migración elimina el acceso administrativo anónimo, protege los comprobantes y crea la configuración compartida de tienda y disponibilidad. El acceso demo del boceto no debe usarse junto a esa migración en producción: la migración está diseñada para el administrador autenticado con Google. Si la consulta no devuelve filas, vuelve a iniciar sesión con Google y ejecuta solamente el `insert into public.admin_users` ubicado al final de la migración.

## Google OAuth

En Supabase configura la URL pública en **Authentication > URL Configuration > Site URL** y agrega `http://localhost:5173/**` para desarrollo y `https://TU-DOMINIO/**` para producción. En Google Cloud, la URL de callback autorizada es la que muestra Supabase en la configuración del proveedor Google.

Los clientes pueden comprar como invitados, pero solamente los pedidos creados mientras tienen su sesión de Google activa quedan asociados automáticamente a “Mis pedidos” y aparecen en otros dispositivos al iniciar sesión con la misma cuenta.

Si el panel sigue usando el acceso demo, ejecuta `supabase/demo-admin.sql` después de `schema.sql`. Esto permite que el panel demo lea y actualice pedidos desde cualquier dispositivo. No uses esta migración en producción: expone los pedidos a usuarios anónimos y debe reemplazarse por `production-hardening.sql` con administrador Google.

## Variables necesarias

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_BUSINESS_NAME`
- `VITE_BANK_NAME`
- `VITE_BANK_ACCOUNT`
- `VITE_BUSINESS_RUT`
- `VITE_PICKUP_ADDRESS`

Las variables `VITE_*` son visibles en el navegador. Solo se debe utilizar la clave publicable de Supabase; nunca se debe agregar la clave `service_role` al proyecto web.

## Despliegue

El hosting debe redirigir `/delivery`, `/admin` y `/admin/analytics` hacia `index.html` para permitir recargas directas. Vercel y Cloudflare ya tienen fallback SPA configurado. Después de desplegar, prueba pedidos, fases, tienda cerrada, disponibilidad, cuenta de cliente y panel administrativo desde teléfono y computador.

## Pedidos entre dispositivos en el boceto

El panel demo consulta los pedidos desde Supabase cada 8 segundos y también escucha Realtime. Todos los dispositivos deben usar el mismo `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. En el proyecto demo, conserva las políticas públicas existentes de lectura de `orders`; la migración de producción las restringe intencionalmente y requiere iniciar sesión con Google como administrador.
