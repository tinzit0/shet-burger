# SHET BURGER

Sitio de pedidos construido con React, Vite y Supabase. Incluye catálogo, carrito, transferencia con comprobante, seguimiento, acceso de clientes con Google y panel administrativo. Para el boceto, el panel conserva el acceso demo `shet.burger@gmail.com` / `shet2026`; reemplázalo por autenticación real antes de aceptar pedidos en producción.

## Desarrollo

1. Copia `.env.example` como `.env` y completa los valores.
2. Instala dependencias con `npm install`.
3. Inicia el proyecto con `npm run dev`.
4. Compila con `npm run build`.

## Configuración inicial de Supabase

1. Ejecuta `supabase/schema.sql` si la tabla de pedidos todavía no existe.
2. Inicia sesión una vez con Google usando la cuenta del dueño.
3. Revisa el correo indicado al final de `supabase/production-hardening.sql`.
4. Ejecuta completo `supabase/production-hardening.sql` en SQL Editor.
5. Confirma con `select * from public.admin_users;` que el administrador fue creado.

La migración elimina el acceso administrativo anónimo, protege los comprobantes y crea la configuración compartida de tienda y disponibilidad. El acceso demo del boceto no debe usarse junto a esa migración en producción: la migración está diseñada para el administrador autenticado con Google. Si la consulta no devuelve filas, vuelve a iniciar sesión con Google y ejecuta solamente el `insert into public.admin_users` ubicado al final de la migración.

## Google OAuth

En Supabase configura la URL pública en **Authentication > URL Configuration > Site URL** y agrega `http://localhost:5173/**` para desarrollo y `https://TU-DOMINIO/**` para producción. En Google Cloud, la URL de callback autorizada es la que muestra Supabase en la configuración del proveedor Google.

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

El hosting debe redirigir `/admin` y `/admin/analytics` hacia `index.html` para permitir recargas directas. Después de desplegar, prueba pedidos, fases, tienda cerrada, disponibilidad, cuenta de cliente y panel administrativo desde teléfono y computador.
