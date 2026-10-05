import MenuSection from './MenuSection';
import FooterCTA from './FooterCTA';
import { directionsUrl } from '../config';
import { instagramUrl } from '../data';

export default function DeliveryPage({ onAdd, stock, storeOpen }) {
  return <>
    <section className="delivery-intro" id="top" aria-labelledby="delivery-title">
      <div className="section-meta"><span>SHET A TU MANERA</span><span className={`delivery-status${storeOpen ? '' : ' is-closed'}`}>{storeOpen ? '● PEDIDOS ABIERTOS' : '○ PEDIDOS CERRADOS'}</span></div>
      <h1 id="delivery-title">ELIGE.<br/><span>ARMA.</span><br/>PIDE.</h1>
      <div className="delivery-intro__bottom"><p>Tu burger, tu tamaño, tu momento.<br/>Despacho o retiro en Nonguén.</p><a href="#menu" className="text-link">EXPLORAR MENÚ ↓</a></div>
    </section>
    <MenuSection onAdd={onAdd} stock={stock} storeOpen={storeOpen}/>
    <section className="delivery-outro"><p className="eyebrow">DESDE EL BARRIO</p><h2>HECHO EN<br/><em>NONGUÉN.</em></h2><div><a href={directionsUrl} target="_blank" rel="noreferrer" className="text-link">PUNTO DE RETIRO ↗</a><a href={instagramUrl} target="_blank" rel="noreferrer" className="text-link">INSTAGRAM ↗</a></div></section>
    <FooterCTA footerOnly/>
  </>;
}
