import { ArrowDown } from 'lucide-react';

// Kawaii sad face: droopy brows, frown, blush and a tear that drips on a loop.
export function SadFace({ tone = 'pink', className = '' }) {
  const fill = { pink: '#F09AC4', magenta: '#C2185B', cream: '#FFF9FF' }[tone] || tone;
  const ink = '#0A0A0A';
  return <svg className={`sad-face ${className}`} viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r="52" fill={fill} stroke={ink} strokeWidth="5"/>
    <path d="M30 42 l18 -7 M90 42 l-18 -7" stroke={ink} strokeWidth="5" strokeLinecap="round"/>
    <circle cx="42" cy="56" r="6" fill={ink}/>
    <circle cx="78" cy="56" r="6" fill={ink}/>
    <circle cx="44" cy="54" r="1.8" fill="#fff"/>
    <circle cx="80" cy="54" r="1.8" fill="#fff"/>
    <ellipse cx="30" cy="72" rx="8" ry="5" fill="#ff6fa8" opacity=".55"/>
    <ellipse cx="90" cy="72" rx="8" ry="5" fill="#ff6fa8" opacity=".55"/>
    <path d="M44 88 q16 -14 32 0" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round"/>
    <path className="sad-face__tear" d="M78 64 c-5 8 -7 12 -7 15 a7 7 0 0 0 14 0 c0 -3 -2 -7 -7 -15z" fill="#8fd3ff" stroke={ink} strokeWidth="3"/>
  </svg>;
}

// Big in-page notice for /delivery while the store switch is off.
export default function StoreClosed({ content = {} }) {
  return <section className="store-closed" role="status" aria-labelledby="store-closed-title">
    <div className="store-closed__card">
      <div className="store-closed__sign" aria-hidden="true"><i/><span>CERRADO</span></div>
      <div className="store-closed__faces" aria-hidden="true">
        <SadFace tone="pink" className="store-closed__face store-closed__face--a"/>
        <SadFace tone="magenta" className="store-closed__face store-closed__face--b"/>
        <SadFace tone="cream" className="store-closed__face store-closed__face--c"/>
      </div>
      <div className="store-closed__copy">
        <span className="store-closed__pill">VOLVEMOS PRONTO</span>
        <h2 id="store-closed-title">SHET BURGER<br/><em>ESTÁ CERRADO</em></h2>
        <p>{content.closedMessage || 'La plancha está apagada por ahora. Pronto volvemos a encenderla.'}</p>
        {content.openingHours && <p className="store-closed__hours">{content.openingHours}</p>}
        <a className="store-closed__link" href="#menu">MIENTRAS TANTO, MIRA LA CARTA <ArrowDown aria-hidden="true"/></a>
      </div>
    </div>
  </section>;
}
