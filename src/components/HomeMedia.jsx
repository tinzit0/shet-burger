import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Flame, House, MapPin, Pause, Play, Sparkles, UsersRound } from 'lucide-react';
import video1 from '../../assets/videos shet o fotos/video1.mp4';
import { instagramUrl } from '../data';
import { business, directionsUrl } from '../config';
import useVideoPlayback from '../lib/useVideoPlayback';

const moodPhotos = [
  { src: '/assets/campaign/home-foto-1-1024.webp', alt: 'Dos hamburguesas SHET junto a su caja rosa', className: 'mood-card--hero', tag: 'DOBLE ANTOJO', width: 1024, height: 1365 },
  { src: '/assets/campaign/mesa-shet.jpg', alt: 'Selección de hamburguesas SHET servidas en platos rosados', className: 'mood-card--table', tag: 'BUENA COMPAÑÍA', width: 1200, height: 1800 },
  { src: '/assets/campaign/home-foto-3-1024.webp', alt: 'Entrega de una caja SHET durante la noche', className: 'mood-card--night', tag: 'NOCHE SHET', width: 1024, height: 1365 },
  { src: '/assets/campaign/shet-outside-1200.webp', alt: 'Hamburguesa SHET disfrutada al aire libre', className: 'mood-card--outside', tag: 'AL AIRE LIBRE', width: 1200, height: 1600 },
];

const moodTicker = ['SMASH HOT', 'PAN DE PAPA', 'PINK BOX', 'NONGUÉN'];

export function HomeActionBar() {
  return <nav className="home-actions" aria-label="Acciones rápidas">
    <a className="home-actions__item home-actions__item--pink" href="/delivery" data-route><span>Tu próximo buen plan</span><ArrowUpRight aria-hidden="true"/><strong>QUIERO SHET</strong><p>Elige tu burger. Nosotros prendemos la plancha.</p></a>
    <a className="home-actions__item home-actions__item--light" href="#ambiente"><span>Mira cómo nace</span><ArrowDownRight aria-hidden="true"/><strong>VE A LA PLANCHA</strong><p>Así se hace el desorden que tanto te gusta.</p></a>
  </nav>;
}

export function CampaignVideo({ src, poster, label, className = '' }) {
  const { videoRef, playing, togglePlayback } = useVideoPlayback({ src, lazy: true });
  const [failed, setFailed] = useState(false);
  return <>
    <div className={`film__media ${className}`}><video ref={videoRef} poster={poster} muted loop playsInline preload="metadata" aria-label={label} onError={() => setFailed(true)}/></div>
    {!failed && <button className="film__control" type="button" onClick={togglePlayback} aria-label={`${playing ? 'Pausar' : 'Reproducir'} ${label}`}>{playing ? <Pause aria-hidden="true"/> : <Play aria-hidden="true"/>}{playing ? 'PAUSAR' : 'REPRODUCIR'}</button>}
  </>;
}

