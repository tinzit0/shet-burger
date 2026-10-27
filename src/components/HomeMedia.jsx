import { useState } from 'react';
import { ArrowUpRight, MapPin, Pause, Play } from 'lucide-react';
import video1 from '../../assets/videos shet o fotos/video1.mp4';
import { instagramUrl } from '../data';
import { business, directionsUrl } from '../config';
import useVideoPlayback from '../lib/useVideoPlayback';

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
    <header className="mood-board__header" data-reveal>
      <span>NO ES SOLO UNA BURGER</span>
      <h2 id="mood-board-title"><strong>SHET</strong><em>MOOD</em></h2>
      <p>NONGUÉN,<br/>BUENA BURGER<br/>Y CERO POSE.</p>
    </header>
    <div className="mood-board__grid">
      <figure className="mood-board__photo mood-board__photo--outside" data-reveal>
        <img src="/assets/campaign/home-foto-1-1024.webp" alt="Dos hamburguesas SHET disfrutadas al aire libre" width="1024" height="1365" loading="lazy" decoding="async"/>
        <figcaption>AL AIRE LIBRE</figcaption>
      </figure>
      <figure className="mood-board__photo mood-board__photo--table" data-reveal>
        <img src="/assets/campaign/mesa-shet.jpg" alt="Tres hamburguesas SHET servidas en platos rosados" width="1200" height="1800" loading="lazy" decoding="async"/>
        <figcaption>PARA COMPARTIR</figcaption>
      </figure>
      <figure className="mood-board__photo mood-board__photo--people" data-reveal>
        <img src="/assets/campaign/momento-shet.jpg" alt="Clienta disfrutando una hamburguesa SHET" width="1200" height="1800" loading="lazy" decoding="async"/>
        <figcaption>SIN POSES</figcaption>
      </figure>
      <div className="mood-board__statement" data-reveal>
        <span>FAT SMASH BURGERS</span>
        <strong>CRUJIENTE.<br/>JUGOSA.<br/><em>DESORDENADA.</em></strong>
        <a href="/delivery" data-route>VER LA CARTA <ArrowUpRight aria-hidden="true"/></a>
      </div>
    </div>
    <div className="brand-tape" aria-hidden="true">
      {[0, 1].map(track => <div key={track}><span>FAT SMASH</span><i>✳</i><span>PINK BOX</span><i>✳</i><span>NONGUÉN</span><i>✳</i></div>)}
    </div>
    <div className="mood-board__social" data-reveal>
      <p>LO QUE PASA ALREDEDOR<br/>DE UNA CAJA ROSA.</p>
      <a href={instagramUrl} target="_blank" rel="noreferrer">SÍGUENOS @SHETBURGER <ArrowUpRight aria-hidden="true"/></a>
    </div>
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
