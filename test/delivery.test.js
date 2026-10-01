import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotal, formatDeliveryAddress, getDeliveryFee, getDeliveryZoneFromAddress } from '../src/lib/delivery.js';

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
