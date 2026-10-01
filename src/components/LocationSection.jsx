import { location } from '../config';

export default function LocationSection() {
  const { latitude: lat, longitude: lng, configured } = location;
  const mapUrl = configured ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng-.008},${lat-.005},${lng+.008},${lat+.005}&layer=mapnik` : null;
  const directions = configured ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : null;
  return <section className="location-section" id="ubicacion" aria-labelledby="location-title">
    <div className="location-copy" data-reveal><p className="editorial-label">04 / DE CONCE, CON ACTITUD</p><h2 id="location-title">FIND<br/>THE SHET.</h2><p className="location-place">NONGUÉN<br/>CONCEPCIÓN.</p>
      {configured ? <a className="editorial-link" href={directions} target="_blank" rel="noreferrer">CÓMO LLEGAR ↗</a> : <><button className="editorial-link" disabled>CÓMO LLEGAR ↗</button><p className="location-pending">Pronto encontrarás aquí nuestra ubicación exacta.</p></>}
    </div>
    <div className={`location-map${configured ? ' is-configured' : ''}`}>
      {configured ? <><iframe title="Mapa de ubicación de Shet Burger" src={mapUrl} loading="lazy" tabIndex={-1}/><span className="map-pin"><img src="/assets/logo shet burger.png" alt="Shet Burger" width="64" height="64"/></span><a className="map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></> : <div className="map-placeholder"><span className="map-cross" aria-hidden="true">↗</span><strong>DE NONGUÉN.<br/>PARA TU ANTOJO.</strong><span>UBICACIÓN EXACTA POR CONFIRMAR</span>{/* TODO: insertar coordenadas exactas de Shet Burger. */}</div>}
    </div>
  </section>;
}
