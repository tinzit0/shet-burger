import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const artifacts = 'artifacts/premium-after';
const widths = [360, 390, 430, 768, 1024, 1440, 1920];
await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/supabase|Failed to load resource/.test(message.text())) errors.push(message.text()); });

  for (const width of widths) {
    const height = width <= 430 ? 844 : width <= 768 ? 900 : 1000;
    await page.setViewportSize({ width, height });
    for (const [name, path] of [['home', '/'], ['delivery', '/delivery']]) {
      await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(name === 'home' ? '#hero-title' : '#delivery-title');
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise(resolve => setTimeout(resolve, 60));
        }
        await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name} tiene overflow a ${width}px`);
      const tinyText = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(element => {
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || !element.getClientRects().length) return false;
        const ownText = [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        return ownText && Number.parseFloat(style.fontSize) < 11;
      }).map(element => ({ text: element.textContent.trim().slice(0, 50), size: getComputedStyle(element).fontSize })));
      assert.deepEqual(tinyText, [], `${name} contiene texto menor a 11px en ${width}px`);
      await page.screenshot({ path: `${artifacts}/${name}-${width}.png`, fullPage: true });
    }
    console.log(`PASS responsive, typography and no overflow: ${width}px`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('.hero video').count(), 0);
  assert.equal(await page.locator('.photo-journal__item img').evaluateAll(images => images.every(image => image.getBoundingClientRect().height < 500)), true);
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  assert.equal(await page.locator('main').evaluate(element => element.inert), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('button', { name: 'Abrir menú', exact: true }).evaluate(element => element === document.activeElement), true);

  await page.goto(`${base}/delivery`, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('.menu-item').count(), 29);
  assert.equal(await page.locator('.menu-category').first().locator('.menu-item-photo img').evaluateAll(images => images.every(image => image.srcset.includes('1024w') && image.currentSrc.includes('/menu/hd/'))), true);
  await page.locator('.menu-item').first().getByRole('button', { name: 'Doble $11.990', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar BBQ Beast Doble por $11.990', exact: true }).click();
  await page.locator('.cart-drawer').waitFor();
  assert.match(await page.locator('.cart-total').innerText(), /11\.990/);
  await page.keyboard.press('Escape');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#delivery-title').waitFor();
  for (const path of ['/admin', '/admin/analytics']) {
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
    await page.locator('.admin-login').waitFor();
  }
  assert.deepEqual(errors, []);
  console.log('PASS navigation, menu focus trap, HD images, variants, cart, direct reloads and admin guards');
} finally {
  await browser.close();
}
