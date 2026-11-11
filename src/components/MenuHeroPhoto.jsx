import { useId } from 'react';
import { productImage } from '../lib/productImages';
import photoOutlines from '../lib/menuPhotoOutlines.json';

// Keep the real setting around the food. Admin uploads take precedence.
const campaignPhotos = {
  'bbq-beast': { catalog: '/assets/menu/page-2-3.webp', photo: '/assets/campaign/cowboy-smoke.jpg' },
  'cheeseburger-bacon': { catalog: '/assets/menu/page-3-3.webp', photo: '/assets/campaign/bacon-clasica.jpg' },
};
const definedBackgrounds = new Set(['vicio', 'bacon-trip', 'onion-shet']);

// Coordinates use a 480px-wide original. Keep the entire food inside each frame.
const catalogFrames = {
  'cowboy-smoke': ['page-2-1', 718.44, [0, 180, 480, 430]],
  'bacon-trip': ['page-2-2', 718.44, [0, 185, 480, 420]],
  'bbq-beast': ['page-2-3', 718.44, [0, 180, 480, 430]],
  'onion-shet': ['page-2-4', 639.65, [0, 50, 480, 530]],
  'blue-hit': ['page-3-1', 718.44, [0, 170, 480, 420]],
  'clasica-bacon': ['page-3-2', 718.44, [0, 180, 480, 450]],
  'cheeseburger-bacon': ['page-3-3', 480, [0, 55, 480, 400]],
  'tentacion': ['page-1-1', 320.69, [0, 0, 480, 320.69]],
  'vicio': ['page-1-2', 320.69, [0, 0, 480, 320.69]],
  'triple-shet': ['page-1-3', 320.69, [0, 0, 480, 320.69]],
};

export function menuHeroImage(product) {
  const original = productImage(product);
  const campaign = campaignPhotos[product.id];
  const photo = campaign?.catalog === original ? campaign : null;
  const frame = catalogFrames[product.id];
  const knownFrame = frame && original === `/assets/menu/${frame[0]}.webp`;
  return {
    src: photo?.photo || original,
    fallback: original,
    position: photo ? '50% 52%' : product.id === 'onion-shet' && original === '/assets/menu/page-2-4.webp' ? '50% 35%' : product.category === 'promos' ? '50% 50%' : '50% 65%',
    framing: product.category === 'promos' ? 'promotion' : product.id === 'onion-shet' && original === '/assets/menu/page-2-4.webp' ? 'portrait' : 'burger',
    frame: photo ? { height:720, crop:product.id === 'bbq-beast' ? [30,170,450,360] : [20,120,460,430] } : knownFrame ? { height:frame[1], crop:frame[2] } : null,
    outline: !photo && knownFrame ? photoOutlines[product.id] : null,
    definedBackground: definedBackgrounds.has(product.id),
  };
}

export default function MenuHeroPhoto({ product, image = menuHeroImage(product), sizes, loading, decorative = false }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!decorative && image.frame) {
    const [x,y,width,height] = image.frame.crop;
    const detailedEdge = image.definedBackground || product.id === 'cowboy-smoke';
    const feather = Math.min(width,height) * (detailedEdge ? .004 : .012);
    const inset = feather * 1.6;
    return <svg className="menu-campaign__framed-photo" viewBox={`${x} ${y} ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={product.name} data-source={image.src}>
      <defs>
        {image.outline && <>
          <filter id={`${id}-matte`} colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 6 0 -6 0 -.1" result="warm"/>
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 6 -6 0 -.1" result="green"/>
            <feComposite in="warm" in2="green" operator="arithmetic" k2="1" k3="1" result="edge"/>
            <feColorMatrix in="edge" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
          </filter>
          <filter id={`${id}-core`}><feMorphology operator="erode" radius="1.5"/><feGaussianBlur stdDeviation=".35"/></filter>
          <clipPath id={`${id}-contour`}><path d={image.outline}/></clipPath>
        </>}
        <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          {image.outline && <feMorphology operator="dilate" radius={detailedEdge ? 2 : 9}/>}
          <feGaussianBlur stdDeviation={image.outline ? detailedEdge ? 1 : 4 : feather}/>
        </filter>
        <mask id={`${id}-edge`} maskUnits="userSpaceOnUse" x={x} y={y} width={width} height={height}>
          {image.outline
            ? <><g clipPath={`url(#${id}-contour)`}><image href={image.src} width="480" height={image.frame.height} filter={`url(#${id}-matte)`}/></g><path d={image.outline} fill="white" filter={`url(#${id}-core)`}/></>
            : <rect x={x+inset} y={y+inset} width={width-inset*2} height={height-inset*2} rx={Math.min(width,height)*.2} fill="white" filter={`url(#${id}-soft)`}/>}
        </mask>
        {image.outline && <>
          <filter id={`${id}-bounds-soft`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={feather}/></filter>
          <mask id={`${id}-bounds`} maskUnits="userSpaceOnUse" x={x} y={y} width={width} height={height}>
            <rect x={x+inset} y={y+inset} width={width-inset*2} height={height-inset*2} rx={Math.min(width,height)*.2} fill="white" filter={`url(#${id}-bounds-soft)`}/>
          </mask>
        </>}
      </defs>
      <g mask={image.outline ? `url(#${id}-bounds)` : undefined}>
        <image className="menu-campaign__source" href={image.src} width="480" height={image.frame.height} mask={`url(#${id}-edge)`} preserveAspectRatio="none"
          onError={event => { if (event.currentTarget.dataset.fallback) return; event.currentTarget.dataset.fallback='true'; event.currentTarget.setAttribute('href',image.fallback); }}/>
      </g>
    </svg>;
  }
  return <img
    className={decorative ? undefined : `menu-campaign__image--${image.framing}`}
    src={image.src}
    sizes={sizes}
    loading={loading}
    decoding="async"
    alt={decorative ? '' : product.name}
    aria-hidden={decorative || undefined}
    style={{ objectPosition: image.position }}
    onError={event => {
      const image = event.currentTarget;
      if (image.dataset.fallback) return;
      image.dataset.fallback = 'true';
      image.src = menuHeroImage(product).fallback;
    }}
  />;
}
