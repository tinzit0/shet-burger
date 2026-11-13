import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPoint, parsePointFromAddress, pointInPolygon, polygonCenter, zoneForPoint } from '../src/lib/geo.js';
import { DELIVERY_ZONES, deliveryMapsUrl, displayDeliveryAddress, formatDeliveryAddress, getDeliveryZoneFromAddress } from '../src/lib/delivery.js';

const square = [[0, 0], [0, 10], [10, 10], [10, 0]];

test('detecta puntos dentro, fuera y sobre el borde de un polígono', () => {
  assert.equal(pointInPolygon([5, 5], square), true);
  assert.equal(pointInPolygon([0, 5], square), true);
  assert.equal(pointInPolygon([11, 5], square), false);
  assert.equal(pointInPolygon([5, 5], [[0, 0], [1, 1]]), false);
  const notch = [[0, 0], [0, 10], [10, 10], [10, 6], [4, 6], [4, 4], [10, 4], [10, 0]];
  assert.equal(pointInPolygon([8, 5], notch), false, 'respeta polígonos cóncavos');
  assert.equal(pointInPolygon([5, 2], notch), true);
});

test('elige la primera zona activa que contiene el punto', () => {
  const zones = [{ id: 'a', active: false, polygon: square }, { id: 'b', polygon: square }, { id: 'c', polygon: square }];
  assert.equal(zoneForPoint([5, 5], zones).id, 'b');
  assert.equal(zoneForPoint([50, 50], zones), null);
});

test('el local de Río Loa queda dentro de Nonguén y cada zona inicial contiene su propio centro', () => {
  assert.equal(zoneForPoint([-36.83088, -73.00707], DELIVERY_ZONES).id, 'nonguen');
  for (const zone of DELIVERY_ZONES) assert.equal(zoneForPoint(polygonCenter(zone.polygon), DELIVERY_ZONES).id, zone.id, zone.label);
});

test('guarda el pin en la dirección sin romper la lectura de la zona', () => {
  const address = formatDeliveryAddress('nonguen', 'Los Boldos 123', DELIVERY_ZONES, [-36.8309, -73.007]);
  assert.equal(address, 'Nonguén · Los Boldos 123 · -36.83090,-73.00700');
  assert.equal(getDeliveryZoneFromAddress(address).id, 'nonguen');
  assert.deepEqual(parsePointFromAddress(address), [-36.8309, -73.007]);
  assert.equal(displayDeliveryAddress(address), 'Nonguén · Los Boldos 123');
  assert.equal(deliveryMapsUrl(address), 'https://www.google.com/maps/search/?api=1&query=-36.8309,-73.007');
  assert.equal(deliveryMapsUrl('Nonguén · Los Boldos 123'), null);
  assert.equal(formatPoint(null), '');
});

test('usa las tarifas guardadas por el admin', () => {
  const zones = [{ ...DELIVERY_ZONES[0], fee: 1500 }];
  assert.equal(getDeliveryZoneFromAddress('Nonguén · Calle 1', zones).fee, 1500);
});

test('la Universidad del Bío-Bío (Av. Collao 1202) queda en Collao', () => {
  assert.equal(zoneForPoint([-36.8231, -73.0125], DELIVERY_ZONES).id, 'collao');
  assert.equal(zoneForPoint([-36.8174, -73.0012], DELIVERY_ZONES).id, 'valle-noble');
});
