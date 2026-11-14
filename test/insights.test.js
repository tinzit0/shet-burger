import test from 'node:test';
import assert from 'node:assert/strict';
import { daySummary, hourlyOrders, productRanking, couponPerformance, customerInsights, kitchenQueue, isLate, ordersCsv, whatsappLink } from '../src/lib/insights.js';

const now = new Date(2026, 10, 14, 21, 0).getTime(); // sábado 21:00
const at = (daysAgo, hour, extra = {}) => ({ created_at: new Date(2026, 10, 14 - daysAgo, hour, 0).toISOString(), status: 'Pedido entregado', total: 10000, items: [], ...extra });

test('resumen del día compara con la semana pasada hasta la misma hora', () => {
  const orders = [at(0, 20, { total: 12000 }), at(0, 19, { total: 8000, mode: 'delivery' }), at(7, 20, { total: 10000 }), at(7, 22, { total: 50000 })];
  const s = daySummary(orders, now);
  assert.equal(s.orders, 2); assert.equal(s.sales, 20000); assert.equal(s.average, 10000);
  assert.equal(s.previousSales, 10000); assert.equal(s.change, 100); assert.equal(s.delivery, 1);
});

test('sin ventas la semana pasada no inventa un porcentaje', () => assert.equal(daySummary([at(0, 20)], now).change, null));

test('hora peak sale del promedio del mismo día de la semana', () => {
  const r = hourlyOrders([at(7, 20), at(14, 20), at(7, 13), at(0, 20), at(3, 20)], now);
  assert.equal(r.hours[20].today, 1); assert.equal(r.hours[20].typical, 0.5); assert.equal(r.peakHour, 20);
});

test('ranking de productos y productos sin ventas', () => {
  const orders = [at(1, 20, { items: [{ product: { id: 'a', name: 'Doble' }, price: 9000, quantity: 2 }, { product: { id: 'b', name: 'Papas' }, price: 3000, quantity: 1 }] })];
  const r = productRanking(orders, [{ id: 'a', name: 'Doble' }, { id: 'b', name: 'Papas' }, { id: 'c', name: 'Veggie' }, { id: 'x', name: 'Mayo', category: 'salsas' }], now);
  assert.deepEqual(r.top.map(p => [p.id, p.quantity, p.revenue]), [['a', 2, 18000], ['b', 1, 3000]]);
  assert.deepEqual(r.stale.map(p => p.id), ['c']);
});

test('rendimiento de cupones', () => {
  const r = couponPerformance([at(1, 20, { coupon_code: 'SHET10', discount_amount: 1000, total: 9000 }), at(2, 20, { coupon_code: 'SHET10', discount_amount: 500, total: 4500 }), at(2, 20)]);
  assert.deepEqual(r, [{ code: 'SHET10', uses: 2, discount: 1500, sales: 13500 }]);
});

test('clientes frecuentes y dormidos por teléfono', () => {
  const c = (d, phone) => at(d, 20, { customer: { name: 'Ana', phone } });
  const r = customerInsights([c(30, '+56 9 1111 1111'), c(25, '911111111'), c(1, '922222222'), c(2, '922222222'), c(3, '933333333')], now);
  assert.equal(r.total, 3); // +56 9 1111 1111 y 911111111 son la misma persona
  assert.deepEqual(r.loyal.map(x => x.phone).sort(), ['911111111', '922222222']);
  assert.deepEqual(r.sleeping.map(x => [x.phone, x.daysAway]), [['911111111', 25]]);
});

test('cola de cocina suma productos de pedidos abiertos y marca atrasos', () => {
  const open = { created_at: new Date(now - 25 * 60000).toISOString(), status: 'En preparación', items: [{ product: { name: 'Doble' }, quantity: 2 }] };
  const fresh = { created_at: new Date(now - 5 * 60000).toISOString(), status: 'Pedido recibido', items: [{ product: { name: 'Doble' }, quantity: 1 }, { product: { name: 'Papas' }, quantity: 1 }] };
  const q = kitchenQueue([open, fresh, at(0, 18, { items: [{ product: { name: 'Doble' }, quantity: 9 }] })], now);
  assert.deepEqual(q.items, [{ name: 'Doble', quantity: 3 }, { name: 'Papas', quantity: 1 }]);
  assert.deepEqual(q.orders.map(o => [o.minutes, o.late]), [[25, true], [5, false]]);
  assert.equal(isLate({ ...open, status: 'Listo para servir' }, now), false);
});

test('CSV escapa separadores y abre bien en Excel', () => {
  const csv = ordersCsv([at(0, 20, { order_number: 'SB-1', customer: { name: 'Pérez; Juan', phone: '9 1234 5678' } })]);
  assert.ok(csv.startsWith('﻿Pedido;'));
  assert.match(csv, /"Pérez; Juan";912345678;/);
});

test('WhatsApp agrega el código de Chile a celulares de 9 dígitos', () => {
  assert.equal(whatsappLink('9 1234 5678', 'Hola'), 'https://wa.me/56912345678?text=Hola');
  assert.equal(whatsappLink('+56 9 1234 5678', 'a b'), 'https://wa.me/56912345678?text=a%20b');
});
