import { supabase } from './supabase';
import { DELIVERY_ZONES } from './delivery';
import { isValidPolygon } from './geo';

const toZone = row => ({
  id: String(row.id),
  label: String(row.label || '').trim(),
  fee: Math.max(0, Math.round(Number(row.fee) || 0)),
  color: /^#[0-9a-f]{6}$/i.test(row.color || '') ? row.color : '#EC3478',
  polygon: Array.isArray(row.polygon) ? row.polygon.map(([lat, lng]) => [Number(lat), Number(lng)]) : [],
  active: row.active !== false,
});

/**
 * Delivery zones from Supabase (table delivery_zones, see supabase/delivery-polygons.sql).
 * Falls back to the built-in outlines when the table is missing or empty, so checkout keeps working.
 */
export async function loadDeliveryZones({ includeInactive = false } = {}) {
  if (!supabase) return { zones: DELIVERY_ZONES, source: 'default' };
  const { data, error } = await supabase.from('delivery_zones').select('id,label,fee,color,polygon,active,position').order('position', { ascending: true });
  if (error || !data?.length) return { zones: DELIVERY_ZONES, source: 'default', error };
  const zones = data.map(toZone).filter(zone => zone.label && isValidPolygon(zone.polygon));
  return { zones: includeInactive ? zones : zones.filter(zone => zone.active), source: 'database' };
}

export function validateZones(zones) {
  const labels = new Set();
  for (const zone of zones) {
    const label = zone.label.trim();
    if (!label) return 'Cada zona necesita un nombre.';
    if (label.includes('·')) return `El nombre "${label}" no puede contener el carácter «·».`;
    if (labels.has(label.toLocaleLowerCase('es-CL'))) return `Hay dos zonas llamadas "${label}".`;
    labels.add(label.toLocaleLowerCase('es-CL'));
    if (!Number.isInteger(zone.fee) || zone.fee < 0 || zone.fee > 100000) return `La tarifa de "${label}" debe ser un número entre $0 y $100.000.`;
    if (!isValidPolygon(zone.polygon)) return `Dibuja al menos 3 puntos para "${label}".`;
  }
  return '';
}

export const saveDeliveryZones = (zones, token = null) => supabase.rpc('admin_save_delivery_zones', {
  p_zones: zones.map((zone, position) => ({ ...toZone(zone), label: zone.label.trim(), position })),
  p_token: token,
});
