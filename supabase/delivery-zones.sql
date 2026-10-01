-- Ejecutar una vez en Supabase > SQL Editor.
-- Agrega al total el despacho según la población incluida al inicio de la dirección.
begin;

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
  v_delivery_fee integer := 0;
  v_valid_items integer;
  v_order public.orders;
begin
  if not coalesce((select is_open from public.store_settings where id=1), false) then raise exception 'Los pedidos están cerrados'; end if;
  if p_customer_name is null or length(trim(p_customer_name)) not between 1 and 80 then raise exception 'Nombre inválido'; end if;
  if p_customer_phone !~ '^\+569[0-9]{8}$' then raise exception 'Teléfono inválido'; end if;
  if p_fulfillment not in ('delivery','pickup') then raise exception 'Modalidad inválida'; end if;
  if p_fulfillment='delivery' and (p_address is null or length(trim(p_address)) not between 1 and 180) then raise exception 'Dirección inválida'; end if;

  if p_fulfillment='delivery' then
    v_delivery_fee := case split_part(trim(p_address), ' · ', 1)
      when 'Nonguén' then 1000
      when 'Collao' then 1000
      when 'Valle Noble' then 1000
      when 'San Guillermo' then 1000
      when 'Palomares' then 1000
      when 'Km 10' then 1000
      when 'Concepción Centro' then 3000
      else null
    end;
    if v_delivery_fee is null then raise exception 'Zona de delivery no disponible'; end if;
  end if;

  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Pedido vacío o demasiado grande'; end if;
  select count(*),sum((item->>'quantity')::integer*price.price)
    into v_valid_items,v_total
  from jsonb_array_elements(p_items) item
  join public.menu_prices price on price.product_id=item#>>'{product,id}' and price.variant=item->>'variant'
  left join public.product_availability availability on availability.product_id=price.product_id
  where (item->>'quantity')::integer between 1 and 25 and coalesce(availability.available,true);
  if v_valid_items<>jsonb_array_length(p_items) or v_total is null then raise exception 'Hay productos, precios o cantidades no válidos'; end if;

  v_total := v_total + v_delivery_fee;
  insert into public.orders(order_number,user_id,customer_name,customer_phone,fulfillment,address,items,total,status,stage,receipt_name,receipt_path)
  values(p_order_number,(select auth.uid()),trim(p_customer_name),p_customer_phone,p_fulfillment,nullif(trim(p_address),''),p_items,v_total,'Pedido recibido',0,p_receipt_name,p_receipt_path)
  returning * into v_order;
  return next v_order;
end;
$$;

revoke all on function public.place_order(text,text,text,text,text,jsonb,text,text) from public;
grant execute on function public.place_order(text,text,text,text,text,jsonb,text,text) to anon, authenticated;

commit;
