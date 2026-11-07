import { useEffect, useState } from 'react';
import { loadCoupons } from '../lib/coupons';
import { couponLabel, couponConditions } from '../lib/couponRules';

export default function PublicCoupons() {
  const [coupons, setCoupons] = useState([]), [copied, setCopied] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = async () => { try { const result = await loadCoupons(); if (active && !result.error) setCoupons(result.data || []); } catch {} };
    refresh(); const timer = setInterval(refresh, 15000); window.addEventListener('focus', refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  const available = coupons.filter(coupon => !coupon.expires_at || new Date(coupon.expires_at).getTime() > Date.now());
  if (!available.length) return null;
  return <section className="public-coupons" aria-label="Promociones disponibles"><h2>UN EXTRA PARA TU ANTOJO.</h2><p>Elige tu promoción y aplica su código en el carrito.</p><div>{available.map(coupon => <article key={coupon.id}>{coupon.title&&<h3>{coupon.title}</h3>}<strong>{couponLabel(coupon)}</strong>{coupon.description&&<p>{coupon.description}</p>}<b>{coupon.code}</b><small>{couponConditions(coupon)}</small><small>{coupon.min_subtotal > 0 ? `Desde $${Number(coupon.min_subtotal).toLocaleString('es-CL')} en productos.` : 'Sin compra mínima.'}{coupon.expires_at && ` Hasta ${new Date(coupon.expires_at).toLocaleString('es-CL')}.`}</small><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(coupon.code); setCopied(coupon.code); } catch { setCopied(''); } }}>{copied === coupon.code ? 'COPIADO' : 'COPIAR CÓDIGO'}</button></article>)}</div></section>;
}
