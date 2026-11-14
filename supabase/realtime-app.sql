-- La app móvil y la web se actualizan en vivo cuando cambian zonas de despacho o cupones.
-- Solo agrega las tablas a los avisos de Supabase Realtime; no modifica datos ni permisos
-- (cada cliente sigue recibiendo únicamente lo que sus políticas RLS le permiten leer).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'delivery_zones') then
    alter publication supabase_realtime add table public.delivery_zones;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'coupons') then
    alter publication supabase_realtime add table public.coupons;
  end if;
end $$;
