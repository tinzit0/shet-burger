-- Ejecutar una vez en Supabase > SQL Editor para habilitar cuentas de clientes.
alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);

drop policy if exists "authenticated can create own orders" on public.orders;
drop policy if exists "authenticated can read orders" on public.orders;
drop policy if exists "authenticated can update orders" on public.orders;
drop policy if exists "authenticated can delete orders" on public.orders;

create policy "authenticated can create own orders"
  on public.orders for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "authenticated can read orders"
  on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);
