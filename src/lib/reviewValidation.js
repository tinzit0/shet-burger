export const REVIEW_LIMITS = { name: 80, comment: 1000 };
export function validateReview({ name, rating, comment }) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return 'Selecciona entre 1 y 5 estrellas.';
  if (typeof name !== 'string' || !name.trim() || name.trim().length > REVIEW_LIMITS.name) return 'Escribe un nombre de hasta 80 caracteres.';
  if (typeof comment !== 'string' || !comment.trim() || comment.trim().length > REVIEW_LIMITS.comment) return 'Escribe un comentario de hasta 1000 caracteres.';
  return null;
}
