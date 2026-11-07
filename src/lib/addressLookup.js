import { detectDeliveryZone, getDeliveryZone, DELIVERY_UNAVAILABLE_MESSAGE } from './delivery.js';

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

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function zoneFromGeocode(result) {
  if (result.partial_match) return null;
  const components = result.address_components || [];
  const names = type => components.filter(component => component.types.includes(type)).map(component => normalize(component.long_name));
  const country = components.find(component => component.types.includes('country'));
  if (country?.short_name !== 'CL' || !names('locality').includes('concepcion')) return null;
  if (!names('route').length || !names('street_number').length) return null;
  // Do not classify a street name or the entire city as a delivery sector.
  const sectors = components.filter(component => component.types.some(type => type === 'neighborhood' || type === 'sublocality' || type.startsWith('sublocality_level_')));
  const matches = sectors.map(component => {
    const name = normalize(component.long_name);
    return name === 'centro' ? getDeliveryZone('concepcion-centro') : detectDeliveryZone(name);
  }).filter(Boolean);
  return new Set(matches.map(zone => zone.id)).size === 1 ? matches[0] : null;
}

async function lookupGoogleAddress(address) {
  const maps = await loadMaps();
  let results;
  try {
    ({ results } = await new maps.Geocoder().geocode({
      address,
      componentRestrictions: { country: 'CL', locality: 'Concepción' },
      region: 'CL',
    }));
  } catch (error) {
    if (error.code === 'ZERO_RESULTS') throw new Error('No encontramos esa dirección. Revisa la calle y el número.');
    throw new Error('No pudimos consultar la dirección. Intenta nuevamente en unos momentos.');
  }
  if (results.length !== 1 || results[0].partial_match) throw new Error('La dirección no es precisa. Agrega el número y la ciudad para ubicarla.');
  const result = results[0];
  const zone = zoneFromGeocode(result);
  if (!zone) throw new Error('No pudimos confirmar cobertura para esta dirección. Revisa la dirección completa; aún no se ha calculado un cobro.');
  return { zone, formattedAddress: result.formatted_address };
}

export function zoneFromPhoton(feature) {
  const place = feature?.properties || {};
  if (place.countrycode?.toUpperCase() !== 'CL' || normalize(place.city) !== 'concepcion') return null;
  const sectors = [place.district, place.locality, place.suburb, place.neighbourhood].filter(Boolean);
  const zones = sectors.map(sector => normalize(sector) === 'centro' ? getDeliveryZone('concepcion-centro') : detectDeliveryZone(sector)).filter(Boolean);
  return new Set(zones.map(zone => zone.id)).size === 1 ? zones[0] : null;
}

export async function lookupDeliveryAddress(address, { signal, fetcher = globalThis.fetch, googleKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY } = {}) {
  const value = String(address || '').trim();
  if (value.length < 6 || !/\d/.test(value)) throw new Error('Escribe la calle y el número de tu dirección.');
  // A written delivery sector is sufficient to quote the existing flat rate.
  // This is a tariff lookup, not a claim that the house was verified by a map.
  const explicitZone = detectDeliveryZone(value);
  if (explicitZone) return { zone: explicitZone, formattedAddress: value, source: 'sector' };
  if (googleKey?.trim()) {
    try { return await lookupGoogleAddress(value); } catch { /* Try the keyless provider as well. */ }
  }
  const endpoint = import.meta.env?.VITE_PHOTON_URL?.trim() || 'https://photon.komoot.io/api/';
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ q: value, limit: '5', lat: '-36.827', lon: '-73.014', countrycode: 'CL' }).toString();
  let features;
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(cancel, 12000);
  try {
    const response = await fetcher(url.toString(), { signal: controller.signal });
    if (!response.ok) throw new Error('lookup unavailable');
    ({ features } = await response.json());
    if (!Array.isArray(features)) throw new Error('invalid response');
  } catch {
    throw new Error('No pudimos consultar el mapa. Incluye tu sector en la dirección (ej.: Los Boldos 123, Nonguén) para calcular la tarifa automáticamente.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
  // A search may return a nearby POI or another street. Never quote those results.
  const candidates = features.filter(feature => {
    const place = feature.properties || {};
    const street = place.street || (place.type === 'street' ? place.name : '');
    const normalizeStreet = text => normalize(text).replace(/\b(avenida|av\.?|calle|pasaje|pje\.?)\b/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    const streetName = normalizeStreet(street);
    const entered = normalizeStreet(value);
    return streetName && ` ${entered} `.includes(` ${streetName} `) && (!place.housenumber || new RegExp(`\\b${String(place.housenumber).replace(/[^0-9]/g, '')}\\b`).test(value));
  });
  const zones = candidates.map(zoneFromPhoton);
  if (!zones.length || zones.some(zone => !zone) || new Set(zones.map(zone => zone.id)).size !== 1) {
    throw Object.assign(new Error(DELIVERY_UNAVAILABLE_MESSAGE), { code: 'DELIVERY_UNAVAILABLE' });
  }
  return { zone: zones[0], formattedAddress: value, source: 'photon' };
}
