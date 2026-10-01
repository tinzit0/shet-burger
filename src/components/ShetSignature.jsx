import { useRef, useState } from 'react';
import foto1 from '../../assets/videos shet o fotos/foto1.jpg';
import foto2 from '../../assets/videos shet o fotos/foto2.jpg';
import foto4 from '../../assets/videos shet o fotos/foto4.jpg';

const signatures = [
  { number: '01', title: 'COSTRA.', kicker: 'EL SONIDO PRIMERO.', text: 'Carne contra la plancha. Fuego alto. Bordes que crujen antes del primer mordisco.', image: foto4, alt: 'Hamburguesas SHET listas para compartir' },
  { number: '02', title: 'JUGOSA.', kicker: 'SIN PEDIR DISCULPAS.', text: 'Cheddar fundido, doble carne y ese desorden que obliga a usar las dos manos.', image: foto1, alt: 'Dos hamburguesas SHET sostenidas al aire libre' },
  { number: '03', title: 'DE CALLE.', kicker: 'HECHA PARA SALIR.', text: 'Una caja rosa, cualquier esquina y el antojo resuelto. Así se vive SHET.', image: foto2, alt: 'Disfrutando una hamburguesa SHET en la calle' },
];

export default function ShetSignature() {
  const [active, setActive] = useState(0);
  const stage = useRef(null), frame = useRef(0), point = useRef(null);
  const move = event => {
    if (event.pointerType === 'touch') return;
    point.current = { x: event.clientX, y: event.clientY };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const rect = stage.current?.getBoundingClientRect();
      if (!rect || !point.current) return;
      stage.current.style.setProperty('--signature-x', `${((point.current.x - rect.left) / rect.width * 100).toFixed(1)}%`);
      stage.current.style.setProperty('--signature-y', `${((point.current.y - rect.top) / rect.height * 100).toFixed(1)}%`);
    });
  };
  return <section className="shet-signature" id="codigo-shet" aria-labelledby="signature-title">
    <div className="editorial-meta"><span>03 / EL CÓDIGO SHET</span><span>TOCA PARA DESCUBRIR</span></div>
    <div className="shet-signature__heading"><h2 id="signature-title" data-reveal>¿QUÉ HACE<br/><em>SHET A SHET?</em></h2><p>Tres reglas.<br/>Cero secretos. ↘</p></div>
    <div className="shet-signature__body">
      <div className="shet-signature__stage" ref={stage} onPointerMove={move} onPointerLeave={() => { stage.current?.style.removeProperty('--signature-x'); stage.current?.style.removeProperty('--signature-y'); }}>
        <div className="shet-signature__photos" aria-live="polite">
          {signatures.map((item, index) => <img className={index === active ? 'is-active' : ''} key={item.number} src={item.image} alt={index === active ? item.alt : ''} aria-hidden={index !== active} width="1170" height="1560" loading="lazy" decoding="async"/>)}
        </div>
        <span className="shet-signature__counter">{signatures[active].number} / 03</span>
        <span className="shet-signature__kicker">{signatures[active].kicker}</span>
        <span className="shet-signature__cursor" aria-hidden="true">VER</span>
      </div>
      <div className="shet-signature__list" role="tablist" aria-label="El código SHET">
        {signatures.map((item, index) => <button type="button" role="tab" aria-selected={active === index} className={active === index ? 'is-active' : ''} key={item.number} onClick={() => setActive(index)} onPointerEnter={event => { if (event.pointerType !== 'touch') setActive(index); }}>
          <small>{item.number}</small><strong>{item.title}</strong><span>{item.text}</span><i aria-hidden="true">↗</i>
        </button>)}
        <a className="editorial-link" href="/delivery" data-route>PRUEBA EL CÓDIGO →</a>
      </div>
    </div>
  </section>;
}
