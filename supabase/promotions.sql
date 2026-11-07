-- Ejecutar después de coupons.sql. Conserva los cupones existentes.
begin;
alter table public.coupons drop constraint coupons_discount_type_check;
alter table public.coupons drop constraint coupons_check;
alter table public.coupons add constraint coupons_discount_type_check check (discount_type in ('percent','fixed','buy_x_pay_y','quantity_percent','free_delivery'));
alter table public.coupons add constraint coupons_value_check check (value between 1 and 1000000 and (discount_type not in ('percent','quantity_percent') or value <= 100));
alter table public.coupons add column title text not null default '' check (length(title)<=80);
alter table public.coupons add column description text not null default '' check (length(description)<=200);
alter table public.coupons add column scope_label text not null default 'Todos los productos.' check (length(scope_label)<=300);
alter table public.coupons add column product_ids text[] not null default '{}' check (cardinality(product_ids)<=500);
alter table public.coupons add column min_quantity integer not null default 2 check (min_quantity between 2 and 50);
alter table public.coupons add column buy_quantity integer not null default 2 check (buy_quantity between 2 and 50);
alter table public.coupons add column pay_quantity integer not null default 1 check (pay_quantity>=1 and pay_quantity<buy_quantity);

create or replace function public.admin_save_coupon(p_coupon jsonb, p_token uuid default null)
returns public.coupons language plpgsql security definer set search_path = '' as $$
declare v_result public.coupons;
begin
  perform public.admin_list_coupons(p_token);
  if p_coupon->>'id' is null then
    insert into public.coupons(code,discount_type,value,min_subtotal,expires_at,active,published,
      title,description,scope_label,product_ids,min_quantity,buy_quantity,pay_quantity)
    values(upper(trim(p_coupon->>'code')),p_coupon->>'discount_type',(p_coupon->>'value')::integer,
      coalesce((p_coupon->>'min_subtotal')::integer,0),(p_coupon->>'expires_at')::timestamptz,
      coalesce((p_coupon->>'active')::boolean,true),coalesce((p_coupon->>'published')::boolean,true),
      coalesce(p_coupon->>'title',''),coalesce(p_coupon->>'description',''),coalesce(p_coupon->>'scope_label','Todos los productos.'),
      array(select jsonb_array_elements_text(coalesce(p_coupon->'product_ids','[]'::jsonb))),
      coalesce((p_coupon->>'min_quantity')::integer,2),coalesce((p_coupon->>'buy_quantity')::integer,2),coalesce((p_coupon->>'pay_quantity')::integer,1))
    returning * into v_result;
  else
    update public.coupons set active=(p_coupon->>'active')::boolean
    where id=(p_coupon->>'id')::uuid returning * into v_result;
    if not found then raise exception 'Promoción no encontrada'; end if;
  end if;
  return v_result;
end;
$$;

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
  v_units integer[];
  v_count integer;
  v_eligible bigint;
  v_free integer;
begin
  select * into v_coupon from public.coupons where code=upper(trim(p_coupon_code)) for share;
  if not found or not v_coupon.active then raise exception 'Esta promoción no está disponible'; end if;
  if v_coupon.expires_at is not null and v_coupon.expires_at<=now() then raise exception 'Esta promoción venció'; end if;
  -- place_order valida tienda, cantidades, precios y disponibilidad con datos del servidor.
  select * into strict v_order from public.place_order(p_order_number,p_customer_name,p_customer_phone,p_fulfillment,p_address,p_items,p_receipt_name,p_receipt_path);
  if p_fulfillment='delivery' then
    v_fee := case split_part(trim(p_address),' · ',1) when 'Concepción Centro' then 3000 else 1000 end;
  end if;
  v_subtotal := v_order.total-v_fee;
  if v_subtotal<v_coupon.min_subtotal then raise exception 'No se alcanza la compra mínima de la promoción'; end if;
  -- Nunca se confía en la categoría ni en el precio enviados desde el navegador.
  select array_agg(price.price order by price.price) into v_units
    from jsonb_array_elements(p_items) item
    join public.menu_prices price on price.product_id=item#>>'{product,id}' and price.variant=item->>'variant'
    cross join lateral generate_series(1,(item->>'quantity')::integer) unit
    where cardinality(v_coupon.product_ids)=0 or price.product_id=any(v_coupon.product_ids);
  v_count := coalesce(cardinality(v_units),0);
  select coalesce(sum(unit),0) into v_eligible from unnest(v_units) unit;
  if v_coupon.discount_type='free_delivery' then
    if p_fulfillment<>'delivery' or v_fee<=0 then raise exception 'Esta promoción requiere delivery'; end if;
    v_discount := v_fee;
  else
    if v_count=0 then raise exception 'Agrega productos participantes para usar esta promoción'; end if;
    if v_coupon.discount_type='buy_x_pay_y' then
      if v_count<v_coupon.buy_quantity then raise exception 'No se alcanza la cantidad de la promoción'; end if;
      v_free := (v_count/v_coupon.buy_quantity)*(v_coupon.buy_quantity-v_coupon.pay_quantity);
      select coalesce(sum(unit),0)::integer into v_discount from unnest(v_units[1:v_free]) unit;
    elsif v_coupon.discount_type in ('percent','quantity_percent') then
      if v_coupon.discount_type='quantity_percent' and v_count<v_coupon.min_quantity then raise exception 'No se alcanza la cantidad de la promoción'; end if;
      v_discount := floor(v_eligible*v_coupon.value/100.0)::integer;
    else
      v_discount := least(v_eligible,v_coupon.value)::integer;
    end if;
    v_discount := greatest(0,least(v_eligible,v_discount))::integer;
  end if;
  update public.orders set coupon_code=v_coupon.code,discount_amount=v_discount,total=v_order.total-v_discount
    where id=v_order.id returning * into v_order;
  return next v_order;
end;
$$;
revoke all on function public.admin_save_coupon(jsonb,uuid) from public;
revoke all on function public.place_order_with_coupon(text,text,text,text,text,jsonb,text,text,text) from public;
grant execute on function public.admin_save_coupon(jsonb,uuid) to anon,authenticated;
grant execute on function public.place_order_with_coupon(text,text,text,text,text,jsonb,text,text,text) to anon,authenticated;
commit;
