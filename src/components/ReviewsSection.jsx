import { useEffect, useRef, useState } from 'react';
import { loadReviews, reviewsConfigured, submitReview } from '../lib/reviews';
import { REVIEW_LIMITS } from '../lib/reviewValidation';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]), [summary, setSummary] = useState(null), [page, setPage] = useState(0);
  const [loading, setLoading] = useState(reviewsConfigured), [loadError, setLoadError] = useState('');
  const [rating, setRating] = useState(0), [sending, setSending] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const startedAt = useRef(Date.now()), section = useRef(null), busy = useRef(false);
  async function refresh(nextPage = 0) {
    setLoading(true); setLoadError('');
    try { const result = await loadReviews(nextPage); setReviews(items => nextPage ? [...items, ...result.reviews] : result.reviews); setSummary(result.summary); setPage(nextPage); }
    catch (err) { setLoadError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    if (!reviewsConfigured) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { refresh(); observer.disconnect(); } }, { rootMargin: '300px' });
    observer.observe(section.current); return () => observer.disconnect();
  }, []);
  async function publish(event) {
    event.preventDefault(); if (busy.current) return;
    const form = event.currentTarget, values = new FormData(form);
    busy.current = true; setSending(true); setError(''); setMessage('');
    try {
      await submitReview({ name: values.get('name'), comment: values.get('comment'), rating }, { website: values.get('website'), startedAt: startedAt.current });
      setMessage('Gracias por tu opinión. Se publicará después de ser revisada.'); form.reset(); setRating(0); startedAt.current = Date.now();
    } catch (err) { setError(err.message); }
    finally { busy.current = false; setSending(false); }
  }
  const total = Number(summary?.total || 0);
  return <section className="reviews-section" id="opiniones" ref={section} aria-labelledby="reviews-title">
    <div className="editorial-meta"><span>05 / SIN FILTROS. CON SABOR.</span><span>TU OPINIÓN CUENTA</span></div>
    <div className="reviews-top"><div data-reveal><h2 id="reviews-title">OPINA<br/>DE SHET.</h2><div className="review-summary" aria-live="polite">
      {loadError ? <p>{loadError} <button type="button" onClick={()=>refresh()}>Reintentar</button></p> : loading && !summary ? <p>Cargando opiniones…</p> : total > 0 ? <><strong>{Number(summary.average).toFixed(1)} <span aria-hidden="true">★</span></strong><p>Promedio sobre 5 · Basado en {total} {total === 1 ? 'opinión' : 'opiniones'}</p></> : <><strong className="no-rating">TU PRIMER<br/>VEREDICTO.</strong><p>{reviewsConfigured ? 'Todavía no hay opiniones publicadas. ¿Te animas?' : 'Las opiniones estarán disponibles pronto.'}</p></>}
    </div></div>
    <form className="review-form" onSubmit={publish} aria-label="Publicar una opinión" aria-describedby="review-notice">
      <fieldset disabled={sending || !reviewsConfigured}><legend>¿QUÉ TAN SHET ESTUVO?</legend><div className="review-stars">{[1,2,3,4,5].map(value=><label key={value} className={value<=rating?'selected':''}><input type="radio" name="rating" value={value} checked={rating===value} onChange={()=>setRating(value)} required aria-label={`${value} ${value===1?'estrella':'estrellas'}`}/><span aria-hidden="true">★</span></label>)}</div>
      <label className="review-field" htmlFor="review-name">NOMBRE<input id="review-name" name="name" autoComplete="given-name" required maxLength={REVIEW_LIMITS.name} placeholder="Tu nombre"/></label>
      <label className="review-field" htmlFor="review-comment">COMENTARIO<textarea id="review-comment" name="comment" required maxLength={REVIEW_LIMITS.comment} rows={3} placeholder="Dinos qué tal estuvo…"/></label>
      <div className="review-honeypot" aria-hidden="true"><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      <button className="editorial-link" type="submit">{sending ? 'ENVIANDO…' : 'PUBLICAR →'}</button></fieldset>
      <p id="review-notice" className="review-notice">{reviewsConfigured ? 'Tu nombre y comentario serán públicos tras moderación. No incluyas datos personales. Máximo 1000 caracteres.' : 'Estamos preparando este espacio. El envío aún no está habilitado.'}</p>
      <p role="alert" className="review-error">{error}</p><p role="status">{message}</p>
    </form></div>
    {reviews.length > 0 && <div className="review-editorial" aria-label="Opiniones aprobadas">{reviews.map(review=><article key={review.id}><p className="review-display-stars" aria-label={`${review.rating} de 5 estrellas`}>{'★'.repeat(review.rating)}<span aria-hidden="true">{'☆'.repeat(5-review.rating)}</span></p><h3>{review.name}</h3><blockquote>“{review.comment}”</blockquote></article>)}</div>}
    {reviews.length > 0 && reviews.length < total && <button className="editorial-link" disabled={loading} onClick={()=>refresh(page+1)}>{loading?'CARGANDO…':'MÁS OPINIONES ↓'}</button>}
  </section>;
}
