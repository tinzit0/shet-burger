import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import useOpeningCountdown from '../lib/useOpeningCountdown';

export default function ClosedPopup({ storeOpen, content }) {
  const [dismissed, setDismissed] = useState(false);
  const close = useRef(null);
  const { time, countdown } = useOpeningCountdown(!storeOpen && !dismissed);
  useEffect(() => { setDismissed(false); }, [storeOpen]);
  useEffect(() => {
    if (storeOpen || dismissed) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    close.current?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') setDismissed(true);
      if (event.key === 'Tab') {
        const focusable = [...document.querySelectorAll('.closed-popup__card button')];
        const position = focusable.indexOf(document.activeElement);
        event.preventDefault();
        focusable[(position + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length]?.focus();
      }
    };
    window.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, [storeOpen, dismissed]);
  if (storeOpen || dismissed) return null;
  return <div className="closed-popup" role="dialog" aria-modal="true" aria-labelledby="closed-title">
    <div className="closed-popup__card">
      <button ref={close} type="button" className="closed-popup__close" onClick={() => setDismissed(true)} aria-label="Cerrar aviso"><X/></button>
      <div className="closed-popup__tape" aria-hidden="true">CERRADO ✳ CERRADO ✳ CERRADO</div>
      <img src="/assets/logo shet burger.png" alt="SHET BURGER"/>
      <h2 id="closed-title">ABRIMOS<br/>A LAS <em>{time}</em></h2>
      <p className="closed-popup__countdown">FALTAN <b>{countdown}</b></p>
      <p>{content.closedMessage || 'Por ahora la plancha está apagada. Puedes recorrer la carta y elegir tu SHET: los pedidos se habilitan al abrir.'}</p>
      {content.openingHours && <p className="closed-popup__hours">{content.openingHours}</p>}
      <button type="button" className="closed-popup__cta" onClick={() => setDismissed(true)}>VER LA CARTA <ArrowUpRight aria-hidden="true"/></button>
    </div>
  </div>;
}
