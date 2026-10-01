import { location, directionsUrl } from '../config';
import locationPhoto from '../../assets/videos shet o fotos/foto5.jpg';

export default function LocationSection({ compact = false }) {
  const { latitude: lat, longitude: lng, configured } = location;
  const mapUrl = configured ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng-.008},${lat-.005},${lng+.008},${lat+.005}&layer=mapnik` : null;
  const directions = directionsUrl;
  if (compact) return <section className="location-section location-section--campaign" id="ubicacion" aria-labelledby="location-title">
    <div className="location-campaign-ticker" aria-hidden="true"><div><span>ENCUENTRA EL ANTOJO&nbsp; · &nbsp;NONGUÉN&nbsp; · &nbsp;CONCEPCIÓN&nbsp; · &nbsp;</span><span>ENCUENTRA EL ANTOJO&nbsp; · &nbsp;NONGUÉN&nbsp; · &nbsp;CONCEPCIÓN&nbsp; · &nbsp;</span></div></div>
    <div className="location-copy" data-reveal>
      <p className="editorial-label">04 / DE CONCE, CON ACTITUD</p>
      <h2 id="location-title">AQUÍ<br/>VIVE<br/><em>SHET.</em></h2>
      <p className="location-campaign-intro">Una hamburguesa, una foto y cero ganas de compartir. El antojo también se vive afuera.</p>
      <p className="location-place">NONGUÉN<br/>CONCEPCIÓN.</p>
      <div className="location-campaign-actions">
        <a className="editorial-link" href="/delivery" data-route>PEDIR AHORA →</a>
        {configured ? <a className="editorial-link" href={directions} target="_blank" rel="noreferrer">CÓMO LLEGAR ↗</a> : <span className="location-campaign-pending">UBICACIÓN EXACTA<br/>POR CONFIRMAR.</span>}
      </div>
    </div>
    <div className="location-campaign-stage">
      <span className="location-campaign-word" data-drift aria-hidden="true">NONGUÉN</span>
      <figure className="location-map" data-reveal>
        <img className="location-campaign-photo" src={locationPhoto} alt="Disfrutando una hamburguesa SHET al aire libre" width="1170" height="1559" loading="lazy" decoding="async" data-drift/>
        <span className="location-photo-index">MOMENTO / 05</span>
        <figcaption><span>SHET EN LA CALLE.</span><span>CONCEPCIÓN, CHILE.</span></figcaption>
      </figure>
      <div className="location-campaign-card" data-reveal><small>PRUEBA IRREFUTABLE</small><strong>ASÍ SE VE<br/>EL ANTOJO.</strong><span>SONRÍE. MUERDE. REPITE.</span></div>
      <span className="location-campaign-badge" aria-hidden="true"><img src="/assets/logo shet burger.png" alt=""/>100%<br/>SHET</span>
    </div>
    <div className="location-campaign-bottom" aria-hidden="true"><span>NO POSAR</span><i/><span>SOLO DISFRUTAR</span><b>05 — 2026</b></div>
  </section>;
  return <section className="location-section" id="ubicacion" aria-labelledby="location-title">
    <div className="location-copy" data-reveal><p className="editorial-label">04 / DE CONCE, CON ACTITUD</p><h2 id="location-title">AQUÍ<br/>ESTÁ SHET.</h2><p className="location-place">NONGUÉN<br/>CONCEPCIÓN.</p>
      {configured ? <a className="editorial-link" href={directions} target="_blank" rel="noreferrer">CÓMO LLEGAR ↗</a> : <><button className="editorial-link" disabled>CÓMO LLEGAR ↗</button><p className="location-pending">Pronto encontrarás aquí nuestra ubicación exacta.</p></>}
    </div>
    <div className={`location-map${configured ? ' is-configured' : ''}`}>
      {configured ? <><iframe title="Mapa de ubicación de Shet Burger" src={mapUrl} loading="lazy" tabIndex={-1}/><span className="map-pin"><img src="/assets/logo shet burger.png" alt="Shet Burger" width="64" height="64"/></span><a className="map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© Colaboradores de OpenStreetMap</a></> : <div className="map-placeholder"><span className="map-cross" aria-hidden="true">↗</span><strong>DE NONGUÉN.<br/>PARA TU ANTOJO.</strong><span>UBICACIÓN EXACTA POR CONFIRMAR</span></div>}
    </div>
  </section>;
}
