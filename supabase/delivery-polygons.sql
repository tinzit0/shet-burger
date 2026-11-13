-- Zonas de despacho dibujadas como polígonos (pestaña "ZONAS DE DESPACHO" del admin).
-- Ejecutar una vez en Supabase > SQL Editor. Es seguro volver a ejecutarlo.
--
-- 1. Crea la tabla delivery_zones (lectura pública, escritura solo admin) con las 7 zonas iniciales.
-- 2. Crea admin_save_delivery_zones para guardar desde el panel.
-- 3. Cambia el cálculo del despacho en el servidor: la tarifa sale de la tabla según la zona
--    guardada al inicio de la dirección ("Zona · calle · lat,lng"), en vez de una lista fija.
begin;

create table if not exists public.delivery_zones (
  id text primary key check (id ~ '^[a-z0-9-]{1,60}$'),
  label text not null unique check (length(trim(label)) between 1 and 40 and position('·' in label) = 0),
  fee integer not null check (fee between 0 and 100000),
  color text not null default '#EC3478' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  polygon jsonb not null check (jsonb_typeof(polygon) = 'array' and jsonb_array_length(polygon) >= 3),
  active boolean not null default true,
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.delivery_zones enable row level security;
drop policy if exists "delivery zones are public" on public.delivery_zones;
create policy "delivery zones are public" on public.delivery_zones for select to anon, authenticated using (true);
revoke insert, update, delete on public.delivery_zones from anon, authenticated;
grant select on public.delivery_zones to anon, authenticated;

-- Contornos iniciales alrededor de cada sector (ajustarlos en el admin con los límites reales).
insert into public.delivery_zones (id, label, fee, color, polygon, position) values
  ('nonguen', 'Nonguén', 1000, '#EC3478', '[[-36.826,-73.016],[-36.826,-72.998],[-36.835,-72.985],[-36.86,-72.975],[-36.865,-72.99],[-36.85,-73.01],[-36.84,-73.022]]', 0),
  ('collao', 'Collao', 1000, '#8E44AD', '[[-36.806,-73.037],[-36.806,-73.009],[-36.826,-73.009],[-36.826,-73.016],[-36.834,-73.0195],[-36.834,-73.037]]', 1),
  ('valle-noble', 'Valle Noble', 1000, '#2E86DE', '[[-36.808,-73.009],[-36.808,-72.997],[-36.8205,-72.998],[-36.826,-72.998],[-36.826,-73.009]]', 2),
  ('san-guillermo', 'San Guillermo', 1000, '#16A085', '[[-36.802,-72.997],[-36.802,-72.972],[-36.818,-72.965],[-36.822,-72.965],[-36.8205,-72.98],[-36.8205,-72.998],[-36.808,-72.997]]', 3),
  ('palomares', 'Palomares', 1000, '#F39C12', '[[-36.8205,-72.998],[-36.826,-72.998],[-36.835,-72.985],[-36.838,-72.97],[-36.822,-72.965],[-36.8205,-72.98]]', 4),
  ('km-10', 'Km 10', 1000, '#27AE60', '[[-36.812,-72.952],[-36.812,-72.925],[-36.835,-72.925],[-36.835,-72.952]]', 5),
  ('concepcion-centro', 'Concepción Centro', 3000, '#C0392B', '[[-36.8195,-73.063],[-36.8195,-73.037],[-36.834,-73.037],[-36.835,-73.063]]', 6)
on conflict (id) do nothing;

-- Guardado desde el panel: dueño con Google (is_admin) o token del acceso de demostración.
create or replace function public.admin_save_delivery_zones(p_zones jsonb, p_token uuid default null)
returns setof public.delivery_zones language plpgsql security definer set search_path = '' as $$
declare
  v_allowed boolean := coalesce(public.is_admin(), false);
  v_zone jsonb;
  v_ids text[] := '{}';
begin
  if not v_allowed and p_token is not null and to_regclass('public.demo_admin_sessions') is not null then
    execute 'select exists(select 1 from public.demo_admin_sessions where token=$1 and expires_at>now())' into v_allowed using p_token;
  end if;
  if not v_allowed then raise exception 'Sesión administrativa vencida'; end if;
  if jsonb_typeof(p_zones) <> 'array' or jsonb_array_length(p_zones) not between 1 and 40 then raise exception 'Envía entre 1 y 40 zonas'; end if;

  for v_zone in select value from jsonb_array_elements(p_zones) loop
    if exists (select 1 from jsonb_array_elements(v_zone->'polygon') vertex
               where jsonb_typeof(vertex) <> 'array' or jsonb_array_length(vertex) <> 2
                  or abs((vertex->>0)::numeric) > 90 or abs((vertex->>1)::numeric) > 180) then
      raise exception 'Polígono inválido en %', v_zone->>'label';
    end if;
    v_ids := v_ids || (v_zone->>'id');
  end loop;

  delete from public.delivery_zones where id <> all (v_ids);
  -- Labels are unique: free them first so zones can swap names in one save.
  update public.delivery_zones set label = '~' || substr(md5(id), 1, 12) where id = any (v_ids);
  insert into public.delivery_zones (id, label, fee, color, polygon, active, position, updated_at)
  select z->>'id', trim(z->>'label'), (z->>'fee')::integer, coalesce(z->>'color', '#EC3478'), z->'polygon',
         coalesce((z->>'active')::boolean, true), coalesce((z->>'position')::integer, 0), now()
  from jsonb_array_elements(p_zones) z
  on conflict (id) do update set label = excluded.label, fee = excluded.fee, color = excluded.color,
    polygon = excluded.polygon, active = excluded.active, position = excluded.position, updated_at = now();
  return query select * from public.delivery_zones order by position;
end;
$$;
revoke all on function public.admin_save_delivery_zones(jsonb, uuid) from public;
grant execute on function public.admin_save_delivery_zones(jsonb, uuid) to anon, authenticated;

-- Reemplaza las tarifas fijas del servidor por la tabla de zonas, en todas las funciones de pedido
-- (pedido normal, copia privada y pedido con cupón / despacho gratis).
do $$
declare
  fn record;
  definition text;
  zone_fee constant text := '(select z.fee from public.delivery_zones z where z.active and z.label = split_part(trim(p_address), '' · '', 1) limit 1)';
begin
  for fn in
    select p.oid from pg_proc p
    where p.pronamespace in ('public'::regnamespace, coalesce(to_regnamespace('shet_private'), 'public'::regnamespace))
      and p.prokind = 'f'
      and pg_get_functiondef(p.oid) ~ 'case\s+split_part\(trim\(p_address\),\s*'' · '',\s*1\)'
  loop
    definition := pg_get_functiondef(fn.oid);
    -- The first quantifier is non-greedy, so the whole pattern stops at the CASE's own "end".
    definition := regexp_replace(definition, 'case\s+?split_part\(trim\(p_address\),\s*?'' · '',\s*?1\).*?\mend\M', zone_fee, 'g');
    execute definition;
  end loop;
end $$;

commit;
