import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import MenuHeroPhoto, { menuHeroImage } from './MenuHeroPhoto';

const featuredIds = ['bbq-beast', 'tentacion', 'cowboy-smoke', 'bacon-trip', 'triple-shet', 'onion-shet', 'cheeseburger-bacon'];
const slideColors = ['#F09AC4', '#4A3A47', '#C2185B'];
const SLIDE_DURATION = 6000;

export default function MenuCover({ storeOpen, stock = {}, products = [], onChooseProduct, selectionOpen = false }) {
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const touchStart = useRef(null);
  const suppressClickUntil = useRef(0);
  // One presentation array, derived from the existing managed catalog.
  const slides = useMemo(() => {
    const ordered = [...featuredIds.map(id => products.find(p => p.id === id)), ...products.filter(p => ['burgers', 'promos'].includes(p.category) && !featuredIds.includes(p.id))];
    return ordered.filter(p => p?.image).map((product, number) => ({
      product, label: product.category === 'promos' ? 'LA PROMO' : 'LA SMASH',
      title: product.name, description: product.description, price: product.prices[0]?.[1],
      image: menuHeroImage(product), slideBg: slideColors[number % slideColors.length],
    }));
  }, [products]);
  const index = active % Math.max(slides.length, 1);
  const rotating = !focused && !hovered && !hidden && !reducedMotion && !selectionOpen && slides.length > 1;
  const move = direction => { if (slides.length) setActive(value => (value + direction + slides.length) % slides.length); };
  const startSwipe = event => {
    const touch = event.touches.length === 1 ? event.touches[0] : null;
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const endSwipe = event => {
    const start = touchStart.current, touch = event.changedTouches[0];
    touchStart.current = null;
    if (!start || !touch) return;
    const x = touch.clientX - start.x, y = touch.clientY - start.y;
    if (Math.abs(x) > 48 && Math.abs(x) > Math.abs(y) * 1.3) {
      suppressClickUntil.current = Date.now() + 400;
      move(x < 0 ? 1 : -1);
    }
  };
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionChanged = event => setReducedMotion(event.matches);
    const visibilityChanged = () => setHidden(document.hidden);
    media.addEventListener('change', motionChanged);
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => { media.removeEventListener('change', motionChanged); document.removeEventListener('visibilitychange', visibilityChanged); };
  }, []);
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setActive(value => (value + 1) % slides.length), SLIDE_DURATION);
    return () => window.clearTimeout(timer);
  }, [rotating, active, slides.length]);

  return <section className={`menu-campaign${rotating ? ' is-playing' : ''}`} id="top" aria-label="La carta SHET">
    <h1 className="sr-only" id="delivery-title">Hamburguesas y promociones SHET BURGER</h1>
    <div className="menu-campaign__stage" role="region" aria-roledescription="carrusel" aria-label="Destacados del menú"
      onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }} onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      {slides.map((slide, number) => {
        const { product, label, title, description, price, image, slideBg } = slide;
        const current = index === number;
        return <article key={product.id} className={`menu-campaign__slide menu-campaign__slide--paper-${number % 2 ? 'pink' : 'white'}${image.definedBackground ? ' menu-campaign__slide--clear-paper' : ''}${current ? ' is-active' : ''}`}
          style={{ '--slide-bg': slideBg, '--slide-position': current ? 0 : number < index ? -1 : 1, '--slide-backdrop-blur': image.definedBackground ? '0px' : '8px', '--slide-backdrop-opacity': image.definedBackground ? .1 : .22 }}
          aria-hidden={!current} inert={!current} aria-roledescription="diapositiva" aria-label={`${number + 1} de ${slides.length}: ${title}`}>
          <div className="menu-campaign__backdrop" aria-hidden="true"><MenuHeroPhoto product={product} image={image} decorative loading={number === 0 ? 'eager' : 'lazy'}/></div>
          <div className="menu-campaign__texture" aria-hidden="true"/>
          <div className="menu-campaign__shade" aria-hidden="true"/>
          <div className={`menu-campaign__spread${product.category === 'promos' ? ' is-promo' : ''}`}
            onTouchStart={startSwipe} onTouchEnd={endSwipe} onTouchCancel={() => { touchStart.current = null; }}
            onClickCapture={event => { if (Date.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); } }}>
            <div className="menu-campaign__visual">
              <button className="menu-campaign__photo" type="button" tabIndex={current ? 0 : -1} onClick={() => onChooseProduct?.(product)} aria-label={`Ver y personalizar ${title}`}>
                <MenuHeroPhoto product={product} image={image} sizes="(max-width: 767px) 100vw, 46vw" loading={number === 0 ? 'eager' : 'lazy'}/>
              </button>
            </div>
            <div className="menu-campaign__copy">
              <div className="menu-campaign__name"><span>{label}</span><h2 className={title.length > 16 ? 'is-long' : undefined}>{title}</h2><span className="menu-campaign__price">Desde <b>{price}</b></span></div>
              <div className="menu-campaign__details"><p className="menu-campaign__description" title={description}>{description}</p><button type="button" tabIndex={current ? 0 : -1} className="menu-campaign__order" onClick={() => onChooseProduct?.(product)}>{!storeOpen ? 'VER OPCIONES' : stock[product.id] === false ? 'VER DETALLES' : 'PIDE AQUÍ'}<ArrowUpRight aria-hidden="true"/></button>{(!storeOpen || stock[product.id] === false) && <small>{!storeOpen ? 'Por ahora los pedidos están cerrados.' : 'Producto agotado temporalmente.'}</small>}</div>
            </div>
          </div>
        </article>;
      })}
      {!slides.length && <div className="menu-campaign__empty"><h2>LA CARTA SHET.</h2><a href="#menu">Ver el menú <ArrowDown/></a></div>}
      {slides.length > 1 && <>
        <button className="menu-campaign__arrow menu-campaign__arrow--prev" type="button" onClick={() => move(-1)} aria-label="Destacado anterior"><ChevronLeft aria-hidden="true"/></button>
        <button className="menu-campaign__arrow menu-campaign__arrow--next" type="button" onClick={() => move(1)} aria-label="Siguiente destacado"><ChevronRight aria-hidden="true"/></button>
        <div className="menu-campaign__controls"><span className="menu-campaign__count" aria-live={rotating ? 'off' : 'polite'} aria-atomic="true"><b>{String(index + 1).padStart(2, '0')}</b><span>/ {String(slides.length).padStart(2, '0')}</span></span><div className="menu-campaign__dots" role="group" aria-label="Elegir destacado">{slides.map((slide, number) => <button type="button" key={slide.product.id} aria-label={`Ver ${slide.title}`} aria-pressed={index === number} onClick={() => setActive(number)}><span/></button>)}</div></div>
      </>}
    </div>
    <div className="menu-campaign__footer"><span><i className={storeOpen ? 'is-open' : ''}/>{storeOpen ? 'RECIBIENDO PEDIDOS' : 'PEDIDOS CERRADOS'}</span><a href="#menu">EXPLORA TODA LA CARTA <ArrowDown aria-hidden="true"/></a><span>NONGUÉN, CONCEPCIÓN</span></div>
  </section>;
}
