export const DELIVERY_ZONES = Object.freeze([
  { id: 'nonguen', label: 'Nonguén', fee: 1000 },
  { id: 'collao', label: 'Collao', fee: 1000 },
  { id: 'valle-noble', label: 'Valle Noble', fee: 1000 },
  { id: 'san-guillermo', label: 'San Guillermo', fee: 1000 },
  { id: 'palomares', label: 'Palomares', fee: 1000 },
  { id: 'km-10', label: 'Km 10', fee: 1000 },
  { id: 'concepcion-centro', label: 'Concepción Centro', fee: 3000 },
]);

export const getDeliveryZone = id => DELIVERY_ZONES.find(zone => zone.id === id) || null;

export const DELIVERY_UNAVAILABLE_MESSAGE = 'No llegamos a esa zona por el momento. Puedes elegir retiro en el local.';

export const composeDeliveryAddress = ({ street = '', number = '', population = '' }) => {
  const line = [street.trim(), number.trim()].filter(Boolean).join(' ');
  return line ? [line, population.trim(), 'Concepción'].filter(Boolean).join(', ') : '';
};

// Read the sector after the street number, even when city/country follow it.
// Street names before the number (e.g. Avenida Collao 123) are not sectors.
export const detectDeliveryZone = address => {
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\./g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\bkm\s*(\d+)/g, 'km $1').replace(/\s+/g, ' ').trim();
  const value = normalize(address);
  const firstPart = normalize(String(address || '').split(/[,;·]/)[0]);
  const afterNumber = value.match(/\b\d+[a-z]?\b(.*)$/)?.[1]?.trim() || '';
  // A different municipality must not inherit Concepción's "Centro" tariff.
  const otherCity = /\b(talcahuano|hualpen|san pedro de la paz|chiguayante|penco|tome|coronel|lota|hualqui)\b/;
  if (otherCity.test(afterNumber)) return null;
  const matches = DELIVERY_ZONES.filter(zone => {
    const labels = zone.id === 'km-10' ? ['km 10', 'kilometro 10', 'kilometros 10']
      : zone.id === 'concepcion-centro' ? ['concepcion centro', 'centro concepcion', 'centro de concepcion', 'centro']
      : [normalize(zone.label)];
    return labels.some(label => value === label || firstPart === label || ` ${afterNumber} `.includes(` ${label} `));
  });
  return matches.length === 1 ? matches[0] : null;
};

export const getDeliveryZoneFromAddress = address => {
  const zoneLabel = String(address || '').split(' · ')[0].trim().toLocaleLowerCase('es-CL');
  return DELIVERY_ZONES.find(zone => zone.label.toLocaleLowerCase('es-CL') === zoneLabel) || null;
};

export const getDeliveryFee = (mode, zoneId) => mode === 'delivery' ? (getDeliveryZone(zoneId)?.fee || 0) : 0;

export const calculateOrderTotal = (subtotal, mode, zoneId) => Number(subtotal || 0) + getDeliveryFee(mode, zoneId);

export const formatDeliveryAddress = (zoneId, streetAddress) => {
  const zone = getDeliveryZone(zoneId);
  return zone ? `${zone.label} · ${String(streetAddress || '').trim()}` : '';
};
