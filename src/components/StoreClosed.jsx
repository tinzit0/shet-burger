import Asterisk from './Asterisk';
import { ArrowDown } from 'lucide-react';
import useOpeningCountdown from '../lib/useOpeningCountdown';

/** Moving black tape that says the store is closed. */
export function ClosedTape() {
  return <div className="closed-tape" aria-hidden="true">{[0, 1].map(track => <div key={track}>{Array.from({ length: 4 }, (_, i) => <span key={i}>CERRADO<i><Asterisk/></i>VOLVEMOS A LAS 18:00<i><Asterisk/></i></span>)}</div>)}</div>;
}

// Big in-page notice for /delivery while the store switch is off.
export default function StoreClosed({ content = {} }) {
  const { time, countdown } = useOpeningCountdown();
  return <section className="store-closed" role="status" aria-labelledby="store-closed-title">
    <ClosedTape/>
    <div className="store-closed__inner">
      <div className="store-closed__copy">
        <span className="store-closed__pill"><i/>PLANCHA APAGADA</span>
        <h2 id="store-closed-title">ABRIMOS<br/>A LAS <em>{time}</em></h2>
        <p className="store-closed__countdown">FALTAN <b>{countdown}</b></p>
      </div>
      <div className="store-closed__side">
        <p>{content.closedMessage || 'Ahora estamos cerrados. Prepara el antojo: a las 18:00 prendemos la plancha y empezamos a recibir pedidos.'}</p>
        {content.openingHours && <p className="store-closed__hours">{content.openingHours}</p>}
        <a className="store-closed__link" href="#menu">MIENTRAS TANTO, ARMA TU PEDIDO <ArrowDown aria-hidden="true"/></a>
      </div>
    </div>
  </section>;
}
