-- SHET BURGER: cuentas de clientes con Google.
-- Ejecutar después de schema.sql. Es seguro repetirlo.

alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_user_id_created_at_idx on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;
drop policy if exists "authenticated can create own orders" on public.orders;
drop policy if exists "authenticated can read orders" on public.orders;
drop policy if exists "authenticated can read own orders" on public.orders;
create policy "authenticated can create own orders" on public.orders
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "authenticated can read own orders" on public.orders
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "authenticated can upload receipts" on storage.objects;
drop policy if exists "authenticated can upload own receipts" on storage.objects;
create policy "authenticated can upload own receipts" on storage.objects
  for insert to authenticated
  with check (bucket_id='order-receipts' and (storage.foldername(name))[1]=(select auth.uid())::text);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
