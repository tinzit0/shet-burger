import { detectDeliveryZone, DELIVERY_UNAVAILABLE_MESSAGE, DELIVERY_ZONES } from './delivery.js';
import { polygonCenter, zoneForPoint } from './geo.js';

let mapsReady;

function loadMaps() {
  if (window.google?.maps?.Geocoder) return Promise.resolve(window.google.maps);
  const key = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) return Promise.reject(new Error('La búsqueda de direcciones todavía no está habilitada. Intenta más tarde.'));
  if (mapsReady) return mapsReady;
  mapsReady = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    let timer;
    const fail = () => {
      clearTimeout(timer);
      delete window.shetMapsReady;
      script.remove();
      mapsReady = undefined;
      reject(new Error('No pudimos conectar con el servicio de direcciones. Intenta nuevamente.'));
    };
    window.shetMapsReady = () => {
      clearTimeout(timer);
      delete window.shetMapsReady;
      resolve(window.google.maps);
    };
    const params = new URLSearchParams({ key, callback: 'shetMapsReady', loading: 'async', language: 'es', region: 'CL' });
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = fail;
    timer = setTimeout(fail, 15000);
    document.head.appendChild(script);
  });
  return mapsReady;
}

const normalize = value => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const normalizeStreet = text => normalize(text).replace(/\b(avenida|av\.?|calle|pasaje|pje\.?)\b/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

/** Google result → map point, only for a precise street address in Concepción. */
export function pointFromGeocode(result) {
  if (!result || result.partial_match) return null;
  const components = result.address_components || [];
  const has = type => components.some(component => component.types.includes(type));
  const country = components.find(component => component.types.includes('country'));
  const city = components.filter(component => component.types.includes('locality')).map(component => normalize(component.long_name));
  if (country?.short_name !== 'CL' || !city.includes('concepcion') || !has('route') || !has('street_number')) return null;
  const location = result.geometry?.location;
  const lat = typeof location?.lat === 'function' ? location.lat() : location?.lat;
  const lng = typeof location?.lng === 'function' ? location.lng() : location?.lng;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { point: [lat, lng], precise: true } : null;
}

async function geocodeWithGoogle(address) {
  const maps = await loadMaps();
  const { results } = await new maps.Geocoder().geocode({ address, componentRestrictions: { country: 'CL', locality: 'Concepción' }, region: 'CL' });
  return results.length === 1 ? pointFromGeocode(results[0]) : null;
}

/**
 * Photon (OpenStreetMap) features → the best point on the street the customer typed.
 * A feature on another street or in another city is never used.
 */
export function pointFromPhoton(features, address) {
  const entered = normalizeStreet(address);
  const candidates = (features || []).filter(feature => {
    const place = feature?.properties || {};
    const coordinates = feature?.geometry?.coordinates;
    if (place.countrycode?.toUpperCase() !== 'CL' || normalize(place.city) !== 'concepcion') return false;
    if (!Array.isArray(coordinates) || !coordinates.every(Number.isFinite)) return false;
    const street = normalizeStreet(place.street || (place.type === 'street' ? place.name : ''));
    return street && ` ${entered} `.includes(` ${street} `);
  });
  const withNumber = candidates.find(feature => {
    const number = String(feature.properties.housenumber || '').replace(/[^0-9]/g, '');
    return number && new RegExp(`\\b${number}\\b`).test(address);
  });
  const best = withNumber || candidates[0];
  if (!best) return null;
  const [lng, lat] = best.geometry.coordinates;
  return { point: [lat, lng], precise: Boolean(withNumber) };
}

async function geocodeWithPhoton(address, { signal, fetcher }) {
  const endpoint = import.meta.env?.VITE_PHOTON_URL?.trim() || 'https://photon.komoot.io/api/';
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ q: address, limit: '6', lat: '-36.827', lon: '-73.014', countrycode: 'CL' }).toString();
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(cancel, 12000);
  try {
    const response = await fetcher(url.toString(), { signal: controller.signal });
    if (!response.ok) throw new Error('lookup unavailable');
    const { features } = await response.json();
    if (!Array.isArray(features)) throw new Error('invalid response');
    return pointFromPhoton(features, address);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

const unavailable = point => Object.assign(new Error(DELIVERY_UNAVAILABLE_MESSAGE), { code: 'DELIVERY_UNAVAILABLE', point });

/**
 * Finds where the address is on the map and which delivery polygon contains it.
 * Returns { zone, point, precise, source }. When the map cannot place the address but the
 * customer wrote a known sector, the sector is used and the pin starts in its center so the
 * customer can drop it on their house.
 */
export async function lookupDeliveryAddress(address, { signal, fetcher = globalThis.fetch, googleKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY, zones = DELIVERY_ZONES } = {}) {
  const value = String(address || '').trim();
  if (value.length < 6 || !/\d/.test(value)) throw new Error('Escribe la calle y el número de tu dirección.');
  let located = null, networkFailed = false;
  if (googleKey?.trim()) {
    try { located = await geocodeWithGoogle(value); } catch { /* Try the keyless provider as well. */ }
  }
  if (!located) {
    try { located = await geocodeWithPhoton(value, { signal, fetcher }); } catch { networkFailed = true; }
  }
  if (located) {
    const zone = zoneForPoint(located.point, zones);
    if (zone) return { zone, point: located.point, precise: located.precise, source: 'map' };
    // An exact house outside every polygon is out of coverage, whatever sector was typed.
    if (located.precise) throw unavailable(located.point);
  }
  const sectorZone = detectDeliveryZone(value, zones);
  if (sectorZone) return { zone: sectorZone, point: polygonCenter(sectorZone.polygon), precise: false, source: 'sector' };
  if (located) throw unavailable(located.point);
  if (networkFailed) throw new Error('No pudimos consultar el mapa. Marca tu casa en el mapa o incluye tu sector (ej.: Los Boldos 123, Nonguén).');
  throw unavailable(null);
}
