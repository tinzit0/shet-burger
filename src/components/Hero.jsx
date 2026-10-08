import { ArrowDown, ArrowUpRight, Pause, Play } from 'lucide-react';
import miradaVideo from '../../assets/mirada.mp4';
import useVideoPlayback from '../lib/useVideoPlayback';

export default function Hero() {
  const { videoRef, playing, togglePlayback } = useVideoPlayback({ src: miradaVideo });

  return <section className="hero" id="top" aria-labelledby="hero-title">
    <div className="hero__scene">
      <div className="hero__frame">
        <video ref={videoRef} className="hero__media" src={miradaVideo} width="720" height="1280" muted loop playsInline preload="metadata" aria-hidden="true"/>
      </div>
    </div>
    <div className="hero__layout">
      <div className="hero__copy">
        <div className="hero__heading">
          <span className="hero__eyebrow">FAT SMASH BURGERS · CONCEPCIÓN</span>
          <h1 id="hero-title"><span>EL SABOR</span><em>se arma</em><span>CAPA A CAPA.</span></h1>
        </div>
        <div className="hero__content">
          <div className="hero__actions">
            <a className="button button--primary" href="/delivery" data-route>PEDIR AHORA <ArrowUpRight aria-hidden="true"/></a>
            <a className="hero__story" href="#promesa">CONOCE EL MOOD <ArrowDown aria-hidden="true"/></a>
          </div>
          <p className="hero__detail">Hecha al momento. Con actitud de Nonguén.</p>
        </div>
      </div>
    </div>
    <button type="button" className="hero__video-control" onClick={togglePlayback} aria-label={`${playing ? 'Pausar' : 'Reproducir'} video de portada`}>{playing ? <Pause aria-hidden="true"/> : <Play aria-hidden="true"/>}<span>{playing ? 'PAUSAR' : 'REPRODUCIR'}</span></button>
  </section>;
}