export function ShetMood() {
  return <section className="mood section" id="promesa" aria-labelledby="mood-title">
    <header className="mood__intro" data-reveal>
      <div className="mood__title"><span className="mood__eyebrow">NO ES SOLO UNA BURGER</span><h2 id="mood-title">SHET<br/><em>Mood.</em></h2><p>Tu gente, una caja rosa y un buen motivo para juntarse.</p></div>
      <figure className="mood__moment">
        <div className="mood__moment-image"><img src="/assets/campaign/burger-playlist.jpg" alt="Hamburguesa SHET junto a un teléfono con el Instagram de la marca" width="1200" height="1800" loading="lazy" decoding="async"/></div>
        <figcaption><Sparkles aria-hidden="true"/> EL ANTOJO VA CONTIGO.</figcaption>
      </figure>
      <div className="mood__stamp">
        <span className="mood__origin-label"><MapPin aria-hidden="true"/> NUESTRO LUGAR EN EL MUNDO</span>
        <strong>De Nonguén,<br/>con actitud.</strong>
        <p>{business.pickupAddress}</p>
        <a href={directionsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR <ArrowUpRight aria-hidden="true"/></a>
      </div>
    </header>
    <div className="mood-ticker" aria-hidden="true">
      {[0, 1].map(track => <div className="mood-ticker__track" key={track}>{moodTicker.map(item => <span key={`${track}-${item}`}>{item}<i>•</i></span>)}</div>)}
    </div>
    <div className="mood__grid">
      {moodPhotos.map(photo => <figure className={`mood-card ${photo.className}`} data-reveal key={photo.src}><div className="mood-card__image"><img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async"/></div><figcaption className="mood-card__tag">{photo.tag}<Sparkles aria-hidden="true"/></figcaption></figure>)}
    </div>
    <div className="mood__note" data-reveal><Flame aria-hidden="true"/><strong>PLANCHA<br/>FUERTE.</strong><p>Pan de papa. Bordes crujientes. Salsas de la casa. Cero vueltas.</p><a href="/delivery" data-route>ENCUENTRA TU ANTOJO <ArrowUpRight aria-hidden="true"/></a></div>
  </section>;
}

export function BrandSignal() {
  return <section className="brand-signal" aria-label="La esencia SHET">
    <img className="brand-signal__pattern" src="/assets/campaign/shet-pattern-1600.webp" alt="" loading="lazy" decoding="async" data-drift/>
    <div className="brand-signal__words" aria-hidden="true">
      <div className="brand-signal__track"><span>FAT SMASH</span><span>PINK BOX</span><span>NO RULES</span></div>
      <div className="brand-signal__track brand-signal__track--clone"><span>FAT SMASH</span><span>PINK BOX</span><span>NO RULES</span></div>
    </div>
  </section>;
}

export function CampaignFilm() {
  return <section className="film" id="ambiente" aria-labelledby="film-title">
    <CampaignVideo src={video1} poster="/assets/campaign/hero-poster-960.webp" label="Preparación de una hamburguesa SHET"/>
    <div className="film__copy" data-reveal><span>DE LA PLANCHA A TUS MANOS</span><h2 id="film-title">HECHO EN<br/><em>NONGUÉN.</em></h2></div>
  </section>;
}

export function ShetClub() {
  return <section className="shet-club section" aria-labelledby="club-title">
    <header className="shet-club__heading" data-reveal><span>LA VIDA ALREDEDOR DE LA BURGER</span><h2 id="club-title">ENTRA AL<br/><em>Universo SHET.</em></h2></header>
    <div className="shet-club__grid">
      <article className="club-card club-card--photo" data-reveal>
        <img src="/assets/campaign/momento-shet.jpg" alt="Clienta disfrutando una hamburguesa SHET" width="1200" height="1800" loading="lazy" decoding="async" data-drift/>
        <div><span>EL ANTOJO</span><h3>SE COME<br/>SIN POSES.</h3></div>
      </article>
      <article className="club-card club-card--statement" data-reveal><span className="club-card__eyebrow"><Flame aria-hidden="true"/> ACTITUD SHET</span><h3>CRUJIENTE.<br/>JUGOSA.<br/><em>DESORDENADA.</em></h3><div className="club-card__traits"><span>FAT SMASH</span><span>PAN DE PAPA</span><span>HECHA AL MOMENTO</span></div><a href="/delivery" data-route>ARMA TU PEDIDO <ArrowUpRight aria-hidden="true"/></a></article>
      <a className="club-card club-card--social" href={instagramUrl} target="_blank" rel="noreferrer" data-reveal>
        <img src="/assets/campaign/auto-shet.jpg" alt="Amigos compartiendo hamburguesas SHET" width="1200" height="1800" loading="lazy" decoding="async" data-drift/>
        <div><span>SIGUE EL MOOD</span><h3>@SHETBURGER</h3><strong>VER INSTAGRAM <ArrowUpRight aria-hidden="true"/></strong></div>
      </a>
    </div>
    <div className="shet-plans" aria-labelledby="plans-title">
      <header data-reveal><span>SIEMPRE HAY UN BUEN MOTIVO</span><h3 id="plans-title">EL PLAN<br/>LO PONES TÚ.</h3><p>Nosotros ponemos las burgers.</p></header>
      <div className="shet-plans__links">
        <a href="/delivery" data-route data-reveal><House aria-hidden="true"/><h4>HOY NO SE COCINA.</h4><p>Tu favorita, directo a la casa.</p><span>PEDIR DELIVERY <ArrowUpRight aria-hidden="true"/></span></a>
        <a href="/delivery" data-route data-reveal><UsersRound aria-hidden="true"/><h4>JUNTA A LA BANDA.</h4><p>Burgers y combos para compartir.</p><span>VER EL MENÚ <ArrowUpRight aria-hidden="true"/></span></a>
        <a href={directionsUrl} target="_blank" rel="noreferrer" data-reveal><MapPin aria-hidden="true"/><h4>NOS VEMOS EN SHET.</h4><p>Pasa por tu pedido en Nonguén.</p><span>CÓMO LLEGAR <ArrowUpRight aria-hidden="true"/></span></a>
      </div>
    </div>
  </section>;
}

export default function HomeMedia() {
  return <><HomeActionBar/><ShetMood/><BrandSignal/><CampaignFilm/><ShetClub/></>;
}
