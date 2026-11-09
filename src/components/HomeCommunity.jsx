import { ArrowUpRight } from 'lucide-react';
import { instagramUrl } from '../data';
import InstagramFeed from './InstagramFeed';
import muerdeLaTentacion from '../../assets/fotos burger/muerde la tentacion.jpeg';

export default function HomeCommunity() {
  return <section className="community" aria-label="La comunidad SHET">
    <div className="community__vibe">
      <img src="/assets/campaign/burger-playlist.jpg" alt="Hamburguesa SHET junto a la playlist de la marca" width="1200" height="1800" loading="lazy" decoding="async"/>
      <h2>CONÉCTATE A LA VIBRA DE SHET</h2>
      <a className="community__pill" href="/delivery" data-route>VER LA CARTA <ArrowUpRight aria-hidden="true"/></a>
    </div>
    <div className="community__photo">
      <img src={muerdeLaTentacion} alt="Muerde la tentación: hamburguesa SHET y polera de la marca" width="900" height="1600" loading="lazy" decoding="async"/>
    </div>
    <div className="community__instagram">
      <h2><a href={instagramUrl} target="_blank" rel="noreferrer">SÍGUENOS<br/>@SHETBURGER <ArrowUpRight aria-hidden="true"/></a></h2>
      <InstagramFeed/>
      <div className="community__social">
        <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram de SHET Burger"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>
      </div>
    </div>
  </section>;
}
