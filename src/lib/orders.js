import { supabase } from './supabase';

export const normalizeOrder = order => ({
  ...order,
  id: order.id || order.order_number,
  mode: order.fulfillment || order.mode,
  stage: Number(order.stage ?? ({ 'En preparación': 1, 'Listo para servir': 2, 'Pedido entregado': 3 }[order.status] || 0)),
  customer: order.customer || {
    name: order.customer_name || '',
    phone: order.customer_phone || '',
    address: order.address || '',
  },
});

export async function saveOrder(order, receiptFile) {
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };
  const { receipt_preview, ...databaseOrder } = order;
  let receiptPath = null;
  if (receiptFile) {
    receiptPath = `${order.order_number}/${Date.now()}-${receiptFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const upload = await supabase.storage.from('order-receipts').upload(receiptPath, receiptFile, { upsert: false });
    if (upload.error) return { data: null, error: upload.error };
  }
  const { data, error } = await supabase.from('orders').insert({ ...databaseOrder, receipt_path: receiptPath }).select().single();
  return { data, error };
}

export async function getReceiptUrl(path) {
  if (!supabase || !path) return null;
  const { data } = await supabase.storage.from('order-receipts').createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}

export async function loadOrders() {
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  return { data: data?.map(normalizeOrder) || [], error };
}

export async function updateStoredOrder(id, status, stage) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase.from('orders').update({ status }).eq('id', id);
}

export async function deleteStoredOrder(id) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase.from('orders').delete().eq('id', id);
}

export function subscribeToOrders(onChange) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel('shared-admin-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
