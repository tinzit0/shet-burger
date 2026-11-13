import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Eraser, MapPin, Plus, Save, Trash2, Undo2 } from 'lucide-react';
import { useLeafletMap } from './DeliveryMap';
import { saveDeliveryZones, validateZones } from '../lib/deliveryZones';
import { pointInPolygon, pointOnPolygonEdge, polygonCenter } from '../lib/geo';

const money = value => `$${Number(value || 0).toLocaleString('es-CL')}`;
const palette = ['#EC3478', '#8E44AD', '#2E86DE', '#16A085', '#F39C12', '#27AE60', '#C0392B', '#D35400', '#7F8C8D'];
const slug = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'zona';
const clone = zones => zones.map(zone => ({ ...zone, polygon: zone.polygon.map(vertex => [...vertex]) }));

/** Index of the polygon edge closest to the point, so a click inserts the vertex where it belongs. */
function nearestEdge(polygon, [lat, lng]) {
  let best = 0, bestDistance = Infinity;
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    const dx = b[1] - a[1], dy = b[0] - a[0];
    const t = Math.max(0, Math.min(1, ((lng - a[1]) * dx + (lat - a[0]) * dy) / (dx * dx + dy * dy || 1)));
    const distance = (a[1] + t * dx - lng) ** 2 + (a[0] + t * dy - lat) ** 2;
    if (distance < bestDistance) { bestDistance = distance; best = i; }
  });
  return best + 1;
}

/** Zones that share territory: the first one in the list wins at checkout. */
function overlaps(zones) {
  const pairs = [];
  zones.forEach((a, i) => zones.slice(i + 1).forEach(b => {
    if (a.active === false || b.active === false) return;
    const inside = (vertex, polygon) => pointInPolygon(vertex, polygon) && !pointOnPolygonEdge(vertex, polygon);
    if (a.polygon.some(vertex => inside(vertex, b.polygon)) || b.polygon.some(vertex => inside(vertex, a.polygon))) pairs.push(`${a.label} y ${b.label}`);
  }));
  return pairs;
}

