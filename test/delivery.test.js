import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotal, composeDeliveryAddress, detectDeliveryZone, formatDeliveryAddress, getDeliveryFee, getDeliveryZoneFromAddress } from '../src/lib/delivery.js';

test('conserva calle, número y población de la dirección ingresada', () => {
  const address = composeDeliveryAddress({ street: ' Río Itata ', number: ' 50A ', population: ' Nonguén ' });
  assert.equal(address, 'Río Itata 50A, Nonguén, Concepción');
  assert.equal(detectDeliveryZone(address)?.fee, 1000);
  assert.equal(composeDeliveryAddress({ street: 'O’Higgins', number: '123', population: 'Centro' }), 'O’Higgins 123, Centro, Concepción');
  assert.equal(composeDeliveryAddress({ street: 'Río Itata', number: '50' }), 'Río Itata 50, Concepción');
  assert.equal(composeDeliveryAddress({}), '');
});

test('detecta un sector explícito al final de la dirección sin depender de tildes', () => {
  assert.equal(detectDeliveryZone('Los Boldos 123, NONGUEN')?.id, 'nonguen');
  assert.equal(detectDeliveryZone('O’Higgins 123, Concepción Centro')?.fee, 3000);
  assert.equal(detectDeliveryZone('Casa 12, km. 10')?.id, 'km-10');
});

test('no confunde calles con sectores ni asigna tarifas a direcciones desconocidas', () => {
  assert.equal(detectDeliveryZone('Avenida Collao 123'), null);
  assert.equal(detectDeliveryZone('Los Boldos 123'), null);
  assert.equal(detectDeliveryZone('Calle 123, Talcahuano'), null);
  assert.equal(detectDeliveryZone(''), null);
});

test('reconoce el sector seguido de ciudad, país o datos del departamento', () => {
  for (const address of [
    'rio itata 50 nonguen concepcion',
    'Río Itata 50, Nonguén, Concepción, Chile',
    'RÍO ITATA 50 NONGUÉN CONCEPCIÓN',
    'Río Itata 50, depto 2, Nonguén, Concepción',
    'Calle no registrada 999, Nonguén, Concepción',
  ]) assert.equal(detectDeliveryZone(address)?.id, 'nonguen', address);
  assert.equal(detectDeliveryZone('Calle 50 Valle Noble Concepción')?.fee, 1000);
  assert.equal(detectDeliveryZone('Calle 50 Centro de Concepción Chile')?.fee, 3000);
  assert.equal(detectDeliveryZone('Calle 50 Nonguén Collao Concepción'), null);
  assert.equal(detectDeliveryZone('Avenida Collao 123, Concepción'), null);
  assert.equal(detectDeliveryZone('Calle 50 Nonguencito Concepción'), null);
  assert.equal(detectDeliveryZone('Calle 50 Centro Talcahuano'), null);
  assert.equal(detectDeliveryZone('Centro, Calle 50, Penco'), null);
});

test('aplica $1.000 a las seis zonas cercanas', () => {
  for (const zone of ['nonguen', 'collao', 'valle-noble', 'san-guillermo', 'palomares', 'km-10']) {
    assert.equal(getDeliveryFee('delivery', zone), 1000);
  }
});

test('aplica $3.000 a Concepción Centro y no cobra por retiro', () => {
  assert.equal(calculateOrderTotal(12990, 'delivery', 'concepcion-centro'), 15990);
  assert.equal(calculateOrderTotal(12990, 'pickup', 'concepcion-centro'), 12990);
});

test('guarda y recupera la población dentro de la dirección', () => {
  const address = formatDeliveryAddress('nonguen', 'Los Boldos 123, casa 4');
  assert.equal(address, 'Nonguén · Los Boldos 123, casa 4');
  assert.equal(getDeliveryZoneFromAddress(address)?.id, 'nonguen');
});
