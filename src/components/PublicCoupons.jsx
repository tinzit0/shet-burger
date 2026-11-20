import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { loadCoupons } from '../lib/coupons';
import { couponLabel, couponConditions } from '../lib/couponRules';

// The big figure printed on the ticket: what the customer actually gets.
function couponFigure(coupon) {
  switch (coupon.discount_type) {
    case 'buy_x_pay_y': return { value: `${coupon.buy_quantity}×${coupon.pay_quantity}`, unit: 'PROMO' };
    case 'free_delivery': return { value: 'GRATIS', unit: 'DELIVERY' };
    case 'percent':
    case 'quantity_percent': return { value: `${coupon.value}%`, unit: 'OFF' };
    default: return { value: `$${Number(coupon.value).toLocaleString('es-CL')}`, unit: 'MENOS' };
  }
}

const formatDate = value => new Date(value).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '').toUpperCase();

export default function PublicCoupons() {
  const [coupons, setCoupons] = useState([]), [copied, setCopied] = useState('');
  const resetTimer = useRef(null);
  useEffect(() => {
    let active = true;
    const refresh = async () => { try { const result = await loadCoupons(); if (active && !result.error) setCoupons(result.data || []); } catch {} };
    refresh(); const timer = setInterval(refresh, 15000); window.addEventListener('focus', refresh);
    return () => { active = false; clearInterval(timer); clearTimeout(resetTimer.current); window.removeEventListener('focus', refresh); };
  }, []);
  const available = coupons.filter(coupon => !coupon.expires_at || new Date(coupon.expires_at).getTime() > Date.now());
  if (!available.length) return null;

  const copy = async code => {
    try { await navigator.clipboard.writeText(code); setCopied(code); } catch { setCopied(''); return; }
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(''), 2400);
  };

  return <section className="public-coupons" aria-labelledby="public-coupons-title">
    <header className="public-coupons__head">
      <span className="public-coupons__eyebrow">CÓDIGOS SHET · SOLO EN LA WEB</span>
      <h2 id="public-coupons-title">UN EXTRA PARA TU ANTOJO.</h2>
      <p>Copia el código y pégalo en el carrito antes de pagar.</p>
    </header>
    <ul className="public-coupons__list">
      {available.map(coupon => {
        const figure = couponFigure(coupon), isCopied = copied === coupon.code;
        return <li key={coupon.id} className="coupon-ticket"><div className="coupon-ticket__card">
          <div className="coupon-ticket__body">
            <div className="coupon-ticket__figure" aria-hidden="true"><b>{figure.value}</b><span>{figure.unit}</span></div>
            <div className="coupon-ticket__copy">
              <h3>{coupon.title || couponLabel(coupon)}</h3>
              {coupon.title && <strong className="sr-only">{couponLabel(coupon)}</strong>}
              {coupon.description && <p>{coupon.description}</p>}
              <ul className="coupon-ticket__tags">
                <li>{coupon.min_subtotal > 0 ? `Desde $${Number(coupon.min_subtotal).toLocaleString('es-CL')}` : 'Sin mínimo'}</li>
                {coupon.expires_at && <li>Hasta {formatDate(coupon.expires_at)}</li>}
              </ul>
              <small>{couponConditions(coupon)}</small>
            </div>
          </div>
          <div className="coupon-ticket__stub">
            <span>TU CÓDIGO</span>
            <code>{coupon.code}</code>
            <button type="button" className={isCopied ? 'is-copied' : ''} onClick={() => copy(coupon.code)} aria-label={`Copiar código ${coupon.code}`}>
              {isCopied ? <Check aria-hidden="true"/> : <Copy aria-hidden="true"/>}{isCopied ? 'COPIADO' : 'COPIAR'}
            </button>
            <span className="sr-only" aria-live="polite">{isCopied ? `Código ${coupon.code} copiado` : ''}</span>
          </div>
        </div></li>;
      })}
    </ul>
  </section>;
}
