import { ArrowUpRight } from 'lucide-react';
import { instagramUrl } from '../data';
import { business } from '../config';

export default function FooterCTA({ footerOnly = false }) {
  return <>
    {!footerOnly && <section className="footer-cta" id="pedir"><p className="eyebrow">EL SIGUIENTE MOVIMIENTO ES TUYO</p><h2 data-reveal>¿HAMBRE?<br/><em>PIDE SHET.</em></h2><a className="button button--primary" href="/delivery" data-route>PEDIR AHORA <ArrowUpRight/></a></section>}
    <footer className="site-footer">
      <div className="site-footer__brand"><a href="/" data-route aria-label="SHET BURGER — inicio"><img src="/assets/logo shet burger.png" width="72" height="72" alt=""/><span>SHET<br/>BURGER</span></a><p>FAT SMASH BURGERS<br/>DESDE NONGUÉN.</p></div>
      <div className="site-footer__info"><div><small>RETIRO</small><p>{business.pickupAddress}</p></div><div><small>PEDIDOS</small><p>Revisa el estado de apertura<br/>en nuestro menú.</p></div></div>
      <nav className="site-footer__nav" aria-label="Enlaces del pie"><a href="/delivery" data-route>PEDIR <ArrowUpRight/></a><a href={instagramUrl} target="_blank" rel="noreferrer">INSTAGRAM <ArrowUpRight/></a><a href="/admin">ADMINISTRACIÓN</a></nav>
      <div className="site-footer__bottom"><span>© {new Date().getFullYear()} SHET BURGER</span><span>CONCEPCIÓN, CHILE</span></div>
    </footer>
  </>;
}
