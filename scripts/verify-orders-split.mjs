import { chromium } from 'playwright';
import assert from 'node:assert/strict';

// Pestaña PEDIDOS: en curso arriba, entregados y rechazados bajo la línea. Pedidos simulados.
const out = process.env.SHOT_DIR || 'artifacts/orders-split';
const ago = m => new Date(Date.now() - m * 60000).toISOString();
const order = (n, m, status, name, extra = {}) => ({ id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, order_number: `SHET-${n}`, created_at: ago(m), status, stage: 0, fulfillment: 'pickup', customer_name: name, customer_phone: '+56912345678', total: 9490, discount_amount: 0, items: [{ product: { id: 'bbq', name: 'BBQ Beast' }, price: 9490, quantity: 1 }], ...extra });
const orders = [
  order(1, 3, 'Pago confirmado', 'Camila Rojas'),
  order(2, 30, 'Pedido entregado', 'Diego Fuentes'),
  order(3, 8, 'En preparación', 'Valentina Muñoz', { fulfillment: 'delivery' }),
  order(4, 60, 'Pedido rechazado', 'Tomás Pérez', { rejection_reason: 'Monto distinto' }),
  order(5, 12, 'Listo para servir', 'Ignacio Soto'),
  order(6, 90, 'Pedido entregado', 'Josefa Lagos'),
  order(7, 2, 'Pedido recibido', 'Pago Pendiente'),
];
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', headless: true });
try {
  for (const width of [1280, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } }), errors = [];
    await context.addInitScript(() => { localStorage.setItem('shet-demo-admin-token', '00000000-0000-0000-0000-000000000000'); localStorage.setItem('shet-admin-sound', 'off'); });
    await context.route('**/rest/v1/orders*', route => route.request().method() === 'GET' ? route.fulfill({ json: orders }) : route.fulfill({ status: 204, body: '' }));
    await context.route('**/rest/v1/rpc/*', route => route.fulfill({ json: [] }));
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => m.type() === 'error' && !/Failed to load resource|WebSocket|realtime/i.test(m.text()) && errors.push(m.text()));
    await page.goto('http://127.0.0.1:5173/admin');
    await page.getByRole('button', { name: /^PEDIDOS/ }).click();
    await page.locator('.admin-orders-divider').waitFor();
    const names = await page.locator('.admin-orders > *').evaluateAll(els => els.map(el => el.classList.contains('admin-orders-divider') ? '---' : el.querySelector('strong')?.textContent).filter(Boolean));
    assert.deepEqual(names, ['Camila Rojas', 'Valentina Muñoz', 'Ignacio Soto', '---', 'Diego Fuentes', 'Tomás Pérez', 'Josefa Lagos']);
    await page.locator('.admin-orders').screenshot({ path: `${out}/pedidos-${width}.png` });
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('OK pedidos separados');
} finally { await browser.close(); }
