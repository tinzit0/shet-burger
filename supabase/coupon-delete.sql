-- Ejecutar después de coupons.sql y promotions.sql.
-- Permite al panel eliminar cupones. Los pedidos guardan el código como texto,
-- así que el historial de pedidos conserva el cupón usado aunque se elimine.
begin;
create or replace function public.admin_delete_coupon(p_id uuid, p_token uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.admin_list_coupons(p_token);
  delete from public.coupons where id=p_id;
  if not found then raise exception 'Cupón no encontrado'; end if;
end;
$$;
revoke all on function public.admin_delete_coupon(uuid,uuid) from public;
grant execute on function public.admin_delete_coupon(uuid,uuid) to anon,authenticated;
commit;
