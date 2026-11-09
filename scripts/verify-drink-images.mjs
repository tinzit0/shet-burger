import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const output = 'artifacts/menu-reference';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];
try {
  for (const width of [375, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(base);
    const homePhoto = page.locator('.community__photo img');
    await homePhoto.scrollIntoViewIfNeeded();
    await homePhoto.evaluate(i => i.decode());
    assert.match(decodeURI(await homePhoto.getAttribute('src')), /muerde la tentacion/);
    assert.equal(await page.locator('.community form').count(), 0);
    await page.locator('.community__photo').screenshot({ path: `${output}/tentacion-${width}.png` });
    await page.goto(`${base}/delivery`);
    const section = page.locator('.menu-category--bebidas');
    await section.scrollIntoViewIfNeeded();
    const cards = section.locator('.menu-item');
    assert.equal(await cards.count(), 7, 'All six drinks and Jumex remain');
    const names = await cards.locator('h3').allTextContents();
    assert.equal(await section.locator('.menu-item-photo img').count(), 7);
    await section.locator('img').evaluateAll(images => Promise.all(images.map(i => i.decode())));
    for (const card of await cards.all()) {
      const photo = await card.locator('.menu-item-photo').boundingBox();
      const copy = await card.locator('.menu-item-copy').boundingBox();
      const quantity = await card.locator('.quantity-control').boundingBox();
      const add = await card.locator('.menu-item-add').boundingBox();
      assert.ok(photo.x + photo.width <= copy.x + 1, 'Photo stays beside product details');
      assert.ok(quantity.y >= copy.y + copy.height - 1, 'Quantity does not cover product details');
      assert.ok(quantity.x + quantity.width <= add.x + 1, 'Quantity does not cover add button');
      assert.equal(await card.locator('img').evaluate(i => getComputedStyle(i).objectFit), 'contain');
      assert.match(await card.locator('img').getAttribute('src'), /^\/assets\/drinks\/.+\.webp$/);
    }
    let quantityAndFlavor = false;
    const coca = page.locator('#product-bebida-0');
    const jumex = page.locator('#product-jugo-jumex');
    if (!await coca.locator('.menu-item-add').isDisabled() && !await jumex.locator('.menu-item-add').isDisabled()) {
      const cocaPrice = (await coca.locator('.menu-item-options b').first().innerText()).replace(/\D/g, '');
      await coca.getByRole('button', { name: 'Agregar Coca Cola', exact: true }).click();
      await coca.getByRole('button', { name: 'Agregar Coca Cola', exact: true }).click();
      assert.equal(await coca.locator('output').innerText(), '3');
      await coca.locator('.menu-item-add').click();
      const cart = page.locator('.cart-drawer');
      await cart.waitFor();
      const line = cart.locator('.cart-item').filter({ has: page.getByRole('heading', { name: 'Coca Cola', exact: true }) });
      assert.equal(await line.locator('.cart-quantity > span').innerText(), '3');
      assert.equal((await line.locator('.cart-item__info > strong').innerText()).replace(/\D/g, ''), cocaPrice);
      await line.locator('img').evaluate(i => i.decode());
      await cart.getByRole('button', { name: 'Cerrar', exact: true }).click();
      await jumex.getByRole('button', { name: 'Agregar Jugo Jumex', exact: true }).click();
      await jumex.locator('.menu-item-add').click();
      const modal = page.locator('.product-configurator');
      await modal.waitFor();
      assert.equal(await modal.locator('.quantity-control output').innerText(), '2');
      await modal.locator('.product-configurator__photo img').evaluate(i => i.decode());
      assert.equal(await modal.locator('.product-configurator__photo img').evaluate(i => getComputedStyle(i).objectFit), 'contain');
      assert.equal(await modal.locator('.product-configurator__options button').count(), 4);
      await modal.getByRole('button', { name: 'Mango', exact: true }).click();
      await modal.locator('.product-configurator__submit').click();
      await cart.waitFor();
      const juiceLine = cart.locator('.cart-item').filter({ has: page.getByRole('heading', { name: 'Jugo Jumex', exact: true }) });
      assert.equal(await juiceLine.locator('.cart-quantity > span').innerText(), '2');
      assert.match(await juiceLine.innerText(), /Mango/);
      await cart.getByRole('button', { name: 'Cerrar', exact: true }).click();
      quantityAndFlavor = true;
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await section.scrollIntoViewIfNeeded();
    await section.screenshot({ path: `${output}/drinks-${width}.png` });
    assert.deepEqual(errors, [], 'No console errors');
    const result = { width, names, localImages: 7, imageAndControlsDoNotOverlap: true, quantityAndFlavor, horizontalOverflow: false, consoleErrors: errors };
    results.push(result);
    console.log(JSON.stringify(result));
    await context.close();
  }
  await writeFile(`${output}/drink-results.json`, JSON.stringify(results, null, 2));
} finally { await browser.close(); }
