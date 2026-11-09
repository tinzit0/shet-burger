import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/data.js';
import { selectedAddons, customizationTotal, customizationLines, customizationUnavailable, standaloneExtra, promotionBurgerAllowed, promotionExtraAllowed } from '../src/lib/customization.js';

test('dos carnes extra convierten una doble en cuadruple y calculan su costo', () => {
  const extras = selectedAddons({ 'extra-0': 2, 'extra-6': 3 }, products, 'burger');
  assert.equal(customizationTotal({ extras }), 7400);
  assert.equal(extras[0].quantity, 2);
  assert.equal(11990 + customizationTotal({ extras }), 19390);
});
test('cantidades diez, cinco y cero, separando papas de hamburguesa', () => {
  const entry = { extras: selectedAddons({ 'extra-0': 10, 'extra-6': 0 }, products, 'burger'), friesExtras: selectedAddons({ 'extra-4': 5 }, products, 'fries') };
  assert.equal(entry.extras.length, 1);
  assert.equal(customizationTotal(entry), 30000);
  assert.match(customizationLines(entry)[1].label, /papas/);
});
test('promociones mantienen cantidades y extras propios de cada hamburguesa', () => {
  const entry = { burgers: [{ product_id: 'bbq-beast', name: 'BBQ Beast', variant: 'Doble', surcharge: 2500, extras: selectedAddons({ 'extra-0': 2 }, products, 'burger') }, { product_id: 'onion-shet', name: 'Onion SHET', variant: 'Simple', extras: selectedAddons({ 'extra-6': 3 }, products, 'burger') }] };
  assert.equal(customizationTotal(entry), 9900);
  const lines = customizationLines(entry);
  assert.equal(lines[1].value, '2 × Extra carne y cheddar');
  assert.equal(lines[3].value, '3 × Tocino');
  assert.match(lines[1].label, /Hamburguesa 1/);
  assert.match(lines[3].label, /Hamburguesa 2/);
  assert.equal(customizationUnavailable(entry, { 'extra-6': false }), true);
});
test('agotados, bebidas de promos y productos retirados invalidan la personalizacion', () => {
  assert.equal(customizationUnavailable({ drinkChoiceIds: ['bebida-0'] }, { 'bebida-0': false }), true);
  assert.equal(customizationUnavailable({ extras: [{ product_id: 'retirado' }] }, {}, products), true);
  assert.equal(customizationUnavailable({ friesExtras: [{ product_id: 'extra-4' }] }, { 'extra-4': false }), true);
});
test('carne y cheddar solo asociado; tocino disponible por separado', () => {
  assert.equal(standaloneExtra(products.find(item => item.id === 'extra-0')), false);
  assert.equal(standaloneExtra(products.find(item => item.id === 'extra-6')), true);
  assert.deepEqual(selectedAddons({ 'extra-0': 1 }, products, 'fries'), []);
});
test('reglas administrativas independientes para cada posicion de la promocion', () => {
  const promo = { promotionSlots: [{ allowedBurgerIds: ['bbq-beast'], allowedExtraIds: ['extra-0'] }, { allowedBurgerIds: ['onion-shet'], allowedExtraIds: ['extra-6'] }] };
  const bbq = products.find(item => item.id === 'bbq-beast');
  assert.equal(promotionBurgerAllowed(promo, 0, bbq), true);
  assert.equal(promotionBurgerAllowed(promo, 1, bbq), false);
  assert.equal(promotionExtraAllowed(promo, 0, bbq, { id: 'extra-0' }), true);
  assert.equal(promotionExtraAllowed(promo, 1, bbq, { id: 'extra-0' }), false);
});
