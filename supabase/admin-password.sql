-- Cambio de contraseña del panel de administración (botón "CONTRASEÑA" del admin).
-- Ejecutar una vez en Supabase > SQL Editor. Es seguro volver a ejecutarlo.
begin;

create or replace function public.demo_admin_change_password(p_token uuid, p_current text, p_new text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if p_token is null or not exists (select 1 from public.demo_admin_sessions where token = p_token and expires_at > now()) then
    raise exception 'Sesión administrativa vencida. Vuelve a entrar al panel.';
  end if;
  if not exists (select 1 from public.demo_admin_credentials where id = 1 and password_hash = crypt(coalesce(p_current, ''), password_hash)) then
    raise exception 'La contraseña actual no es correcta.';
  end if;
  if p_new is null or length(p_new) < 8 or length(p_new) > 72 then
    raise exception 'La nueva contraseña debe tener entre 8 y 72 caracteres.';
  end if;
  if p_new = p_current then
    raise exception 'La nueva contraseña debe ser distinta de la actual.';
  end if;
  update public.demo_admin_credentials set password_hash = crypt(p_new, gen_salt('bf')) where id = 1;
  -- Cierra la sesión en los demás dispositivos; este sigue conectado.
  delete from public.demo_admin_sessions where token <> p_token;
  return true;
end;
$$;

revoke all on function public.demo_admin_change_password(uuid, text, text) from public;
grant execute on function public.demo_admin_change_password(uuid, text, text) to anon, authenticated;

commit;
