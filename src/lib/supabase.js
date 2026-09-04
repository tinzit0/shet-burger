import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://kxldsjodgfonrrlwjbws.supabase.co';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_J5s_2YqtASIYSqu2k00SGA_copdr39x';

export const supabase = url && key ? createClient(url, key) : null;
export const supabaseConfigured = Boolean(supabase);
