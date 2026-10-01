// Run against Vite with VITE_REVIEWS_ENABLED=true. Uses mock API responses only.
// Requires Playwright in the development environment (not a production dependency).
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = process.env.TEST_URL || 'http://127.0.0.1:5174';
const artifacts = 'artifacts/editorial';
await mkdir(artifacts, { recursive: true });
const errors = [];
try {
  const context = await browser.newContext();
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await context.routeWebSocket(/supabase/, socket => socket.close());
  let mode = 'empty', submitted = null, storeOpen = true, sold = false;
  await context.route('**/*.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    let body = [];
    if (url.pathname.endsWith('/store_settings')) body = { is_open: storeOpen };
    if (url.pathname.endsWith('/product_availability')) body = sold ? [{ product_id: 'bbq-beast', available: false }] : [];
    if (url.pathname.endsWith('/review_summary')) body = [{ total: mode === 'approved' ? 8 : 0, average: mode === 'approved' ? 4.5 : null }];
    if (url.pathname.endsWith('/reviews') && mode === 'approved') {
      const from = Number(url.searchParams.get('offset') || 0);
      body = Array.from({ length: from ? 2 : 6 }, (_, i) => ({ id: String(from+i), name: `PRUEBA ${from+i}`, rating: 4, comment: '<script>texto literal</script> Opinión simulada para prueba de interfaz.', created_at: '2026-01-01' }));
    }
    if (url.pathname.endsWith('/submit_review')) { submitted = route.request().postDataJSON(); body = null; }
    if (mode === 'error' && /reviews|review_summary/.test(url.pathname)) return route.fulfill({ status: 500, json: { message: 'Simulated offline' } });
    await route.fulfill({ status: 200, json: body });
  });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  if (process.env.SKIP_LAYOUT) await page.goto(base, { waitUntil: 'domcontentloaded' });
  for (const width of process.env.SKIP_LAYOUT ? [] : [375, 390, 430, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.locator('.editorial-intro').waitFor();
    await page.locator('.motion-ready').first().waitFor({ state: 'attached' });
    for (const element of await page.locator('.motion-ready').all()) {
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
    }
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 650) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForTimeout(850);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow at ${width}`);
    assert.equal(await page.locator('.menu-item').count(), 7);
    assert.equal(await page.locator('.reveal-pending').count(), 0, 'All headings reveal after scroll');
    assert.equal(await page.locator('.menu-item-photo img').evaluateAll(imgs => imgs.every(i => i.naturalWidth > 0)), true);
    assert.equal(await page.locator('.menu-item-photo img').evaluateAll(imgs => imgs.every(i => i.currentSrc.includes('/menu/hd/') && i.srcset.includes('1024w'))), true, 'Enhanced responsive images loaded');
    await page.screenshot({ path: `${artifacts}/${width}.png`, fullPage: true });
    console.log(`PASS layout, images and reveals: ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  assert.equal(await page.locator('main').evaluate(el => el.inert), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('button', { name: 'Abrir menú', exact: true }).evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  await page.locator('#main-navigation a[href="#menu"]').click();
  assert.equal(await page.locator('main').evaluate(el => el.inert), false);
  await page.locator('.menu-item').first().getByRole('button', { name: 'Doble $11.990', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar BBQ Beast Doble por $11.990', exact: true }).click();
  await page.locator('.cart-drawer').waitFor();
  assert.match(await page.locator('.cart-drawer').innerText(), /11.990/);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#opiniones').scrollIntoViewIfNeeded();
  await page.waitForTimeout(3500);
  assert.match(await page.locator('.review-summary').innerText(), /Todavía no hay/);
  await page.getByRole('radio', { name: '1 estrella', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('radio', { name: '2 estrellas', exact: true }).isChecked(), true);
  await page.getByLabel('NOMBRE', { exact: true }).fill('Prueba de interfaz');
  await page.getByLabel('COMENTARIO', { exact: true }).fill('Opinión simulada; no se guarda en una base real.');
  await page.getByRole('button', { name: 'PUBLICAR →', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Se publicará' }).waitFor();
  assert.equal(submitted.p_rating, 2);
  assert.equal(submitted.p_name, 'Prueba de interfaz');
  assert.equal('approved' in submitted, false);
  assert.equal(await page.locator('.review-editorial article').count(), 0);
  console.log('PASS mobile menu, keyboard stars, variant/cart and moderated submission');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('.menu-item-photo').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const photo = page.locator('.menu-item-photo').first();
  await photo.hover({ position: { x: 35, y: 35 } });
  await page.waitForFunction(() => document.querySelector('.menu-item-photo').classList.contains('is-tilting'));
  assert.notEqual(await photo.evaluate(el => el.style.getPropertyValue('--tilt-x')), '0.00deg');
  await page.getByRole('button', { name: 'Promociones', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.menu-item').length === 3);
  for (const item of await page.locator('.menu-item').all()) { await item.scrollIntoViewIfNeeded(); await page.waitForTimeout(160); }
  assert.equal(await page.locator('.menu-item.reveal-pending').count(), 0);
  await page.getByRole('button', { name: 'Burgers', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.menu-item').length === 7);
  await page.locator('.editorial-intro').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('[data-drift]').style.getPropertyValue('--scroll-progress') !== '');
  assert.notEqual(await page.locator('.reading-progress').evaluate(el => el.style.transform), 'scaleX(0)');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelectorAll('.reveal-pending').length === 0);
  assert.equal(await page.locator('.reveal-pending').count(), 0);
  assert.equal(await page.locator('[data-drift]').first().evaluate(el => el.style.getPropertyValue('--scroll-progress')), '');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('.motion-ready').first().waitFor({ state: 'attached' });
  console.log('PASS tilt, category entrances, scroll effects and live reduced-motion switch');
  mode = 'approved';
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#opiniones').scrollIntoViewIfNeeded();
  await page.getByText('MÁS OPINIONES ↓', { exact: true }).waitFor();
  assert.match(await page.locator('.review-summary').innerText(), /4.5/);
  await page.getByText('MÁS OPINIONES ↓', { exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.review-editorial article').length === 8);
  assert.equal(await page.locator('.review-editorial script').count(), 0);
  mode = 'error';
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#opiniones').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Reintentar', exact: true }).waitFor();
  mode = 'empty';
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await page.getByText('Todavía no hay opiniones publicadas. ¿Te animas?', { exact: true }).waitFor();
  storeOpen = false;
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.store-closed-banner').waitFor();
  assert.equal(await page.locator('.menu-item-add:disabled').count(), 7);
  storeOpen = true; sold = true;
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.menu-item-add:disabled').length === 1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('.reveal-pending').count(), 0);
  assert.equal(await page.locator('.editorial-ticker>div').evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });
  await page.locator('.admin-login').waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS approved pagination, literal text, error/retry, store closed, stock, reduced motion and admin route');
} finally { await browser.close(); }
