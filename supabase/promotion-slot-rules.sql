create or replace function shet_private.normalize_items(p_items jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare item jsonb; p jsonb; c jsonb; b jsonb; bp jsonb; d jsonb; e jsonb; f jsonb; be jsonb; bf jsonb; slot jsonb; addon jsonb; v text; amount integer; base integer; surcharge integer; qty integer; canonical jsonb:='[]'; burgers jsonb; names jsonb; selections jsonb; idx integer; drink_idx integer; drink_ids jsonb;
begin
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Pedido invalido'; end if;
 for item in select value from jsonb_array_elements(p_items) loop
  p:=shet_private.product(item#>>'{product,id}');
  if coalesce(item->>'quantity','') !~ '^[0-9]+$' then raise exception 'Cantidad invalida'; end if;
  qty:=(item->>'quantity')::integer;
  if qty not between 1 and 25 then raise exception 'Cantidad invalida'; end if;
  base:=shet_private.price(p,item->>'variant'); amount:=base;
  if p->>'category' in ('extras','salsas') and not coalesce((p->>'standalone')::boolean,p->>'id'<>'extra-0') then raise exception 'Este extra solo se agrega a hamburguesas'; end if;
  c:=coalesce(item->'customization','{}'); selections:='[]'; burgers:='[]'; names:='[]';
  e:=shet_private.addons(coalesce(c->'extras','[]'),'burger',p); f:=shet_private.addons(coalesce(c->'friesExtras','[]'),'fries',p);
  if p->>'category'<>'burgers' and (e->>'total')::integer+(f->>'total')::integer>0 then raise exception 'Asocia los extras a su hamburguesa'; end if;
  amount:=amount+(e->>'total')::integer+(f->>'total')::integer;
  selections:=shet_private.lines(e->'items',f->'items');
  if jsonb_typeof(coalesce(c->'burgers','[]')) is distinct from 'array' or jsonb_array_length(coalesce(c->'burgers','[]'))<>coalesce((p->>'burgerChoiceCount')::integer,0) then raise exception 'Completa cada hamburguesa de la promocion'; end if;
  idx:=0;
  for b in select value from jsonb_array_elements(coalesce(c->'burgers','[]')) loop
   idx:=idx+1; bp:=shet_private.product(b->>'product_id');
   slot:=coalesce(p->'promotionSlots'->(idx-1),'{}');
   if bp->>'category'<>'burgers' or (jsonb_array_length(coalesce(p->'allowedBurgerIds','[]'))>0 and not(p->'allowedBurgerIds' ? (bp->>'id'))) then raise exception 'Hamburguesa no incluida en la promocion'; end if;
   if jsonb_array_length(coalesce(slot->'allowedBurgerIds','[]'))>0 and not(slot->'allowedBurgerIds' ? (bp->>'id')) then raise exception 'Hamburguesa no permitida en esta posicion'; end if;
   v:=b->>'variant'; surcharge:=shet_private.price(bp,v)-shet_private.price(bp,bp#>>'{prices,0,0}');
   if (p->>'allowBurgerVariants'='false' or slot->>'allowBurgerVariants'='false') and v<>bp#>>'{prices,0,0}' then raise exception 'La promocion incluye hamburguesas simples'; end if;
   be:=shet_private.addons(coalesce(b->'extras','[]'),'burger',bp); bf:=shet_private.addons(coalesce(b->'friesExtras','[]'),'fries',bp);
   for addon in select value from jsonb_array_elements((be->'items')||(bf->'items')) loop
    if jsonb_array_length(coalesce(slot->'allowedExtraIds','[]'))>0 and not(slot->'allowedExtraIds' ? (addon->>'product_id')) then raise exception 'Adicional no permitido para esta hamburguesa de la promocion'; end if;
   end loop;
   amount:=amount+surcharge+(be->>'total')::integer+(bf->>'total')::integer;
   burgers:=burgers||jsonb_build_array(jsonb_build_object('product_id',bp->>'id','name',bp->>'name','variant',v,'surcharge',surcharge,'extras',be->'items','friesExtras',bf->'items'));
   names:=names||jsonb_build_array(bp->>'name');
   selections:=selections||jsonb_build_array(jsonb_build_object('label','Hamburguesa '||idx,'value',(bp->>'name')||' · '||v))||shet_private.lines(be->'items',bf->'items','Hamburguesa '||idx||' · ');
  end loop;
  drink_ids:=coalesce(c->'drinkChoiceIds','[]');
  if jsonb_typeof(drink_ids) is distinct from 'array' or jsonb_array_length(drink_ids)<>coalesce((p->>'drinkChoiceCount')::integer,0) then raise exception 'Completa las bebidas de la promocion'; end if;
  drink_idx:=0;
  for d in select value from jsonb_array_elements(drink_ids) loop
   bp:=shet_private.product(d#>>'{}'); drink_idx:=drink_idx+1;
   if bp->>'category'<>'bebidas' or bp ? 'optionGroup' then raise exception 'Bebida no incluida'; end if;
   selections:=selections||jsonb_build_array(jsonb_build_object('label','Bebida '||drink_idx,'value',bp->>'name'));
  end loop;
  if p ? 'optionGroup' then
   select value->>'value' into v from jsonb_array_elements(coalesce(item->'selections','[]')) where value->>'label'=p#>>'{optionGroup,label}' limit 1;
   if v is null or not(p#>'{optionGroup,values}' ? v) then raise exception 'Selecciona una opcion valida'; end if;
   selections:=selections||jsonb_build_array(jsonb_build_object('label',p#>>'{optionGroup,label}','value',v));
  end if;
  if p->>'category' in ('extras','salsas') then selections:=selections||jsonb_build_array(jsonb_build_object('label','Entrega','value','Extra independiente: enviar por separado')); end if;
  if coalesce(item->>'price','') !~ '^[0-9]+$' or (item->>'price')::integer<>amount then raise exception 'El precio cambio. Vuelve a elegir el producto antes de pagar'; end if;
  c:=jsonb_build_object('extras',e->'items','friesExtras',f->'items','burgers',burgers,'drinkChoiceIds',drink_ids);
  canonical:=canonical||jsonb_build_array(jsonb_build_object('product',p,'quantity',qty,'variant',item->>'variant','price',amount,'note',left(coalesce(item->>'note',''),240),'customization',c,'burger_choices',names,'selections',selections));
 end loop;
 return canonical;
end $$;

