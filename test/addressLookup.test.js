import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupDeliveryAddress, pointFromGeocode, pointFromPhoton } from '../src/lib/addressLookup.js';
import { calculateOrderTotal, DELIVERY_ZONES } from '../src/lib/delivery.js';
import { pointInPolygon } from '../src/lib/geo.js';

const offline = () => { throw new Error('Network error'); };
const photon = features => async () => ({ ok: true, json: async () => ({ features }) });
const feature = (lat, lng, properties = {}) => ({ geometry: { type: 'Point', coordinates: [lng, lat] }, properties: { countrycode: 'CL', city: 'Concepción', street: 'Los Boldos', ...properties } });
const NONGUEN_POINT = [-36.8309, -73.0070]; // Río Loa, Nonguén
const COLLAO_POINT = [-36.8182, -73.0219];
const PENCO_POINT = [-36.74, -72.99];

for (const zone of DELIVERY_ZONES) {
  test(`sin mapa, cotiza ${zone.label} con el sector escrito y deja el pin en la zona`, async () => {
    for (const text of [`Calle 123, ${zone.label}, Concepción`, `${zone.label}, Calle 123, Concepción`]) {
      const result = await lookupDeliveryAddress(text, { googleKey: '', fetcher: offline });
      assert.equal(result.zone.id, zone.id);
      assert.equal(result.source, 'sector');
      assert.equal(result.precise, false);
      assert.ok(pointInPolygon(result.point, zone.polygon), 'el pin inicial queda dentro de la zona');
      assert.equal(calculateOrderTotal(9990, 'delivery', result.zone.id), 9990 + zone.fee);
    }
  });
}

test('acepta las formas habituales de Centro y Km 10 cuando el mapa no responde', async () => {
  for (const sector of ['Centro', 'centro concepcion', 'Centro de Concepción', 'Concepción Centro']) {
    const result = await lookupDeliveryAddress(`O’Higgins 123 ${sector}`, { googleKey: '', fetcher: offline });
    assert.equal(result.zone.id, 'concepcion-centro');
    assert.equal(result.zone.fee, 3000);
  }
  for (const sector of ['km10', 'km. 10', 'kilómetro 10', 'kilómetros 10']) {
    assert.equal((await lookupDeliveryAddress(`Calle 50 ${sector}`, { googleKey: '', fetcher: offline })).zone.id, 'km-10');
  }
});

test('ubica la casa en el mapa y cobra la zona del polígono donde cae, sin escribir sector', async () => {
  let requested = '';
  const fetcher = async url => { requested = url; return photon([feature(...NONGUEN_POINT, { housenumber: '123' })])(); };
  const result = await lookupDeliveryAddress('Los Boldos 123', { googleKey: '', fetcher });
  assert.equal(result.zone.id, 'nonguen');
  assert.equal(result.source, 'map');
  assert.equal(result.precise, true);
  assert.deepEqual(result.point, NONGUEN_POINT);
  assert.equal(new URL(requested).hostname, 'photon.komoot.io');
});

test('el polígono manda sobre el sector escrito cuando la casa está ubicada', async () => {
  const result = await lookupDeliveryAddress('Los Boldos 123, Nonguén', { googleKey: '', fetcher: photon([feature(...COLLAO_POINT, { housenumber: '123' })]) });
  assert.equal(result.zone.id, 'collao');
});

test('una casa ubicada fuera de todas las zonas queda sin cobertura y devuelve el punto para corregirlo', async () => {
  await assert.rejects(
    lookupDeliveryAddress('Los Boldos 123, Nonguén', { googleKey: '', fetcher: photon([feature(...PENCO_POINT, { housenumber: '123' })]) }),
    error => error.code === 'DELIVERY_UNAVAILABLE' && /No llegamos a esa zona/.test(error.message) && error.point?.[0] === PENCO_POINT[0],
  );
});

test('si el mapa solo encuentra la calle (sin número) fuera de zona, usa el sector escrito', async () => {
  const result = await lookupDeliveryAddress('Los Boldos 123, Nonguén', { googleKey: '', fetcher: photon([feature(...PENCO_POINT)]) });
  assert.equal(result.zone.id, 'nonguen');
  assert.equal(result.source, 'sector');
});

test('sin cobertura muestra el mensaje solicitado y no devuelve una tarifa', async () => {
  await assert.rejects(lookupDeliveryAddress('Calle 123, Penco', { googleKey: '', fetcher: photon([]) }), error => error.code === 'DELIVERY_UNAVAILABLE' && /No llegamos a esa zona/.test(error.message));
});

