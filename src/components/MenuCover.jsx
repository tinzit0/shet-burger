import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from 'lucide-react';
import BurgerPhoto from './BurgerPhoto';

const featuredIds = ['bacon-trip', 'tentacion', 'cowboy-smoke', 'bbq-beast', 'triple-shet', 'onion-shet', 'cheeseburger-bacon'];
const scenes = ['slate', 'wine', 'forest', 'copper', 'plum'];
const SLIDE_DURATION = 11000;

export default function MenuCover({ storeOpen, stock = {}, products = [], onChooseProduct, selectionOpen = false }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const slides = useMemo(() => {
    const ordered = [...featuredIds.map(id => products.find(p => p.id === id)), ...products.filter(p => ['burgers','promos'].includes(p.category) && !featuredIds.includes(p.id))];
    return ordered.filter(p => p?.image);
  }, [products]);
  const index = active % Math.max(slides.length, 1);
  const rotating = !paused && !focused && !hidden && !reducedMotion && !selectionOpen && slides.length > 1;
  const move = direction => { if (slides.length) setActive(value => (value + direction + slides.length) % slides.length); };

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
      onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      {slides.map((product, number) => {
        const current = index === number, promo = product.category === 'promos';
        return <article key={product.id} className={`menu-campaign__slide menu-campaign__slide--${scenes[number % scenes.length]}${current ? ' is-active' : ''}`}
          aria-hidden={!current} inert={!current} aria-roledescription="diapositiva" aria-label={`${number + 1} de ${slides.length}: ${product.name}`}>
          <div className="menu-campaign__texture" aria-hidden="true"/>
          <div className="menu-campaign__visual">
            <button className="menu-campaign__photo" type="button" tabIndex={current ? 0 : -1} onClick={() => onChooseProduct?.(product)} aria-label={`Ver y personalizar ${product.name}`}>
              <BurgerPhoto product={product} sizes="(max-width: 700px) 100vw, 52vw" loading={number === 0 ? 'eager' : 'lazy'}/>
            </button>
            <span className="menu-campaign__sticker">{promo ? 'EL PLAN ES COMPARTIR' : 'INCLUYE PAPITAS'} <ArrowUpRight aria-hidden="true"/></span>
          </div>
          <div className="menu-campaign__name"><span>{promo ? 'LA PROMO' : 'LA SMASH'}</span><h2>{product.name}</h2><p>MUCHO SHET.<br/>CERO VUELTAS.</p></div>
          <div className="menu-campaign__details"><span className="menu-campaign__eyebrow">{promo ? 'JUNTOS SABE MEJOR' : 'HECHA AL MOMENTO · NONGUÉN'}</span><p>{product.description}</p><span className="menu-campaign__price">Desde <b>{product.prices[0]?.[1]}</b></span><button type="button" tabIndex={current ? 0 : -1} className="menu-campaign__order" onClick={() => onChooseProduct?.(product)}>{!storeOpen ? 'VER OPCIONES' : stock[product.id] === false ? 'VER DETALLES' : 'PIDE AQUÍ'}<ArrowUpRight aria-hidden="true"/></button>{(!storeOpen || stock[product.id] === false)&&<small>{!storeOpen ? 'Por ahora los pedidos están cerrados.' : 'Producto agotado temporalmente.'}</small>}</div>
        </article>;
      })}
      {!slides.length&&<div className="menu-campaign__empty"><h2>LA CARTA SHET.</h2><a href="#menu">Ver el menú <ArrowDown/></a></div>}
      <div className="menu-campaign__brand" aria-hidden="true">SHET<span>FAT SMASH BURGERS</span></div>
      {slides.length > 1&&<>
        <button className="menu-campaign__arrow menu-campaign__arrow--prev" type="button" onClick={() => move(-1)} aria-label="Destacado anterior"><ArrowLeft/></button>
        <button className="menu-campaign__arrow menu-campaign__arrow--next" type="button" onClick={() => move(1)} aria-label="Siguiente destacado"><ArrowRight/></button>
        <div className="menu-campaign__controls"><span className="menu-campaign__count">{String(index+1).padStart(2,'0')} / {String(slides.length).padStart(2,'0')}</span><div className="menu-campaign__dots" role="group" aria-label="Elegir destacado">{slides.map((product, number)=><button type="button" key={product.id} aria-label={`Ver ${product.name}`} aria-pressed={index===number} onClick={()=>setActive(number)}><span/></button>)}</div><button className="menu-campaign__pause" type="button" onClick={()=>setPaused(value=>!value)} aria-pressed={paused} aria-label={paused?'Reanudar carrusel':'Pausar carrusel'}>{paused?<Play/>:<Pause/>}</button></div>
        <div className="menu-campaign__progress" aria-hidden="true"><span key={`${active}-${rotating}`} className={rotating?'is-running':''}/></div>
      </>}
    </div>
    <div className="menu-campaign__footer"><span><i className={storeOpen?'is-open':''}/>{storeOpen?'RECIBIENDO PEDIDOS':'PEDIDOS CERRADOS'}</span><a href="#menu">EXPLORA TODA LA CARTA <ArrowDown aria-hidden="true"/></a><span>NONGUÉN, CONCEPCIÓN</span></div>
  </section>;
}
