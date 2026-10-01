import { supabase } from './supabase';
import { validateReview } from './reviewValidation';

// La migración de reseñas ya está instalada. Solo desactivar con false explícito.
export const reviewsConfigured = Boolean(supabase && import.meta.env.VITE_REVIEWS_ENABLED?.trim().toLowerCase() !== 'false');
export async function loadReviews(page = 0) {
  if (!reviewsConfigured) throw new Error('Las opiniones estarán disponibles pronto.');
  const [list, summary] = await Promise.all([
    supabase.from('reviews').select('id,name,rating,comment,created_at').eq('approved', true).order('created_at', { ascending: false }).order('id').range(page * 6, page * 6 + 5),
    supabase.rpc('review_summary'),
  ]);
  if (list.error || summary.error) throw new Error('No pudimos cargar las opiniones. Inténtalo nuevamente.');
  return { reviews: list.data, summary: summary.data[0] };
}
export async function submitReview(review, { website, startedAt }) {
  const error = validateReview(review);
  if (error) throw new Error(error);
  if (!reviewsConfigured) throw new Error('Las opiniones estarán disponibles pronto.');
  if (website || Date.now() - startedAt < 3000) throw new Error('Espera unos segundos y vuelve a intentarlo.');
  let token;
  try {
    token = localStorage.getItem('shet-review-token');
    if (!token) { token = crypto.randomUUID(); localStorage.setItem('shet-review-token', token); }
  } catch { throw new Error('Habilita el almacenamiento del navegador para enviar tu opinión.'); }
  const { error: requestError } = await supabase.rpc('submit_review', {
    p_name: review.name.trim(), p_rating: review.rating, p_comment: review.comment.trim(), p_token: token, p_website: website,
  });
  if (requestError) throw new Error(requestError.message.includes('REVIEW_COOLDOWN') ? 'Ya enviaste una opinión. Espera 5 minutos antes de enviar otra.' : 'No pudimos enviar tu opinión. Inténtalo nuevamente.');
}
