import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import miradaVideo from '../../assets/mirada.mp4';

export default function Hero() {
  const videoRef = useRef(null);
  useEffect(() => {
    const video = videoRef.current, motion = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, activated = false;
    const sync = () => {
      const canPlay = activated && !motion.matches && !navigator.connection?.saveData;
      if (canPlay && !video.getAttribute('src')) { video.src = miradaVideo; video.load(); }
      if (visible && !document.hidden && canPlay) video.play().catch(() => {});
      else video.pause();
    };
    const activate = () => { activated = true; sync(); removeActivation(); };
    const removeActivation = () => {
      window.removeEventListener('scroll', activate);
      window.removeEventListener('pointerdown', activate);
      window.removeEventListener('keydown', activate);
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    observer.observe(video);
    window.addEventListener('scroll', activate, { passive: true, once: true });
    window.addEventListener('pointerdown', activate, { once: true });
    window.addEventListener('keydown', activate, { once: true });
    motion.addEventListener('change', sync);
    video.addEventListener('loadeddata', sync);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); removeActivation(); motion.removeEventListener('change', sync); video.removeEventListener('loadeddata', sync); document.removeEventListener('visibilitychange', sync); video.pause(); };
  }, []);
  return <section className="hero" id="top" aria-labelledby="hero-title">
    <video ref={videoRef} className="hero__media" muted loop playsInline preload="metadata" aria-hidden="true"/>
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
