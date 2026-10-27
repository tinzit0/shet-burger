import { MapPin, Navigation } from 'lucide-react';
import { business, directionsUrl, pickupMapEmbedUrl } from '../config';

export default function LocationSection() {
  return <section className="location section" id="ubicacion" aria-labelledby="location-title">
    <div className="location__heading" data-reveal><div><h2 id="location-title">TU SHET<br/><em>ESTÁ CERCA.</em></h2></div><p>Retira tu pedido en Río Loa 130, Nonguén, o pide despacho dentro de nuestras zonas disponibles.</p></div>
    <div className="location__grid">
      <div className="location__map" data-reveal><iframe title="Mapa del punto de retiro de SHET Burger en Río Loa 130" src={pickupMapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><div className="location__address"><MapPin/><strong>RÍO LOA 130 · NONGUÉN</strong></div></div>
      <div className="location__details" data-reveal><span>DELIVERY Y RETIRO</span><h3>VEN POR TU SHET<br/>O TE LA LLEVAMOS.</h3><p>Elige tu modalidad al finalizar el pedido. El costo de despacho se muestra según tu población.</p><a className="button button--primary" href={directionsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR <Navigation/></a><p className="location__note">Retiro sin costo en {business.pickupAddress}.</p></div>
    </div>
  </section>;
}
