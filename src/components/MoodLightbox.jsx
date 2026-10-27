import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

export default function MoodLightbox({ photos, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const dialogRef = useRef(null);
  const touchStart = useRef(null);
  const photo = photos[index];
  const move = direction => setIndex(current => (current + direction + photos.length) % photos.length);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  const keyDown = event => {
    if (event.key === 'Tab') {
      const buttons = [...dialogRef.current.querySelectorAll('button:not([disabled])')];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    }
  };

  return <dialog ref={dialogRef} className="mood-lightbox" aria-labelledby="lightbox-title" onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={keyDown} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="mood-lightbox__layout">
      <header><span>EL UNIVERSO SHET</span><button type="button" autoFocus onClick={onClose} aria-label="Cerrar galería"><X aria-hidden="true"/></button></header>
      <figure onTouchStart={event => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={event => { const start = touchStart.current; touchStart.current = null; if (!start) return; const touch = event.changedTouches[0]; const dx = touch.clientX - start.x; const dy = touch.clientY - start.y; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1); }} onTouchCancel={() => { touchStart.current = null; }}>
        <img key={photo.src} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height}/>
        <figcaption aria-live="polite" aria-atomic="true"><span>0{index + 1} / 0{photos.length}</span><h2 id="lightbox-title">{photo.tag}</h2></figcaption>
      </figure>
      <nav className="mood-lightbox__navigation" aria-label="Navegar fotografías"><button type="button" onClick={() => move(-1)} aria-label="Foto anterior"><ArrowLeft aria-hidden="true"/></button><div>{photos.map((item, photoIndex) => <button type="button" key={item.src} aria-label={`Ver foto ${photoIndex + 1}: ${item.tag}`} aria-pressed={index === photoIndex} onClick={() => setIndex(photoIndex)}><span/></button>)}</div><button type="button" onClick={() => move(1)} aria-label="Foto siguiente"><ArrowRight aria-hidden="true"/></button></nav>
    </div>
  </dialog>;
}
