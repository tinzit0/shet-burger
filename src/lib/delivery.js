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
