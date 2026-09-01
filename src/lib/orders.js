import { supabase } from './supabase';

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
