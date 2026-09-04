-- SHET BURGER: seguridad, administradores y configuración compartida.
-- Ejecutar una sola vez en Supabase > SQL Editor después de schema.sql.
-- Antes de ejecutar, cambia el correo del INSERT final si el administrador usará otra cuenta.

begin;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admins can read admin users" on public.admin_users;
create policy "admins can read admin users" on public.admin_users
  for select to authenticated using (public.is_admin() or user_id = (select auth.uid()));

create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),
  is_open boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id, is_open) values (1, true) on conflict (id) do nothing;
alter table public.store_settings enable row level security;

drop policy if exists "everyone can read store settings" on public.store_settings;
drop policy if exists "admins can update store settings" on public.store_settings;
create policy "everyone can read store settings" on public.store_settings for select to anon, authenticated using (true);
create policy "admins can update store settings" on public.store_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.product_availability (
  product_id text primary key,
  available boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.product_availability enable row level security;

drop policy if exists "everyone can read availability" on public.product_availability;
drop policy if exists "admins can insert availability" on public.product_availability;
drop policy if exists "admins can update availability" on public.product_availability;
create policy "everyone can read availability" on public.product_availability for select to anon, authenticated using (true);
create policy "admins can insert availability" on public.product_availability for insert to authenticated with check (public.is_admin());
create policy "admins can update availability" on public.product_availability for update to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.menu_prices (
  product_id text not null,
  variant text not null,
  price integer not null check (price > 0),
  primary key (product_id, variant)
);
alter table public.menu_prices enable row level security;
drop policy if exists "everyone can read menu prices" on public.menu_prices;
create policy "everyone can read menu prices" on public.menu_prices for select to anon, authenticated using (true);

insert into public.menu_prices (product_id,variant,price) values
('bbq-beast','Simple',9490),('bbq-beast','Doble',11990),('onion-shet','Simple',9290),('onion-shet','Doble',11290),
('bacon-trip','Simple',9590),('bacon-trip','Doble',11990),('cowboy-smoke','Simple',9990),('cowboy-smoke','Doble',12990),
('blue-hit','Simple',9100),('blue-hit','Doble',11800),('clasica-bacon','Simple',8990),('clasica-bacon','Doble',10990),
('cheeseburger-bacon','Simple',7990),('cheeseburger-bacon','Doble',9990),('triple-shet','Promo',28990),
('vicio','Promo',9990),('tentacion','Combo',18990),('empanadas','8 unidades',4990),('aros','Porción',2990),('papas-pork','Bowl',7990),
('bebida-0','Lata',1500),('bebida-1','Lata',1500),('bebida-2','Lata',1500),('bebida-3','Lata',1500),('bebida-4','Lata',1500),('bebida-5','Lata',1500),
('extra-0','Extra',2500),('extra-1','Extra',2000),('extra-2','Extra',2000),('extra-3','Extra',1500),('extra-4','Extra',1000),
('extra-5','Extra',800),('extra-6','Extra',800),('extra-7','Extra',800),('extra-8','Extra',800),('extra-9','Extra',800)
on conflict (product_id,variant) do update set price=excluded.price;

alter table public.orders enable row level security;
drop policy if exists "public can create orders" on public.orders;
drop policy if exists "public can read orders by number" on public.orders;
drop policy if exists "public can update orders" on public.orders;
drop policy if exists "public can delete orders" on public.orders;
drop policy if exists "authenticated can create own orders" on public.orders;
drop policy if exists "authenticated can read orders" on public.orders;
drop policy if exists "authenticated can update orders" on public.orders;
drop policy if exists "authenticated can delete orders" on public.orders;
drop policy if exists "public can create guest orders" on public.orders;
drop policy if exists "customers and admins can read orders" on public.orders;
drop policy if exists "admins can update orders" on public.orders;
drop policy if exists "admins can delete orders" on public.orders;

create policy "public can create guest orders" on public.orders
  for insert to anon with check (
    user_id is null and customer_phone ~ '^\+569[0-9]{8}$' and total > 0
    and jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50
  );
create policy "authenticated can create own orders" on public.orders
  for insert to authenticated with check (
    (select auth.uid()) = user_id and customer_phone ~ '^\+569[0-9]{8}$' and total > 0
    and jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50
  );
create policy "customers and admins can read orders" on public.orders
  for select to authenticated using ((select auth.uid()) = user_id or public.is_admin());
create policy "admins can update orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete orders" on public.orders
  for delete to authenticated using (public.is_admin());

create or replace function public.place_order(
  p_order_number text,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment text,
  p_address text,
  p_items jsonb,
  p_receipt_name text,
  p_receipt_path text
) returns setof public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
  v_valid_items integer;
  v_order public.orders;
begin
  if not coalesce((select is_open from public.store_settings where id=1), false) then raise exception 'La tienda está cerrada'; end if;
  if p_customer_name is null or length(trim(p_customer_name)) not between 1 and 80 then raise exception 'Nombre inválido'; end if;
  if p_customer_phone !~ '^\+569[0-9]{8}$' then raise exception 'Teléfono inválido'; end if;
  if p_fulfillment not in ('delivery','pickup') then raise exception 'Modalidad inválida'; end if;
  if p_fulfillment='delivery' and (p_address is null or length(trim(p_address)) not between 1 and 180) then raise exception 'Dirección inválida'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Pedido vacío o demasiado grande'; end if;

  select count(*),sum((item->>'quantity')::integer*price.price)
    into v_valid_items,v_total
  from jsonb_array_elements(p_items) item
  join public.menu_prices price on price.product_id=item#>>'{product,id}' and price.variant=item->>'variant'
  left join public.product_availability availability on availability.product_id=price.product_id
  where (item->>'quantity')::integer between 1 and 25 and coalesce(availability.available,true);
  if v_valid_items<>jsonb_array_length(p_items) or v_total is null then raise exception 'Hay productos, precios o cantidades no válidos'; end if;

  insert into public.orders(order_number,user_id,customer_name,customer_phone,fulfillment,address,items,total,status,stage,receipt_name,receipt_path)
  values(p_order_number,(select auth.uid()),trim(p_customer_name),p_customer_phone,p_fulfillment,nullif(trim(p_address),''),p_items,v_total,'Pedido recibido',0,p_receipt_name,p_receipt_path)
  returning * into v_order;
  return next v_order;
end;
$$;
revoke all on function public.place_order(text,text,text,text,text,jsonb,text,text) from public;
grant execute on function public.place_order(text,text,text,text,text,jsonb,text,text) to anon, authenticated;
revoke insert on public.orders from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('order-receipts', 'order-receipts', false, 8388608, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "public can upload receipts" on storage.objects;
drop policy if exists "public can read receipts" on storage.objects;
drop policy if exists "authenticated can upload receipts" on storage.objects;
drop policy if exists "public can upload guest receipts" on storage.objects;
drop policy if exists "authenticated can upload own receipts" on storage.objects;
drop policy if exists "customers and admins can read receipts" on storage.objects;
drop policy if exists "admins can delete receipts" on storage.objects;
create policy "public can upload guest receipts" on storage.objects
  for insert to anon with check (bucket_id='order-receipts' and (storage.foldername(name))[1]='guest');
create policy "authenticated can upload own receipts" on storage.objects
  for insert to authenticated with check (bucket_id='order-receipts' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "customers and admins can read receipts" on storage.objects
  for select to authenticated using (
    bucket_id='order-receipts' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin())
  );
create policy "admins can delete receipts" on storage.objects
  for delete to authenticated using (bucket_id='order-receipts' and public.is_admin());

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='store_settings') then
    alter publication supabase_realtime add table public.store_settings;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='product_availability') then
    alter publication supabase_realtime add table public.product_availability;
  end if;
end $$;

-- Autoriza la cuenta del dueño si ya inició sesión al menos una vez con Google.
insert into public.admin_users (user_id, email)
select id, email from auth.users where lower(email)=lower('shet.burger@gmail.com')
on conflict (user_id) do update set email=excluded.email;

commit;
