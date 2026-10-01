import { instagramUrl } from '../data';
export default function FooterCTA({ footerOnly = false }) {
  return <>{!footerOnly && <section className="editorial-cta" id="pedir"><p className="editorial-label">EL SIGUIENTE MOVIMIENTO ES TUYO.</p><h2 data-reveal>¿HAMBRE?<br/><span>PIDE SHET.</span></h2><a className="editorial-link" href="/delivery" data-route>PEDIR AHORA →</a></section>}
    <footer className="editorial-footer"><a className="brand" href="/" data-route><img src="/assets/logo shet burger.png" width="56" height="56" alt="Logo de Shet Burger"/><span>SHET BURGER</span></a><p>NONGUÉN<br/>CONCEPCIÓN.</p><nav aria-label="Enlaces del pie"><a href={instagramUrl} target="_blank" rel="noreferrer">Instagram ↗</a><a href={instagramUrl} target="_blank" rel="noreferrer">Contacto ↗</a><a href="/delivery" data-route>Pedidos ↗</a></nav><small>HAMBURGUESAS SIN LÍMITES<br/><a href="/admin">ADMINISTRACIÓN</a> · © {new Date().getFullYear()} SHET BURGER</small></footer></>;
}
