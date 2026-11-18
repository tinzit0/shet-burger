import { getOrderStage, isAwaitingPayment, isRejectedOrder } from './orderStatus.js';

// Cálculos del panel del dueño. Todo sale de los pedidos ya cargados:
// no necesita tablas nuevas ni consultas extra a Supabase.
const DAY = 86400000;
export const LATE_MINUTES = 20;
export { variantOf };

const time = order => new Date(order.created_at || Date.now()).getTime();
const startOfDay = ms => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
// +56 9 1234 5678 y 9 1234 5678 son el mismo cliente.
const phoneOf = order => { const digits = String(order.customer?.phone || order.customer_phone || '').replace(/\D/g, ''); return digits.length === 11 && digits.startsWith('56') ? digits.slice(2) : digits; };
const nameOf = order => order.customer?.name || order.customer_name || 'Cliente';
const itemName = item => item.product?.name || item.name || 'Producto';
const variantOf = item => typeof item.variant === 'string' ? item.variant : item.variant?.label || item.variant?.name || '';
const sum = (list, fn) => list.reduce((total, x) => total + fn(x), 0);
const active = orders => orders.filter(o => !o.cancelled && !isRejectedOrder(o));

export const minutesSince = (order, now = Date.now()) => Math.max(0, Math.floor((now - time(order)) / 60000));

// Pedidos sin entregar que llevan demasiado tiempo esperando.
// Los pagos aún sin confirmar no cuentan: cocina no los prepara todavía.
export const isLate = (order, now = Date.now()) => !isAwaitingPayment(order) && getOrderStage(order) < 2 && minutesSince(order, now) >= LATE_MINUTES;

export function daySummary(orders, now = Date.now()) {
  const today = startOfDay(now), lastWeek = today - 7 * DAY, elapsed = now - today;
  const todays = active(orders).filter(o => time(o) >= today && time(o) <= now);
  // Se compara contra el mismo día de la semana pasada hasta la misma hora.
  const previous = active(orders).filter(o => time(o) >= lastWeek && time(o) <= lastWeek + elapsed);
  const sales = sum(todays, o => Number(o.total) || 0), prevSales = sum(previous, o => Number(o.total) || 0);
  return {
    orders: todays.length,
    sales,
    average: todays.length ? Math.round(sales / todays.length) : 0,
    previousSales: prevSales,
    change: prevSales ? Math.round((sales - prevSales) / prevSales * 100) : null,
    delivery: todays.filter(o => (o.mode || o.fulfillment) === 'delivery').length,
  };
}

// Pedidos por hora: hoy contra el promedio de las últimas 4 semanas en el mismo día.
export function hourlyOrders(orders, now = Date.now()) {
  const today = startOfDay(now), weekday = new Date(now).getDay();
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, today: 0, typical: 0 }));
  for (const order of active(orders)) {
    const t = time(order), hour = new Date(t).getHours();
    if (t >= today && t <= now) hours[hour].today += 1;
    else if (t < today && t >= today - 28 * DAY && new Date(t).getDay() === weekday) hours[hour].typical += 1 / 4;
  }
  hours.forEach(h => { h.typical = Math.round(h.typical * 10) / 10; });
  const peak = hours.reduce((best, h) => (h.typical > best.typical ? h : best), hours[0]);
  return { hours, peakHour: peak.typical > 0 ? peak.hour : null };
}

export function productRanking(orders, products = [], now = Date.now(), days = 7) {
  const since = now - days * DAY, totals = new Map();
  for (const order of active(orders)) {
    if (time(order) < since) continue;
    for (const item of order.items || []) {
      const key = item.product?.id || itemName(item), row = totals.get(key) || { id: key, name: itemName(item), quantity: 0, revenue: 0 };
      row.quantity += Number(item.quantity) || 0;
      row.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      totals.set(key, row);
    }
  }
  const soldNames = new Set([...totals.values()].map(row => row.name));
  const top = [...totals.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);
  // Productos del menú que no se vendieron en el período: candidatos a promoción.
  const stale = products.filter(p => !['extras', 'salsas'].includes(p.category) && !totals.has(p.id) && !soldNames.has(p.name)).map(p => ({ id: p.id, name: p.name }));
  return { top, stale };
}

export function couponPerformance(orders) {
  const rows = new Map();
  for (const order of active(orders)) {
    if (!order.coupon_code) continue;
    const row = rows.get(order.coupon_code) || { code: order.coupon_code, uses: 0, discount: 0, sales: 0 };
    row.uses += 1; row.discount += Number(order.discount_amount) || 0; row.sales += Number(order.total) || 0;
    rows.set(order.coupon_code, row);
  }
  return [...rows.values()].sort((a, b) => b.uses - a.uses);
}

