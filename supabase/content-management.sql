-- Editor de contenido y catálogo para SHET Burger.
-- Ejecutar después de production-hardening.sql para disponer de public.is_admin().

create table if not exists public.catalog_products (
  id text primary key,
  payload jsonb not null,
  position integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.catalog_products enable row level security;
alter table public.site_content enable row level security;

drop policy if exists "public can read active catalog" on public.catalog_products;
drop policy if exists "admins can manage catalog" on public.catalog_products;
create policy "public can read active catalog" on public.catalog_products
  for select to anon, authenticated using (active = true);
create policy "admins can manage catalog" on public.catalog_products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public can read site content" on public.site_content;
drop policy if exists "admins can manage site content" on public.site_content;
create policy "public can read site content" on public.site_content
  for select to anon, authenticated using (true);
create policy "admins can manage site content" on public.site_content
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create index if not exists catalog_products_position_idx on public.catalog_products (position);
