import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, ShoppingBag, UserRound, X } from 'lucide-react';

export default function Header({ cartCount = 0, onCart, latestOrder, onTrack, user, onAccount }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null), toggleRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    if (!open) return;
    const outside = [...document.querySelectorAll('main, .skip-link')];
    outside.forEach(el => { el.inert = true; });
    headerRef.current.querySelector('nav a')?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); }
      if (event.key !== 'Tab') return;
      const controls = [...headerRef.current.querySelectorAll('a,button')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const resize = () => { if (window.innerWidth > 900) setOpen(false); };
    document.addEventListener('keydown', keyboard); window.addEventListener('resize', resize);
    return () => { document.body.classList.remove('nav-open'); outside.forEach(el => { el.inert = false; }); document.removeEventListener('keydown', keyboard); window.removeEventListener('resize', resize); };
  }, [open]);

  const close = event => {
    setOpen(false);
    const hash = event?.currentTarget?.hash;
    if (hash) requestAnimationFrame(() => { const target = document.querySelector(hash); if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); } });
  };
  return <header ref={headerRef} className={`brand-header${scrolled ? ' is-scrolled' : ''}`}>
    <a className="brand-header__logo" href="#top" aria-label="SHET BURGER — inicio">
      <img src="/assets/logo shet burger.png" alt="" />
      <span>SHET BURGER</span>
    </a>
    <nav id="main-navigation" className={`brand-header__nav${open ? ' is-open' : ''}`} aria-label="Navegación principal">
      <a href="#menu" onClick={close}>Burgers</a>
      <a href="#ingredientes" onClick={close}>Nosotros</a>
      <a href="#ubicacion" onClick={close}>Ubicación</a>
      <a href="#opiniones" onClick={close}>Opiniones</a>
      <a href="#pedir" onClick={close}>Pedir</a>
      <button className="brand-header__mobile-account" type="button" onClick={()=>{close();onAccount()}}><UserRound/> {user ? 'Mis pedidos' : 'Ingresar con Google'}</button>
      {latestOrder&&<button className="brand-header__mobile-track" type="button" onClick={()=>{close();onTrack()}}>Ver compra <ShoppingBag/></button>}
      <a className="brand-header__mobile-admin" href="/admin" onClick={close}>Panel admin</a>
      <button className="brand-header__mobile-order" type="button" onClick={()=>{close();onCart()}}>Ordenar ahora <ArrowUpRight /></button>
    </nav>
    <div className="brand-header__utilities"><button className="brand-header__account" type="button" onClick={onAccount}><UserRound/> {user ? 'MIS PEDIDOS' : 'INGRESAR'}</button>{latestOrder && <button className="brand-header__track" type="button" onClick={onTrack}>VER COMPRA</button>}<a className="brand-header__admin" href="/admin">PANEL ADMIN</a><button className="brand-header__order" type="button" onClick={onCart}>PEDIDO <ShoppingBag size={15}/>{cartCount > 0 && <b>{cartCount}</b>}</button></div>
    <button ref={toggleRef} className="brand-header__toggle" type="button" onClick={() => setOpen(value => !value)} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="main-navigation"><span>{open ? 'CERRAR' : 'MENÚ'}</span>{open ? <X /> : <Menu />}</button>
  </header>;
}