// Clientes agrupados por teléfono. "Dormidos": compraron 2+ veces y no vuelven hace 21 días.
export function customerInsights(orders, now = Date.now(), sleepDays = 21) {
  const rows = new Map();
  for (const order of active(orders)) {
    const phone = phoneOf(order);
    if (phone.length < 8) continue;
    const row = rows.get(phone) || { phone, name: nameOf(order), orders: 0, spent: 0, last: 0 };
    row.orders += 1; row.spent += Number(order.total) || 0;
    if (time(order) > row.last) { row.last = time(order); row.name = nameOf(order); }
    rows.set(phone, row);
  }
  const all = [...rows.values()].map(r => ({ ...r, daysAway: Math.floor((now - r.last) / DAY) }));
  return {
    loyal: all.filter(r => r.orders >= 2).sort((a, b) => b.orders - a.orders || b.spent - a.spent),
    sleeping: all.filter(r => r.orders >= 2 && r.daysAway >= sleepDays).sort((a, b) => b.spent - a.spent),
    total: all.length,
  };
}

export const whatsappLink = (phone, message) => {
  const digits = String(phone).replace(/\D/g, '');
  const full = digits.length === 9 ? `56${digits}` : digits; // celulares chilenos sin código de país
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
};

// Lo que cocina tiene que preparar ahora: suma por producto de los pedidos abiertos.
export function kitchenQueue(orders, now = Date.now()) {
  const open = active(orders).filter(o => !isAwaitingPayment(o) && getOrderStage(o) < 2).sort((a, b) => time(a) - time(b));
  const totals = new Map();
  for (const order of open) for (const item of order.items || []) {
    const label = variantOf(item) ? `${itemName(item)} (${variantOf(item)})` : itemName(item);
    totals.set(label, (totals.get(label) || 0) + (Number(item.quantity) || 0));
  }
  return {
    orders: open.map(o => ({ ...o, minutes: minutesSince(o, now), late: isLate(o, now) })),
    items: [...totals].map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity),
  };
}

