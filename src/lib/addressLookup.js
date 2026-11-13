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

const STREET_WORDS = /\b(avenida|av|calle|pasaje|pje|psje|camino|diagonal|general|gral)\b/g;
const streetTokens = text => normalize(text).replace(/[^a-z0-9 ]/g, ' ').replace(STREET_WORDS, ' ').split(/\s+/).filter(Boolean);
/** "Av. Collao 1202, Concepción" → tokens of the street part only: ["collao"]. */
const enteredStreet = address => streetTokens(String(address || '').split(/\s\d/)[0]);
/** Same street when one name contains all the words of the other ("Collao" ~ "Avenida Ignacio Collao"). */
const sameStreet = (a, b) => a.length > 0 && b.length > 0 && (a.every(token => b.includes(token)) || b.every(token => a.includes(token)));
const enteredNumber = address => String(address || '').match(/\s(\d+)[a-z]?\b/i)?.[1] || '';

/**
 * Photon (OpenStreetMap) features → points on the street the customer typed.
 * Returns the exact house when OSM has the number; otherwise every segment of that street
 * (long streets cross several zones), so the caller can pick the segment inside a zone.
 * A feature on another street or in another city is never used.
 */
export function pointFromPhoton(features, address) {
  const street = enteredStreet(address), number = enteredNumber(address);
  const candidates = (features || []).filter(feature => {
    const place = feature?.properties || {};
    const coordinates = feature?.geometry?.coordinates;
    if (place.countrycode?.toUpperCase() !== 'CL' || normalize(place.city) !== 'concepcion') return false;
    if (!Array.isArray(coordinates) || !coordinates.every(Number.isFinite)) return false;
    return sameStreet(street, streetTokens(place.street || (place.type === 'street' ? place.name : '')));
  });
  const toPoint = feature => [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
  const exact = number && candidates.find(feature => String(feature.properties.housenumber || '').replace(/[^0-9]/g, '') === number);
  if (exact) return { point: toPoint(exact), precise: true };
  if (!candidates.length) return null;
  return { point: toPoint(candidates[0]), precise: false, alternatives: candidates.map(toPoint) };
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
const needsPin = point => Object.assign(new Error('No encontramos tu número exacto. Mueve el pin a tu casa en el mapa para calcular el despacho.'), { code: 'NEEDS_PIN', point });

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
  const sectorZone = detectDeliveryZone(value, zones);
  if (located && !located.precise && located.alternatives?.length) {
    // Street found but not the house: use the segment in the written sector, else the zone most of the street falls in.
    const hits = located.alternatives.map(point => ({ point, zone: zoneForPoint(point, zones) })).filter(hit => hit.zone);
    const inSector = sectorZone && hits.find(hit => hit.zone.id === sectorZone.id);
    const counts = hits.reduce((map, hit) => map.set(hit.zone.id, (map.get(hit.zone.id) || 0) + 1), new Map());
    const best = inSector || hits.sort((a, b) => counts.get(b.zone.id) - counts.get(a.zone.id))[0];
    if (best) return { zone: best.zone, point: best.point, precise: false, source: 'map' };
  }
  if (located) {
    const zone = zoneForPoint(located.point, zones);
    if (zone) return { zone, point: located.point, precise: located.precise, source: 'map' };
    // An exact house outside every polygon is out of coverage, whatever sector was typed.
    if (located.precise) throw unavailable(located.point);
  }
  if (sectorZone) return { zone: sectorZone, point: polygonCenter(sectorZone.polygon), precise: false, source: 'sector' };
  // Only an exact house can be declared out of coverage; a street-level guess needs the customer's pin.
  if (located) throw located.precise ? unavailable(located.point) : needsPin(located.point);
  if (networkFailed) throw new Error('No pudimos consultar el mapa. Marca tu casa en el mapa o incluye tu sector (ej.: Los Boldos 123, Nonguén).');
  // Another municipality is out of coverage; an address the map simply can't find needs the pin.
  if (/\b(talcahuano|hualpen|san pedro de la paz|chiguayante|penco|tome|coronel|lota|hualqui)\b/.test(normalize(value))) throw unavailable(null);
  throw Object.assign(new Error('No encontramos esa dirección. Revisa la calle y el número, o marca tu casa en el mapa.'), { code: 'NEEDS_PIN', point: null });
}

/** Street and house number at a map point (Photon reverse), for filling the form after the pin moves. */
export function addressFromReverse(features) {
  const places = (features || []).map(feature => feature?.properties || {}).filter(place => place.countrycode?.toUpperCase() !== 'XX');
  const street = place => place.street || (place.type === 'street' ? place.name : '');
  const withNumber = places.find(place => street(place) && place.housenumber);
  const best = withNumber || places.find(place => street(place));
  return best ? { street: street(best), number: String(best.housenumber || '').trim() } : null;
}

export async function reverseGeocode([lat, lng], { signal, fetcher = globalThis.fetch } = {}) {
  const endpoint = (import.meta.env?.VITE_PHOTON_URL?.trim() || 'https://photon.komoot.io/api/').replace(/\/api\/?$/, '/reverse');
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ lat: String(lat), lon: String(lng), limit: '5', radius: '0.15' }).toString();
  try {
    const response = await fetcher(url.toString(), { signal });
    if (!response.ok) return null;
    const { features } = await response.json();
    return addressFromReverse(features);
  } catch { return null; }
}
