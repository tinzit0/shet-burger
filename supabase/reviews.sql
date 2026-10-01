-- Reseñas independientes de pedidos. Ejecutar en Supabase SQL Editor.
begin;
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(btrim(comment)) between 1 and 1000),
  created_at timestamptz not null default now(),
  approved boolean not null default false
);
-- CREATE TABLE IF NOT EXISTS no modifica una tabla que ya existe.
-- Compatibilidad con instalaciones anteriores sin moderación: las reseñas
-- existentes quedan pendientes; no se eliminan ni se publican automáticamente.
alter table public.reviews
  add column if not exists approved boolean not null default false;

create index if not exists reviews_public_date on public.reviews (created_at desc, id) where approved = true;
alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;
drop policy if exists "read approved reviews" on public.reviews;
create policy "read approved reviews" on public.reviews for select to anon, authenticated using (approved = true);
-- Una política SELECT permisiva antigua no debe exponer las pendientes.
drop policy if exists "require approved reviews" on public.reviews;
create policy "require approved reviews" on public.reviews as restrictive
  for select to anon, authenticated using (approved = true);

-- Los clientes nunca insertan directamente ni pueden elegir approved.
-- Tabla privada de cooldown: no exponer tokens mediante la API.
create schema if not exists shet_private;
revoke all on schema shet_private from public, anon, authenticated;
create table if not exists shet_private.review_attempts (
  token uuid primary key,
  submitted_at timestamptz not null default now()
);
revoke all on shet_private.review_attempts from public, anon, authenticated;
alter table shet_private.review_attempts enable row level security;

create or replace function public.submit_review(p_name text, p_rating integer, p_comment text, p_token uuid, p_website text default '')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_token is null or p_name is null or p_comment is null or p_rating is null
     or char_length(btrim(p_name)) not between 1 and 80
     or char_length(btrim(p_comment)) not between 1 and 1000
     or p_rating not between 1 and 5 or coalesce(p_website, '') <> '' then
    raise exception 'INVALID_REVIEW';
  end if;
  -- Serializa envíos del mismo token para impedir carreras de requests.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_token::text, 0));
  if exists (select 1 from shet_private.review_attempts where token = p_token and submitted_at > now() - interval '5 minutes') then
    raise exception 'REVIEW_COOLDOWN';
  end if;
  insert into shet_private.review_attempts(token, submitted_at) values(p_token, now())
    on conflict(token) do update set submitted_at = excluded.submitted_at;
  insert into public.reviews(name, rating, comment, approved)
    values(btrim(p_name), p_rating, btrim(p_comment), false);
end;
$$;
revoke all on function public.submit_review(text, integer, text, uuid, text) from public;
grant execute on function public.submit_review(text, integer, text, uuid, text) to anon, authenticated;

-- Agregado sobre TODAS las aprobadas, independiente de las páginas visibles.
create or replace function public.review_summary()
returns table(total bigint, average numeric)
language sql stable security invoker set search_path = '' as $$
  select count(*), round(avg(rating), 1) from public.reviews where approved = true;
$$;
revoke all on function public.review_summary() from public;
grant execute on function public.review_summary() to anon, authenticated;
commit;

-- Moderación: Table Editor > reviews > approved = true, usando el Dashboard.
-- No agregar políticas públicas de UPDATE/INSERT/DELETE.
-- Mantenimiento opcional desde SQL Editor:
-- delete from shet_private.review_attempts where submitted_at < now() - interval '7 days';
