-- MEJORA TUS PAPAS: una sola opción, "Cheddar y bacon", máximo 1 por hamburguesa.
-- Ejecutar en Supabase SQL Editor después de menu-customization.sql.
-- El producto se marca agotado/disponible desde el panel (pestaña DISPONIBILIDAD).

begin;

-- 1. Producto nuevo (si ya existe, se conserva su precio y solo se reactiva).
insert into public.shet_catalog_products(id,payload,position)
select 'papas-cheddar-bacon',
 '{"id":"papas-cheddar-bacon","category":"extras","name":"Cheddar y bacon","description":"Salsa cheddar y tocino sobre tus papas.","prices":[["Extra","$1.800"]],"friesExtra":true,"burgerExtra":false,"standalone":false}'::jsonb,
 coalesce(max(position),-1)+1
from public.shet_catalog_products
on conflict(id) do update set payload=public.shet_catalog_products.payload||'{"friesExtra":true}'::jsonb,active=true,updated_at=now();

insert into public.menu_prices(product_id,variant,price) values('papas-cheddar-bacon','Extra',1800)
on conflict(product_id,variant) do nothing;

-- 2. El resto de los extras deja de aparecer en MEJORA TUS PAPAS.
update public.shet_catalog_products
set payload=payload||'{"friesExtra":false}'::jsonb,updated_at=now()
where id<>'papas-cheddar-bacon' and payload->>'category' in ('extras','salsas');

-- 3. El servidor rechaza más de 1 unidad en papas.
create or replace function shet_private.addons(p_items jsonb,p_scope text,p_burger jsonb default '{}') returns jsonb language plpgsql security invoker set search_path='' as $$
declare item jsonb; p jsonb; qty integer; amount integer; result jsonb:='[]'; total integer:=0; seen text[]:='{}';
begin
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)>100 then raise exception 'Extras invalidos'; end if;
 for item in select value from jsonb_array_elements(p_items) loop
  p:=shet_private.product(item->>'product_id');
  if coalesce(item->>'quantity','') !~ '^[0-9]+$' then raise exception 'Cantidad de extra invalida'; end if;
  qty:=(item->>'quantity')::integer;
  if qty not between 1 and 100 or item->>'product_id'=any(seen) or p->>'category' not in ('extras','salsas') then raise exception 'Extra o cantidad invalida'; end if;
  if p_scope='fries' and qty>1 then raise exception 'Mejora tus papas permite maximo 1 unidad'; end if;
  seen:=array_append(seen,item->>'product_id');
  if jsonb_array_length(coalesce(p_burger->'allowedExtraIds','[]'))>0 and not(p_burger->'allowedExtraIds' ? (p->>'id')) then raise exception 'Extra no disponible para esta hamburguesa'; end if;
  if p_scope='fries' and not coalesce((p->>'friesExtra')::boolean,p->>'id'='papas-cheddar-bacon') then raise exception 'Extra no disponible para papas'; end if;
  if p_scope='burger' and not coalesce((p->>'burgerExtra')::boolean,true) then raise exception 'Extra no disponible para hamburguesas'; end if;
  amount:=shet_private.price(p,p#>>'{prices,0,0}'); total:=total+amount*qty;
  result:=result||jsonb_build_array(jsonb_build_object('product_id',p->>'id','name',p->>'name','quantity',qty,'unit_price',amount,'scope',p_scope));
 end loop;
 return jsonb_build_object('items',result,'total',total);
end $$;

commit;
