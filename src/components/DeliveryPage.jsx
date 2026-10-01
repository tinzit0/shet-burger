import MenuSection from './MenuSection';
import FooterCTA from './FooterCTA';
import { directionsUrl } from '../config';
import { instagramUrl } from '../data';

export default function DeliveryPage({ onAdd, stock, storeOpen }) {
  return <>
    <section className="delivery-intro" id="top" aria-labelledby="delivery-title">
      <div className="editorial-meta"><span>SHET A TU MANERA</span><span className="delivery-status">{storeOpen ? '● TIENDA ABIERTA' : '○ TIENDA CERRADA'}</span></div>
      <h1 id="delivery-title">PIDE<br/><span>TU SHET.</span></h1>
      <div className="delivery-intro__bottom"><p>Elige tu hamburguesa. Arma tu pedido.<br/>Despacho o retiro, tú decides.</p><a href="#menu" className="editorial-link">EXPLORAR MENÚ ↓</a></div>
    </section>
    <MenuSection onAdd={onAdd} stock={stock} storeOpen={storeOpen}/>
    <section className="delivery-outro"><h2>HECHO EN<br/>NONGUÉN.</h2><div>{directionsUrl ? <a href={directionsUrl} target="_blank" rel="noreferrer" className="editorial-link">NUESTRO LOCAL ↗</a> : <span className="local-pending">NUESTRO LOCAL ↗<small>Ubicación exacta por confirmar</small></span>}<a href={instagramUrl} target="_blank" rel="noreferrer" className="editorial-link">INSTAGRAM ↗</a></div></section>
    <FooterCTA footerOnly/>
  </>;
}
