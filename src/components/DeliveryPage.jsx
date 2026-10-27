import MenuSection from './MenuSection';
import FooterCTA from './FooterCTA';
import { directionsUrl } from '../config';
import { instagramUrl } from '../data';
import MenuCover from './MenuCover';

export default function DeliveryPage({ onAdd, stock, storeOpen, products, content }) {
  return <>
    <MenuCover storeOpen={storeOpen} stock={stock} products={products}/>
    <MenuSection onAdd={onAdd} stock={stock} storeOpen={storeOpen} products={products} content={content}/>
    <section className="delivery-outro"><h2>HECHO EN<br/><em>NONGUÉN.</em></h2><div><a href={directionsUrl} target="_blank" rel="noreferrer" className="text-link">PUNTO DE RETIRO ↗</a><a href={instagramUrl} target="_blank" rel="noreferrer" className="text-link">INSTAGRAM ↗</a></div></section>
    <FooterCTA footerOnly/>
  </>;
}
