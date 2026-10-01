import { location, directionsUrl } from '../config';
import { homePhotos } from './HomeMedia';

export default function LocationSection({ compact = false }) {
  const { latitude: lat, longitude: lng, configured } = location;
  const mapUrl = configured ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng-.008},${lat-.005},${lng+.008},${lat+.005}&layer=mapnik` : null;
  const directions = directionsUrl;
  return <section className={`location-section${compact ? ' location-section--campaign' : ''}`} id="ubicacion" aria-labelledby="location-title">
    <div className="location-copy" data-reveal><p className="editorial-label">04 / DE CONCE, CON ACTITUD</p><h2 id="location-title">AQUÍ<br/>ESTÁ SHET.</h2><p className="location-place">NONGUÉN<br/>CONCEPCIÓN.</p>
      {configured ? <a className="editorial-link" href={directions} target="_blank" rel="noreferrer">CÓMO LLEGAR ↗</a> : <><button className="editorial-link" disabled>CÓMO LLEGAR ↗</button><p className="location-pending">Pronto encontrarás aquí nuestra ubicación exacta.</p></>}
    </div>
    <div className={`location-map${configured ? ' is-configured' : ''}`}>
      {compact ? <img className="location-campaign-photo" src={homePhotos[1]} alt="Una pausa con SHET Burger al sol" width="1170" height="1560" loading="lazy" decoding="async"/> : configured ? <><iframe title="Mapa de ubicación de Shet Burger" src={mapUrl} loading="lazy" tabIndex={-1}/><span className="map-pin"><img src="/assets/logo shet burger.png" alt="Shet Burger" width="64" height="64"/></span><a className="map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© Colaboradores de OpenStreetMap</a></> : <div className="map-placeholder"><span className="map-cross" aria-hidden="true">↗</span><strong>DE NONGUÉN.<br/>PARA TU ANTOJO.</strong><span>UBICACIÓN EXACTA POR CONFIRMAR</span></div>}
    </div>
  </section>;
}