const csvCell = value => {
  const text = String(value ?? '');
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function ordersCsv(orders) {
  const header = ['Pedido', 'Fecha', 'Cliente', 'Teléfono', 'Modalidad', 'Estado', 'Productos', 'Cupón', 'Descuento', 'Total'];
  const rows = orders.map(o => [
    o.order_number || o.id, new Date(time(o)).toLocaleString('es-CL'), nameOf(o), phoneOf(o),
    (o.mode || o.fulfillment) === 'delivery' ? 'Delivery' : 'Retiro', o.status || '',
    (o.items || []).map(i => `${i.quantity}× ${itemName(i)}`).join(' | '), o.coupon_code || '', o.discount_amount || 0, o.total || 0,
  ]);
  // Punto y coma + BOM: Excel en español lo abre con columnas y tildes correctas.
  return '﻿' + [header, ...rows].map(r => r.map(csvCell).join(';')).join('\r\n');
}

// ---------- Estadísticas por período (pestaña Resumen) ----------

export const PERIODS = [
  { id: 'today', label: 'Hoy' },
  { id: '7', label: '7 días' },
  { id: '30', label: '30 días' },
  { id: 'month', label: 'Este mes' },
];

// Ventana del período y la ventana anterior equivalente hasta la misma altura
// (hoy contra el mismo día de la semana pasada, 7 días contra los 7 anteriores, etc.).
export function periodRange(period, now = Date.now()) {
  const today = startOfDay(now);
  if (period === 'month') {
    const d = new Date(now), start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const prevStart = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
    const prevEnd = Math.min(prevStart + (now - start), start);
    return { start, end: now, prevStart, prevEnd, days: Math.round((today - start) / DAY) + 1, compare: 'el mes pasado a esta altura' };
  }
  const days = period === '30' ? 30 : period === '7' ? 7 : 1;
  const start = today - (days - 1) * DAY, shift = days === 1 ? 7 * DAY : days * DAY;
  const compare = days === 1 ? `el ${new Date(now).toLocaleDateString('es-CL', { weekday: 'long' })} pasado a esta hora` : `los ${days} días anteriores`;
  return { start, end: now, prevStart: start - shift, prevEnd: now - shift, days, compare };
}

const between = (orders, from, to) => active(orders).filter(o => time(o) >= from && time(o) <= to);
const pct = (value, previous) => previous ? Math.round((value - previous) / previous * 100) : null;
const isDelivery = o => (o.mode || o.fulfillment) === 'delivery';
const units = o => sum(o.items || [], i => Number(i.quantity) || 0);

// Indicadores del período. `everything` incluye rechazados y pagos sin confirmar.
export function periodSummary(orders, period, now = Date.now(), everything = orders) {
  const range = periodRange(period, now);
  const list = between(orders, range.start, range.end), prev = between(orders, range.prevStart, range.prevEnd);
  const sales = sum(list, o => Number(o.total) || 0), prevSales = sum(prev, o => Number(o.total) || 0);
  const average = list.length ? Math.round(sales / list.length) : 0, prevAverage = prev.length ? Math.round(prevSales / prev.length) : 0;
  const delivery = list.filter(isDelivery);
  // Cliente nuevo: su primer pedido de la historia cae dentro del período.
  const firstOrder = new Map();
  for (const o of active(orders)) { const p = phoneOf(o); if (p.length >= 8 && (!firstOrder.has(p) || time(o) < firstOrder.get(p))) firstOrder.set(p, time(o)); }
  const phones = new Set(list.map(phoneOf).filter(p => p.length >= 8));
  const newCustomers = [...phones].filter(p => firstOrder.get(p) >= range.start).length;
  const inRange = everything.filter(o => time(o) >= range.start && time(o) <= range.end);
  const rejected = inRange.filter(isRejectedOrder).length;
  return {
    range, sales, orders: list.length, average, units: sum(list, units),
    previous: { sales: prevSales, orders: prev.length, average: prevAverage },
    change: { sales: pct(sales, prevSales), orders: pct(list.length, prev.length), average: pct(average, prevAverage) },
    channels: [
      { id: 'delivery', label: 'Delivery', orders: delivery.length, sales: sum(delivery, o => Number(o.total) || 0) },
      { id: 'pickup', label: 'Retiro', orders: list.length - delivery.length, sales: sales - sum(delivery, o => Number(o.total) || 0) },
    ],
    customers: phones.size, newCustomers, returning: phones.size - newCustomers,
    discount: sum(list, o => Number(o.discount_amount) || 0), couponOrders: list.filter(o => o.coupon_code).length,
    rejected, rejectedRate: inRange.length ? Math.round(rejected / inRange.length * 100) : 0,
  };
}

// Ventas por día del período (hoy muestra las últimas 2 semanas para tener contexto).
export function dailySales(orders, period, now = Date.now()) {
  const range = periodRange(period, now), days = period === 'today' ? 14 : range.days;
  const first = startOfDay(now) - (days - 1) * DAY;
  const rows = Array.from({ length: days }, (_, i) => ({ date: first + i * DAY, sales: 0, orders: 0 }));
  for (const o of between(orders, first, now)) {
    const row = rows[Math.round((startOfDay(time(o)) - first) / DAY)];
    if (row) { row.sales += Number(o.total) || 0; row.orders += 1; }
  }
  return rows;
}

// Promedio de ventas por día de la semana en las últimas `weeks` semanas (lunes primero).
export function weekdaySales(orders, now = Date.now(), weeks = 8) {
  const from = startOfDay(now) - weeks * 7 * DAY, names = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const rows = names.map(name => ({ name, sales: 0, orders: 0 }));
  for (const o of between(orders, from, now)) { const row = rows[(new Date(time(o)).getDay() + 6) % 7]; row.sales += Number(o.total) || 0; row.orders += 1; }
  return rows.map(r => ({ ...r, sales: Math.round(r.sales / weeks), orders: Math.round(r.orders / weeks * 10) / 10 }));
}

const CATEGORY_LABELS = { burgers: 'Hamburguesas', promos: 'Promos', fritos: 'Papas y fritos', bebidas: 'Bebidas', extras: 'Extras', salsas: 'Salsas' };
// Ingresos por categoría del menú (antes de descuentos).
export function categorySales(orders, products = [], from = 0, to = Date.now()) {
  const byId = new Map(products.map(p => [p.id, p.category])), byName = new Map(products.map(p => [p.name, p.category])), rows = new Map();
  for (const o of between(orders, from, to)) for (const item of o.items || []) {
    const key = item.product?.category || byId.get(item.product?.id) || byName.get(itemName(item)) || 'otros';
    const row = rows.get(key) || { id: key, label: CATEGORY_LABELS[key] || 'Otros', revenue: 0, quantity: 0 };
    row.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0); row.quantity += Number(item.quantity) || 0;
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => b.revenue - a.revenue);
}
