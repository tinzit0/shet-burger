import { useEffect, useRef, useState } from 'react';

// Leaflet only loads when a map is shown, so the home page stays light.
let leafletReady;
export function loadLeaflet() {
  leafletReady ||= Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]).then(([module]) => module.default || module);
  return leafletReady;
}

export const SHOP_POINT = [-36.83088, -73.00707];
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';
const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`;

export const pinIcon = (L, className = 'map-pin') => L.divIcon({
  className,
  html: '<svg viewBox="0 0 32 44" aria-hidden="true"><path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 43 16 43s15-16 15-27.2C31 7.6 24.3 1 16 1z"/><circle cx="16" cy="16" r="6"/></svg>',
  iconSize: [32, 44],
  iconAnchor: [16, 43],
});

export const shopIcon = L => L.divIcon({ className: 'map-shop', html: '<img src="/assets/logo shet burger.png" alt=""/>', iconSize: [38, 38], iconAnchor: [19, 19] });

/** Creates a Leaflet map in the container and returns it (null until ready). */
export function useLeafletMap(containerRef, options = {}) {
  const [state, setState] = useState(null);
  useEffect(() => {
    let map, cancelled = false;
    loadLeaflet().then(L => {
      if (cancelled || !containerRef.current) return;
      map = L.map(containerRef.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false, tap: true, ...options }).setView(SHOP_POINT, 13);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19, className: 'map-tiles' }).addTo(map);
      L.marker(SHOP_POINT, { icon: shopIcon(L), interactive: false, keyboard: false }).addTo(map);
      setState({ L, map });
    });
    // Stop any pan/zoom in flight first: removing a map mid-animation throws inside Leaflet.
    return () => { cancelled = true; if (map) { map.stop(); map.off(); map.remove(); } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

/** Checkout map: shows the delivery zones and a pin the customer can move by tapping or dragging. */
export default function DeliveryMap({ zones, point, onPick, activeZoneId }) {
  const containerRef = useRef(null);
  const leaflet = useLeafletMap(containerRef);
  const layersRef = useRef({ zones: null, pin: null });
  const pickRef = useRef(null);
  const userPickRef = useRef(null);
  // Remember points the customer chose on the map so we don't re-center under their finger.
  pickRef.current = next => { userPickRef.current = next; onPick?.(next); };

  useEffect(() => {
    if (!leaflet) return;
    const { L, map } = leaflet;
    layersRef.current.zones?.remove();
    const group = L.featureGroup(zones.filter(zone => zone.active !== false).map(zone => L.polygon(zone.polygon, {
      color: zone.color, weight: zone.id === activeZoneId ? 3 : 2, fillColor: zone.color, fillOpacity: zone.id === activeZoneId ? 0.28 : 0.12,
    }).bindTooltip(`${zone.label} · ${money(zone.fee)}`, { sticky: true, direction: 'top' }).on('click', event => pickRef.current?.([event.latlng.lat, event.latlng.lng]))));
    group.addTo(map);
    layersRef.current.zones = group;
    if (!layersRef.current.fitted && group.getLayers().length) { map.fitBounds(group.getBounds(), { padding: [12, 12] }); layersRef.current.fitted = true; }
  }, [leaflet, zones, activeZoneId]);

  useEffect(() => {
    if (!leaflet) return;
    const { map } = leaflet;
    const click = event => pickRef.current?.([event.latlng.lat, event.latlng.lng]);
    map.on('click', click);
    return () => map.off('click', click);
  }, [leaflet]);

  useEffect(() => {
    if (!leaflet) return;
    const { L, map } = leaflet;
    if (!point) { layersRef.current.pin?.remove(); layersRef.current.pin = null; return; }
    if (!layersRef.current.pin) {
      layersRef.current.pin = L.marker(point, { icon: pinIcon(L), draggable: true, autoPan: true, keyboard: true, title: 'Tu ubicación de entrega' })
        .on('dragend', event => { const { lat, lng } = event.target.getLatLng(); pickRef.current?.([lat, lng]); })
        .addTo(map);
    } else layersRef.current.pin.setLatLng(point);
    if (userPickRef.current !== point) map.setView(point, Math.max(map.getZoom(), 16), { animate: false });
  }, [leaflet, point]);

  return <div className="delivery-map" ref={containerRef} role="application" aria-label="Mapa de zonas de despacho. Toca el mapa para marcar tu casa."/>;
}
