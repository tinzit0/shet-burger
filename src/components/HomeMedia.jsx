import { useEffect, useRef, useState } from 'react';
import video1 from '../../assets/videos shet o fotos/video1.mp4';

const journalPhotos = [
  { src: '/assets/campaign/mesa-shet.jpg', alt: 'Selección de hamburguesas SHET servidas en platos rosados', shape: 'wide' },
  { src: '/assets/campaign/cowboy-smoke.jpg', alt: 'Hamburguesa SHET con aros de cebolla y tocino', shape: 'portrait' },
  { src: '/assets/campaign/auto-shet.jpg', alt: 'Amigos compartiendo hamburguesas SHET dentro de un auto', shape: 'portrait' },
  { src: '/assets/campaign/momento-shet.jpg', alt: 'Clienta disfrutando una hamburguesa SHET', shape: 'wide' },
];

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
      if (visible && allowed && !paused && !document.hidden && video.getAttribute('src')) video.play().catch(() => setPaused(true));
      else video.pause();
    };
    const loader = new IntersectionObserver(entries => { nearby = entries[0].isIntersecting; sync(); }, { rootMargin: '300px' });
    const player = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .12 });
    loader.observe(video); player.observe(video);
    reduced.addEventListener('change', sync); document.addEventListener('visibilitychange', sync); video.addEventListener('loadeddata', sync);
    return () => { cancelled = true; loader.disconnect(); player.disconnect(); reduced.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); video.removeEventListener('loadeddata', sync); video.pause(); };
  }, [src, paused, manual]);
  return <div className={`film__media ${className}`}>
    <video ref={ref} poster={poster} muted loop playsInline preload="metadata" aria-label={label} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)}/>
    {!failed && <button className="film__control" type="button" onClick={() => { if (ref.current.paused) { setManual(true); setPaused(false); } else setPaused(true); }} aria-label={`${playing ? 'Pausar' : 'Reproducir'} ${label}`}>{playing ? 'PAUSA' : 'REPRODUCIR'}</button>}
  </div>;
}

export function BrandPromise() {
  return <section className="promise section" id="promesa" aria-labelledby="promise-title">
    <div className="promise__grid">
      <div className="promise__copy" data-reveal><h2 id="promise-title">PLANCHA FUERTE.<br/><em>INGREDIENTES REALES.</em></h2><p>Carne contra el fierro, bordes crujientes, pan de papa y salsas que hacen lo suyo. Nada sobra. Nada se esconde.</p></div>
      <figure className="promise__photo promise__photo--large" data-reveal><img src="/assets/campaign/home-foto-1-1024.webp" srcSet="/assets/campaign/home-foto-1-640.webp 640w, /assets/campaign/home-foto-1-1024.webp 1024w" sizes="(max-width: 720px) 100vw, (max-width: 960px) 50vw, 30vw" alt="Hamburguesas SHET junto a su caja rosa" width="1024" height="1366" loading="lazy" decoding="async"/></figure>
      <figure className="promise__photo promise__photo--small" data-reveal><img src="/assets/campaign/home-foto-3-1024.webp" srcSet="/assets/campaign/home-foto-3-640.webp 640w, /assets/campaign/home-foto-3-1024.webp 1024w" sizes="(max-width: 720px) 72vw, (max-width: 960px) 50vw, 24vw" alt="Pedido SHET listo para llevar" width="1024" height="1366" loading="lazy" decoding="async"/></figure>
    </div>
  </section>;
}

export function PhotoJournal() {
  return <section className="photo-journal section" aria-labelledby="journal-title">
    <div className="photo-journal__heading" data-reveal>
      <h2 id="journal-title">SE VE BIEN.<br/><em>SABE MEJOR.</em></h2>
      <p>En la mesa, en el auto o camino a casa. La caja rosa siempre llega con algo bueno adentro.</p>
    </div>
    <div className="photo-journal__grid">
      {journalPhotos.map(photo => <figure className={`photo-journal__item photo-journal__item--${photo.shape}`} data-reveal key={photo.src}>
        <img src={photo.src} alt={photo.alt} width="1200" height="1800" loading="lazy" decoding="async"/>
      </figure>)}
    </div>
  </section>;
}

export function CampaignFilm() {
  return <section className="film" id="ambiente" aria-labelledby="film-title">
    <CampaignVideo src={video1} poster="/assets/campaign/hero-poster-960.webp" label="Preparación de una hamburguesa SHET"/>
    <div className="film__copy" data-reveal><h2 id="film-title">HECHO EN<br/><em>NONGUÉN.</em></h2></div>
  </section>;
}

export default function HomeMedia() {
  return <><BrandPromise/><PhotoJournal/><CampaignFilm/></>;
}
