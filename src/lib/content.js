import { supabase } from './supabase';

export async function loadManagedContent(defaultProducts, defaultContent) {
  if (!supabase) return { products: defaultProducts, content: defaultContent, remote: false };
  const [catalogResult, contentResult] = await Promise.all([
    supabase.from('shet_catalog_products').select('payload,position').eq('active', true).order('position'),
    supabase.from('shet_site_content').select('payload').eq('id', 'main').maybeSingle(),
  ]);
  return {
    products: !catalogResult.error && catalogResult.data
      ? catalogResult.data.map(item => item.payload)
      : defaultProducts,
    content: !contentResult.error && contentResult.data?.payload ? { ...defaultContent, ...contentResult.data.payload } : defaultContent,
    remote: !catalogResult.error && !contentResult.error,
  };
}

export async function saveManagedCatalog(products, token = null) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase.rpc('shet_save_catalog', { p_products: products, p_token: token });
}

export async function removeManagedProduct(id, token = null) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase.rpc('shet_archive_product', { p_id: id, p_token: token });
}

export async function saveManagedContent(content, token = null) {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  return supabase.rpc('shet_save_content', { p_content: content, p_token: token });
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

export function subscribeToContent(onChange) {
 if (!supabase) return () => {};
 const channel = supabase.channel('shet-content-' + crypto.randomUUID()).on('postgres_changes', {event:'*',schema:'public',table:'shet_catalog_products'},onChange).on('postgres_changes',{event:'*',schema:'public',table:'shet_site_content'},onChange).subscribe();
 return () => { void supabase.removeChannel(channel); };
}
