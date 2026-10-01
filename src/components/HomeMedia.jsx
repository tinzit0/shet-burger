import { useEffect, useRef, useState } from 'react';
import foto1 from '../../assets/videos shet o fotos/foto1.jpg';
import foto2 from '../../assets/videos shet o fotos/foto2.jpg';
import foto3 from '../../assets/videos shet o fotos/foto3.jpg';
import foto4 from '../../assets/videos shet o fotos/foto4.jpg';
import video1 from '../../assets/videos shet o fotos/video1.mp4';
import video2 from '../../assets/videos shet o fotos/video2.mp4';

export const homePhotos = [foto1, foto2, foto3, foto4];
const descriptions = ['Dos hamburguesas SHET y su caja rosa al sol', 'Una pausa con SHET en la calle', 'Una caja SHET Burger entregada junto a un auto', 'Tres hamburguesas listas para compartir'];

function Photo({ index, className = '', children }) {
  return <figure className={`campaign-photo ${className}`} data-reveal>
    <div className="campaign-photo__frame" data-tilt><img src={homePhotos[index]} alt={descriptions[index]} width="1170" height="1560" loading="lazy" decoding="async" data-drift/></div>
    {children && <figcaption>{children}</figcaption>}
  </figure>;
}

// No src until near the viewport; playback stops outside it and in hidden tabs.
export function CampaignVideo({ src, poster, label, className = '' }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const video = ref.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, nearby = false, cancelled = false;
    const sync = () => {
      if (cancelled) return;
      const allowed = manual || (!reduced.matches && !navigator.connection?.saveData);
      if (nearby && allowed && !video.getAttribute('src')) { video.src = src; video.load(); }
      if (visible && allowed && !paused && !document.hidden && video.getAttribute('src')) {
        video.play().catch(error => { if (!cancelled && error.name !== 'AbortError') setPaused(true); });
      } else video.pause();
    };
    const loader = new IntersectionObserver(entries => { nearby = entries[0].isIntersecting; sync(); }, { rootMargin: '250px' });
    const player = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .1 });
    loader.observe(video); player.observe(video);
    reduced.addEventListener('change', sync); document.addEventListener('visibilitychange', sync); video.addEventListener('loadeddata', sync);
    return () => { cancelled = true; loader.disconnect(); player.disconnect(); reduced.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); video.removeEventListener('loadeddata', sync); video.pause(); };
  }, [src, paused, manual]);
  return <div className={`campaign-video ${className}`}>
    <video ref={ref} poster={poster} autoPlay muted loop playsInline preload="metadata" aria-label={label} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)}/>
    {!failed && <button className="campaign-video__control" type="button" onClick={() => { if (ref.current.paused) { setManual(true); setPaused(false); } else setPaused(true); }} aria-label={`${playing ? 'Pausar' : 'Reproducir'} ${label}`}>{playing ? 'PAUSA Ⅱ' : 'REPRODUCIR ↗'}</button>}
    {failed && <span className="campaign-video__control">VIDEO NO DISPONIBLE</span>}
  </div>;
}

