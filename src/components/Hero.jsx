import { ArrowUpRight } from 'lucide-react';
import miradaVideo from '../../assets/mirada.mp4';
import useVideoPlayback from '../lib/useVideoPlayback';

export default function Hero({ content }) {
  const { videoRef } = useVideoPlayback({ src: miradaVideo });

  return <section className="hero" id="top" aria-labelledby="hero-title">
    <div className="hero__scene">
      <div className="hero__frame">
        <video ref={videoRef} className="hero__media" src={miradaVideo} poster="/assets/campaign/eye-poster.webp" width="720" height="1280" muted loop playsInline preload="metadata" aria-hidden="true"/>
      </div>
    </div>
    <div className="hero__layout">
      <div className="hero__copy">
        <div className="hero__heading">
          <span className="hero__eyebrow">{content.heroEyebrow}</span>
          <h1 id="hero-title"><span>{content.heroTitle}</span><em>{content.heroAccent}</em></h1>
        </div>
        <div className="hero__content">
          <div className="hero__actions">
            <a className="button button--primary" href="/delivery" data-route>{content.heroPrimaryLabel} <ArrowUpRight aria-hidden="true"/></a>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
