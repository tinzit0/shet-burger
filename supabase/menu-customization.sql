-- Additive SHET migration. Existing orders, stock, prices and unrelated sites are preserved.
create schema if not exists shet_private;
revoke all on schema shet_private from public,anon,authenticated;
create table public.shet_catalog_products (
 id text primary key, payload jsonb not null check(jsonb_typeof(payload)='object' and payload->>'id'=id),
 position integer not null default 0, active boolean not null default true, updated_at timestamptz not null default now()
);
create table public.shet_site_content (
 id text primary key check(id='main'), payload jsonb not null default '{}' check(jsonb_typeof(payload)='object'), updated_at timestamptz not null default now()
);
alter table public.shet_catalog_products enable row level security;
alter table public.shet_site_content enable row level security;
grant select on public.shet_catalog_products,public.shet_site_content to anon,authenticated;
create policy shet_catalog_read on public.shet_catalog_products for select to anon,authenticated using(active or (select public.is_admin()));
create policy shet_content_read on public.shet_site_content for select to anon,authenticated using(true);
create index shet_catalog_position_idx on public.shet_catalog_products(position);

create function shet_private.authorize(p_token uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not public.is_admin() and not exists(select 1 from public.demo_admin_sessions where token=p_token and expires_at>now()) then raise exception 'Sesion administrativa requerida'; end if;
end $$;
create function public.shet_save_catalog(p_products jsonb,p_token uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare p jsonb; v jsonb; pos integer;
begin
 perform shet_private.authorize(p_token);
 if jsonb_typeof(p_products) is distinct from 'array' or jsonb_array_length(p_products) not between 1 and 500 then raise exception 'Catalogo invalido'; end if;
 for p in select value from jsonb_array_elements(p_products) loop
  if p->>'id' is null or length(p->>'id') not between 1 and 100 or p->>'name' is null or length(trim(p->>'name')) not between 1 and 100 or p->>'category' is null or p->>'category' not in ('burgers','promos','fritos','salsas','extras','bebidas') or jsonb_typeof(p->'prices') is distinct from 'array' or jsonb_array_length(p->'prices') not between 1 and 10 then raise exception 'Producto invalido'; end if;
  for v in select value from jsonb_array_elements(p->'prices') loop
   if v->>0 is null or length(v->>0) not between 1 and 80 or v->>1 is null or regexp_replace(v->>1,'[^0-9]','','g')::bigint not between 1 and 10000000 then raise exception 'Precio invalido'; end if;
  end loop;
  if coalesce((p->>'burgerChoiceCount')::integer,0) not between 0 and 10 or coalesce((p->>'drinkChoiceCount')::integer,0) not between 0 and 10 then raise exception 'Cantidad de opciones invalida'; end if;
  select coalesce(max(position),-1)+1 into pos from public.shet_catalog_products;
  insert into public.shet_catalog_products(id,payload,position) values(p->>'id',p,pos) on conflict(id) do update set payload=excluded.payload,active=true,updated_at=now();
  for v in select value from jsonb_array_elements(p->'prices') loop
   insert into public.menu_prices(product_id,variant,price) values(p->>'id',v->>0,regexp_replace(v->>1,'[^0-9]','','g')::integer) on conflict(product_id,variant) do update set price=excluded.price;
  end loop;
 end loop;
end $$;
create function public.shet_archive_product(p_id text,p_token uuid default null) returns void language plpgsql security definer set search_path='' as $$
begin
 perform shet_private.authorize(p_token);
 update public.shet_catalog_products set active=false,updated_at=now() where id=p_id;
 insert into public.product_availability(product_id,available) values(p_id,false) on conflict(product_id) do update set available=false,updated_at=now();
end $$;
create function public.shet_save_content(p_content jsonb,p_token uuid default null) returns void language plpgsql security definer set search_path='' as $$
begin
 perform shet_private.authorize(p_token);
 if jsonb_typeof(p_content) is distinct from 'object' or octet_length(p_content::text)>50000 then raise exception 'Contenido invalido'; end if;
 insert into public.shet_site_content(id,payload) values('main',p_content) on conflict(id) do update set payload=excluded.payload,updated_at=now();
end $$;

create function shet_private.product(p_id text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p jsonb; available boolean;
begin
 select payload into p from public.shet_catalog_products where id=p_id and active for share;
 if p is null then raise exception 'Producto no disponible: %',p_id; end if;
 select a.available into available from public.product_availability a where product_id=p_id for share;
 if available is false then raise exception 'Producto agotado: %',p->>'name'; end if;
 return p;
end $$;
create function shet_private.price(p jsonb,p_variant text) returns integer language plpgsql security invoker set search_path='' as $$
declare amount integer;
begin
 select regexp_replace(value->>1,'[^0-9]','','g')::integer into amount from jsonb_array_elements(p->'prices') where value->>0=p_variant;
 if amount is null then raise exception 'Opcion de producto invalida'; end if;
 return amount;
end $$;
create function shet_private.addons(p_items jsonb,p_scope text,p_burger jsonb default '{}') returns jsonb language plpgsql security invoker set search_path='' as $$
declare item jsonb; p jsonb; qty integer; amount integer; result jsonb:='[]'; total integer:=0; seen text[]:='{}';
begin
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)>100 then raise exception 'Extras invalidos'; end if;
 for item in select value from jsonb_array_elements(p_items) loop
  p:=shet_private.product(item->>'product_id');
  if coalesce(item->>'quantity','') !~ '^[0-9]+$' then raise exception 'Cantidad de extra invalida'; end if;
  qty:=(item->>'quantity')::integer;
  if qty not between 1 and 100 or item->>'product_id'=any(seen) or p->>'category' not in ('extras','salsas') then raise exception 'Extra o cantidad invalida'; end if;
  seen:=array_append(seen,item->>'product_id');
  if jsonb_array_length(coalesce(p_burger->'allowedExtraIds','[]'))>0 and not(p_burger->'allowedExtraIds' ? (p->>'id')) then raise exception 'Extra no disponible para esta hamburguesa'; end if;
  if p_scope='fries' and not coalesce((p->>'friesExtra')::boolean,p->>'id' in ('extra-4','extra-6')) then raise exception 'Extra no disponible para papas'; end if;
  if p_scope='burger' and not coalesce((p->>'burgerExtra')::boolean,true) then raise exception 'Extra no disponible para hamburguesas'; end if;
  amount:=shet_private.price(p,p#>>'{prices,0,0}'); total:=total+amount*qty;
  result:=result||jsonb_build_array(jsonb_build_object('product_id',p->>'id','name',p->>'name','quantity',qty,'unit_price',amount,'scope',p_scope));
 end loop;
 return jsonb_build_object('items',result,'total',total);
end $$;
create function shet_private.lines(p_extras jsonb,p_fries jsonb,p_prefix text default '') returns jsonb language sql security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('label',p_prefix||label,'value',(item->>'quantity')||' × '||(item->>'name'))),'[]') from (
  select value item,'Extra hamburguesa' label from jsonb_array_elements(p_extras)
  union all select value,'Mejora tus papas' from jsonb_array_elements(p_fries)
 ) entries;
$$;

-- Validates and normalizes only new SHET requests; legacy order APIs remain unchanged.
create function shet_private.normalize_items(p_items jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
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

-- Preserve the legacy endpoint while correcting its escaped phone regex in the private copy.
do $$ declare definition text; begin
 select pg_get_functiondef(oid) into strict definition from pg_proc where pronamespace='public'::regnamespace and proname='place_order';
 definition:=replace(definition,'FUNCTION public.place_order(','FUNCTION shet_private.base_order(');
 definition:=regexp_replace(definition,'if p_customer_phone !~ [^;]+;', 'if p_customer_phone is null or p_customer_phone !~ ''^[+]569[0-9]{8}$'' then raise exception ''Telefono invalido'';');
 execute definition;
end $$;
create function public.shet_place_order(p_order_number text,p_customer_name text,p_customer_phone text,p_fulfillment text,p_address text,p_items jsonb,p_receipt_name text,p_receipt_path text) returns setof public.orders language plpgsql security definer set search_path='' as $$
declare items jsonb; result public.orders; delta bigint;
begin
 if not coalesce((select is_open from public.store_settings where id=1 for share),false) then raise exception 'Los pedidos estan cerrados'; end if;
 items:=shet_private.normalize_items(p_items);
 select sum(((i->>'price')::integer-mp.price)*(i->>'quantity')::integer) into delta from jsonb_array_elements(items) i join public.menu_prices mp on mp.product_id=i#>>'{product,id}' and mp.variant=i->>'variant';
 select * into strict result from shet_private.base_order(p_order_number,p_customer_name,p_customer_phone,p_fulfillment,p_address,items,p_receipt_name,p_receipt_path);
 update public.orders set total=total+coalesce(delta,0)::integer where id=result.id returning * into result;
 return next result;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('menu-images','menu-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy shet_menu_images_read on storage.objects for select to anon,authenticated using(bucket_id='menu-images');
create policy shet_menu_images_insert on storage.objects for insert to authenticated with check(bucket_id='menu-images' and (select public.is_admin()));
create policy shet_menu_images_update on storage.objects for update to authenticated using(bucket_id='menu-images' and (select public.is_admin())) with check(bucket_id='menu-images' and (select public.is_admin()));

-- Reuse the existing coupon rules, using canonical prices and this validated endpoint.
do $$ declare definition text; begin
 select pg_get_functiondef(oid) into strict definition from pg_proc where pronamespace='public'::regnamespace and proname='place_order_with_coupon';
 definition:=replace(definition,'FUNCTION public.place_order_with_coupon(','FUNCTION public.shet_place_order_with_coupon(');
 definition:=replace(definition,'from public.place_order(','from public.shet_place_order(');
 definition:=replace(definition,'array_agg(price.price order by price.price)','array_agg((item->>''price'')::integer order by (item->>''price'')::integer)');
 definition:=replace(definition,'jsonb_array_elements(p_items) item','jsonb_array_elements(v_order.items) item');
 execute definition;
end $$;
revoke all on all functions in schema shet_private from public,anon,authenticated;
revoke all on function public.shet_save_catalog(jsonb,uuid),public.shet_archive_product(text,uuid),public.shet_save_content(jsonb,uuid),public.shet_place_order(text,text,text,text,text,jsonb,text,text),public.shet_place_order_with_coupon(text,text,text,text,text,jsonb,text,text,text) from public;
grant execute on function public.shet_save_catalog(jsonb,uuid),public.shet_archive_product(text,uuid),public.shet_save_content(jsonb,uuid),public.shet_place_order(text,text,text,text,text,jsonb,text,text),public.shet_place_order_with_coupon(text,text,text,text,text,jsonb,text,text,text) to anon,authenticated;
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='shet_catalog_products') then alter publication supabase_realtime add table public.shet_catalog_products; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='shet_site_content') then alter publication supabase_realtime add table public.shet_site_content; end if;
end $$;

-- Metadata from the existing catalog; existing server prices take precedence.
with source as (select value p, ordinality::integer position from jsonb_array_elements('[{"id":"bbq-beast","category":"burgers","name":"BBQ Beast","image":"/assets/menu/page-2-3.webp","description":"Burger 125g, cheddar, tocino, cebolla caramelizada en salsa BBQ, aros de cebolla, pepinillos y mayonesa en pan de papa.","prices":[["Simple","$9.490"],["Doble","$11.990"]],"featured":true},{"id":"onion-shet","category":"burgers","name":"Onion SHET","image":"/assets/menu/page-2-4.webp","description":"Burger 125g, doble cheddar, tocino, cebolla crispy y salsa mayo sriracha —ligeramente picante— en pan de papa.","prices":[["Simple","$9.290"],["Doble","$11.290"]]},{"id":"bacon-trip","category":"burgers","name":"Bacon Trip","image":"/assets/menu/page-2-2.webp","description":"Burger 125g, doble cheddar, mermelada de tocino —la joya de la casa—, pepinillos y salsa Emmy en pan de papa.","prices":[["Simple","$9.590"],["Doble","$11.990"]],"featured":true},{"id":"cowboy-smoke","category":"burgers","name":"Cowboy Smoke","image":"/assets/menu/page-2-1.webp","description":"Burger 125g, doble cheddar, pulled pork artesanal con cebolla crispy, pepinillos y salsa BBQ en pan de papa.","prices":[["Simple","$9.990"],["Doble","$12.990"]]},{"id":"blue-hit","category":"burgers","name":"Blue Hit","image":"/assets/menu/page-3-1.webp","description":"Burger 125g, queso chanco, champiñones salteados, rúcula y salsa de queso azul en pan de papa.","prices":[["Simple","$9.100"],["Doble","$11.800"]]},{"id":"clasica-bacon","category":"burgers","name":"Clásica Bacon","image":"/assets/menu/page-3-2.webp","description":"Burger 125g, cheddar, tocino, lechuga, tomate, cebolla, pepinillos y salsa SHET en pan de papa.","prices":[["Simple","$8.990"],["Doble","$10.990"]]},{"id":"cheeseburger-bacon","category":"burgers","name":"Cheeseburger Bacon","image":"/assets/menu/page-3-3.webp","description":"Burger 125g, triple cheddar, tocino, pepinillos, ketchup y mostaza en pan de papa.","prices":[["Simple","$7.990"],["Doble","$9.990"]]},{"id":"triple-shet","category":"promos","name":"Triple SHET","image":"/assets/menu/page-1-3.webp","description":"3 burgers simples a elección, papas fritas, 3 bebidas a elección y 6 empanadas de queso.","prices":[["Promo","$28.990"]],"burgerChoiceCount":3,"drinkChoiceCount":3},{"id":"vicio","category":"promos","name":"Vicio","image":"/assets/menu/page-1-2.webp","description":"Burger a elección, papas fritas y bebida a elección.","prices":[["Promo","$9.990"]],"burgerChoiceCount":1,"drinkChoiceCount":1},{"id":"tentacion","category":"promos","name":"Tentación","image":"/assets/menu/page-1-1.webp","description":"2 burgers simples a elección, papas fritas y 2 bebidas a elección.","prices":[["Combo","$18.990"]],"burgerChoiceCount":2,"drinkChoiceCount":2},{"id":"empanadas","category":"fritos","name":"Empanadas","description":"8 empanadas de queso fritas.","prices":[["8 unidades","$4.990"]]},{"id":"aros","category":"fritos","name":"Aros de cebolla","description":"Aros de cebolla crujientes.","prices":[["Porción","$2.990"]]},{"id":"papas-pork","category":"fritos","name":"Papas Pork","description":"Papas fritas naturales con pulled pork, salsa BBQ, salsa cheddar y un toque de cebollín.","prices":[["Bowl","$7.990"]]},{"id":"bebida-0","category":"bebidas","name":"Coca Cola","description":"Bebida en lata 350 ml.","prices":[["Lata","$1.500"]]},{"id":"bebida-1","category":"bebidas","name":"Coca Cola Zero","description":"Bebida en lata 350 ml.","prices":[["Lata","$1.500"]]},{"id":"bebida-2","category":"bebidas","name":"Sprite","description":"Bebida en lata 350 ml.","prices":[["Lata","$1.500"]]},{"id":"bebida-3","category":"bebidas","name":"Sprite Zero","description":"Bebida en lata 350 ml.","prices":[["Lata","$1.500"]]},{"id":"bebida-4","category":"bebidas","name":"Fanta","description":"Bebida en lata 350 ml.","prices":[["Lata","$1.500"]]},{"id":"bebida-5","category":"bebidas","name":"Kem","description":"Bebida en lata 350 ml.","prices":[["Lata","$1.500"]]},{"id":"jugo-jumex","category":"bebidas","name":"Jugo Jumex","description":"Jugo Jumex en lata. Elige tu sabor favorito al agregarlo al pedido.","prices":[["Lata","$1.500"]],"optionGroup":{"label":"Sabor","prompt":"Elige tu sabor","values":["Durazno","Manzana","Piña","Mango"]},"requiredCatalogEntry":true},{"id":"extra-0","category":"extras","name":"Extra carne y cheddar","description":"Agregado para personalizar tu pedido.","prices":[["Extra","$2.500"]]},{"id":"extra-1","category":"extras","name":"Salsa queso azul","description":"Agregado para personalizar tu pedido.","prices":[["Extra","$2.000"]]},{"id":"extra-2","category":"extras","name":"Mermelada de tocino","description":"Agregado para personalizar tu pedido.","prices":[["Extra","$2.000"]]},{"id":"extra-3","category":"extras","name":"Pulled pork","description":"Agregado para personalizar tu pedido.","prices":[["Extra","$1.500"]]},{"id":"extra-4","category":"extras","name":"Salsa cheddar","description":"Agregado para personalizar tu pedido.","prices":[["Extra","$1.000"]]},{"id":"extra-5","category":"extras","name":"Cebolla crispy","description":"Agregado para personalizar tu pedido.","prices":[["Extra","$800"]]},{"id":"extra-6","category":"extras","name":"Tocino","description":"Agregado para personalizar tu pedido.","prices":[["Extra","$800"]]},{"id":"extra-7","category":"extras","name":"Champiñones","description":"Agregado para personalizar tu pedido.","prices":[["Extra","$800"]]},{"id":"extra-8","category":"extras","name":"Salsa Emmy","description":"Agregado para personalizar tu pedido.","prices":[["Extra","$800"]]},{"id":"extra-9","category":"extras","name":"Jalapeño","description":"Agregado para personalizar tu pedido.","prices":[["Extra","$800"]]}]'::jsonb) with ordinality), canonical as (select p,position,(select jsonb_agg(jsonb_build_array(v->>0,coalesce('$'||replace(to_char(mp.price,'FM999G999G999'),',','.'),v->>1)) order by ord) from jsonb_array_elements(p->'prices') with ordinality as variant(v,ord) left join public.menu_prices mp on mp.product_id=p->>'id' and mp.variant=v->>0) prices from source) insert into public.shet_catalog_products(id,payload,position) select p->>'id',jsonb_set(p,'{prices}',prices),position from canonical on conflict(id) do nothing;
insert into public.menu_prices(product_id,variant,price) select id,v->>0,regexp_replace(v->>1,'[^0-9]','','g')::integer from public.shet_catalog_products cross join lateral jsonb_array_elements(payload->'prices') v on conflict(product_id,variant) do nothing;
insert into public.shet_site_content(id,payload) values('main','{"heroEyebrow":"FAT SMASH BURGERS · NONGUÉN","heroTitle":"¿HAMBRE?","heroAccent":"Pide SHET.","heroDetail":"Plancha fuerte. Pan de papa. Hechas al momento.","heroPrimaryLabel":"PEDIR","heroSecondaryLabel":"CONOCE EL MOOD","menuEyebrow":"PASA SMASH","menuTitle":"MENÚ","menuAccent":"BURGERS","menuNote":"Todas las hamburguesas incluyen papas fritas."}'::jsonb) on conflict(id) do nothing;
