import { ArrowDown, ArrowUpRight } from 'lucide-react';

export default function Hero() {
  return <section className="hero" id="top" aria-labelledby="hero-title">
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
