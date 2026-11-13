import { formatPoint, parsePointFromAddress } from './geo.js';

// Starting delivery zones. The admin "Zonas de despacho" tab stores the real polygons and fees
// in Supabase; these shapes are only the initial outline around each sector (verify in the admin).
// Polygon vertices are [lat, lng].
export const DELIVERY_ZONES = Object.freeze([
  { id: 'nonguen', label: 'Nonguén', fee: 1000, color: '#EC3478', polygon: [[-36.826, -73.016], [-36.826, -72.998], [-36.835, -72.985], [-36.86, -72.975], [-36.865, -72.99], [-36.85, -73.01], [-36.84, -73.022]] },
  { id: 'collao', label: 'Collao', fee: 1000, color: '#8E44AD', polygon: [[-36.806, -73.037], [-36.806, -73.013], [-36.826, -73.013], [-36.826, -73.016], [-36.834, -73.0195], [-36.834, -73.037]] },
  { id: 'valle-noble', label: 'Valle Noble', fee: 1000, color: '#2E86DE', polygon: [[-36.808, -73.013], [-36.808, -72.997], [-36.8205, -72.998], [-36.826, -72.998], [-36.826, -73.013]] },
  { id: 'san-guillermo', label: 'San Guillermo', fee: 1000, color: '#16A085', polygon: [[-36.802, -72.997], [-36.802, -72.972], [-36.818, -72.965], [-36.822, -72.965], [-36.8205, -72.98], [-36.8205, -72.998], [-36.808, -72.997]] },
  { id: 'palomares', label: 'Palomares', fee: 1000, color: '#F39C12', polygon: [[-36.8205, -72.998], [-36.826, -72.998], [-36.835, -72.985], [-36.838, -72.97], [-36.822, -72.965], [-36.8205, -72.98]] },
  { id: 'km-10', label: 'Km 10', fee: 1000, color: '#27AE60', polygon: [[-36.812, -72.952], [-36.812, -72.925], [-36.835, -72.925], [-36.835, -72.952]] },
  { id: 'concepcion-centro', label: 'Concepción Centro', fee: 3000, color: '#C0392B', polygon: [[-36.8195, -73.063], [-36.8195, -73.0395], [-36.835, -73.0395], [-36.835, -73.063]] },
].map(zone => Object.freeze({ ...zone, active: true })));

export const getDeliveryZone = (id, zones = DELIVERY_ZONES) => zones.find(zone => zone.id === id) || null;

export const DELIVERY_UNAVAILABLE_MESSAGE = 'No llegamos a esa zona por el momento. Puedes elegir retiro en el local.';

export const composeDeliveryAddress = ({ street = '', number = '', population = '' }) => {
  const line = [street.trim(), number.trim()].filter(Boolean).join(' ');
  return line ? [line, population.trim(), 'Concepción'].filter(Boolean).join(', ') : '';
};

// Read the sector after the street number, even when city/country follow it.
// Street names before the number (e.g. Avenida Collao 123) are not sectors.
export const detectDeliveryZone = (address, zones = DELIVERY_ZONES) => {
  const normalize = value => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\./g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\bkm\s*(\d+)/g, 'km $1').replace(/\s+/g, ' ').trim();
  const value = normalize(address);
  const firstPart = normalize(String(address || '').split(/[,;·]/)[0]);
  const afterNumber = value.match(/\b\d+[a-z]?\b(.*)$/)?.[1]?.trim() || '';
  // A different municipality must not inherit Concepción's "Centro" tariff.
  const otherCity = /\b(talcahuano|hualpen|san pedro de la paz|chiguayante|penco|tome|coronel|lota|hualqui)\b/;
  if (otherCity.test(afterNumber)) return null;
  const matches = zones.filter(zone => zone.active !== false).filter(zone => {
    const labels = zone.id === 'km-10' ? ['km 10', 'kilometro 10', 'kilometros 10']
      : zone.id === 'concepcion-centro' ? ['concepcion centro', 'centro concepcion', 'centro de concepcion', 'centro']
      : [normalize(zone.label)];
    return labels.some(label => value === label || firstPart === label || ` ${afterNumber} `.includes(` ${label} `));
  });
  return matches.length === 1 ? matches[0] : null;
};

export const getDeliveryZoneFromAddress = (address, zones = DELIVERY_ZONES) => {
  const zoneLabel = String(address || '').split(' · ')[0].trim().toLocaleLowerCase('es-CL');
  return zones.find(zone => zone.label.toLocaleLowerCase('es-CL') === zoneLabel) || null;
};

export const getDeliveryFee = (mode, zoneId, zones = DELIVERY_ZONES) => mode === 'delivery' ? (getDeliveryZone(zoneId, zones)?.fee || 0) : 0;

export const calculateOrderTotal = (subtotal, mode, zoneId, zones = DELIVERY_ZONES) => Number(subtotal || 0) + getDeliveryFee(mode, zoneId, zones);

/** "Zona · dirección · lat,lng" — the server reads the zone label before the first " · ". */
export const formatDeliveryAddress = (zoneId, streetAddress, zones = DELIVERY_ZONES, point = null) => {
  const zone = getDeliveryZone(zoneId, zones);
  if (!zone) return '';
  return [zone.label, String(streetAddress || '').trim(), formatPoint(point)].filter(Boolean).join(' · ');
};

/** Google Maps link for the pin saved with a delivery order, for the rider. */
export const deliveryMapsUrl = address => {
  const point = parsePointFromAddress(address);
  return point ? `https://www.google.com/maps/search/?api=1&query=${point[0]},${point[1]}` : null;
};

/** Address for people: without the trailing map coordinates. */
export const displayDeliveryAddress = address => String(address || '').replace(/\s*·\s*-?\d{1,2}\.\d{3,},\s*-?\d{1,3}\.\d{3,}\s*$/, '');
