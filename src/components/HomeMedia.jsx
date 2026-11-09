import { useState } from 'react';
import { MapPin, Pause, Play } from 'lucide-react';
import video1 from '../../assets/videos shet o fotos/video1.mp4';
import { business, directionsUrl } from '../config';
import useVideoPlayback from '../lib/useVideoPlayback';

function MoodSticker({ name, alt }) {
  return <picture className="mood-board__sticker">
    <source media="(prefers-reduced-motion: reduce)" srcSet={`/assets/caricaturas/${name}-still.png`}/>
    <img src={`/assets/caricaturas/${name}.gif`} alt={alt} width="140" height="140" loading="lazy"/>
  </picture>;
}

export function MoodStickers() {
  return <div className="mood-stickers" aria-label="Personajes de SHET Burger">
    <MoodSticker name="abrazo" alt="Bebida y hamburguesa kawaii abrazándose"/>
    <MoodSticker name="tocino" alt="Hamburguesa kawaii animada comiendo tocino"/>
  </div>;
}

export function CampaignVideo({ src, poster, label }) {
  const { videoRef, playing, togglePlayback } = useVideoPlayback({ src, lazy: true });
  const [failed, setFailed] = useState(false);

  return <>
    <div className="film__media"><video ref={videoRef} poster={poster} muted loop playsInline preload="metadata" aria-label={label} onError={() => setFailed(true)}/></div>
    {!failed && <button className="film__control" type="button" onClick={togglePlayback} aria-label={`${playing ? 'Pausar' : 'Reproducir'} ${label}`}>{playing ? <Pause aria-hidden="true"/> : <Play aria-hidden="true"/>}<span>{playing ? 'PAUSAR' : 'REPRODUCIR'}</span></button>}
  </>;
}

export function ShetMoodBoard() {
  return <section className="mood-board" id="promesa" aria-labelledby="mood-board-title">
    <div className="mood-board__collage">
      <header className="mood-board__title">
        <span className="sr-only">NO ES SOLO UNA BURGER</span>
        <h2 id="mood-board-title"><strong>SHET</strong><em>MOOD</em></h2>
      </header>
      <figure className="mood-board__photo mood-board__photo--outside">
        <img src="/assets/campaign/home-foto-1-1024.webp" alt="Dos hamburguesas SHET disfrutadas al aire libre" width="1024" height="1365" loading="lazy" decoding="async"/>
        <figcaption className="sr-only">AL AIRE LIBRE</figcaption>
      </figure>
      <figure className="mood-board__photo mood-board__photo--table">
        <img src="/assets/campaign/mesa-shet.jpg" alt="Tres hamburguesas SHET servidas en platos rosados" width="1200" height="1800" loading="lazy" decoding="async"/>
        <figcaption className="sr-only">PARA COMPARTIR</figcaption>
      </figure>
      <figure className="mood-board__photo mood-board__photo--people">
        <img src="/assets/campaign/momento-shet.jpg" alt="Clienta disfrutando una hamburguesa SHET" width="1200" height="1800" loading="lazy" decoding="async"/>
        <figcaption className="sr-only">SIN POSES</figcaption>
      </figure>
      <div className="mood-board__side">
        <p>CRUJIENTE.<br/>JUGOSA.<br/>DESORDENADA.</p>
        <figure className="mood-board__photo mood-board__photo--box"><img src="/assets/campaign/auto-shet.jpg" alt="Compartiendo hamburguesas SHET en el auto" width="1200" height="1800" loading="lazy" decoding="async"/></figure>
      </div>
    </div>
    <div className="sr-only"><span>FAT SMASH BURGERS</span><p>CRUJIENTE. JUGOSA. DESORDENADA.</p><p>LO QUE PASA ALREDEDOR DE UNA CAJA ROSA.</p></div>
  </section>;
}

export function CampaignFilm() {
  return <section className="film" id="ambiente" aria-labelledby="film-title">
    <CampaignVideo src={video1} poster="/assets/campaign/hero-poster-960.webp" label="Preparación de una hamburguesa SHET"/>
    <div className="film__copy" data-reveal>
      <span>DESDE NONGUÉN</span>
      <h2 id="film-title">DE LA PLANCHA<br/><em>a tus manos.</em></h2>
      <div className="film__details"><p>{business.pickupAddress}</p><a href={directionsUrl} target="_blank" rel="noreferrer"><MapPin aria-hidden="true"/> CÓMO LLEGAR</a></div>
    </div>
  </section>;
}

export default function HomeMedia() {
  return <><ShetMoodBoard/><CampaignFilm/></>;
}
