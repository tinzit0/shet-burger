-- SHET BURGER: permisos temporales para el panel demo.
-- Usar solamente mientras el panel admin utilice correo/contraseña demo.
-- Para producción, reemplazar por production-hardening.sql y Google Admin.

alter table public.orders enable row level security;
drop policy if exists "demo can read all orders" on public.orders;
drop policy if exists "demo can update all orders" on public.orders;
drop policy if exists "demo can delete all orders" on public.orders;
create policy "demo can read all orders" on public.orders for select to anon using (true);
create policy "demo can update all orders" on public.orders for update to anon using (true) with check (true);
create policy "demo can delete all orders" on public.orders for delete to anon using (true);

-- Necesario para que el panel demo pueda abrir comprobantes con URL firmada.
drop policy if exists "demo can read receipts" on storage.objects;
create policy "demo can read receipts" on storage.objects for select to anon using (bucket_id='order-receipts');
