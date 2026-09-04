import { adminSupabase, supabase } from './supabase';

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
  if (!adminSupabase || !path) return null;
  const { data } = await adminSupabase.storage.from('order-receipts').createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}

export async function loadOrders() {
  if (!adminSupabase) return { data: null, error: new Error('Supabase no configurado') };
  const { data, error } = await adminSupabase.from('orders').select('*').order('created_at', { ascending: false });
  return { data: data?.map(normalizeOrder) || [], error };
}

export async function loadCustomerOrders(userId) {
  if (!supabase || !userId) return { data: [], error: null };
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return { data: data?.map(normalizeOrder) || [], error };
}

export async function updateStoredOrder(id, status, stage) {
  if (!adminSupabase) return { error: new Error('Supabase no configurado') };
  return adminSupabase.from('orders').update({ status, stage }).eq('id', id);
}

export async function deleteStoredOrder(id) {
  if (!adminSupabase) return { error: new Error('Supabase no configurado') };
  return adminSupabase.from('orders').delete().eq('id', id);
}

export function subscribeToOrders(onChange) {
  if (!adminSupabase) return () => {};
  const channel = adminSupabase
    .channel('shared-admin-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe();
  return () => { adminSupabase.removeChannel(channel); };
}