export default function HomeMedia() {
  const [moving, setMoving] = useState(true);
  return <>
    <section className="campaign-intro" id="experiencia" aria-labelledby="campaign-title">
      <div className="editorial-meta"><span>01 / ESTO ES SHET</span><a href="#campaign-film">BAJA Y ABRE EL APETITO ↓</a></div>
      <div className="campaign-intro__composition">
        <h2 id="campaign-title" data-reveal>GRANDE.<br/><span>JUGOSA.</span><br/>SHET.</h2>
        <Photo index={0}><span>NO ES SOLO UNA HAMBURGUESA.</span><span>ES EL MOMENTO. ↗</span></Photo>
        <span className="campaign-stamp" aria-hidden="true">100%<br/>SHET.</span>
      </div>
      <p className="campaign-note">Manos ocupadas.<br/>Cero palabras.</p>
    </section>
    <div className="campaign-slice" aria-hidden="true">
      <div>{[0,1].map(n => <span key={n}>RECIÉN HECHA&nbsp; • &nbsp;DOBLE SABOR&nbsp; • &nbsp;CERO ATAJOS&nbsp; • &nbsp;</span>)}</div>
    </div>
    <section className="campaign-film" id="campaign-film" aria-labelledby="film-title">
      <CampaignVideo src={video1} poster={foto1} label="Video de campaña SHET 01"/>
      <div className="campaign-film__frame" aria-hidden="true"><i/><i/><span>REC ●</span><b>01 / 02</b></div>
      <div className="campaign-film__copy"><span>DESDE EL BARRIO. CON ACTITUD.</span><h2 id="film-title" data-reveal>HECHO EN<br/><em>NONGUÉN.</em></h2><span>SHET BURGER / CONCEPCIÓN, CHILE</span></div>
    </section>
    <section className="campaign-gallery" aria-labelledby="gallery-title">
      <div className="editorial-meta"><span>02 / FUERA DEL MOLDE</span><span>LA CALLE ES NUESTRA MESA.</span></div>
      <h2 id="gallery-title" data-reveal>BUEN SABOR.<br/><span>CERO MODALES.</span></h2>
      <span className="campaign-gallery__side" data-drift aria-hidden="true">ANTOJO · CALLE · SHET ·</span>
      <div className="campaign-gallery__layout">
        <Photo index={1} className="campaign-gallery__a"><span>01 — A TU RITMO.</span></Photo>
        <Photo index={3} className="campaign-gallery__b"><span>02 — MEJOR EN COMPAÑÍA.</span></Photo>
        <p className="campaign-gallery__type" data-reveal>A LO<br/><em>GRANDE.</em></p>
        <Photo index={0} className="campaign-gallery__c"><span>03 — DOBLE ACTITUD.</span></Photo>
        <Photo index={2} className="campaign-gallery__d"><span>04 — EL ANTOJO NO AVISA.</span></Photo>
        <p className="campaign-gallery__note">De día. De noche.<br/>Donde te pille el hambre.<br/><b>VIVE SHET. ↗</b></p>
      </div>
    </section>
    <section className="campaign-facts" aria-label="El sello de SHET Burger">
      <p className="campaign-facts__lead" data-reveal>NO VENDEMOS<br/><span>HAMBURGUESAS.</span><br/>VENDEMOS EL ANTOJO.</p>
      <div className="campaign-facts__list">
        <article data-reveal><small>01</small><strong>HECHA<br/>AL MOMENTO.</strong><span>Sin atajos.</span></article>
        <article data-reveal><small>02</small><strong>DOBLE<br/>ACTITUD.</strong><span>Sabor sin límites.</span></article>
        <article data-reveal><small>03</small><strong>DEL<br/>BARRIO.</strong><span>Nonguén, Concepción.</span></article>
      </div>
      <span className="campaign-facts__orbit" aria-hidden="true">SHET<br/>BURGER<i>★</i></span>
    </section>
    <div className={`campaign-marquee${moving ? '' : ' is-paused'}`}>
      <p className="sr-only">SHET BURGER — SABOR SIN LÍMITES — NONGUÉN — CONCEPCIÓN</p>
      <div aria-hidden="true">{[0,1].map(n => <span key={n}>SHET BURGER — SABOR SIN LÍMITES — NONGUÉN — CONCEPCIÓN —&nbsp;</span>)}</div>
      <button type="button" onClick={() => setMoving(value => !value)} aria-label={moving ? 'Pausar texto en movimiento' : 'Reanudar texto en movimiento'}>{moving ? 'PAUSA Ⅱ' : 'REPRODUCIR ↗'}</button>
    </div>
    <section className="campaign-sticky" aria-labelledby="sticky-title">
      <div className="campaign-sticky__visual"><CampaignVideo src={video2} poster={foto3} label="Video de campaña SHET 02"/><span className="campaign-sticky__edition">SHET EN MOVIMIENTO / VOL. 02</span></div>
      <div className="campaign-sticky__words"><p className="editorial-label">03 / SIN ATAJOS</p><h2 id="sticky-title"><span data-reveal>COME<br/><em>BIEN.</em></span><span data-reveal>VIVE<br/><em>SHET.</em></span></h2><p>El barrio se lleva dentro.<br/>El hambre, hasta aquí.</p><a className="editorial-link" href="/delivery" data-route>ENCUENTRA TU SHET ↗</a></div>
    </section>
  </>;
}
