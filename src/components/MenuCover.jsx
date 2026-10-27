import { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import BurgerPhoto from './BurgerPhoto';

const slideIds = ['triple-shet', 'bbq-beast', 'tentacion', 'bacon-trip', 'vicio'];
const slideCopy = {
  'triple-shet': { eyebrow: 'PROMO PARA COMPARTIR', headline: 'TRES BURGERS.\nCERO EXCUSAS.', note: 'Elige las tres hamburguesas que quieras y arma el panorama completo.' },
  'bbq-beast': { eyebrow: 'FAT SMASH · SELLO SHET', headline: 'AHUMADA.\nBRUTAL.', note: 'Tocino, BBQ, aros de cebolla y una costra que hace todo el ruido.' },
  'tentacion': { eyebrow: 'PROMO PARA DOS', headline: 'CAE EN LA\nTENTACIÓN.', note: 'Dos burgers simples a elección, papas y dos bebidas para compartir.' },
  'bacon-trip': { eyebrow: 'LA JOYA DE LA CASA', headline: 'UN VIAJE\nCON BACON.', note: 'Mermelada de tocino, doble cheddar y salsa Emmy en pan de papa.' },
  'vicio': { eyebrow: 'COMBO INDIVIDUAL', headline: 'TU VICIO.\nTU BURGER.', note: 'Elige una hamburguesa, suma papas y bebida. Así de simple.' },
};

const mobileHeroImages = {
  'triple-shet': '/assets/campaign/triple-cheddar.jpg',
  tentacion: '/assets/campaign/bacon-clasica.jpg',
  vicio: '/assets/campaign/cowboy-smoke.jpg',
};

export default function MenuCover({ storeOpen, stock = {}, products }) {
  const preferredSlides = slideIds.map(id => products.find(product => product.id === id)).filter(Boolean);
  const slides = preferredSlides.length ? preferredSlides : products.filter(product => product.image).slice(0, 5);
  const [active, setActive] = useState(0);
  const current = slides[active % slides.length];
  const currentAvailable = storeOpen && stock[current.id] !== false;
  const copy = slideCopy[current.id] || { eyebrow: current.category === 'promos' ? 'PROMOCIÓN SHET' : 'FAT SMASH BURGER', headline: `${current.name}\nSHET.`, note: current.description };

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return undefined;
    const timer = window.setInterval(() => setActive(index => (index + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, [active]);

  const move = direction => setActive(index => (index + direction + slides.length) % slides.length);

  return <section className="menu-cover" id="top" aria-roledescription="carrusel" aria-label="Promociones y hamburguesas destacadas">
    <div className="menu-cover__media" aria-live="polite">
      {slides.map((product, index) => <div className={`menu-cover__slide${index === active ? ' is-active' : ''}`} data-product-id={product.id} aria-hidden={index !== active} key={product.id}>
        <picture>
          {mobileHeroImages[product.id] && (
            <source media="(max-width: 720px)" srcSet={mobileHeroImages[product.id]}/>
          )}
          <BurgerPhoto product={product} sizes="100vw" loading={index === 0 ? 'eager' : 'lazy'}/>
        </picture>
      </div>)}
      <div className="menu-cover__shade"/>
    </div>
    <a className="menu-cover__hit" href={`#product-${current.id}`} aria-label={`Ver ${current.name} en el menú`}/>

    <div className="menu-cover__content">
      <div className="menu-cover__topline">
        <p className={`delivery-status${storeOpen ? '' : ' is-closed'}`}><span aria-hidden="true"/>{storeOpen ? 'PEDIDOS ABIERTOS' : 'PEDIDOS CERRADOS'}</p>
        <span>{String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
      </div>
      <div className="menu-cover__copy" key={current.id}>
        <span>{copy.eyebrow}</span>
        <h1>{copy.headline.split('\n').map((line, index) => <span key={line}>{line}{index === 0 && <br/>}</span>)}</h1>
        <p>{copy.note}</p>
        <div className="menu-cover__actions">
          <a className={`menu-cover__primary${currentAvailable ? '' : ' is-unavailable'}`} href={`#product-${current.id}`} aria-disabled={!currentAvailable}><span>{!storeOpen ? 'TIENDA CERRADA' : stock[current.id] === false ? 'AGOTADO' : current.category === 'promos' ? 'ELEGIR ESTA PROMO' : 'VER ESTA BURGER'}</span><strong>{current.prices[0][1]}</strong><ArrowUpRight/></a>
          <a className="menu-cover__secondary" href="#menu">VER TODO EL MENÚ <ArrowDown/></a>
        </div>
      </div>
      <div className="menu-cover__footer">
        <div className="menu-cover__dots" role="tablist" aria-label="Elegir destacado">{slides.map((product, index) => <button type="button" role="tab" aria-selected={index === active} aria-label={`Ver ${product.name}`} key={product.id} onClick={() => setActive(index)}><span/></button>)}</div>
        <div className="menu-cover__arrows"><button type="button" onClick={() => move(-1)} aria-label="Destacado anterior"><ArrowLeft/></button><button type="button" onClick={() => move(1)} aria-label="Siguiente destacado"><ArrowRight/></button></div>
      </div>
    </div>
    <a className="menu-cover__product" href={`#product-${current.id}`} aria-label={`Ir a ${current.name}`}>{current.name}<strong>{current.prices[0][1]}</strong></a>
  </section>;
}
