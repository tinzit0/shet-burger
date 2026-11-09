import { productImage } from '../lib/productImages';
import originalMenuPhotos from '../lib/originalMenuPhotos.json';

/** Preserve the real catalog photo; hero framing clips its original pixels only. */
export default function BurgerPhoto({ product, sizes = '(max-width: 600px) 90vw, (max-width: 900px) 38vw, 30vw', loading = 'lazy', presentation = 'catalog' }) {
  const source = productImage(product);
  const original = originalMenuPhotos[product.id];
  const matches = original?.catalogImage === source;
  const editorial = presentation === 'hero' && matches ? original : null;
  return <img
    className={editorial ? 'is-original-photo' : undefined}
    src={editorial?.src || source}
    sizes={sizes}
    width={editorial?.width || (matches && original.sourceWidth) || 1024} height={editorial?.height || (matches && original.sourceHeight) || 1024} loading={loading} decoding="async" alt={product.name}
    onError={event => { const image = event.currentTarget; if (image.dataset.fallback) return; image.dataset.fallback = 'true'; image.removeAttribute('srcset'); image.src = source; }}
  />;
}
