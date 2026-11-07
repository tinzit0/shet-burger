import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupDeliveryAddress, zoneFromGeocode, zoneFromPhoton } from '../src/lib/addressLookup.js';
import { calculateOrderTotal, DELIVERY_ZONES } from '../src/lib/delivery.js';

for (const zone of DELIVERY_ZONES) {
  test(`cotiza ${zone.label} automáticamente con ciudad y sin consultar mapas`, async () => {
    const fetcher = () => { throw new Error('No debe depender del mapa'); };
    for (const text of [`Calle 123, ${zone.label}, Concepción`, `${zone.label}, Calle 123, Concepción`]) {
      const result = await lookupDeliveryAddress(text, { googleKey: '', fetcher });
      assert.equal(result.zone.id, zone.id);
      assert.equal(calculateOrderTotal(9990, 'delivery', result.zone.id), 9990 + zone.fee);
    }
  });
}

test('acepta las formas habituales de Centro y Km 10', async () => {
  const fetcher = () => { throw new Error('No debe consultar mapas'); };
  for (const sector of ['Centro', 'centro concepcion', 'Centro de Concepción', 'Concepción Centro']) {
    const result = await lookupDeliveryAddress(`O’Higgins 123 ${sector}`, { googleKey: '', fetcher });
    assert.equal(result.zone.id, 'concepcion-centro');
    assert.equal(result.zone.fee, 3000);
  }
  for (const sector of ['km10', 'km. 10', 'kilómetro 10', 'kilómetros 10']) {
    assert.equal((await lookupDeliveryAddress(`Calle 50 ${sector}`, { googleKey: '', fetcher })).zone.id, 'km-10');
  }
});

test('sin cobertura muestra el mensaje solicitado y no devuelve una tarifa', async () => {
  const fetcher = async () => ({ ok: true, json: async () => ({ features: [] }) });
  await assert.rejects(lookupDeliveryAddress('Calle 123, Penco', { googleKey: '', fetcher }), error => error.code === 'DELIVERY_UNAVAILABLE' && /No llegamos a esa zona/.test(error.message));
});

test('sin clave de Google calcula tarifa y total al escribir la dirección con sector', async () => {
  const fetcher = () => { throw new Error('No debe consultar mapas'); };
  for (const text of ['Los Boldos 123, Nonguén', 'Los Boldos 123 Nonguen', 'rio itata 50 nonguen concepcion', 'Río Itata 50, Nonguén, Concepción, Chile', 'Calle no registrada 999 Nonguén Concepción']) {
    const { zone } = await lookupDeliveryAddress(text, { googleKey: '', fetcher });
    assert.equal(zone.fee, 1000);
    assert.equal(calculateOrderTotal(9990, 'delivery', zone.id), 10990);
  }
  const { zone } = await lookupDeliveryAddress('O’Higgins 123, Concepción Centro', { googleKey: '', fetcher });
  assert.equal(calculateOrderTotal(9990, 'delivery', zone.id), 12990);
});

test('consulta Photon sin clave para resolver el sector de una calle', async () => {
  let requested = '';
  const fetcher = async url => {
    requested = url;
    return { ok: true, json: async () => ({ features: [{ properties: { countrycode: 'CL', city: 'Concepción', street: 'Los Boldos', housenumber: '123', district: 'Nonguén' } }] }) };
  };
  const result = await lookupDeliveryAddress('Los Boldos 123', { googleKey: '', fetcher });
  assert.equal(result.zone.fee, 1000);
  assert.equal(new URL(requested).hostname, 'photon.komoot.io');
});

test('no cobra por una calle diferente o una comuna ajena', async () => {
  assert.equal(zoneFromPhoton({ properties: { countrycode: 'CL', city: 'Talcahuano', district: 'Centro' } }), null);
  const fetcher = async () => ({ ok: true, json: async () => ({ features: [{ properties: { countrycode: 'CL', city: 'Concepción', street: 'Otra Calle', district: 'Nonguén' } }] }) });
  await assert.rejects(lookupDeliveryAddress('Los Boldos 123', { googleKey: '', fetcher }), /No llegamos a esa zona/);
});

test('un fallo de red permite completar la dirección y cotizar sin selección manual', async () => {
  const fetcher = async () => { throw new Error('Network error'); };
  await assert.rejects(lookupDeliveryAddress('Los Boldos 123', { googleKey: '', fetcher }), /Incluye tu sector/);
  const { zone } = await lookupDeliveryAddress('Los Boldos 123, Nonguén', { googleKey: '', fetcher });
  assert.equal(zone.fee, 1000);
});

const component = (name, type, short = name) => ({ long_name: name, short_name: short, types: [type] });
const address = sector => ({ address_components: [component('Chile', 'country', 'CL'), component('Concepción', 'locality'), component('Los Boldos', 'route'), component('123', 'street_number'), component(sector, 'neighborhood')] });

test('clasifica sectores usando los componentes geográficos de una dirección completa', () => {
  assert.equal(zoneFromGeocode(address('Nonguén'))?.fee, 1000);
  assert.equal(zoneFromGeocode(address('Centro'))?.fee, 3000);
});

test('no cobra por coincidencias parciales, calles, otras comunas o sectores desconocidos', () => {
  assert.equal(zoneFromGeocode({ ...address('Nonguén'), partial_match: true }), null);
  assert.equal(zoneFromGeocode(address('Sector desconocido')), null);
  const street = address('Sector desconocido');
  street.address_components.push(component('Collao', 'route'));
  assert.equal(zoneFromGeocode(street), null);
  const otherCity = address('Centro');
  otherCity.address_components[1] = component('Talcahuano', 'locality');
  assert.equal(zoneFromGeocode(otherCity), null);
  const noNumber = address('Nonguén');
  noNumber.address_components = noNumber.address_components.filter(item => !item.types.includes('street_number'));
  assert.equal(zoneFromGeocode(noNumber), null);
});
