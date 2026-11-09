import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export default function ClosedPopup({ storeOpen, content }) {
  const [dismissed, setDismissed] = useState(false);
  const close = useRef(null);
  useEffect(() => { setDismissed(false); }, [storeOpen]);
  useEffect(() => {
    if (storeOpen || dismissed) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    close.current?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') setDismissed(true);
      if (event.key === 'Tab') { event.preventDefault(); close.current?.focus(); }
    };
    window.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, [storeOpen, dismissed]);
  if (storeOpen || dismissed) return null;
  return <div className="closed-popup" role="dialog" aria-modal="true" aria-labelledby="closed-title"><div className="closed-popup__card"><button ref={close} type="button" onClick={() => setDismissed(true)} aria-label="Cerrar aviso"><X/></button><img src="/assets/logo shet burger.png" alt="SHET BURGER"/><span>VOLVEMOS CON TODO</span><h2 id="closed-title">POR AHORA,<br/>CERRADO.</h2><p>{content.closedMessage || 'El local está cerrado. Pronto volveremos a encender la plancha.'}</p>{content.openingHours && <p className="closed-popup__hours">{content.openingHours}</p>}<small>Puedes recorrer la carta. Los pedidos se habilitan cuando abramos.</small></div></div>;
}
