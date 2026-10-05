import { MapPin, Navigation } from 'lucide-react';
import { business, directionsUrl, pickupMapEmbedUrl } from '../config';
import { DELIVERY_ZONES } from '../lib/delivery';

const money = value => `$${Number(value).toLocaleString('es-CL')}`;

export default function LocationSection() {
  return <section className="location section" id="ubicacion" aria-labelledby="location-title">
    <div className="section-meta"><span>06 / RETIRO Y DELIVERY</span><span>CONCEPCIÓN</span></div>
    <div className="location__heading" data-reveal><div><p className="eyebrow">ENCUENTRA EL CARRITO ROSA</p><h2 id="location-title">TU SHET<br/><em>ESTÁ CERCA.</em></h2></div><p>Retira tu pedido en Río Loa 130, Nonguén, o pide despacho dentro de nuestras zonas disponibles.</p></div>
    <div className="location__grid">
      <div className="location__map" data-reveal><iframe title="Mapa del punto de retiro de SHET Burger en Río Loa 130" src={pickupMapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><div className="location__address"><MapPin/><span><small>PUNTO DE RETIRO</small><strong>RÍO LOA 130 · NONGUÉN</strong></span></div></div>
      <div className="location__details" data-reveal><p className="eyebrow">ZONAS DE DESPACHO</p><ul>{DELIVERY_ZONES.map(zone => <li key={zone.id}><span>{zone.label}</span><b>{money(zone.fee)}</b></li>)}</ul><a className="button button--primary" href={directionsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR <Navigation/></a><p className="location__note">Retiro sin costo en {business.pickupAddress}.</p></div>
    </div>
  </section>;
}
