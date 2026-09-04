-- Ejecutar una vez en Supabase > SQL Editor.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  fulfillment text not null check (fulfillment in ('delivery', 'pickup')),
  address text,
  items jsonb not null default '[]'::jsonb,
  total integer not null default 0,
  status text not null default 'Pedido recibido',
  stage integer not null default 0,
  receipt_name text,
  receipt_path text,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists receipt_name text;
alter table public.orders add column if not exists receipt_path text;
alter table public.orders add column if not exists stage integer not null default 0;
alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_user_id_created_at_idx on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;
drop policy if exists "public can create orders" on public.orders;
drop policy if exists "public can create guest orders" on public.orders;
drop policy if exists "public can read orders by number" on public.orders;
drop policy if exists "public can update orders" on public.orders;
drop policy if exists "public can delete orders" on public.orders;
drop policy if exists "authenticated can create own orders" on public.orders;
drop policy if exists "authenticated can read orders" on public.orders;
drop policy if exists "authenticated can read own orders" on public.orders;
drop policy if exists "authenticated can update orders" on public.orders;
drop policy if exists "authenticated can delete orders" on public.orders;
create policy "public can create guest orders" on public.orders for insert to anon with check (user_id is null and customer_phone ~ '^[+]569[0-9]{8}$' and total > 0);
-- La lectura, actualización y eliminación quedan restringidas a usuarios autenticados
-- y administradores. production-hardening.sql completa las políticas de administrador.
create policy "authenticated can create own orders" on public.orders for insert to authenticated with check ((select auth.uid()) = user_id and customer_phone ~ '^[+]569[0-9]{8}$' and total > 0);
create policy "authenticated can read own orders" on public.orders for select to authenticated using ((select auth.uid()) = user_id);

-- Realtime se habilita en una consulta separada para evitar bloqueos al repetir este esquema.

insert into storage.buckets (id, name, public) values ('order-receipts', 'order-receipts', false) on conflict (id) do nothing;
drop policy if exists "public can upload receipts" on storage.objects;
drop policy if exists "public can read receipts" on storage.objects;
drop policy if exists "authenticated can upload receipts" on storage.objects;
drop policy if exists "authenticated can read receipts" on storage.objects;
create policy "public can upload receipts" on storage.objects for insert to anon with check (bucket_id = 'order-receipts');
-- Los comprobantes no tienen lectura pública. El administrador los revisa mediante URLs firmadas.
create policy "authenticated can upload receipts" on storage.objects for insert to authenticated with check (bucket_id = 'order-receipts');
