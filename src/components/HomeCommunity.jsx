import { useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Bookmark, Heart, MessageCircle, Send } from 'lucide-react';
import { instagramUrl } from '../data';
import { AutoVideo } from './HomeJetset';
import video2 from '../../assets/videos shet o fotos/video2.mp4';
import scrollVideo from '../../assets/fotos burger/scroll video.mp4';
import muerdeLaTentacion from '../../assets/fotos burger/muerde la tentacion.jpeg';

const InstagramIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;

/** Three equal panels, like Jetset: vibe video, photo, and an Instagram post with the feed scroll video. */
const panelNames = ['La vibra', 'Hecha al momento', 'Instagram'];

export default function HomeCommunity() {
  const scroller = useRef(null);
  const [active, setActive] = useState(0);
  const onScroll = () => {
    const el = scroller.current;
    if (!el?.firstElementChild) return;
    setActive(Math.min(panelNames.length - 1, Math.round(el.scrollLeft / el.firstElementChild.offsetWidth)));
  };
  const goTo = index => {
    const el = scroller.current;
    el?.scrollTo({ left: el.children[index].offsetLeft, behavior: 'smooth' });
  };
  const last = active === panelNames.length - 1;
  return <div className="community-wrap">
  <section ref={scroller} onScroll={onScroll} className="community" aria-label="La comunidad SHET">
    <div className="community__panel community__panel--vibe">
      <AutoVideo src={video2} poster="/assets/campaign/video-02-poster.jpg"/>
      <h2>CONÉCTATE<br/>A LA VIBRA<br/>DE SHET</h2>
      <a className="community__pill" href="/delivery" data-route>VER LA CARTA <ArrowUpRight aria-hidden="true"/></a>
    </div>
    <div className="community__panel community__panel--photo">
      <img src={muerdeLaTentacion} alt="Muerde la tentación: hamburguesa SHET y polera de la marca" width="900" height="1600" loading="lazy" decoding="async"/>
      <h2>HECHA AL<br/>MOMENTO</h2>
    </div>
    <div className="community__panel community__panel--follow">
      <h2>SÍGUENOS<br/>EN INSTAGRAM</h2>
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
    </div>
  </section>
  <div className="community__hint">
    <button type="button" className={`community__hint-label${last ? ' is-back' : ''}`} onClick={() => goTo(last ? 0 : active + 1)}>
      {last ? 'VOLVER AL INICIO' : 'DESLIZA PARA VER MÁS'} <ArrowRight aria-hidden="true"/>
    </button>
    <div className="community__dots">{panelNames.map((name, index) => <button key={name} type="button" className={index === active ? 'is-active' : ''} aria-label={`Ver ${name}`} aria-current={index === active || undefined} onClick={() => goTo(index)}/>)}</div>
  </div>
  </div>;
}