test('no usa resultados de otra calle u otra comuna', async () => {
  assert.equal(pointFromPhoton([feature(...NONGUEN_POINT, { street: 'Otra Calle' })], 'Los Boldos 123'), null);
  assert.equal(pointFromPhoton([feature(...NONGUEN_POINT, { city: 'Talcahuano' })], 'Los Boldos 123'), null);
  await assert.rejects(lookupDeliveryAddress('Los Boldos 123', { googleKey: '', fetcher: photon([feature(...NONGUEN_POINT, { street: 'Otra Calle' })]) }), error => error.code === 'NEEDS_PIN' && /No encontramos esa dirección/.test(error.message));
});

test('prefiere el resultado con el mismo número de casa', () => {
  const located = pointFromPhoton([feature(...PENCO_POINT, { housenumber: '999' }), feature(...NONGUEN_POINT, { housenumber: '123' })], 'Los Boldos 123');
  assert.deepEqual(located, { point: NONGUEN_POINT, precise: true });
});

test('un fallo de red sin sector pide marcar la casa en el mapa', async () => {
  await assert.rejects(lookupDeliveryAddress('Los Boldos 123', { googleKey: '', fetcher: offline }), /Marca tu casa en el mapa/);
  const { zone } = await lookupDeliveryAddress('Los Boldos 123, Nonguén', { googleKey: '', fetcher: offline });
  assert.equal(zone.fee, 1000);
});

const component = (name, type, short = name) => ({ long_name: name, short_name: short, types: [type] });
const googleResult = (extra = {}) => ({
  address_components: [component('Chile', 'country', 'CL'), component('Concepción', 'locality'), component('Los Boldos', 'route'), component('123', 'street_number')],
  geometry: { location: { lat: () => NONGUEN_POINT[0], lng: () => NONGUEN_POINT[1] } },
  ...extra,
});

test('toma el punto de Google solo para una dirección exacta en Concepción', () => {
  assert.deepEqual(pointFromGeocode(googleResult()), { point: NONGUEN_POINT, precise: true });
  assert.equal(pointFromGeocode(googleResult({ partial_match: true })), null);
  const otherCity = googleResult(); otherCity.address_components[1] = component('Talcahuano', 'locality');
  assert.equal(pointFromGeocode(otherCity), null);
  const noNumber = googleResult(); noNumber.address_components = noNumber.address_components.filter(item => !item.types.includes('street_number'));
  assert.equal(pointFromGeocode(noNumber), null);
});

test('reconoce la calle aunque el mapa use el nombre oficial completo', async () => {
  const fetcher = photon([feature(...COLLAO_POINT, { street: 'Avenida Ignacio Collao', housenumber: '1202' })]);
  const result = await lookupDeliveryAddress('Avenida Collao 1202, Concepción', { googleKey: '', fetcher });
  assert.equal(result.zone.id, 'collao');
  assert.equal(result.precise, true);
});

test('en una calle larga sin número exacto usa el tramo que cae dentro de una zona', async () => {
  const CENTRO_POINT = [-36.8269, -73.0513];
  const fetcher = photon([feature(...PENCO_POINT, { street: undefined, type: 'street', name: 'Barros Arana' }), feature(...CENTRO_POINT, { street: undefined, type: 'street', name: 'Barros Arana' })]);
  const result = await lookupDeliveryAddress('Barros Arana 500, Concepción', { googleKey: '', fetcher });
  assert.equal(result.zone.id, 'concepcion-centro');
  assert.equal(result.precise, false);
  assert.deepEqual(result.point, CENTRO_POINT);
});

test('al mover el pin toma la calle y el número del punto, si existen', async () => {
  const { addressFromReverse } = await import('../src/lib/addressLookup.js');
  assert.deepEqual(addressFromReverse([{ properties: { type: 'street', name: 'Barros Arana' } }, { properties: { street: 'Barros Arana', housenumber: '599' } }]), { street: 'Barros Arana', number: '599' });
  assert.deepEqual(addressFromReverse([{ properties: { type: 'street', name: 'Río Loa' } }]), { street: 'Río Loa', number: '' });
  assert.equal(addressFromReverse([]), null);
});

test('con Google toma calle y número del punto en Concepción', async () => {
  const { addressFromGoogle } = await import('../src/lib/addressLookup.js');
  const part = (long_name, type) => ({ long_name, types: [type] });
  assert.deepEqual(addressFromGoogle([{ address_components: [part('152', 'street_number'), part('Río Loa', 'route'), part('Concepción', 'locality')] }]), { street: 'Río Loa', number: '152' });
  assert.equal(addressFromGoogle([{ address_components: [part('Colón', 'route'), part('Talcahuano', 'locality')] }]), null);
});
