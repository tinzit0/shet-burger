-- Ejecutar después de production-hardening.sql (y demo-admin.sql si se usa ese acceso).
begin;
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[A-Z0-9_-]{3,30}$'),
  discount_type text not null check (discount_type in ('percent','fixed')),
  value integer not null check (value > 0 and value <= 1000000 and (discount_type <> 'percent' or value <= 100)),
  min_subtotal integer not null default 0 check (min_subtotal between 0 and 10000000),
  expires_at timestamptz,
  active boolean not null default true,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.coupons enable row level security;
revoke all on public.coupons from anon, authenticated;
grant select on public.coupons to anon, authenticated;
-- Los códigos no publicados se pueden canjear, pero no se anuncian en la página.
create policy "read available coupons" on public.coupons for select to anon, authenticated
  using (active and (expires_at is null or expires_at > now()));

alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount_amount integer not null default 0;

-- Mantiene la autorización del dueño por Google o por el token del panel existente.
create or replace function public.admin_list_coupons(p_token uuid default null)
returns setof public.coupons language plpgsql security definer set search_path = '' as $$
declare v_allowed boolean := coalesce(public.is_admin(),false);
begin
  if not v_allowed and p_token is not null and to_regclass('public.demo_admin_sessions') is not null then
    execute 'select exists(select 1 from public.demo_admin_sessions where token=$1 and expires_at>now())' into v_allowed using p_token;
  end if;
  if not v_allowed then raise exception 'Sesión administrativa vencida'; end if;
  return query select * from public.coupons order by created_at desc;
end;
$$;
create or replace function public.admin_save_coupon(p_coupon jsonb, p_token uuid default null)
returns public.coupons language plpgsql security definer set search_path = '' as $$
declare v_result public.coupons;
begin
  -- La comprobación también protege la escritura cuando no hay cupones todavía.
  perform public.admin_list_coupons(p_token);
  if p_coupon->>'id' is null then
    insert into public.coupons(code,discount_type,value,min_subtotal,expires_at,active,published)
    values(upper(trim(p_coupon->>'code')),p_coupon->>'discount_type',(p_coupon->>'value')::integer,
      coalesce((p_coupon->>'min_subtotal')::integer,0),(p_coupon->>'expires_at')::timestamptz,
      coalesce((p_coupon->>'active')::boolean,true),coalesce((p_coupon->>'published')::boolean,true))
    returning * into v_result;
  else
    update public.coupons set active=(p_coupon->>'active')::boolean
    where id=(p_coupon->>'id')::uuid returning * into v_result;
    if not found then raise exception 'Cupón no encontrado'; end if;
  end if;
  return v_result;
end;
$$;

-- API de compra invitada: conserva place_order y su validación de precios/stock.
-- Recalcula el descuento en el servidor, sin aceptar importes del navegador.
create or replace function public.place_order_with_coupon(
  p_order_number text,p_customer_name text,p_customer_phone text,p_fulfillment text,
  p_address text,p_items jsonb,p_receipt_name text,p_receipt_path text,p_coupon_code text
) returns setof public.orders language plpgsql security definer set search_path = '' as $$
declare
  v_coupon public.coupons;
  v_order public.orders;
  v_subtotal bigint;
  v_fee integer := 0;
  v_discount integer;
begin
  select * into v_coupon from public.coupons where code=upper(trim(p_coupon_code)) for share;
  if not found or not v_coupon.active then raise exception 'Este cupón no está disponible'; end if;
  if v_coupon.expires_at is not null and v_coupon.expires_at<=now() then raise exception 'Este cupón venció'; end if;
  select * into strict v_order from public.place_order(p_order_number,p_customer_name,p_customer_phone,p_fulfillment,p_address,p_items,p_receipt_name,p_receipt_path);
  if p_fulfillment='delivery' then
    v_fee := case split_part(trim(p_address),' · ',1) when 'Concepción Centro' then 3000 else 1000 end;
  end if;
  v_subtotal := v_order.total-v_fee;
  if v_subtotal<v_coupon.min_subtotal then raise exception 'No se alcanza la compra mínima del cupón'; end if;
  v_discount := least(v_subtotal,case when v_coupon.discount_type='percent' then floor(v_subtotal*v_coupon.value/100.0)::integer else v_coupon.value end);
  update public.orders set coupon_code=v_coupon.code,discount_amount=v_discount,total=v_order.total-v_discount
    where id=v_order.id returning * into v_order;
  return next v_order;
end;
$$;
revoke all on function public.admin_list_coupons(uuid) from public;
revoke all on function public.admin_save_coupon(jsonb,uuid) from public;
revoke all on function public.place_order_with_coupon(text,text,text,text,text,jsonb,text,text,text) from public;
grant execute on function public.admin_list_coupons(uuid) to anon,authenticated;
grant execute on function public.admin_save_coupon(jsonb,uuid) to anon,authenticated;
grant execute on function public.place_order_with_coupon(text,text,text,text,text,jsonb,text,text,text) to anon,authenticated;
commit;
