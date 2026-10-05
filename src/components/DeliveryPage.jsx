import MenuSection from './MenuSection';
import FooterCTA from './FooterCTA';
import { directionsUrl } from '../config';
import { instagramUrl } from '../data';

export default function DeliveryPage({ onAdd, stock, storeOpen }) {
  return <>
    <section className="delivery-intro" id="top" aria-labelledby="delivery-title">
      <p className={`delivery-status${storeOpen ? '' : ' is-closed'}`}>{storeOpen ? '● PEDIDOS ABIERTOS' : '○ PEDIDOS CERRADOS'}</p>
      <h1 id="delivery-title">ELIGE.<br/><span>ARMA.</span><br/>PIDE.</h1>
      <div className="delivery-intro__bottom"><p>Tu burger, tu tamaño, tu momento.<br/>Despacho o retiro en Nonguén.</p></div>
    </section>
    <MenuSection onAdd={onAdd} stock={stock} storeOpen={storeOpen}/>
    <section className="delivery-outro"><h2>HECHO EN<br/><em>NONGUÉN.</em></h2><div><a href={directionsUrl} target="_blank" rel="noreferrer" className="text-link">PUNTO DE RETIRO ↗</a><a href={instagramUrl} target="_blank" rel="noreferrer" className="text-link">INSTAGRAM ↗</a></div></section>
    <FooterCTA footerOnly/>
  </>;
}
