-- Run as a single transaction. Every write, including orders, is rolled back.
begin;
do $$
declare items jsonb; result public.orders; p jsonb; promo jsonb; rejected boolean; test_token uuid:=gen_random_uuid(); test_coupon text:='QA-'||upper(left(gen_random_uuid()::text,8)); original_count bigint;
begin
 select count(*) into original_count from public.orders;
 select payload into p from public.shet_catalog_products where id='bbq-beast';
 items:=jsonb_build_array(jsonb_build_object('product',p,'quantity',1,'variant','Doble','price',19390,'customization',jsonb_build_object('extras',jsonb_build_array(jsonb_build_object('product_id','extra-0','quantity',2),jsonb_build_object('product_id','extra-6','quantity',3)))));
 select * into strict result from public.shet_place_order('QA-ROLLBACK-'||gen_random_uuid(),'Verificacion temporal','+56912345678','pickup','',items,'verificacion-sin-archivo',null);
 if result.total<>19390 or result.items#>>'{0,customization,extras,0,quantity}'<>'2' then raise exception 'FAIL quadruple/total'; end if;
 if not exists(select 1 from public.orders o where o.id=result.id and o.items=result.items) then raise exception 'FAIL persistence'; end if;
 -- Server rejects forged prices and unavailable nested extras.
 rejected:=false;
 begin perform shet_private.normalize_items(jsonb_set(items,'{0,price}','1')); exception when others then rejected:=true; end;
 if not rejected then raise exception 'FAIL price tampering'; end if;
 insert into public.product_availability(product_id,available) values('extra-6',false) on conflict(product_id) do update set available=false;
 rejected:=false;
 begin perform shet_private.normalize_items(items); exception when others then rejected:=true; end;
 if not rejected then raise exception 'FAIL extra stock'; end if;
 update public.product_availability set available=true where product_id='extra-6';
 perform shet_private.normalize_items(items);
 insert into public.coupons(code,discount_type,value,active,published) values(test_coupon,'percent',10,true,false);
 select * into strict result from public.shet_place_order_with_coupon('QA-ROLLBACK-'||gen_random_uuid(),'Verificacion temporal','+56912345678','pickup','',items,'verificacion',null,test_coupon);
 if result.total<>17451 or result.discount_amount<>1939 then raise exception 'FAIL coupon with extras'; end if;
 -- Every promo burger retains its own variant, extras and fries.
 select payload into promo from public.shet_catalog_products where id='tentacion';
 items:=jsonb_build_array(jsonb_build_object('product',promo,'quantity',1,'variant','Combo','price',30890,'customization',jsonb_build_object('burgers',jsonb_build_array(jsonb_build_object('product_id','bbq-beast','variant','Doble','extras',jsonb_build_array(jsonb_build_object('product_id','extra-0','quantity',2)),'friesExtras',jsonb_build_array(jsonb_build_object('product_id','extra-4','quantity',2))),jsonb_build_object('product_id','onion-shet','variant','Simple','extras',jsonb_build_array(jsonb_build_object('product_id','extra-6','quantity',2)),'friesExtras',jsonb_build_array(jsonb_build_object('product_id','extra-6','quantity',1)))),'drinkChoiceIds',jsonb_build_array('bebida-0','bebida-1'))));
 select * into strict result from public.shet_place_order('QA-ROLLBACK-'||gen_random_uuid(),'Verificacion temporal','+56912345678','pickup','',items,'verificacion-sin-archivo',null);
 if result.total<>30890 or result.items#>>'{0,customization,burgers,1,extras,0,quantity}'<>'2' or jsonb_array_length(result.items#>'{0,selections}')<>8 then raise exception 'FAIL promotion'; end if;
 update public.shet_catalog_products set payload=payload||jsonb_build_object('promotionSlots',jsonb_build_array(jsonb_build_object('allowedBurgerIds',jsonb_build_array('bbq-beast'),'allowedExtraIds',jsonb_build_array('extra-0','extra-4')),jsonb_build_object('allowedBurgerIds',jsonb_build_array('onion-shet'),'allowedExtraIds',jsonb_build_array('extra-6')))) where id='tentacion';
 perform shet_private.normalize_items(items);
 rejected:=false;
 begin perform shet_private.normalize_items(jsonb_set(items,'{0,customization,burgers,1,product_id}','"bbq-beast"')); exception when others then rejected:=sqlerrm like '%posicion%'; end;
 if not rejected then raise exception 'FAIL slot-specific burger rule'; end if;
 rejected:=false;
 begin perform shet_private.normalize_items(jsonb_set(items,'{0,customization,burgers,1,extras,0,product_id}','"extra-0"')); exception when others then rejected:=sqlerrm like '%Adicional no permitido%'; end;
 if not rejected then raise exception 'FAIL slot-specific ingredient rule'; end if;
 update public.store_settings set is_open=false where id=1;
 rejected:=false;
 begin perform public.shet_place_order('QA-ROLLBACK-'||gen_random_uuid(),'Verificacion temporal','+56912345678','pickup','',items,'verificacion',null); exception when others then rejected:=true; end;
 if not rejected then raise exception 'FAIL closed store'; end if;
 update public.store_settings set is_open=true where id=1;
 rejected:=false;
 begin perform public.shet_save_catalog(jsonb_build_array(p),null); exception when others then rejected:=true; end;
 if not rejected then raise exception 'FAIL admin authorization'; end if;
 -- Exercise the existing demo-admin authorization. The temporary session rolls back too.
 insert into public.demo_admin_sessions(token,expires_at) values(test_token,now()+interval '5 minutes');
 perform public.shet_save_catalog(jsonb_build_array(jsonb_set(p,'{prices,0,1}','"$9.491"')),test_token);
 if (select price from public.menu_prices where product_id='bbq-beast' and variant='Simple')<>9491 then raise exception 'FAIL catalog price sync'; end if;
 perform public.shet_save_content(jsonb_build_object('closedMessage','Mensaje temporal de verificacion'),test_token);
 if (select payload->>'closedMessage' from public.shet_site_content where id='main')<>'Mensaje temporal de verificacion' then raise exception 'FAIL closure message'; end if;
end $$;
rollback;
