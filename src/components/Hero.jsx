import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import miradaVideo from '../../assets/mirada.mp4';

export default function Hero() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;

    const syncPlayback = () => {
      const canPlay = !reducedMotion.matches && !navigator.connection?.saveData;
      if (visible && !document.hidden && canPlay) video.play().catch(() => {});
      else video.pause();
    };

    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncPlayback();
    }, { threshold: 0.05 });

    observer.observe(video);
    reducedMotion.addEventListener('change', syncPlayback);
    document.addEventListener('visibilitychange', syncPlayback);
    video.addEventListener('loadeddata', syncPlayback);
    syncPlayback();

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', syncPlayback);
      document.removeEventListener('visibilitychange', syncPlayback);
      video.removeEventListener('loadeddata', syncPlayback);
      video.pause();
    };
  }, []);

  return <section className="hero" id="top" aria-labelledby="hero-title">
    <video ref={videoRef} className="hero__media" src={miradaVideo} muted loop playsInline preload="metadata" aria-hidden="true"/>
    <div className="hero__overlay"/>
    <div className="hero__content">
      <p className="eyebrow">FAT SMASH BURGERS · CONCEPCIÓN</p>
      <h1 id="hero-title">EL SABOR<br/><em>SE ARMA</em><br/>CAPA A CAPA.</h1>
      <p className="hero__lead">Costra, cheddar fundido y ese desorden perfecto. Hecha al momento en Nonguén.</p>
      <div className="hero__actions"><a className="button button--primary" href="/delivery" data-route>PEDIR SHET <ArrowUpRight/></a><a className="text-link" href="#promesa">CONOCE LA HISTORIA <ArrowDown/></a></div>
    </div>
    <div className="hero__meta"><span>HECHA AL MOMENTO</span><i/><span>SIN ATAJOS</span></div>
  </section>;
}
