import { supabase } from './supabase';
import { getOrderStage } from './orderStatus';

export const normalizeOrder = order => ({
  ...order,
  id: order.id || order.order_number,
  mode: order.fulfillment || order.mode,
  stage: getOrderStage(order),
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
    const ownerFolder = order.user_id || 'guest';
    receiptPath = `${ownerFolder}/${order.order_number}/${Date.now()}-${receiptFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const upload = await supabase.storage.from('order-receipts').upload(receiptPath, receiptFile, { upsert: false });
    if (upload.error) return { data: null, error: upload.error };
  }
  const payload = { ...databaseOrder, receipt_path: receiptPath };
  const { data, error } = await supabase.rpc('place_order', {
    p_order_number: databaseOrder.order_number,
    p_customer_name: databaseOrder.customer_name,
    p_customer_phone: databaseOrder.customer_phone,
    p_fulfillment: databaseOrder.fulfillment,
    p_address: databaseOrder.address || '',
    p_items: databaseOrder.items,
    p_receipt_name: databaseOrder.receipt_name,
    p_receipt_path: receiptPath,
  }).single();
  if (error && /place_order|function.*exist/i.test(error.message || '')) {
    if (!order.user_id) {
      const { error: insertError } = await supabase.from('orders').insert(payload);
      if (insertError) return { data: null, error: insertError };
      const remote = await supabase.from('orders').select('*').eq('order_number', order.order_number).single();
      return { data: remote.data || { ...payload, id: order.order_number }, error: remote.error && remote.error.code !== 'PGRST116' ? remote.error : null };
    }
    const fallback = await supabase.from('orders').insert(payload).select().single();
    return fallback;
  }
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

export async function loadCustomerOrders(userId) {
  if (!supabase || !userId) return { data: [], error: null };
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return { data: data?.map(normalizeOrder) || [], error };
}

export async function updateStoredOrder(id, status, stage) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase.from('orders').update({ status, stage }).eq('id', id).select().single();
}

export async function deleteStoredOrder(id) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  const key = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(id)) ? 'id' : 'order_number';
  const { data: order, error: readError } = await supabase.from('orders').select('receipt_path').eq(key, id).single();
  if (readError) {
    // Algunos esquemas demo no permiten leer la fila antes de borrarla.
    // Intentamos igualmente eliminar el pedido para no dejarlo visible.
    const deletion = await supabase.from('orders').delete().eq(key, id);
    return deletion.error ? { error: readError } : deletion;
  }
  if (order?.receipt_path) {
    // La eliminación del pedido no debe bloquearse si el rol demo no tiene
    // permiso para borrar archivos del bucket. En producción, el admin sí
    // podrá limpiarlo mediante la política de Storage correspondiente.
    await supabase.storage.from('order-receipts').remove([order.receipt_path]);
  }
  return supabase.from('orders').delete().eq(key, id);
}

export function subscribeToOrders(onChange) {
  if (!supabase) return () => {};
  const channelName = `shared-orders-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}
