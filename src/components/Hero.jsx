import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { instagramUrl } from '../data';
import miradaVideo from '../../assets/mirada.mp4';

export default function Hero({ onOrder }) {
  return <section className="hero-premium hero-premium--centered hero-premium--video" id="top">
    <video className="hero-premium__video" autoPlay muted loop playsInline preload="metadata" poster="/assets/hero.png" aria-hidden="true"><source src={miradaVideo} type="video/mp4"/></video>
    <div className="hero-premium__grain"/><div className="hero-premium__glow"/>
    <div className="hero-centered__copy">
      <p className="hero-premium__eyebrow">SMASH BURGERS · CONCEPCIÓN</p>
      <h1>EL SABOR<br/><em>SE ARMA</em><br/>CAPA A CAPA.</h1>
      <p className="hero-premium__lead">Doble smash, cheddar fundido y la joya de la casa. Hecha al momento para comerse sin pensarlo dos veces.</p>
      <div className="hero-premium__actions"><a className="hero-premium__primary" href="#menu">VER MENÚ <ArrowDown/></a><button className="hero-premium__secondary" type="button" onClick={onOrder}>ORDENAR AHORA <ArrowUpRight/></button></div>
    </div>
    <div className="hero-centered__detail"><span>HECHA AL MOMENTO</span><i/><span>SIN ATAJOS</span></div>
    <a className="hero-centered__scroll" href="#experiencia">DESCUBRE SHET <ArrowDown/></a>
  </section>;
}
