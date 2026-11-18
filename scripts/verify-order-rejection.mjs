import { chromium } from 'playwright';
import assert from 'node:assert/strict';

// Rechazo con motivo: el dueño lo escribe en el panel y el cliente lo ve en su seguimiento.
// Pedidos simulados, nada llega a la base de datos real. Requiere el sitio en http://127.0.0.1:5173.
const out = process.env.SHOT_DIR || 'artifacts/order-rejection';
const order = { id: '00000000-0000-4000-8000-000000000001', order_number: 'SHET-1', created_at: new Date(Date.now() - 5 * 60000).toISOString(), status: 'Pedido recibido', stage: 0, fulfillment: 'pickup', customer_name: 'Diego Fuentes', customer_phone: '+56912345678', total: 9490, discount_amount: 0, items: [{ product: { id: 'bbq', name: 'BBQ Beast' }, price: 9490, quantity: 1, variant: 'Simple' }], receipt_name: 'comprobante.png', receipt_path: 'guest/SHET-1/comprobante.png' };

const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', headless: true });
try {
  for (const width of [1280, 375]) {
    const errors = [], patches = [];
    let orders = [structuredClone(order)];
    const mock = async context => {
      await context.route('**/rest/v1/orders*', async route => {
        const req = route.request(), params = new URL(req.url()).searchParams;
        if (req.method() === 'GET') { const number = params.get('order_number')?.replace('eq.', ''); return route.fulfill({ json: number ? orders.filter(o => o.order_number === number) : orders }); }
        if (req.method() === 'PATCH') { const body = req.postDataJSON(), id = params.get('id')?.replace('eq.', ''); patches.push(body); orders = orders.map(o => o.id === id ? { ...o, ...body } : o); return route.fulfill({ json: [{ id }] }); }
        return route.fulfill({ status: 204, body: '' });
      });
      await context.route('**/storage/v1/object/sign/**', route => route.fulfill({ json: { signedURL: '/receipt-mock.svg' } }));
      await context.route('**/rest/v1/rpc/*', route => route.fulfill({ json: [] }));
    };
    const watch = page => { page.on('pageerror', e => errors.push(e.message)); page.on('console', m => m.type() === 'error' && !/Failed to load resource|WebSocket|realtime/i.test(m.text()) && errors.push(m.text())); };

    // 1. Panel: rechazar pide un motivo antes de guardar.
    const admin = await browser.newContext({ viewport: { width, height: 900 } });
    await admin.addInitScript(() => { localStorage.setItem('shet-demo-admin-token', '00000000-0000-0000-0000-000000000000'); localStorage.setItem('shet-admin-sound', 'off'); });
    await mock(admin);
    const page = await admin.newPage(); watch(page);
    await page.goto('http://127.0.0.1:5173/admin');
    await page.locator('.admin-payment-card').first().getByRole('button', { name: 'VER DETALLE' }).click();
    await page.getByRole('button', { name: 'RECHAZAR PEDIDO' }).click();
    const send = page.getByRole('button', { name: 'RECHAZAR Y AVISAR AL CLIENTE' });
    assert.equal(await send.isDisabled(), true, 'sin motivo no se puede enviar');
    await page.getByRole('button', { name: 'Monto distinto' }).click();
    await page.locator('#admin-reject-reason').fill('El comprobante es por $9.000 y el pedido es por $9.490. Envíanos la diferencia.');
    await page.screenshot({ path: `${out}/admin-motivo-${width}.png` });
    await send.click();
    await page.locator('.admin-rejection-note').waitFor();
    assert.deepEqual(patches.at(-1), { status: 'Pedido rechazado', stage: 4, rejection_reason: 'El comprobante es por $9.000 y el pedido es por $9.490. Envíanos la diferencia.' });
    await page.screenshot({ path: `${out}/admin-rechazado-${width}.png` });
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
    assert.equal(await page.locator('.admin-payment-card').count(), 0, 'sale de por confirmar');
    await page.getByRole('button', { name: /^COCINA/ }).click();
    assert.equal(await page.getByText('Diego Fuentes').count(), 0, 'no llega a cocina');
    await admin.close();

    // 2. Cliente invitado: el seguimiento muestra el motivo.
    const guest = await browser.newContext({ viewport: { width, height: 900 } });
    await guest.addInitScript(o => localStorage.setItem('shet-demo-orders', JSON.stringify([o])), order);
    await mock(guest);
    const client = await guest.newPage(); watch(client);
    await client.goto('http://127.0.0.1:5173/');
    await client.locator(width < 700 ? '.brand-header__mobile-track, .brand-header__track' : '.brand-header__track').first().click({ force: true }).catch(async () => { await client.locator('button[aria-label*="menú" i], .brand-header__menu').first().click(); await client.locator('.brand-header__mobile-track').click(); });
    await client.locator('.tracker-rejection').waitFor();
    assert.match(await client.locator('.tracker-rejection').innerText(), /Envíanos la diferencia/);
    await client.waitForTimeout(400);
    await client.screenshot({ path: `${out}/cliente-seguimiento-${width}.png` });
    await guest.close();

    assert.deepEqual(errors, []);
  }
  console.log('OK rechazo con motivo');
} finally { await browser.close(); }
