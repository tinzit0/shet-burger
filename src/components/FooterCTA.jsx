import { instagramUrl } from '../data';
export default function FooterCTA({ onOrder }) {
  return <><section className="editorial-cta" id="pedir"><p className="editorial-label">EL SIGUIENTE MOVIMIENTO ES TUYO.</p><h2 data-reveal>HUNGRY?<br/><span>ORDER SHET.</span></h2><button className="editorial-link" type="button" onClick={onOrder}>PEDIR →</button></section>
    <footer className="editorial-footer"><a className="brand" href="#top"><img src="/assets/logo shet burger.png" width="56" height="56" alt="Logo de Shet Burger"/><span>SHET BURGER</span></a><p>NONGUÉN<br/>CONCEPCIÓN.</p><nav aria-label="Enlaces del pie"><a href={instagramUrl} target="_blank" rel="noreferrer">Instagram ↗</a><a href={instagramUrl} target="_blank" rel="noreferrer">Contacto ↗</a><button type="button" onClick={onOrder}>Pedidos ↗</button></nav><small>FAT SMASH BURGERS<br/><a href="/admin">ADMIN</a> · © {new Date().getFullYear()} SHET BURGER</small></footer></>;
}
