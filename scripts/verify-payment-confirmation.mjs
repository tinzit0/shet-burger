import { chromium } from 'playwright';
import assert from 'node:assert/strict';

// Pestaña POR CONFIRMAR con pedidos simulados: nada llega a la base de datos real.
// Requiere el sitio local en http://127.0.0.1:5173.
const out = process.env.SHOT_DIR || 'artifacts/payment-confirmation';
const minutesAgo = m => new Date(Date.now() - m * 60000).toISOString();
const receipt = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="520"><rect width="300" height="520" fill="#fff"/><text x="20" y="60" font-size="22" font-family="sans-serif">Transferencia OK</text><text x="20" y="100" font-size="18" font-family="sans-serif">$13.000 a SHET SpA</text></svg>');
const order = (n, created_at, status, extra = {}) => ({ id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, order_number: `SHET-${n}`, created_at, status, stage: 0, fulfillment: 'pickup', customer_name: 'Cliente', customer_phone: '+56912345678', total: 12000, discount_amount: 0, items: [{ product: { id: 'doble', name: 'Doble Cheddar' }, price: 9000, quantity: 1, variant: 'Simple' }], receipt_name: 'comprobante.png', receipt_path: `guest/SHET-${n}/comprobante.png`, ...extra });
const base = [
  order(1, minutesAgo(4), 'Pedido recibido', { customer_name: 'Diego Fuentes', fulfillment: 'delivery', total: 13000 }),
  order(2, minutesAgo(14), 'Pedido recibido', { customer_name: 'Valentina Muñoz Riquelme', receipt_name: 'transferencia.pdf', receipt_path: 'guest/SHET-2/transferencia.pdf' }),
  order(3, minutesAgo(25), 'En preparación', { customer_name: 'Camila Rojas' }),
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
      if (req.method() === 'PATCH') {
        const body = req.postDataJSON(), id = new URL(req.url()).searchParams.get('id')?.replace('eq.', '');
        patches.push(body); orders = orders.map(o => o.id === id ? { ...o, ...body } : o);
        return route.fulfill({ json: [{ id }] });
      }
      return route.fulfill({ status: 204, body: '' });
    });
    await page.route('**/storage/v1/object/sign/**', route => route.fulfill({ json: { signedURL: '/receipt-mock.svg' } }));
    await page.route('**/receipt-mock.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: decodeURIComponent(receipt.split(',')[1]) }));
    await page.route('**/rest/v1/rpc/*', route => route.fulfill({ json: [] }));
    await page.goto('http://127.0.0.1:5173/admin');

    await page.getByRole('heading', { name: 'Pagos por confirmar' }).waitFor();
    await page.locator('.admin-payment-card').nth(1).waitFor();
    assert.equal(await page.locator('.admin-payment-card').count(), 2, 'dos pagos pendientes');
    assert.match(await page.getByRole('button', { name: /^PEDIDOS/ }).innerText(), /1/, 'PEDIDOS solo muestra el confirmado');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/admin-por-confirmar-${width}.png`, fullPage: true });

    // Detalle de un pedido pendiente: bloque de verificación en vez de las fases.
    await page.locator('.admin-payment-card').first().getByRole('button', { name: 'VER DETALLE' }).click();
    await page.locator('.admin-payment-check').waitFor();
    assert.equal(await page.locator('.admin-modal .admin-status-actions').count(), 0);
    await page.screenshot({ path: `${out}/admin-detalle-pendiente-${width}.png` });
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();

    // Confirmar el más antiguo (Valentina, 14 min) lo saca de la pestaña y lo manda a cocina.
    await page.locator('.admin-payment-card').first().getByRole('button', { name: 'CONFIRMAR PAGO' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.admin-payment-card').length === 1);
    assert.deepEqual(patches.at(-1), { status: 'Pago confirmado', stage: 0 });
    await page.getByRole('button', { name: /^COCINA/ }).click();
    await page.getByText('Valentina Muñoz Riquelme · Retiro').waitFor();
    assert.equal(await page.getByText('Diego Fuentes').count(), 0, 'el pedido sin confirmar no aparece en cocina');

    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('OK pagos por confirmar');
} finally { await browser.close(); }
