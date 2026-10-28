import { supabase } from './supabase';

export async function loadStoreState(productIds = []) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  const [settings, availability] = await Promise.all([
    supabase.from('store_settings').select('is_open').eq('id', 1).single(),
    supabase.from('product_availability').select('product_id,available'),
  ]);
  const stock = Object.fromEntries(productIds.map(id => [id, true]));
  for (const item of availability.data || []) stock[item.product_id] = item.available;
  return { storeOpen: settings.data?.is_open ?? true, stock, error: settings.error || availability.error };
}

export const updateStoreOpen = (isOpen, demoToken = null) => supabase
  ? demoToken
    ? supabase.rpc('demo_update_store_open', { p_token: demoToken, p_is_open: isOpen })
    : supabase.from('store_settings').update({ is_open: isOpen, updated_at: new Date().toISOString() }).eq('id', 1)
  : Promise.resolve({ error: new Error('Supabase no configurado') });

export const updateProductAvailability = (productId, available, demoToken = null) => supabase
  ? demoToken
    ? supabase.rpc('demo_update_product_availability', { p_token: demoToken, p_product_id: productId, p_available: available })
    : supabase.from('product_availability').upsert({ product_id: productId, available, updated_at: new Date().toISOString() })
  : Promise.resolve({ error: new Error('Supabase no configurado') });

export function subscribeToStore(onChange, onStatus) {
  if (!supabase) return () => {};
  const channelName = `shared-store-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const channel = supabase.channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, payload => onChange({ ...payload, table: 'store_settings' }))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'product_availability' }, payload => onChange({ ...payload, table: 'product_availability' }))
    .subscribe(status => onStatus?.(status));
  return () => { void supabase.removeChannel(channel); };
}
