import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, ShoppingBag, X } from 'lucide-react';
import { instagramUrl } from '../data';

export default function Header({ cartCount = 0, onCart, latestOrder, onTrack }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    return () => document.body.classList.remove('nav-open');
  }, [open]);

  const close = () => setOpen(false);
  return <header className={`brand-header${scrolled ? ' is-scrolled' : ''}`}>
    <a className="brand-header__logo" href="#top" aria-label="SHET BURGER — inicio">
      <img src="/assets/logo shet burger.png" alt="" />
      <span>SHET BURGER</span>
    </a>
    <nav className={`brand-header__nav${open ? ' is-open' : ''}`} aria-label="Navegación principal">
      <a href="#top" onClick={close}>Inicio</a>
      <a href="#menu" onClick={close}>Menú</a>
      <a href="#ingredientes" onClick={close}>Nosotros</a>
      <a href={instagramUrl} target="_blank" rel="noreferrer" onClick={close}>Contacto</a>
      <a className="brand-header__mobile-admin" href="/admin" onClick={close}>Panel admin</a>
      <a className="brand-header__mobile-order" href={instagramUrl} target="_blank" rel="noreferrer" onClick={close}>Ordenar ahora <ArrowUpRight /></a>
    </nav>
    <div className="brand-header__utilities">{latestOrder && <button className="brand-header__track" type="button" onClick={onTrack}>VER COMPRA</button>}<a className="brand-header__admin" href="/admin">PANEL ADMIN</a><button className="brand-header__order" type="button" onClick={onCart}>PEDIDO <ShoppingBag size={15}/>{cartCount > 0 && <b>{cartCount}</b>}</button></div>
    <button className="brand-header__toggle" type="button" onClick={() => setOpen(value => !value)} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open}><span>{open ? 'CERRAR' : 'MENÚ'}</span>{open ? <X /> : <Menu />}</button>
  </header>;
}
