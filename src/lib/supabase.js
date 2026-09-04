import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
