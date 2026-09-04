import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://kxldsjodgfonrrlwjbws.supabase.co';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_J5s_2YqtASIYSqu2k00SGA_copdr39x';

export const supabase = url && key ? createClient(url, key) : null;
export const adminSupabase = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
export const supabaseConfigured = Boolean(supabase);

export async function signInWithGoogle() {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function signOutCustomer() {
  if (!supabase) return;
  return supabase.auth.signOut();
}

export async function signInWithEmail(email, password) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password, name) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: window.location.origin,
    },
  });
}
