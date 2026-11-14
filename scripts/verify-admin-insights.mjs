import { chromium } from 'playwright';
import assert from 'node:assert/strict';

// Panel del dueño con pedidos simulados: nada llega a la base de datos real.
const out = process.env.SHOT_DIR || '.';
const minutesAgo = m => new Date(Date.now() - m * 60000).toISOString();
const daysAgo = (d, h = 20) => { const t = new Date(); t.setDate(t.getDate() - d); t.setHours(h, 10, 0, 0); return t.toISOString(); };
const item = (id, name, price, quantity, extra = {}) => ({ product: { id, name }, price, quantity, variant: 'Simple', ...extra });
const order = (n, created_at, status, extra = {}) => ({ id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, order_number: `SHET-${n}`, created_at, status, stage: 0, fulfillment: 'retiro', customer_name: 'Cliente', customer_phone: '', total: 12000, discount_amount: 0, items: [item('doble', 'Doble Cheddar', 9000, 1)], ...extra });
const base = [
  order(1, minutesAgo(32), 'En preparación', { customer_name: 'Camila Rojas', customer_phone: '+56 9 8765 4321', items: [item('doble', 'Doble Cheddar', 9000, 2, { note: 'Sin pepinillos' }), item('papas', 'Papas', 3000, 1)], total: 21000 }),
  order(2, minutesAgo(6), 'Pedido recibido', { customer_name: 'Diego', customer_phone: '912345678', fulfillment: 'delivery', items: [item('bbq', 'BBQ Beast', 10000, 1)], total: 13000, coupon_code: 'SHET10', discount_amount: 1000 }),
  order(3, daysAgo(7), 'Pedido entregado', { total: 9000 }),
  order(4, daysAgo(14), 'Pedido entregado', { customer_name: 'Camila Rojas', customer_phone: '987654321' }),
  order(5, daysAgo(30), 'Pedido entregado', { customer_name: 'Pedro Soto', customer_phone: '955555555', total: 18000 }),
  order(6, daysAgo(26), 'Pedido entregado', { customer_name: 'Pedro Soto', customer_phone: '955555555', total: 15000, coupon_code: 'SHET10', discount_amount: 1500 }),
];

const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', headless: true });
try {
  for (const width of [1280, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [], patches = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => m.type() === 'error' && !/Failed to load resource|WebSocket|realtime/i.test(m.text()) && errors.push(m.text()));
    let orders = structuredClone(base);
    await context.addInitScript(() => { localStorage.setItem('shet-demo-admin-token', '00000000-0000-0000-0000-000000000000'); localStorage.setItem('shet-admin-sound', 'off'); });
    await page.route('**/rest/v1/orders*', async route => {
      const req = route.request();
      if (req.method() === 'GET') return route.fulfill({ json: orders });
      if (req.method() === 'PATCH') { patches.push(req.postDataJSON()); return route.fulfill({ status: 204, body: '' }); }
      return route.fulfill({ status: 204, body: '' });
    });
    await page.route('**/rest/v1/rpc/*', route => route.fulfill({ json: [] }));
    await page.goto('http://127.0.0.1:5173/admin');
    await page.getByRole('button', { name: /^PEDIDOS/ }).waitFor();
    await page.getByText('Esperando hace 32 min · ATRASADO').waitFor();
    assert.ok(await page.locator('.admin-tab-alert').count(), 'la pestaña COCINA marca atrasos');

    await page.getByRole('button', { name: 'RESUMEN', exact: true }).click();
    await page.locator('.insight-kpis').waitFor();
    assert.equal(await page.locator('.insight-kpis article').nth(1).locator('strong').innerText(), '2');
    assert.match(await page.locator('.insight-kpis article').first().innerText(), /\$34\.000/);
    assert.match(await page.locator('.insight-table').innerText(), /SHET10\s+2/);
    assert.match(await page.locator('.insight-people').last().innerText(), /Pedro Soto/);
    const wa = await page.locator('.insight-people a').last().getAttribute('href');
    assert.match(wa, /^https:\/\/wa\.me\/56955555555\?text=/);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /EXPORTAR PEDIDOS/ }).click();
    assert.match((await download).suggestedFilename(), /^pedidos-shet-\d{4}-\d{2}-\d{2}\.csv$/);
    await page.screenshot({ path: `${out}/insights-summary-${width}.png`, fullPage: true });

    await page.getByRole('button', { name: /^COCINA/ }).click();
    await page.locator('.kitchen-ticket').first().waitFor();
    assert.equal(await page.locator('.kitchen-ticket').count(), 2);
    assert.ok(await page.locator('.kitchen-ticket').first().evaluate(el => el.classList.contains('is-late')));
    assert.match(await page.locator('.kitchen-totals').innerText(), /2×\s*Doble Cheddar \(Simple\)/);
    await page.screenshot({ path: `${out}/insights-kitchen-${width}.png`, fullPage: true });
    await page.locator('.kitchen-ticket').first().getByRole('button', { name: /LISTO PARA SERVIR/ }).click();
    await page.waitForFunction(() => document.querySelectorAll('.kitchen-ticket').length === 1);
    assert.deepEqual(patches.at(-1), { status: 'Listo para servir', stage: 2 });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, 'sin scroll horizontal');
    assert.deepEqual(errors, []);
    console.log(`ok ${width}px`);
    await context.close();
  }
} finally { await browser.close(); }
