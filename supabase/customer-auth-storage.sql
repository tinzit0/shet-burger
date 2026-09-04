-- Ejecutar después de customer-auth.sql, en una consulta separada.
drop policy if exists "authenticated can upload receipts" on storage.objects;

create policy "authenticated can upload receipts"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'order-receipts');
