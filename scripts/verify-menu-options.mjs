import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const artifacts = process.env.TEST_ARTIFACTS || 'artifacts/menu-options';
await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];

try {
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.clear());
  await context.route('**/rest/v1/catalog_products*', route => route.fulfill({ json: [] }));
  await context.route('**/rest/v1/store_settings*', route => route.fulfill({ json: { is_open: true } }));
  await context.route('**/rest/v1/product_availability*', route => route.fulfill({ json: [] }));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/supabase|Failed to load resource/.test(message.text())) errors.push(message.text());
  });

  for (const [width, height] of [[320, 720], [390, 844], [1440, 1000]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/delivery`, { waitUntil: 'domcontentloaded' });
    await page.locator('#delivery-title').waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.menu-cover__topline').getByText('CARTA ONLINE', { exact: true }).count(), 1, 'La portada debe decir Carta online arriba');
    assert.equal(await page.locator('[aria-roledescription="carrusel"]').count(), 1, 'La tarjeta destacada debe cambiar');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Sin overflow a ${width}px`);
    assert.equal(await page.locator('.menu-cover__feature img').evaluate(image => image.complete && image.naturalWidth > 0), true, 'La foto destacada debe cargar');
    const backgroundBefore = await page.locator('.menu-cover__ambient').evaluate(element => getComputedStyle(element).backgroundImage);
    const productBefore = await page.locator('.menu-cover__feature-caption strong').first().innerText();
    const headlineBefore = await page.locator('#delivery-title').innerText();
    const noteBefore = await page.locator('.menu-cover__copy > p').innerText();
    const detailsBefore = await page.locator('.menu-cover__proof').innerText();
    await page.getByRole('button', { name: 'Siguiente burger' }).click();
    const productAfter = await page.locator('.menu-cover__feature-caption strong').first().innerText();
    const headlineAfter = await page.locator('#delivery-title').innerText();
    const noteAfter = await page.locator('.menu-cover__copy > p').innerText();
    const detailsAfter = await page.locator('.menu-cover__proof').innerText();
    const backgroundAfter = await page.locator('.menu-cover__ambient').evaluate(element => getComputedStyle(element).backgroundImage);
    assert.notEqual(productAfter, productBefore, 'El control debe cambiar la burger destacada');
    assert.notEqual(headlineAfter, headlineBefore, 'El titular debe cambiar junto con la burger');
    assert.notEqual(noteAfter, noteBefore, 'La descripción debe cambiar junto con la burger');
    assert.notEqual(detailsAfter, detailsBefore, 'Los ingredientes deben cambiar junto con la burger');
    assert.equal(backgroundAfter, backgroundBefore, 'El fondo premium debe mantenerse');
    const burgerCard = page.locator('.menu-category--burgers .menu-item').first();
    assert.equal((await burgerCard.locator('.menu-item-price').innerText()).trim(), '$9.490');
    assert.equal(await burgerCard.locator('.menu-item-options').count(), 0, `La tarjeta de burger no muestra Doble a ${width}px`);
    assert.equal(await page.locator('#product-jugo-jumex').count(), 1, 'Jumex debe aparecer en Bebidas');
    await page.locator('.menu-cover').screenshot({ path: `${artifacts}/cover-${width}.png` });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/delivery`, { waitUntil: 'domcontentloaded' });
  const firstBurger = page.locator('.menu-category--burgers .menu-item').first();
  await page.locator('.menu-category--burgers').screenshot({ path: `${artifacts}/burger-menu-390.png` });
  assert.equal((await firstBurger.locator('.menu-item-price').innerText()).trim(), '$9.490');
  assert.equal(await firstBurger.locator('.menu-item-options').count(), 0, 'La tarjeta de burger no debe mostrar Doble');
  await firstBurger.locator('.menu-item-add').click();
  const burgerDialog = page.locator('.product-configurator');
  await burgerDialog.waitFor();
  assert.deepEqual(await burgerDialog.locator('.product-configurator__variants button').allTextContents(), ['Simple$9.490', 'Doble$11.990']);
  assert.equal(await burgerDialog.locator('.product-configurator__extras button').count(), 10, 'La hamburguesa debe permitir elegir extras en el mismo selector');
  await burgerDialog.getByRole('button', { name: /Doble\s*\$11\.990/ }).click();
  await burgerDialog.getByRole('button', { name: /Extra carne y cheddar/ }).click();
  assert.match(await burgerDialog.locator('.product-configurator__submit').innerText(), /14\.490/, 'El total debe sumar el extra elegido');
  await page.screenshot({ path: `${artifacts}/burger-extras-390.png` });
  await burgerDialog.getByRole('button', { name: /AGREGAR CON 1 EXTRA/ }).click();
  await page.locator('.cart-drawer').waitFor();
  assert.match(await page.locator('.cart-item').first().innerText(), /DOBLE/i);
  assert.match(await page.locator('.cart-drawer').innerText(), /EXTRA CARNE Y CHEDDAR[\s\S]*PARA:\s*BBQ BEAST/i);
  assert.match(await page.locator('.cart-total').innerText(), /14\.490/);
  await page.keyboard.press('Escape');

  await page.goto(`${base}/delivery`, { waitUntil: 'domcontentloaded' });
  const triplePromo = page.locator('#product-triple-shet');
  await triplePromo.scrollIntoViewIfNeeded();
  await triplePromo.locator('.menu-item-add').click();
  const promoDialog = page.locator('.product-configurator');
  await promoDialog.waitFor();
  assert.equal(await promoDialog.locator('.product-configurator__drinks select').count(), 3, 'Triple SHET debe permitir elegir sus tres bebidas');
  assert.deepEqual(await promoDialog.locator('.product-configurator__drinks select').first().locator('option').allTextContents(), ['Coca Cola', 'Coca Cola Zero', 'Sprite', 'Sprite Zero', 'Fanta', 'Kem']);
  await promoDialog.locator('.product-configurator__drinks select').nth(0).selectOption({ label: 'Coca Cola Zero' });
  await promoDialog.locator('.product-configurator__drinks select').nth(1).selectOption({ label: 'Sprite' });
  await promoDialog.locator('.product-configurator__drinks select').nth(2).selectOption({ label: 'Fanta' });
  await page.screenshot({ path: `${artifacts}/promo-drinks-390.png` });
  await promoDialog.locator('.product-configurator__submit').click();
  await page.locator('.cart-drawer').waitFor();
  assert.match(await page.locator('.cart-drawer').innerText(), /BEBIDA 1:\s*COCA COLA ZERO[\s\S]*BEBIDA 2:\s*SPRITE[\s\S]*BEBIDA 3:\s*FANTA/i);
  await page.keyboard.press('Escape');

  for (const [promoId, expectedDrinks] of [['vicio', 1], ['tentacion', 2]]) {
    const promo = page.locator(`#product-${promoId}`);
    await promo.scrollIntoViewIfNeeded();
    await promo.locator('.menu-item-add').click();
    const dialog = page.locator('.product-configurator');
    await dialog.waitFor();
    assert.equal(await dialog.locator('.product-configurator__drinks select').count(), expectedDrinks, `${promoId} debe mostrar ${expectedDrinks} selector(es) de bebida`);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
  }

  const jumex = page.locator('#product-jugo-jumex');
  await jumex.scrollIntoViewIfNeeded();
  await jumex.locator('.menu-item-add').click();
  const jumexDialog = page.locator('.product-configurator');
  await jumexDialog.waitFor();
  assert.deepEqual(await jumexDialog.locator('.product-configurator__options button').allTextContents(), ['Durazno', 'Manzana', 'Piña', 'Mango']);
  assert.equal(await jumexDialog.locator('.product-configurator__submit').isDisabled(), true, 'Jumex exige elegir un sabor');
  await page.screenshot({ path: `${artifacts}/jumex-selector-390.png` });
  await jumexDialog.getByRole('button', { name: 'Mango' }).click();
  await jumexDialog.locator('.product-configurator__submit').click();
  await page.locator('.cart-drawer').waitFor();
  assert.match(await page.locator('.cart-drawer').innerText(), /JUGO JUMEX[\s\S]*SABOR:\s*MANGO/i);

  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/delivery`, { waitUntil: 'domcontentloaded' });
  await page.locator('.menu-category--burgers .menu-item').first().locator('.menu-item-add').click();
  const desktopBurgerDialog = page.locator('.product-configurator');
  await desktopBurgerDialog.waitFor();
  assert.equal(await desktopBurgerDialog.locator('.product-configurator__extras button').count(), 10, 'Los extras también deben estar disponibles en escritorio');
  assert.equal(await desktopBurgerDialog.locator('.product-configurator__panel').evaluate(element => element.scrollWidth <= element.clientWidth), true, 'El selector de escritorio no debe desbordarse');
  assert.equal(await desktopBurgerDialog.locator('.product-configurator__submit').isVisible(), true, 'El botón para agregar debe quedar visible sin deslizar en escritorio');
  await page.screenshot({ path: `${artifacts}/burger-extras-1440.png` });
  assert.equal(await desktopBurgerDialog.locator('.product-configurator__submit').evaluate(element => {
    const button = element.getBoundingClientRect();
    const panel = element.closest('.product-configurator__panel').getBoundingClientRect();
    return button.bottom <= panel.bottom && button.top >= panel.top;
  }), true, 'El botón para agregar debe permanecer dentro del selector');
  assert.deepEqual(errors, []);
console.log('PASS fondo premium fijo, portada completa rotativa, burgers con extras, bebidas en promociones y sabores Jumex');
} finally {
  await browser.close();
}
