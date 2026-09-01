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
  receipt_name text,
  receipt_path text,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
create policy "public can create orders" on public.orders for insert to anon with check (true);
create policy "public can read orders by number" on public.orders for select to anon using (true);
create policy "public can update orders" on public.orders for update to anon using (true) with check (true);

insert into storage.buckets (id, name, public) values ('order-receipts', 'order-receipts', false) on conflict (id) do nothing;
create policy "public can upload receipts" on storage.objects for insert to anon with check (bucket_id = 'order-receipts');
create policy "public can read receipts" on storage.objects for select to anon using (bucket_id = 'order-receipts');
