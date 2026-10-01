// Browser regression suite. Supabase is intercepted: no real orders or reviews.
// Playwright is a development-environment tool, not an application dependency.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const base = process.env.TEST_URL || 'http://127.0.0.1:5174';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
let storeOpen = true, sold = false, order = null, submitted = null, projectRef = '';
const customer = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'test@example.invalid', user_metadata: { full_name: 'Cliente de prueba' } };
await mkdir('artifacts/campaign', { recursive: true });
try {
  const context = await browser.newContext();
  await context.routeWebSocket(/supabase/, socket => socket.close());
  await context.route('**/*.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    projectRef = url.hostname.split('.')[0];
    let body = [];
    if (url.pathname.endsWith('/user')) body = customer;
    if (url.pathname.endsWith('/store_settings')) body = { is_open: storeOpen };
    if (url.pathname.endsWith('/product_availability')) body = sold ? [{ product_id: 'bbq-beast', available: false }] : [];
    if (url.pathname.endsWith('/review_summary')) body = [{ total: 1, average: 5 }];
    if (url.pathname.endsWith('/reviews')) body = [{ id: 'test', name: 'Cliente de prueba', rating: 5, comment: 'Opinión simulada para revisar el diseño.', created_at: '2026-01-01' }];
    if (url.pathname.endsWith('/submit_review')) { submitted = route.request().postDataJSON(); body = null; }
    if (url.pathname.includes('/storage/')) body = { Key: 'test/receipt.png' };
    if (url.pathname.endsWith('/place_order')) {
      const p = route.request().postDataJSON();
      order = { id: 'test-order', order_number: p.p_order_number, customer_name: p.p_customer_name, customer_phone: p.p_customer_phone, fulfillment: p.p_fulfillment, address: p.p_address, items: p.p_items, total: p.p_items.reduce((sum, item) => sum + item.price * item.quantity, 0), receipt_name: p.p_receipt_name, receipt_path: p.p_receipt_path, status: 'Pedido recibido', stage: 0, created_at: new Date().toISOString() };
      body = order;
    }
    if (url.pathname.endsWith('/orders')) body = url.searchParams.has('order_number') ? order : (order ? [order] : []);
    await route.fulfill({ status: 200, json: body });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('.campaign-intro').waitFor();
  assert.equal(await page.locator('.menu-item').count(), 0, 'Home contains no purchase menu');
  assert.equal(await page.locator('.campaign-video video[src]').count(), 0, 'Campaign videos not requested above fold');
  assert.equal(await page.locator('.hero-premium__video').count(), 1, 'Original hero retained');
  for (const video of await page.locator('.campaign-video video').all()) {
    await video.scrollIntoViewIfNeeded();
    await page.waitForFunction(el => el.readyState >= 2 && !el.paused, await video.elementHandle());
    assert.equal(await video.evaluate(el => el.videoWidth), 720);
    assert.equal(await video.evaluate(el => el.muted && el.loop && el.playsInline && !el.controls), true);
  }
  await page.locator('.campaign-intro').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('.campaign-video video')].every(v => v.paused));
  for (const width of [375, 390, 430, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    for (const selector of ['.campaign-intro', '.campaign-gallery', '.campaign-sticky', '#opiniones', '#ubicacion', '#pedir']) {
      await page.locator(selector).evaluate(el => window.scrollTo({ top: el.offsetTop - 80, behavior: 'instant' }));
      await page.waitForTimeout(180);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${selector}: overflow at ${width}`);
    }
    for (const img of await page.locator('.campaign-photo img').all()) {
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(el => el.decode());
      assert.equal(await img.evaluate(el => el.naturalWidth), 1170);
    }
    await page.locator('.campaign-intro').evaluate(el => window.scrollTo({ top: el.offsetTop - 65, behavior: 'instant' }));
    await page.waitForTimeout(800);
    await page.screenshot({ path: `artifacts/campaign/home-${width}.png` });
    await page.goto(`${base}/delivery`, { waitUntil: 'domcontentloaded' });
    await page.locator('.menu-item').first().waitFor();
    assert.equal(await page.locator('.menu-item').count(), 7);
    assert.equal(await page.locator('.campaign-video').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Delivery overflow ${width}`);
    await page.screenshot({ path: `artifacts/campaign/delivery-${width}.png` });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#delivery-title').waitFor();
    console.log(`PASS Home/Delivery responsive, media, direct reload: ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  assert.equal(await page.locator('main').evaluate(el => el.inert), true);
  assert.equal(await page.locator('#main-navigation').evaluate(el => Math.round(el.getBoundingClientRect().width) === innerWidth), true, 'Mobile navigation fills the screen');
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('button', { name: 'Abrir menú', exact: true }).evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  await page.locator('.brand-header__mobile-account').click();
  await page.locator('.customer-auth-google').waitFor();
  assert.equal(await page.locator('main').evaluate(el => el.inert), false);
  await page.locator('.customer-auth-close').click();
  await page.locator('.menu-item').first().getByRole('button', { name: 'Doble $11.990', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar BBQ Beast Doble por $11.990', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar una unidad de BBQ Beast' }).click();
  assert.match(await page.locator('.cart-total').innerText(), /23.980/);
  await page.getByRole('button', { name: 'Quitar una unidad de BBQ Beast' }).click();
  await page.locator('.cart-drawer__header').getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  await page.locator('#main-navigation a[href="/"]').click();
  await page.locator('.campaign-intro').waitFor();
  assert.equal(new URL(page.url()).pathname, '/');
  await page.goBack();
  await page.locator('#delivery-title').waitFor();
  await page.goForward();
  await page.locator('.campaign-intro').waitFor();
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  await page.locator('.brand-header__mobile-order').click();
  assert.match(await page.locator('.cart-total').innerText(), /11.990/, 'Cart retained through routes and history');
  await page.getByRole('button', { name: 'CONTINUAR PEDIDO' }).click();
  await page.getByLabel('Nombre', { exact: true }).fill('Prueba automatizada');
  await page.getByLabel('Número móvil, 8 dígitos').fill('12345678');
  await page.getByLabel('Dirección', { exact: true }).fill('Dirección de prueba');
  await page.getByRole('button', { name: 'RETIRO' }).click();
  assert.equal(await page.getByLabel('Dirección', { exact: true }).count(), 0);
  await page.getByRole('button', { name: 'A DOMICILIO', exact: false }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'receipt.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64') });
  await page.getByRole('button', { name: 'ENVIAR PEDIDO Y COMPROBANTE' }).click();
  await page.getByRole('button', { name: 'VER ESTADO DEL PEDIDO' }).click();
  await page.locator('.tracker-panel').waitFor();
  assert.equal(order.total, 11990);
  assert.equal(order.customer_phone, '+56912345678');
  console.log('PASS mobile menu, login entry, cart quantities, shared state, history, receipt checkout and tracking (mock API)');
  await page.goto(`${base}/delivery`, { waitUntil: 'domcontentloaded' });
  for (const [name, count] of [['Promociones', 3], ['Fritos', 3], ['Bebidas', 6], ['Extras', 10], ['Hamburguesas', 7]]) {
    await page.getByRole('button', { name, exact: true }).click();
    assert.equal(await page.locator('.menu-item').count(), count);
  }
  storeOpen = false;
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.store-closed-banner').waitFor();
  assert.equal(await page.locator('.menu-item-add:disabled').count(), 7);
  storeOpen = true; sold = true;
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.menu-item-add:disabled').length === 1);
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.campaign-sticky').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('.campaign-marquee>div').evaluate(el => getComputedStyle(el).animationName), 'none');
  assert.equal(await page.locator('.campaign-video video[src]').count(), 0);
  assert.equal(await page.locator('.reveal-pending').count(), 0);
  await page.locator('#opiniones').scrollIntoViewIfNeeded();
  if (await page.getByLabel('NOMBRE', { exact: true }).isEnabled()) {
    await page.locator('.review-editorial article').waitFor();
    await page.waitForTimeout(3100);
    await page.getByRole('radio', { name: '5 estrellas', exact: true }).check();
    await page.getByLabel('NOMBRE', { exact: true }).fill('Prueba');
    await page.getByLabel('COMENTARIO', { exact: true }).fill('Comentario simulado de prueba.');
    await page.getByRole('button', { name: 'PUBLICAR →' }).click();
    await page.getByRole('status').filter({ hasText: 'Se publicará' }).waitFor();
    assert.equal(submitted.p_rating, 5);
    assert.equal('approved' in submitted, false);
    console.log('PASS approved reviews and moderated submission (mock API)');
  } else console.log('Reviews disabled by current environment; form correctly unavailable');
  assert.equal(await page.locator('.nav-local-pending').count(), 1, 'Unconfigured map stays pending');
  for (const path of ['/admin', '/admin/analytics']) {
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
    await page.locator('.admin-login').waitFor();
  }
  await page.evaluate(() => localStorage.setItem('shet-admin-auth', 'true'));
  await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });
  await page.locator('.admin-shell').waitFor();
  await page.getByRole('button', { name: 'DISPONIBILIDAD', exact: true }).click();
  assert.equal(await page.locator('.admin-product-list article').count(), 29);
  await page.goto(`${base}/admin/analytics`, { waitUntil: 'domcontentloaded' });
  await page.locator('.analytics-bars').waitFor();
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: customer.id, exp: expires, role: 'authenticated' })).toString('base64url')}.test-signature`;
  await page.evaluate(({ key, session }) => { localStorage.removeItem('shet-admin-auth'); localStorage.setItem(key, JSON.stringify(session)); }, { key: `sb-${projectRef}-auth-token`, session: { access_token: token, refresh_token: 'test-refresh', expires_at: expires, expires_in: 3600, token_type: 'bearer', user: customer } });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('.brand-header__account').click();
  await page.locator('.account-panel').waitFor();
  await page.locator('.account-order').waitFor();
  assert.match(await page.locator('.account-panel').innerText(), /Cliente de prueba/i);
  assert.match(await page.locator('.account-order').innerText(), /BBQ Beast/);
  console.log('PASS authenticated customer account, order history and status (mock session/API)');
  assert.deepEqual(errors, []);
  console.log('PASS categories, store/stock, reduced motion, pending location, admin guards/panel/analytics and no JS errors');
} finally { await browser.close(); }
