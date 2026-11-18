import { anonSupabase, supabase } from './supabase';
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
  const { data, error } = await supabase.rpc(databaseOrder.coupon_code ? 'shet_place_order_with_coupon' : 'shet_place_order', {
    ...(databaseOrder.coupon_code ? { p_coupon_code: databaseOrder.coupon_code } : {}),
    p_order_number: databaseOrder.order_number,
    p_customer_name: databaseOrder.customer_name,
    p_customer_phone: databaseOrder.customer_phone,
    p_fulfillment: databaseOrder.fulfillment,
    p_address: databaseOrder.address || '',
    p_items: databaseOrder.items,
    p_receipt_name: databaseOrder.receipt_name,
    p_receipt_path: receiptPath,
  }).single();
  return { data, error };
}

export async function getReceiptUrl(path) {
  if (!supabase || !path) return null;
  const { data } = await supabase.storage.from('order-receipts').createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}

// Panel requests: the password admin always goes through the session-less client (see supabase.js).
const adminDb = demo => (demo && anonSupabase) || supabase;

export async function loadOrders({ demo = false } = {}) {
  const db = adminDb(demo);
  if (!db) return { data: null, error: new Error('Supabase no configurado') };
  const { data, error } = await db.from('orders').select('*').order('created_at', { ascending: false });
  // On error keep what is on screen instead of wiping the list.
  return { data: error ? null : (data || []).map(normalizeOrder), error };
}

export async function loadCustomerOrders(userId) {
  if (!supabase || !userId) return { data: [], error: null };
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return { data: data?.map(normalizeOrder) || [], error };
}

export async function storedOrderExists(order) {
  if (!supabase || !order?.order_number) return true;
  const { data, error } = await supabase.from('orders').select('id').eq('order_number', order.order_number).maybeSingle();
  // Si las políticas no permiten consultar pedidos invitados, no retiramos
  // el pedido local por error de permisos.
  return error ? true : Boolean(data);
}

export async function loadPublicOrder(orderNumber) {
  if (!supabase || !orderNumber) return { data: null, error: null };
  const result = await supabase.from('orders').select('*').eq('order_number', orderNumber).maybeSingle();
  return { data: result.data ? normalizeOrder(result.data) : null, error: result.error };
}

const orderKey = id => /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(id)) ? 'id' : 'order_number';
// RLS turns a forbidden update/delete into "0 rows, no error"; treat that as a failure so the
// panel does not show a change that other devices will never see.
const notSaved = () => new Error('El cambio no se guardó en el servidor. Vuelve a iniciar sesión en el panel.');

// `extra` lleva campos opcionales, como el motivo del rechazo.
export async function updateStoredOrder(id, status, stage, { demo = false, extra = {} } = {}) {
  const db = adminDb(demo);
  if (!db) return { error: new Error('Supabase no configurado') };
  const { data, error } = await db.from('orders').update({ status, stage, ...extra }).eq(orderKey(id), id).select('id');
  if (error && /rejection_reason/.test(error.message || '')) return { data, error: new Error('Falta activar los motivos de rechazo: ejecuta supabase/order-rejection.sql en Supabase.') };
  return { data, error: error || (data?.length ? null : notSaved()) };
}

export async function deleteStoredOrder(id, { demo = false } = {}) {
  const db = adminDb(demo);
  if (!db) return { error: new Error('Supabase no configurado') };
  const key = orderKey(id);
  const { data: order } = await db.from('orders').select('receipt_path').eq(key, id).maybeSingle();
  if (order?.receipt_path) {
    // Best effort: a missing Storage permission must not block deleting the order.
    await db.storage.from('order-receipts').remove([order.receipt_path]);
  }
  const { data, error } = await db.from('orders').delete().eq(key, id).select('id');
  return { data, error: error || (data?.length ? null : notSaved()) };
}

export function subscribeToOrders(onChange, { demo = false } = {}) {
  const db = demo ? adminDb(true) : supabase;
  if (!db) return () => {};
  const channelName = `shared-orders-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const channel = db
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe();
  return () => { void db.removeChannel(channel); };
}
