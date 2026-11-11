import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { instagramUrl } from '../data';
import { Sparkle, SpinSeal, Split, useInView } from './HomeMotion';
export { ScrollMarquee } from './HomeMotion';

// Giant brand word: photo-filled letters alternate with outlined ones (pop-poster style).
const LETTERS = [
  ['S', 'momento'], ['H'], ['E', 'mesa'], ['T', 'cheddar'],
  ['B'], ['U', 'auto'], ['R', 'cowboy'], ['G'], ['E', 'bacon'], ['R'],
];

function Doodle({ className }) {
  return <svg className={className} viewBox="0 0 40 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 4v52M8 44l12 14 12-14"/>
  </svg>;
}

// Kawaii GIFs presented as die-cut stickers so the thin pink line art reads on any background.
function Sticker({ name, className, say }) {
  return <figure className={`toon ${className}`} aria-hidden="true">
    <picture>
      <source media="(prefers-reduced-motion: reduce)" srcSet={`/assets/caricaturas/${name}-still.png`}/>
      <img src={`/assets/caricaturas/${name}.gif`} alt="" width="220" height="220" loading="lazy"/>
    </picture>
    {say && <span className="toon__say">{say}</span>}
  </figure>;
}

export function HomePoster({ content }) {
  const ref = useInView(0.12);
  return <section ref={ref} className="poster" aria-labelledby="poster-title" data-pointer-field>
    <div className="poster__word" aria-hidden="true" data-drift>
      {LETTERS.map(([letter, photo], index) => <span key={index} className={photo ? 'is-photo' : 'is-outline'} style={{ '--i': index, ...(photo ? { '--photo': `url(/assets/home-hero/l-${photo}.webp)` } : {}) }}>{letter}</span>)}
    </div>

    <div className="poster__stage">
      <p className="poster__side poster__side--left">{content.heroDetail}</p>
      <p className="poster__side poster__side--right">Costra crujiente, cheddar fundido y cero atajos. Desde Nonguén, Concepción.</p>

      <img className="poster__logo-sticker" src="/assets/logo shet burger.png" alt="" width="150" height="150" aria-hidden="true" loading="lazy"/>
      <Sticker name="tocino" className="poster__mascot" say="¡ÑAM!"/>
      <Doodle className="poster__doodle poster__doodle--left"/>
      <Doodle className="poster__doodle poster__doodle--right"/>
      <Sparkle className="poster__spark poster__spark--a"/>
      <Sparkle className="poster__spark poster__spark--b"/>
      <Sparkle className="poster__spark poster__spark--c"/>

      <div className="poster__burger-wrap" data-drift data-tilt>
        <img className="poster__burger" src="/assets/home-hero/bacon-trip-hd.webp" alt="Bacon Trip de SHET: doble carne smash, doble cheddar, mermelada de tocino y pepinillos" width="813" height="677" loading="lazy" decoding="async"/>
      </div>

      <h2 id="poster-title" className="poster__title" aria-label="Fat smash burgers">
        <span className="poster__script" aria-hidden="true">fat smash</span>
        <span className="poster__big" aria-hidden="true"><Split text="BURGERS"/></span>
      </h2>
    </div>

    <div className="poster__cta">
      <a className="poster__order" href="/delivery" data-route data-magnetic>{content.heroPrimaryLabel} <ArrowUpRight aria-hidden="true"/></a>
    </div>
  </section>;
}

