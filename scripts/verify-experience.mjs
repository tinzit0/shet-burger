// Interactive flows use a simulated store; this never writes real orders.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const artifacts = 'artifacts/interactive-experience';
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
let storeOpen = true;
let soldOut = false;

async function simulateStore(context) {
  await context.routeWebSocket(/supabase/, socket => socket.close());
  await context.route('**/*.supabase.co/**', async route => {
    assert.equal(route.request().method(), 'GET', 'The experience must not write to the real backend');
    const path = new URL(route.request().url()).pathname;
    let json = [];
    if (path.endsWith('/store_settings')) json = { is_open: storeOpen };
    if (path.endsWith('/product_availability')) json = soldOut ? [{ product_id: 'bacon-trip', available: false }] : [];
    await route.fulfill({ status: 200, json });
  });
}

try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await simulateStore(context);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);

  for (const width of [320, 390, 540, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const selector of ['#ritual', '#tu-antojo', '.mood__grid']) {
      const section = page.locator(selector);
      await section.evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'start' }));
      await section.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${selector}: overflow at ${width}px`);
      const clipped = await section.locator('button, h2, h3, p').evaluateAll(elements => elements.filter(element => element.scrollWidth > element.clientWidth + 2).map(element => element.textContent.trim()));
      assert.deepEqual(clipped, [], `${selector}: clipped content at ${width}px`);
      if ([390, 1440].includes(width)) await section.screenshot({ path: `${artifacts}/${selector.replace(/[^a-z-]/g, '')}-${width}.png` });
    }
  }
  console.log('PASS layouts: 320 / 390 / 540 / 768 / 1024 / 1440 / 1920 px, images loaded, no clipped text');

  await page.setViewportSize({ width: 1440, height: 1000 });
  const slider = page.getByRole('slider', { name: 'Separación de las capas' });
  await slider.focus();
  await slider.press('Home');
  assert.equal(await slider.inputValue(), '0');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const closedTop = await page.locator('.atelier__layer').first().evaluate(element => element.offsetTop);
  await slider.press('End');
  assert.equal(await slider.inputValue(), '100');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const openTop = await page.locator('.atelier__layer').first().evaluate(element => element.offsetTop);
  assert.ok(closedTop - openTop > 50, 'The range must visually separate the burger');
  await page.getByRole('button', { name: 'Unir las capas de la burger' }).click();
  assert.equal(await slider.inputValue(), '0');
  await page.getByRole('button', { name: 'Separar las capas de la burger' }).click();
  assert.equal(await slider.inputValue(), '100');
  await page.locator('.atelier__ingredients').getByRole('button', { name: /Cheddar fundido/ }).click();
  assert.equal(await page.locator('.atelier__caption strong').textContent(), 'Cheddar fundido');
  console.log('PASS atelier: keyboard range, assembly, ingredient selection');

  for (const [label, product] of [['Ahumado', 'Cowboy Smoke'], ['Un poco de fuego', 'Onion SHET'], ['Algo distinto', 'Blue Hit'], ['Dulce & salado', 'Bacon Trip']]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    assert.equal(await page.locator('.flavor-finder__details h3').textContent(), `${product}.`);
    await page.locator('.flavor-finder__photo img').evaluate(image => image.decode());
    assert.equal(await page.locator('.flavor-finder__photo img').getAttribute('alt'), product);
  }
  await page.locator('.flavor-finder__size').getByRole('button', { name: /Doble/ }).click();
  await page.getByRole('button', { name: 'Agregar Bacon Trip Doble por $11.990', exact: true }).click();
  await page.locator('.cart-drawer').waitFor();
  assert.match(await page.locator('.cart-drawer').textContent(), /Bacon Trip/);
  assert.match(await page.locator('.cart-drawer').textContent(), /Doble/);
  assert.match(await page.locator('.cart-drawer').textContent(), /11\.990/);
  await page.locator('.cart-drawer').getByRole('button', { name: /Cerrar/ }).click();
  console.log('PASS flavor finder: all four recommendations, correct photo, double variant and cart price');

  const opener = page.getByRole('button', { name: 'Ampliar foto: DOBLE ANTOJO' });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.locator('figure img').evaluate(image => image.decode());
  assert.equal(await dialog.locator('h2').textContent(), 'DOBLE ANTOJO');
  await page.keyboard.press('ArrowRight');
  assert.equal(await dialog.locator('h2').textContent(), 'BUENA COMPAÑÍA');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await dialog.locator('h2').textContent(), 'AL AIRE LIBRE');
  await dialog.getByRole('button', { name: 'Foto siguiente' }).click();
  assert.equal(await dialog.locator('h2').textContent(), 'DOBLE ANTOJO');
  await dialog.screenshot({ path: `${artifacts}/gallery-1440.png` });
  await dialog.getByRole('button', { name: 'Cerrar galería' }).focus();
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)), true, 'Focus stays inside the modal');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await opener.evaluate(element => element === document.activeElement), true, 'Focus returns to the photo');
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
  console.log('PASS gallery: navigation, wraparound, Escape, focus trap, focus restoration');

  soldOut = true;
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('.flavor-finder__add')?.disabled);
  assert.match(await page.locator('.flavor-finder__add').textContent(), /AGOTADA/);
  await page.getByRole('button', { name: 'Ahumado', exact: true }).click();
  assert.equal(await page.locator('.flavor-finder__add').isEnabled(), true);
  storeOpen = false;
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Pedidos cerrados', exact: true }).waitFor();
  assert.equal(await page.locator('.flavor-finder__add').isDisabled(), true);
  console.log('PASS availability: sold-out product and closed store cannot be added');

  storeOpen = true;
  soldOut = false;
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await simulateStore(mobileContext);
  const mobile = await mobileContext.newPage();
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(base, { waitUntil: 'domcontentloaded' });
  await mobile.getByRole('button', { name: 'Ampliar foto: NOCHE SHET' }).tap();
  const mobileDialog = mobile.getByRole('dialog');
  await mobileDialog.waitFor();
  const touchSession = await mobileContext.newCDPSession(mobile);
  await touchSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y: 300 }] });
  await touchSession.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 305 }] });
  await touchSession.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 100, y: 310 }] });
  await touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal(await mobileDialog.locator('h2').textContent(), 'AL AIRE LIBRE');
  await mobileDialog.locator('figure img').evaluate(image => image.decode());
  await mobileDialog.screenshot({ path: `${artifacts}/gallery-390.png` });
  await mobileDialog.getByRole('button', { name: 'Cerrar galería' }).tap();
  await mobileDialog.waitFor({ state: 'detached' });
  await mobile.getByRole('button', { name: 'Ahumado', exact: true }).tap();
  assert.equal(await mobile.locator('.flavor-finder__details h3').textContent(), 'Cowboy Smoke.');
  console.log('PASS touch: photo opening, swipe, close and flavor selection');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.atelier__stack').scrollIntoViewIfNeeded();
  await page.locator('.atelier__stack').hover({ position: { x: 60, y: 90 } });
  await page.waitForFunction(() => document.querySelector('.atelier__stack').style.getPropertyValue('--tilt-x') !== '');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.atelier__stack')).transform === 'none');
  assert.equal(await page.locator('.flavor-finder__photo img').evaluate(image => getComputedStyle(image).animationName), 'none');
  await page.getByRole('link', { name: 'O EXPLORA TODA LA CARTA' }).click();
  await page.waitForURL('**/delivery');
  await page.locator('.menu-item').first().waitFor();
  assert.equal(await page.locator('.menu-item[data-product-id="bacon-trip"]').count(), 1);
  console.log('PASS motion preferences and full-menu navigation');
  assert.deepEqual(errors, [], 'No browser runtime errors');
} finally {
  await browser.close();
}
