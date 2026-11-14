-- Ejecutar después de promotions.sql. Permite editar promociones desde el panel.
-- Sin "edit": true se mantiene el comportamiento anterior (solo pausar/activar).
-- Los pedidos guardan código y descuento propios, así que editar no altera pedidos ya hechos.
begin;
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
  elsif coalesce((p_coupon->>'edit')::boolean,false) then
    update public.coupons set
      code=upper(trim(p_coupon->>'code')),discount_type=p_coupon->>'discount_type',value=(p_coupon->>'value')::integer,
      min_subtotal=coalesce((p_coupon->>'min_subtotal')::integer,0),expires_at=(p_coupon->>'expires_at')::timestamptz,
      active=coalesce((p_coupon->>'active')::boolean,active),published=coalesce((p_coupon->>'published')::boolean,true),
      title=coalesce(p_coupon->>'title',''),description=coalesce(p_coupon->>'description',''),
      scope_label=coalesce(p_coupon->>'scope_label','Todos los productos.'),
      product_ids=array(select jsonb_array_elements_text(coalesce(p_coupon->'product_ids','[]'::jsonb))),
      min_quantity=coalesce((p_coupon->>'min_quantity')::integer,2),buy_quantity=coalesce((p_coupon->>'buy_quantity')::integer,2),
      pay_quantity=coalesce((p_coupon->>'pay_quantity')::integer,1)
    where id=(p_coupon->>'id')::uuid returning * into v_result;
    if not found then raise exception 'Promoción no encontrada'; end if;
  else
    update public.coupons set active=(p_coupon->>'active')::boolean
    where id=(p_coupon->>'id')::uuid returning * into v_result;
    if not found then raise exception 'Promoción no encontrada'; end if;
  end if;
  return v_result;
end;
$$;
revoke all on function public.admin_save_coupon(jsonb,uuid) from public;
grant execute on function public.admin_save_coupon(jsonb,uuid) to anon,authenticated;
commit;
