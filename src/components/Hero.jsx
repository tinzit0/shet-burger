import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import miradaVideo from '../../assets/mirada.mp4';

export default function Hero({ onOrder }) {
  const videoRef = useRef(null);
  useEffect(() => {
    const video = videoRef.current, motion = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !motion.matches) video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    observer.observe(video);
    motion.addEventListener('change', sync);
    video.addEventListener('loadeddata', sync);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); motion.removeEventListener('change', sync); video.removeEventListener('loadeddata', sync); document.removeEventListener('visibilitychange', sync); video.pause(); };
  }, []);
  return <section className="hero-premium hero-premium--centered hero-premium--video" id="top">
    <video ref={videoRef} className="hero-premium__video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true"><source src={miradaVideo} type="video/mp4"/></video>
    <div className="hero-premium__grain"/><div className="hero-premium__glow"/>
    <div className="hero-centered__copy">
      <p className="hero-premium__eyebrow">HAMBURGUESAS · CONCEPCIÓN</p>
      <h1>EL SABOR<br/><em>SE ARMA</em><br/>CAPA A CAPA.</h1>
      <p className="hero-premium__lead">Doble carne a la plancha, cheddar fundido y la joya de la casa. Hecha al momento para comerse sin pensarlo dos veces.</p>
      <div className="hero-premium__actions"><a className="hero-premium__primary" href="/delivery" data-route>VER MENÚ <ArrowDown/></a><button className="hero-premium__secondary" type="button" onClick={onOrder}>ORDENAR AHORA <ArrowUpRight/></button></div>
    </div>
    <div className="hero-centered__detail"><span>HECHA AL MOMENTO</span><i/><span>SIN ATAJOS</span></div>
    <a className="hero-centered__scroll" href="#experiencia">DESCUBRE SHET <ArrowDown/></a>
  </section>;
}
