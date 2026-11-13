import { ArrowUpRight, Bookmark, Heart, MessageCircle, Send } from 'lucide-react';
import { instagramUrl } from '../data';
import { AutoVideo } from './HomeJetset';
import scrollVideo from '../../assets/fotos burger/scroll video.mp4';

const InstagramIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;

/** Black band with one big Instagram post (the feed scroll video), outlined in white. */
export default function HomeCommunity() {
  return <section className="community" aria-labelledby="community-title">
    <div className="community__intro">
      <span className="community__eyebrow"><InstagramIcon/> @SHETBURGER</span>
      <h2 id="community-title">SÍGUENOS<br/><em>EN INSTAGRAM</em></h2>
      <p>Promos, lanzamientos y lo que sale de la plancha cada noche. Todo pasa primero en nuestro Instagram.</p>
      <a className="community__cta" href={instagramUrl} target="_blank" rel="noreferrer">SEGUIR A @SHETBURGER <ArrowUpRight aria-hidden="true"/></a>
    </div>
    <a className="ig-post" href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Abrir el Instagram de SHET Burger (@shetburger)">
      <span className="ig-post__header">
        <span className="ig-post__avatar"><img src="/assets/logo shet burger.png" alt="" width="40" height="40" loading="lazy"/></span>
        <span className="ig-post__user"><b>shetburger</b><small>Nonguén, Concepción</small></span>
        <InstagramIcon/>
      </span>
      <span className="ig-post__media"><AutoVideo src={scrollVideo} poster="/assets/campaign/scroll-video-poster.webp" label="Recorrido por el feed de Instagram de SHET Burger"/></span>
      <span className="ig-post__actions" aria-hidden="true"><Heart/><MessageCircle/><Send/><Bookmark/></span>
      <span className="ig-post__follow"><InstagramIcon/> SEGUIR A @SHETBURGER</span>
    </a>
  </section>;
}
