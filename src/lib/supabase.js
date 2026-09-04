import { createClient } from '@supabase/supabase-js';

// La clave publishable no es secreta y permite que el boceto funcione también
// cuando el hosting todavía no tiene configuradas sus variables VITE_*.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://kxldsjodgfonrrlwjbws.supabase.co';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_J5s_2YqtASIYSqu2k00SGA_copdr39x';

export const supabase = url && key ? createClient(url, key) : null;
export const supabaseConfigured = Boolean(supabase);

export async function signInWithGoogle(redirectPath = '/') {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: new URL(redirectPath, window.location.origin).toString() },
  });
}

export async function isCurrentUserAdmin() {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

export async function signOutCustomer() {
  if (!supabase) return;
  return supabase.auth.signOut();
}
