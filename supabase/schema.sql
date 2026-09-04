-- Ejecutar una vez en Supabase > SQL Editor.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
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

alter table public.orders enable row level security;
drop policy if exists "public can create orders" on public.orders;
drop policy if exists "public can read orders by number" on public.orders;
drop policy if exists "public can update orders" on public.orders;
drop policy if exists "public can delete orders" on public.orders;
create policy "public can create orders" on public.orders for insert to anon with check (true);
create policy "public can read orders by number" on public.orders for select to anon using (true);
create policy "public can update orders" on public.orders for update to anon using (true) with check (true);
create policy "public can delete orders" on public.orders for delete to anon using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

insert into storage.buckets (id, name, public) values ('order-receipts', 'order-receipts', false) on conflict (id) do nothing;
drop policy if exists "public can upload receipts" on storage.objects;
drop policy if exists "public can read receipts" on storage.objects;
create policy "public can upload receipts" on storage.objects for insert to anon with check (bucket_id = 'order-receipts');
create policy "public can read receipts" on storage.objects for select to anon using (bucket_id = 'order-receipts');