export function HeroIntro() {
  const ref = useInView();
  return <section ref={ref} className="hero-intro" aria-labelledby="hero-intro-title">
    <div className="hero-intro__copy">
      <span className="hero-intro__eyebrow">BIENVENIDO A SHET BURGER</span>
      <h2 id="hero-intro-title" aria-label="Smash con actitud"><span aria-hidden="true">SMASH</span><em aria-hidden="true">con</em><span aria-hidden="true">ACTITUD</span></h2>
      <ul className="hero-intro__tags" aria-label="Lo que lleva cada SHET">{['125 G DE CARNE', 'PAN DE PAPA', 'CHEDDAR FUNDIDO'].map((tag, i) => <li key={tag} style={{ '--i': i }}>{tag}</li>)}</ul>
      <svg className="hero-intro__smile" viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" aria-hidden="true"><path pathLength="1" d="M10 18c20 34 72 40 100 6"/><path pathLength="1" d="M38 8v6M70 6v6"/></svg>
    </div>
    <div className="hero-intro__collage">
      <div className="hero-intro__gingham" aria-hidden="true"/>
      <figure className="hero-intro__photo hero-intro__photo--main" data-drift><img src="/assets/home-hero/triple-720.webp" alt="Triple cheddar SHET recién salida de la plancha" width="720" height="1080" loading="lazy" decoding="async"/></figure>
      <figure className="hero-intro__photo hero-intro__photo--tilt" data-drift><img src="/assets/home-hero/queso-720.webp" alt="Torre de carnes smash con cheddar fundido sobre la espátula" width="720" height="1252" loading="lazy" decoding="async"/></figure>
      <Sticker name="abrazo" className="hero-intro__sticker" say="BFF"/>
      <SpinSeal className="hero-intro__badge" text="100% SMASH ✳ HECHA AL MOMENTO ✳ ">100%</SpinSeal>
      <Sparkle className="hero-intro__spark hero-intro__spark--a"/>
      <Sparkle className="hero-intro__spark hero-intro__spark--b"/>
    </div>
  </section>;
}

export function CheckerBand({ className = '' }) {
  return <div className={`checker-band ${className}`} aria-hidden="true"/>;
}

const SIGNATURE_IDS = ['bacon-trip', 'bbq-beast', 'cowboy-smoke', 'onion-shet', 'blue-hit', 'clasica-bacon', 'cheeseburger-bacon'];

export function SignatureSection({ products = [] }) {
  const ref = useInView(0.15);
  const burgers = SIGNATURE_IDS.map(id => products.find(product => product.id === id)).filter(Boolean);
  const [state, setState] = useState({ index: 0, dir: 1 });
  const [paused, setPaused] = useState(false);
  const count = burgers.length;
  useEffect(() => {
    if (paused || count < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const el = ref.current;
    let visible = false;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.3 });
    if (el) io.observe(el);
    const timer = setInterval(() => { if (visible && !document.hidden) setState(({ index }) => ({ index: (index + 1) % count, dir: 1 })); }, 4200);
    return () => { clearInterval(timer); io.disconnect(); };
  }, [paused, count, ref]);
  if (!burgers.length) return null;
  const current = burgers[state.index % burgers.length];
  const step = delta => setState(({ index }) => ({ index: (index + delta + burgers.length) % burgers.length, dir: delta }));
  const price = current.prices?.[0]?.[1];

  return <section ref={ref} className="signature" aria-labelledby="signature-title" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
    <CheckerBand className="checker-band--signature"/>
    <div className="signature__inner">
      <SpinSeal className="signature__seal" text="HECHAS AL MOMENTO ✳ RECETAS DE LA CASA ✳ ">SHET</SpinSeal>
      <h2 id="signature-title" aria-label="Las firmas SHET"><Split text="LAS FIRMAS SHET"/></h2>
      <div className="signature__stage">
        <p className="signature__side signature__side--left" key={`d-${current.id}`}>{current.description}</p>
        <p className="signature__side signature__side--right">Cada una con carne smash de 125 g en pan de papa. Pídela simple o doble.</p>
        <button className="signature__arrow signature__arrow--prev" type="button" onClick={() => step(-1)} aria-label="Hamburguesa anterior"><ArrowLeft aria-hidden="true"/></button>
        <div className="signature__blob" data-dir={state.dir > 0 ? 'next' : 'prev'}>
          <img key={current.id} src={`/assets/menu/hd/${current.id}-v2-1024.webp`} srcSet={`/assets/menu/hd/${current.id}-v2-640.webp 640w, /assets/menu/hd/${current.id}-v2-1024.webp 1024w`} sizes="(max-width: 720px) 80vw, 34rem" alt={current.name} width="1024" height="1533" loading="lazy" decoding="async"/>
        </div>
        <button className="signature__arrow signature__arrow--next" type="button" onClick={() => step(1)} aria-label="Hamburguesa siguiente"><ArrowRight aria-hidden="true"/></button>
        <Sparkle className="signature__spark signature__spark--a"/>
        <Sparkle className="signature__spark signature__spark--b"/>
        <Sparkle className="signature__spark signature__spark--c"/>
      </div>
      <div className="signature__tape" aria-hidden="true">{[0, 1].map(track => <div key={track}>{['SHET', 'PEDIR AHORA', 'FAT SMASH', 'PINK BOX', 'SHET', 'PEDIR AHORA', 'FAT SMASH', 'PINK BOX'].map((word, i) => <span key={i}>{word}<i>✳</i></span>)}</div>)}</div>
      <a className="signature__label" href="/delivery" data-route aria-live="polite">
        <em>smash</em>
        <strong key={current.id}>{current.name}</strong>
        {price && <span>desde {price}</span>}
        <i className={`signature__timer${paused ? ' is-paused' : ''}`} key={`t-${current.id}`} aria-hidden="true"/>
      </a>
      <div className="signature__dots" aria-hidden="true">{burgers.map((burger, index) => <i key={burger.id} className={index === state.index ? 'is-active' : ''}/>)}</div>
    </div>
  </section>;
}

