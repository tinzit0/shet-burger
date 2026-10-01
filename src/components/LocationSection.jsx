import { business, directionsUrl, pickupMapEmbedUrl } from '../config';
import locationPhoto from '../../assets/videos shet o fotos/foto5.jpg';

export default function LocationSection({ compact = false }) {
  if (compact) return <section className="location-section location-section--campaign" id="ubicacion" aria-labelledby="location-title">
    <div className="location-campaign-ticker" aria-hidden="true"><div><span>PIDE O RETIRA&nbsp; · &nbsp;RÍO LOA 130&nbsp; · &nbsp;NONGUÉN&nbsp; · &nbsp;</span><span>PIDE O RETIRA&nbsp; · &nbsp;RÍO LOA 130&nbsp; · &nbsp;NONGUÉN&nbsp; · &nbsp;</span></div></div>
    <div className="location-copy" data-reveal>
      <p className="editorial-label">04 / PUNTO DE RETIRO</p>
      <h2 id="location-title">AQUÍ<br/>RETIRAS<br/><em>SHET.</em></h2>
      <p className="location-campaign-intro">No es un local. Es el punto donde comienza tu antojo: busca el carrito SHET y retira tu pedido.</p>
      <p className="location-place">RÍO LOA 130<br/>NONGUÉN.</p>
      <div className="location-campaign-actions"><a className="editorial-link" href="/delivery" data-route>PEDIR AHORA →</a><a className="editorial-link" href={directionsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR ↗</a></div>
    </div>
    <div className="location-campaign-stage">
      <span className="location-campaign-word" data-drift aria-hidden="true">NONGUÉN</span>
      <figure className="location-map" data-reveal>
        <img className="location-campaign-photo" src={locationPhoto} alt="Disfrutando una hamburguesa SHET al aire libre" width="1170" height="1559" loading="lazy" decoding="async" data-drift/>
        <span className="location-photo-index">MOMENTO / 05</span>
        <figcaption><span>SHET EN LA CALLE.</span><span>CONCEPCIÓN, CHILE.</span></figcaption>
      </figure>
      <div className="location-campaign-card" data-reveal><small>PUNTO DE RETIRO</small><strong>BUSCA EL<br/>CARRITO SHET.</strong><span>RÍO LOA 130 · NONGUÉN</span></div>
      <span className="location-campaign-badge" aria-hidden="true"><img src="/assets/logo shet burger.png" alt=""/>100%<br/>SHET</span>
    </div>
    <section className="pickup-map-section" aria-labelledby="pickup-map-title">
      <div className="pickup-map-copy" data-reveal><span>UBICACIÓN EXACTA</span><h3 id="pickup-map-title">LLEGA AL<br/><em>CARRITO.</em></h3><p>{business.pickupAddress}</p><a className="editorial-link" href={directionsUrl} target="_blank" rel="noreferrer">ABRIR RUTA EN GOOGLE MAPS ↗</a></div>
      <div className="pickup-map-frame" data-reveal><iframe title="Mapa del punto de retiro de SHET Burger en Río Loa 130" src={pickupMapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/><span aria-hidden="true">RÍO LOA<br/><b>130</b></span></div>
    </section>
    <div className="location-campaign-bottom" aria-hidden="true"><span>PIDE EN LÍNEA</span><i/><span>RETIRA EN EL CARRITO</span><b>RÍO LOA 130</b></div>
  </section>;

  return <section className="location-section" id="ubicacion" aria-labelledby="location-title">
    <div className="location-copy" data-reveal><p className="editorial-label">04 / PUNTO DE RETIRO</p><h2 id="location-title">AQUÍ<br/>RETIRAS SHET.</h2><p className="location-place">RÍO LOA 130<br/>NONGUÉN.</p><a className="editorial-link" href={directionsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR ↗</a></div>
    <div className="location-map is-configured"><iframe title="Mapa del punto de retiro de SHET Burger" src={pickupMapEmbedUrl} loading="lazy" tabIndex={-1}/><span className="map-pin"><img src="/assets/logo shet burger.png" alt="Shet Burger" width="64" height="64"/></span></div>
  </section>;
}
