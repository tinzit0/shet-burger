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

-- Sesión protegida para que el panel demo pueda guardar disponibilidad global
-- sin abrir la escritura de productos a todos los visitantes.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),
  is_open boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id, is_open) values (1, true) on conflict (id) do nothing;

create table if not exists public.product_availability (
  product_id text primary key,
  available boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.demo_admin_credentials (
  id smallint primary key default 1 check (id = 1),
  email text not null unique,
  password_hash text not null
);

create table if not exists public.demo_admin_sessions (
  token uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

alter table public.store_settings enable row level security;
alter table public.product_availability enable row level security;
alter table public.demo_admin_credentials enable row level security;
alter table public.demo_admin_sessions enable row level security;
alter table public.store_settings replica identity full;
alter table public.product_availability replica identity full;

drop policy if exists "everyone can read store settings" on public.store_settings;
create policy "everyone can read store settings" on public.store_settings
  for select to anon, authenticated using (true);

drop policy if exists "everyone can read availability" on public.product_availability;
create policy "everyone can read availability" on public.product_availability
  for select to anon, authenticated using (true);

grant select on table public.store_settings to anon, authenticated;
grant select on table public.product_availability to anon, authenticated;
revoke all on table public.demo_admin_credentials from anon, authenticated;
revoke all on table public.demo_admin_sessions from anon, authenticated;

insert into public.demo_admin_credentials (id, email, password_hash)
values (1, 'shet.burger@gmail.com', extensions.crypt('shet2026', extensions.gen_salt('bf')))
on conflict (id) do nothing;

create or replace function public.demo_admin_login(p_email text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_token uuid;
begin
  if not exists (
    select 1
    from public.demo_admin_credentials
    where lower(email) = lower(trim(p_email))
      and password_hash = crypt(p_password, password_hash)
  ) then
    raise exception 'Credenciales incorrectas';
  end if;

  delete from public.demo_admin_sessions where expires_at <= now();
  insert into public.demo_admin_sessions default values returning token into v_token;
  return v_token;
end;
$$;

create or replace function public.demo_update_product_availability(
  p_token uuid,
  p_product_id text,
  p_available boolean
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.demo_admin_sessions
    where token = p_token and expires_at > now()
  ) then
    raise exception 'Sesión administrativa vencida';
  end if;

  if p_product_id is null or length(trim(p_product_id)) not between 1 and 160 then
    raise exception 'Producto inválido';
  end if;

  insert into public.product_availability (product_id, available, updated_at)
  values (trim(p_product_id), p_available, now())
  on conflict (product_id) do update
    set available = excluded.available, updated_at = excluded.updated_at;
  return true;
end;
$$;

create or replace function public.demo_update_store_open(p_token uuid, p_is_open boolean)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.demo_admin_sessions
    where token = p_token and expires_at > now()
  ) then
    raise exception 'Sesión administrativa vencida';
  end if;

  insert into public.store_settings (id, is_open, updated_at)
  values (1, p_is_open, now())
  on conflict (id) do update
    set is_open = excluded.is_open, updated_at = excluded.updated_at;
  return true;
end;
$$;

revoke all on function public.demo_admin_login(text, text) from public;
revoke all on function public.demo_update_product_availability(uuid, text, boolean) from public;
revoke all on function public.demo_update_store_open(uuid, boolean) from public;
grant execute on function public.demo_admin_login(text, text) to anon, authenticated;
grant execute on function public.demo_update_product_availability(uuid, text, boolean) to anon, authenticated;
grant execute on function public.demo_update_store_open(uuid, boolean) to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'product_availability'
  ) then
    alter publication supabase_realtime add table public.product_availability;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'store_settings'
  ) then
    alter publication supabase_realtime add table public.store_settings;
  end if;
end $$;
