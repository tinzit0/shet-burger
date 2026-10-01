const enhancedIds = new Set(['bbq-beast','onion-shet','bacon-trip','cowboy-smoke','blue-hit','clasica-bacon','cheeseburger-bacon']);

/** Same real catalog product, with responsive, reviewed photo restorations. */
export default function BurgerPhoto({ product, sizes = '(max-width: 600px) 90vw, (max-width: 900px) 38vw, 30vw' }) {
  const enhanced = enhancedIds.has(product.id);
  const base = `/assets/menu/hd/${product.id}-v2`;
  return <img
    src={enhanced ? `${base}-1024.webp` : product.image}
    srcSet={enhanced ? `${base}-640.webp 640w, ${base}-1024.webp 1024w` : undefined}
    sizes={enhanced ? sizes : undefined}
    width="1024" height="1024" loading="lazy" decoding="async" alt={product.name}
    onError={event => { const image = event.currentTarget; if (image.dataset.fallback) return; image.dataset.fallback = 'true'; image.removeAttribute('srcset'); image.src = product.image; }}
  />;
}
