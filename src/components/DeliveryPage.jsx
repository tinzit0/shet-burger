import MenuSection from './MenuSection';
import FooterCTA from './FooterCTA';
import BurgerPhoto from './BurgerPhoto';
import { ArrowDown, ArrowUpRight, Flame, MapPin, ShoppingBag } from 'lucide-react';
import { directionsUrl } from '../config';
import { instagramUrl, products } from '../data';

const featuredProduct = products.find(product => product.featured);

export default function DeliveryPage({ onAdd, stock, storeOpen }) {
  return <>
    <section className="delivery-intro" id="top" aria-labelledby="delivery-title">
      <div className="delivery-intro__layout">
        <div className="delivery-intro__copy">
          <p className={`delivery-status${storeOpen ? '' : ' is-closed'}`}><span aria-hidden="true"/>{storeOpen ? 'PEDIDOS ABIERTOS' : 'PEDIDOS CERRADOS'}</p>
          <span className="delivery-intro__eyebrow">BUEN HAMBRE. BUENA ELECCIÓN.</span>
          <h1 id="delivery-title">HOY SE COME<br/><span>SHET.</span><Flame aria-hidden="true"/></h1>
          <p className="delivery-intro__lead">Elige tu favorita, hazla simple o doble<br className="delivery-intro__break"/> y deja el resto en nuestra plancha.</p>
          <a className="button button--primary" href="#menu">{storeOpen ? 'ENCONTRAR MI BURGER' : 'EXPLORAR EL MENÚ'} <ArrowDown aria-hidden="true"/></a>
          <div className="delivery-intro__details"><span><ShoppingBag aria-hidden="true"/>Delivery y retiro</span><span><MapPin aria-hidden="true"/>Nonguén, Concepción</span></div>
        </div>
        <a className="delivery-feature" href="#menu-category-burgers" aria-label={`Ver hamburguesas, ${featuredProduct.name} desde ${featuredProduct.prices[0][1]}`}>
          <div className="delivery-feature__photo"><BurgerPhoto product={featuredProduct} sizes="(max-width: 720px) 90vw, 42vw" loading="eager"/><span className="delivery-feature__label"><Flame aria-hidden="true"/> FAT SMASH, FULL SABOR</span></div>
          <div className="delivery-feature__caption"><div><span>EL ANTOJO EMPIEZA ACÁ</span><h2>{featuredProduct.name}</h2></div><div><span>Desde</span><strong>{featuredProduct.prices[0][1]}</strong></div><ArrowUpRight aria-hidden="true"/></div>
          <span className="delivery-feature__sticker">CON PAPAS.<br/><strong>OBVIO.</strong></span>
        </a>
      </div>
      <div className="delivery-intro__ribbon" aria-hidden="true"><span>PAN DE PAPA</span><i>✳</i><span>COSTRA CRUJIENTE</span><i>✳</i><span>CHEDDAR FUNDIDO</span><i>✳</i><span>ACTITUD SHET</span></div>
    </section>
    <MenuSection onAdd={onAdd} stock={stock} storeOpen={storeOpen}/>
    <section className="delivery-outro"><h2>HECHO EN<br/><em>NONGUÉN.</em></h2><div><a href={directionsUrl} target="_blank" rel="noreferrer" className="text-link">PUNTO DE RETIRO ↗</a><a href={instagramUrl} target="_blank" rel="noreferrer" className="text-link">INSTAGRAM ↗</a></div></section>
    <FooterCTA footerOnly/>
  </>;
}