export function PromoSection({ products = [] }) {
  const ref = useInView();
  const vicio = products.find(product => product.id === 'vicio')?.prices?.[0]?.[1];
  return <section ref={ref} className="promo-vibe" aria-labelledby="promo-title">
    <div className="promo-vibe__bg" aria-hidden="true"/>
    <div className="promo-vibe__rays" aria-hidden="true"/>
    <div className="promo-vibe__copy">
      <h2 id="promo-title"><span className="promo-vibe__line">ARMA EL</span><span className="promo-vibe__line">PANORAMA</span><span className="promo-vibe__line">CON <em>SHET</em></span><span className="promo-vibe__line">PROMOS</span></h2>
      <Sticker name="abrazo" className="promo-vibe__sticker" say="¡PA' COMPARTIR!"/>
      <p>Para la junta, el partido o el carrete: Triple SHET, Tentación y Vicio traen burgers, papas y bebidas para compartir sin pensarlo dos veces.</p>
      <a className="promo-vibe__cta" href="/delivery" data-route data-magnetic>VER PROMOS <ArrowUpRight aria-hidden="true"/></a>
    </div>
    <div className="promo-vibe__media">
      <figure className="promo-card promo-card--a" data-drift data-tilt><img src="/assets/campaign/mesa-shet.jpg" alt="Tres hamburguesas SHET servidas para compartir" width="1200" height="1800" loading="lazy" decoding="async"/><figcaption>PARA COMPARTIR</figcaption></figure>
      <figure className="promo-card promo-card--b" data-drift data-tilt><img src="/assets/campaign/momento-shet.jpg" alt="Persona disfrutando una hamburguesa SHET" width="1200" height="1800" loading="lazy" decoding="async"/><figcaption>SIN POSES</figcaption></figure>
      {vicio && <span className="promo-vibe__price" aria-hidden="true"><small>COMBOS</small>DESDE<b>{vicio}</b></span>}
    </div>
  </section>;
}

const CANS = [['coca-cola', 'a'], ['fanta', 'b'], ['sprite', 'c'], ['kem', 'd'], ['coca-cola-zero', 'e']];

export function SidesSection() {
  const ref = useInView();
  return <section ref={ref} className="sides" aria-labelledby="sides-title" data-pointer-field>
    {CANS.map(([name, slot]) => <span key={slot} className={`sides__drift sides__drift--${slot}`} data-drift><img className="sides__item" src={`/assets/drinks/${name}.webp`} alt="" width="480" height="480" loading="lazy" aria-hidden="true"/></span>)}
    <Sticker name="tocino" className="sides__sticker"/>
    <Sparkle className="sides__spark sides__spark--a"/>
    <Sparkle className="sides__spark sides__spark--b"/>
    <div className="sides__copy">
      <span className="sides__eyebrow">PARA QUE NO FALTE NADA EN TU PEDIDO:<br/>BEBIDAS, FRITOS Y SALSAS DE LA CASA</span>
      <h2 id="sides-title" aria-label="Completa tu SHET"><span className="sides__row"><Split text="COMPLETA"/></span><span className="sides__row"><Split text="TU SHET" offset={8}/></span></h2>
      <p>Bebidas heladas, aros de cebolla, empanadas de queso y papas pork. Agrégalos al pedido en un toque.</p>
      <a className="sides__cta" href="/delivery" data-route data-magnetic>AGREGAR AL PEDIDO <ArrowUpRight aria-hidden="true"/></a>
      <a className="sides__ig" href={instagramUrl} target="_blank" rel="noreferrer">SÍGUENOS @SHETBURGER <ArrowUpRight aria-hidden="true"/></a>
    </div>
  </section>;
}