export default function AdminDeliveryZones({ zones: initialZones, token, onSaved }) {
  const [zones, setZones] = useState(() => clone(initialZones));
  const [selectedId, setSelectedId] = useState(initialZones[0]?.id || null);
  const [history, setHistory] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const leaflet = useLeafletMap(containerRef, { scrollWheelZoom: true, doubleClickZoom: false });
  const drawRef = useRef(null);
  const zonesRef = useRef(zones);
  zonesRef.current = zones;

  useEffect(() => { if (!dirty) setZones(clone(initialZones)); }, [initialZones]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = zones.find(zone => zone.id === selectedId) || null;
  const conflicts = useMemo(() => overlaps(zones), [zones]);

  const change = updater => {
    setHistory(stack => [...stack.slice(-30), clone(zonesRef.current)]);
    setZones(current => updater(clone(current)));
    setDirty(true); setNotice(''); setError('');
  };
  const updateZone = (id, patch) => change(list => list.map(zone => zone.id === id ? { ...zone, ...patch } : zone));
  const setPolygon = (id, polygon) => updateZone(id, { polygon });
  const undo = () => setHistory(stack => { if (!stack.length) return stack; setZones(stack[stack.length - 1]); setDirty(true); return stack.slice(0, -1); });

  // Draw every zone; the selected one gets draggable vertices and "+" handles on each edge.
  useEffect(() => {
    if (!leaflet) return;
    const { L, map } = leaflet;
    drawRef.current?.remove();
    const group = L.layerGroup().addTo(map);
    drawRef.current = group;
    zones.forEach(zone => {
      const isSelected = zone.id === selectedId;
      let shape = null;
      if (zone.polygon.length >= 2) {
        // Only the zone being edited is interactive: clicks elsewhere add points to it.
        shape = (zone.polygon.length >= 3 ? L.polygon : L.polyline)(zone.polygon, {
          interactive: false, color: zone.color, weight: isSelected ? 3 : 2, dashArray: zone.active === false ? '6 6' : null,
          fillColor: zone.color, fillOpacity: zone.active === false ? 0.04 : isSelected ? 0.3 : 0.14,
        }).addTo(group);
        if (zone.polygon.length >= 3) L.tooltip({ permanent: true, direction: 'center', className: `zone-label${isSelected ? ' is-selected' : ''}` })
          .setLatLng(polygonCenter(zone.polygon)).setContent(`${zone.label}<br>${money(zone.fee)}${zone.active === false ? ' · inactiva' : ''}`).addTo(group);
      }
      if (!isSelected) return;
      const live = shape;
      zone.polygon.forEach((vertex, index) => {
        L.marker(vertex, { draggable: true, icon: L.divIcon({ className: 'zone-vertex', iconSize: [16, 16] }), title: 'Arrastra para mover · doble clic para borrar' })
          .on('drag', event => {
            if (!live?.setLatLngs) return;
            const next = zone.polygon.map(point => [...point]);
            const { lat, lng } = event.target.getLatLng(); next[index] = [lat, lng];
            live.setLatLngs(next);
          })
          .on('dragend', event => { const { lat, lng } = event.target.getLatLng(); const next = zone.polygon.map(point => [...point]); next[index] = [lat, lng]; setPolygon(zone.id, next); })
          .on('dblclick', event => { L.DomEvent.stop(event); setPolygon(zone.id, zone.polygon.filter((_, i) => i !== index)); })
          .addTo(group);
      });
      if (zone.polygon.length >= 3) zone.polygon.forEach((a, index) => {
        const b = zone.polygon[(index + 1) % zone.polygon.length];
        L.marker([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], { draggable: true, icon: L.divIcon({ className: 'zone-midpoint', iconSize: [12, 12] }), title: 'Arrastra o haz clic para agregar un punto' })
          .on('click', event => { L.DomEvent.stop(event); const next = zone.polygon.map(point => [...point]); next.splice(index + 1, 0, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); setPolygon(zone.id, next); })
          .on('dragend', event => { const { lat, lng } = event.target.getLatLng(); const next = zone.polygon.map(point => [...point]); next.splice(index + 1, 0, [lat, lng]); setPolygon(zone.id, next); })
          .addTo(group);
      });
    });
  }, [leaflet, zones, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // A click on the map adds a vertex to the selected zone, on its nearest edge.
  useEffect(() => {
    if (!leaflet) return;
    const click = event => {
      const zone = zonesRef.current.find(item => item.id === selectedId);
      if (!zone) return;
      const point = [event.latlng.lat, event.latlng.lng];
      const next = zone.polygon.map(vertex => [...vertex]);
      if (next.length < 3) next.push(point); else next.splice(nearestEdge(next, point), 0, point);
      setPolygon(zone.id, next);
    };
    leaflet.map.on('click', click);
    return () => leaflet.map.off('click', click);
  }, [leaflet, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const focus = zone => {
    setSelectedId(zone.id);
    if (leaflet && zone.polygon.length >= 3) leaflet.map.fitBounds(leaflet.L.polygon(zone.polygon).getBounds(), { padding: [40, 40], maxZoom: 16 });
  };

  const addZone = () => {
    const center = leaflet ? leaflet.map.getCenter() : { lat: -36.83, lng: -73.01 };
    const d = 0.004;
    let id = 'nueva-zona', n = 2;
    while (zones.some(zone => zone.id === id)) id = `nueva-zona-${n++}`;
    change(list => [...list, { id, label: `Nueva zona ${list.length + 1}`, fee: 1000, color: palette[list.length % palette.length], active: true, polygon: [[center.lat + d, center.lng - d], [center.lat + d, center.lng + d], [center.lat - d, center.lng + d], [center.lat - d, center.lng - d]] }]);
    setSelectedId(id);
  };

  const move = (index, delta) => change(list => { const next = [...list]; const [item] = next.splice(index, 1); next.splice(index + delta, 0, item); return next; });

  const save = async () => {
    const issue = validateZones(zones);
    if (issue) { setError(issue); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const normalized = zones.map(zone => ({ ...zone, id: zone.id.startsWith('nueva-zona') ? slug(zone.label) : zone.id }));
      const result = await saveDeliveryZones(normalized, token);
      if (result.error) throw result.error;
      setZones(clone(normalized)); setDirty(false); setHistory([]);
      onSaved?.(normalized);
      setNotice('Zonas guardadas. El carrito ya cobra con estos polígonos y tarifas.');
    } catch (cause) {
      setError(/admin_save_delivery_zones|function|schema cache/i.test(cause.message || '') ? 'Falta instalar las zonas en Supabase: ejecuta supabase/delivery-polygons.sql en el SQL Editor y vuelve a guardar.' : cause.message || 'No se pudieron guardar las zonas.');
    } finally { setBusy(false); }
  };

  return <section className="admin-zones">
    <div className="admin-section-title"><h2>Zonas de despacho</h2><div className="admin-zones__actions">
      <button type="button" onClick={undo} disabled={!history.length}><Undo2/> Deshacer</button>
      <button type="button" className="admin-zones__save" onClick={save} disabled={busy || !dirty}><Save/> {busy ? 'GUARDANDO…' : dirty ? 'GUARDAR CAMBIOS' : 'GUARDADO'}</button>
    </div></div>
    <p className="admin-zones__help">Elige una zona y dibuja su borde: <b>clic en el mapa</b> agrega un punto, <b>arrastra</b> un punto para moverlo, <b>doble clic</b> sobre un punto lo borra y los <b>puntos chicos</b> de cada borde agregan uno nuevo. El cliente solo escribe su dirección y paga la tarifa de la zona donde cae su casa. Puedes hacer anillos, como en Toteat: una zona cercana al local <b>dentro</b> de otra más grande; manda la que está <b>más arriba en la lista</b> (súbela con las flechas).</p>
    {conflicts.length > 0 && <p className="admin-zones__warning" role="status">Zonas que se cruzan: {conflicts.join(' · ')}. Donde se cruzan se cobra la que está más arriba en la lista; si es un anillo, deja la zona chica arriba de la grande.</p>}
    {error && <p className="admin-error" role="alert">{error}</p>}
    {notice && <p className="admin-zones__notice" role="status">{notice}</p>}
    <div className="admin-zones__layout">
      <div className="admin-zones__map" ref={containerRef} role="application" aria-label="Mapa para dibujar las zonas de despacho"/>
      <ol className="admin-zones__list">
        {zones.map((zone, index) => <li key={zone.id} className={zone.id === selectedId ? 'is-selected' : ''}>
          <button type="button" className="admin-zones__pick" onClick={() => focus(zone)} aria-pressed={zone.id === selectedId}><span style={{ background: zone.color }}/>{zone.id === selectedId ? 'EDITANDO' : 'EDITAR'}</button>
          <label>Nombre<input value={zone.label} maxLength="40" onChange={event => updateZone(zone.id, { label: event.target.value })}/></label>
          <label>Tarifa<input type="number" min="0" max="100000" step="100" inputMode="numeric" value={zone.fee} onChange={event => updateZone(zone.id, { fee: Math.round(Number(event.target.value) || 0) })}/></label>
          <label className="admin-zones__color">Color<input type="color" value={zone.color} onChange={event => updateZone(zone.id, { color: event.target.value })}/></label>
          <label className="admin-zones__active"><input type="checkbox" checked={zone.active !== false} onChange={event => updateZone(zone.id, { active: event.target.checked })}/> Activa</label>
          <small>{zone.polygon.length} puntos</small>
          <div className="admin-zones__row-actions">
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Subir ${zone.label}`}><ArrowUp/></button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === zones.length - 1} aria-label={`Bajar ${zone.label}`}><ArrowDown/></button>
            <button type="button" onClick={() => { const c = polygonCenter(zone.polygon); if (c && leaflet) leaflet.map.setView(c, 15); }} aria-label={`Centrar ${zone.label}`}><MapPin/></button>
            <button type="button" onClick={() => window.confirm(`¿Borrar el dibujo de ${zone.label}?`) && setPolygon(zone.id, [])} aria-label={`Borrar el dibujo de ${zone.label}`}><Eraser/></button>
            <button type="button" onClick={() => window.confirm(`¿Eliminar la zona ${zone.label}?`) && change(list => list.filter(item => item.id !== zone.id))} aria-label={`Eliminar ${zone.label}`}><Trash2/></button>
          </div>
        </li>)}
        <li className="admin-zones__add"><button type="button" onClick={addZone}><Plus/> NUEVA ZONA</button></li>
      </ol>
    </div>
    {selected && <p className="admin-zones__status">Editando <b>{selected.label}</b> · {money(selected.fee)} · {selected.polygon.length < 3 ? 'haz clic en el mapa para marcar al menos 3 puntos' : 'clic en el mapa para agregar puntos'}</p>}
  </section>;
}
