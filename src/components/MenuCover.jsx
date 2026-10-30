import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from 'lucide-react';
import BurgerPhoto from './BurgerPhoto';

const featuredIds = ['bacon-trip', 'bbq-beast', 'onion-shet', 'cowboy-smoke', 'cheeseburger-bacon'];
const featuredContent = {
  'bacon-trip': {
    eyebrow: 'FAT SMASH · HECHAS AL MOMENTO', title: 'TU ANTOJO.', accent: 'A TU MANERA.',
    note: 'Elige tu burger, ábrela y arma tu pedido en Simple o Doble. Todas vienen con papas fritas.',
    badge: 'LA JOYA DE LA CASA', details: ['MERMELADA DE TOCINO', 'DOBLE CHEDDAR', 'SALSA EMMY'],
  },
  'bbq-beast': {
    eyebrow: 'FAT SMASH · SELLO SHET', title: 'AHUMADA.', accent: 'BRUTAL.',
    note: 'Tocino, BBQ y aros de cebolla en una burger intensa, crujiente y hecha para ensuciarse las manos.',
    badge: 'INTENSA Y AHUMADA', details: ['TOCINO + BBQ', 'AROS DE CEBOLLA', 'PEPINILLOS'],
  },
  'onion-shet': {
    eyebrow: 'DOBLE CHEDDAR · MAYO SRIRACHA', title: 'CRISPY.', accent: 'CON ACTITUD.',
    note: 'Cebolla crispy, tocino y un picor suave que aparece justo al final. Equilibrada, pero nada tímida.',
    badge: 'CRISPY Y PICANTE', details: ['DOBLE CHEDDAR', 'CEBOLLA CRISPY', 'MAYO SRIRACHA'],
  },
  'cowboy-smoke': {
    eyebrow: 'PULLED PORK · CEBOLLA CRISPY', title: 'SMOKE.', accent: 'SIN ATAJOS.',
    note: 'Pulled pork artesanal, salsa BBQ y cheddar fundido. Mucho sabor, preparado como corresponde.',
    badge: 'PULLED PORK SHET', details: ['PULLED PORK', 'CEBOLLA CRISPY', 'SALSA BBQ'],
  },
  'cheeseburger-bacon': {
    eyebrow: 'TRIPLE CHEDDAR · TOCINO', title: 'CLÁSICA.', accent: 'BIEN SHET.',
    note: 'La cheeseburger que conoces, llevada a nuestro terreno con triple cheddar, tocino y pan de papa.',
    badge: 'UN CLÁSICO SHET', details: ['TRIPLE CHEDDAR', 'TOCINO', 'KETCHUP + MOSTAZA'],
  },
};

export default function MenuCover({ storeOpen, products = [] }) {
  const slides = useMemo(() => {
    const preferred = featuredIds.map(id => products.find(product => product.id === id)).filter(product => product?.image);
    return preferred.length > 1 ? preferred : products.filter(product => product.category === 'burgers' && product.image).slice(0, 5);
  }, [products]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const featured = slides[active % Math.max(slides.length, 1)];
  const copy = featured ? featuredContent[featured.id] || {
    eyebrow: 'FAT SMASH BURGER', title: featured.name, accent: 'A TU MANERA.', note: featured.description,
    badge: 'FAVORITA SHET', details: ['CARNE SMASH 125 G', 'PAN DE PAPA', 'PAPAS INCLUIDAS'],
  } : null;

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActive(index => (index + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const move = direction => setActive(index => (index + direction + slides.length) % slides.length);

  return <section className="menu-cover" id="top" aria-labelledby="delivery-title">
    <div className="menu-cover__ambient" aria-hidden="true"><span/><span/></div>
    <div className="menu-cover__content">
      <header className="menu-cover__topline">
        <p className={`delivery-status${storeOpen ? '' : ' is-closed'}`}><span aria-hidden="true"/>{storeOpen ? 'PEDIDOS ABIERTOS' : 'PEDIDOS CERRADOS'}</p>
        <span>CARTA ONLINE</span>
      </header>
      <div className="menu-cover__layout">
        <div className="menu-cover__copy" key={`copy-${featured?.id || 'menu'}`}>
          <span>{copy?.eyebrow || 'FAT SMASH BURGERS'}</span>
          <h1 id="delivery-title">{copy?.title || 'MENÚ SHET.'}<br/><em>{copy?.accent || 'A TU MANERA.'}</em></h1>
          <p>{copy?.note || 'Elige tu favorita y arma tu pedido.'}</p>
          <div className="menu-cover__actions">
            <a className="menu-cover__primary" href="#menu"><span>EXPLORAR EL MENÚ</span><ArrowDown/></a>
            {featured && <a className="menu-cover__secondary" href={`#product-${featured.id}`}><span>VER {featured.name.toUpperCase()}</span><strong>{featured.prices[0][1]}</strong><ArrowUpRight/></a>}
          </div>
        </div>
        {featured && <div className="menu-cover__feature" role="region" aria-roledescription="carrusel" aria-label="Burgers destacadas">
          <a className="menu-cover__feature-card" href={`#product-${featured.id}`} aria-label={`Ver ${featured.name} en el menú`} key={featured.id}>
            <div className="menu-cover__feature-media">
              <BurgerPhoto product={featured} sizes="(max-width: 720px) 92vw, 44vw" loading="eager"/>
              <span>{copy.badge}</span>
            </div>
            <div className="menu-cover__feature-caption">
              <div><small>FAT SMASH BURGER</small><strong>{featured.name}</strong></div>
              <div><small>INCLUYE PAPAS</small><strong>{featured.prices[0][1]}</strong></div>
              <ArrowUpRight aria-hidden="true"/>
            </div>
          </a>
          {slides.length > 1 && <div className="menu-cover__feature-nav">
            <span>{String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
            <div className="menu-cover__feature-dots" aria-label="Elegir burger destacada">{slides.map((product, index) => <button type="button" key={product.id} aria-label={`Ver ${product.name}`} aria-pressed={index === active} onClick={() => setActive(index)}/>)}</div>
            <div className="menu-cover__feature-buttons">
              <button type="button" onClick={() => move(-1)} aria-label="Burger anterior"><ArrowLeft/></button>
              <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Reanudar cambio automático' : 'Pausar cambio automático'}>{paused ? <Play/> : <Pause/>}</button>
              <button type="button" onClick={() => move(1)} aria-label="Siguiente burger"><ArrowRight/></button>
            </div>
          </div>}
        </div>}
      </div>
      <footer className="menu-cover__proof" aria-label="Ingredientes destacados" key={`details-${featured?.id || 'menu'}`}>
        {(copy?.details || ['CARNE SMASH 125 G', 'PAN DE PAPA', 'PAPAS INCLUIDAS']).map((detail, index) => <span key={detail}><b>{String(index + 1).padStart(2, '0')}</b> {detail}</span>)}
      </footer>
    </div>
  </section>;
}
