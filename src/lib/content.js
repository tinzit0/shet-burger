import { supabase } from './supabase';

const missingTable = error => /relation .* does not exist|schema cache|could not find the table/i.test(error?.message || '');

export async function loadManagedContent(defaultProducts, defaultContent) {
  if (!supabase) return { products: defaultProducts, content: defaultContent, remote: false };
  const [catalogResult, contentResult] = await Promise.all([
    supabase.from('catalog_products').select('payload,position').eq('active', true).order('position'),
    supabase.from('site_content').select('payload').eq('id', 'main').maybeSingle(),
  ]);
  const catalogUnavailable = catalogResult.error && missingTable(catalogResult.error);
  const contentUnavailable = contentResult.error && missingTable(contentResult.error);
  return {
    products: !catalogResult.error && catalogResult.data?.length ? catalogResult.data.map(item => item.payload) : defaultProducts,
    content: !contentResult.error && contentResult.data?.payload ? { ...defaultContent, ...contentResult.data.payload } : defaultContent,
    remote: !catalogUnavailable && !contentUnavailable,
  };
}

export async function saveManagedCatalog(products) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  const updatedAt = new Date().toISOString();
  const rows = products.map((product, position) => ({ id: product.id, payload: product, position, active: true, updated_at: updatedAt }));
  return supabase.from('catalog_products').upsert(rows);
}

export async function removeManagedProduct(id) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase.from('catalog_products').delete().eq('id', id);
}

export async function saveManagedContent(content) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase.from('site_content').upsert({ id: 'main', payload: content, updated_at: new Date().toISOString() });
}

export async function uploadManagedImage(file, productId) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  const safeProductId = String(productId || 'producto').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : 'webp';
  const uniqueId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${safeProductId}/${uniqueId}.${extension}`;
  const upload = await supabase.storage.from('menu-images').upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });
  if (upload.error) return { error: upload.error };
  const { data } = supabase.storage.from('menu-images').getPublicUrl(upload.data.path);
  return { url: data.publicUrl, path: upload.data.path, error: null };
}
