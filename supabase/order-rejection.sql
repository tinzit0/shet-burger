-- Motivo del rechazo de un pedido. El panel lo guarda al rechazar el pago y el
-- cliente lo ve en el seguimiento y en "Mis pedidos". Ejecutar una vez en Supabase.
alter table public.orders add column if not exists rejection_reason text;
alter table public.orders drop constraint if exists orders_rejection_reason_length;
alter table public.orders add constraint orders_rejection_reason_length
  check (rejection_reason is null or char_length(rejection_reason) <= 300);
