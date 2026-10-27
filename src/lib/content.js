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
