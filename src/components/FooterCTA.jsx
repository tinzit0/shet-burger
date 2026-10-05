import { ArrowUpRight } from 'lucide-react';
import { instagramUrl } from '../data';
import { business } from '../config';

export default function FooterCTA({ footerOnly = false }) {
  return <>
    {!footerOnly && <section className="footer-cta" id="pedir"><h2 data-reveal>¿HAMBRE?<br/><em>PIDE SHET.</em></h2><a className="button button--primary" href="/delivery" data-route>PEDIR AHORA <ArrowUpRight/></a></section>}
    <footer className="site-footer">
      <div className="site-footer__brand"><a href="/" data-route aria-label="SHET BURGER — inicio"><img src="/assets/logo shet burger.png" width="72" height="72" alt=""/><span>SHET<br/>BURGER</span></a></div>
      <div className="site-footer__info"><p>{business.pickupAddress}</p><p>Estado y horarios disponibles en el menú.</p></div>
      <nav className="site-footer__nav" aria-label="Enlaces del pie"><a href="/delivery" data-route>PEDIR <ArrowUpRight/></a><a href={instagramUrl} target="_blank" rel="noreferrer">INSTAGRAM <ArrowUpRight/></a><a href="/admin">ADMINISTRACIÓN</a></nav>
    </footer>
  </>;
}
