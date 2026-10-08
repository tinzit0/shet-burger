import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { measureHeroComposition } from './hero-composition.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const artifacts = process.env.TEST_ARTIFACTS || 'artifacts/premium-after';
const widths = [320, 360, 390, 430, 768, 980, 1024, 1440, 1920];
await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
try {
  const context = await browser.newContext();
  // Keep UI checks independent of the live store and avoid changing its data.
  await context.route('**/rest/v1/store_settings*', route => route.fulfill({ json: { is_open: true } }));
  await context.route('**/rest/v1/product_availability*', route => route.fulfill({ json: [] }));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/supabase|Failed to load resource/.test(message.text())) errors.push(message.text()); });

  for (const width of widths) {
    const height = width <= 430 ? 844 : width <= 768 ? 900 : 1000;
    await page.setViewportSize({ width, height });
    for (const [name, path] of [['home', '/'], ['delivery', '/delivery']]) {
      await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(name === 'home' ? '#hero-title' : '#delivery-title');
      await page.evaluate(() => document.fonts.ready);
      if (name === 'home') {
        await page.waitForFunction(() => document.querySelector('.hero video').videoWidth > 0);
        const composition = await page.locator('.hero video').evaluate(measureHeroComposition);
        assert.ok(composition.fullBleed && composition.fillsScreen && composition.naturalCover, `El video debe ocupar toda la pantalla a ${width}px`);
        assert.equal(width <= 720 ? composition.titleAboveEye : composition.titleBesideEye, true, `El título debe dejar despejada la mirada a ${width}px`);
      }
      const orderButton = await page.locator('.brand-header__order').evaluate(element => {
        const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
        const luminance = color => {
          const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(channel => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        const fg = luminance(style.color), bg = luminance(style.backgroundColor);
        return {
          visible: rect.width > 0 && rect.height >= 44 && rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight,
          background: style.backgroundColor,
          contrast: (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05),
        };
      });
      assert.equal(orderButton.visible, true, `Pedir no es visible en ${name} a ${width}px`);
      assert.notEqual(orderButton.background, 'rgba(0, 0, 0, 0)', 'Pedir necesita un fondo visible');
      assert.ok(orderButton.contrast >= 4.5, `Contraste insuficiente en Pedir: ${orderButton.contrast}`);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise(resolve => setTimeout(resolve, 60));
        }
        await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name} tiene overflow a ${width}px`);
      const failedImages = await page.evaluate(() => [...document.querySelectorAll('main img')].filter(image => !image.complete || !image.naturalWidth).map(image => image.currentSrc || image.src));
      assert.deepEqual(failedImages, [], `${name} contiene imágenes sin cargar en ${width}px`);
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
  assert.equal(await page.locator('.hero video').count(), 1);
  assert.equal(await page.locator('.initial-hero-media').count(), 0);
  assert.equal(await page.locator('.mood-card img').evaluateAll(images => images.length === 4 && images.every(image => image.getBoundingClientRect().height < 500)), true);
  assert.equal(await page.locator('.mood-ticker__track').count(), 2);
  assert.equal(await page.getByText('Carne contra el fierro, cheddar que cae y una caja rosa que se reconoce de lejos. En la mesa, en el auto o donde te agarre el hambre.', { exact: true }).count(), 0);
  assert.equal(await page.locator('.brand-signal__track').count(), 2);
  assert.equal(await page.locator('.signature').count(), 0);
  assert.equal(await page.getByText('CUATRO FORMAS', { exact: false }).count(), 0);
  assert.equal(await page.evaluate(() => Number.parseFloat(getComputedStyle(document.body).fontSize) >= 16), true);
  const textOverflow = await page.evaluate(() => [...document.querySelectorAll('.home-actions__item strong, .mood__note strong, .club-card h3, .club-card a, .club-card strong')].flatMap(element => {
    const box = element.closest('.home-actions__item, .mood__note, .club-card');
    const textRect = element.getBoundingClientRect(), boxRect = box.getBoundingClientRect();
    return textRect.left < boxRect.left - 1 || textRect.right > boxRect.right + 1 || textRect.top < boxRect.top - 1 || textRect.bottom > boxRect.bottom + 1 ? [element.textContent.trim()] : [];
  }));
  assert.deepEqual(textOverflow, []);
  await page.locator('.home-actions a[href="#ambiente"]').click();
  await page.waitForFunction(() => { const top = document.getElementById('ambiente').getBoundingClientRect().top; return top >= 0 && top < innerHeight / 2; });
  assert.equal(await page.locator('#ambiente').evaluate(element => element.getBoundingClientRect().top >= 0), true);
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  assert.equal(await page.locator('main').evaluate(element => element.inert), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('button', { name: 'Abrir menú', exact: true }).evaluate(element => element === document.activeElement), true);

  await page.locator('.brand-header__order').click();
  await page.waitForURL('**/delivery');
  assert.equal(await page.locator('.cart-drawer').count(), 0, 'Pedir debe abrir el catálogo cuando el carrito está vacío');
  await page.locator('.brand-header__order').click();
  await page.waitForFunction(() => { const rect = document.getElementById('menu').getBoundingClientRect(); return rect.top >= 0 && rect.top < innerHeight / 2; });
  await page.locator('.menu-jump').getByRole('link', { name: 'Bebidas' }).click();
  await page.waitForFunction(() => { const top = document.getElementById('menu-category-bebidas').getBoundingClientRect().top; return top >= 140 && top < innerHeight / 2; });
  assert.equal(await page.locator('.menu-category').count(), 5, 'Los accesos rápidos no deben ocultar categorías');
  assert.equal(await page.locator('.menu-item').count(), 29);
  assert.equal(await page.locator('.menu-category').first().locator('.menu-item-photo img').evaluateAll(images => images.every(image => image.srcset.includes('1024w') && image.currentSrc.includes('/menu/hd/'))), true);
  await page.locator('.menu-item').first().getByRole('button', { name: 'Doble $11.990', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar BBQ Beast Doble por $11.990', exact: true }).click();
  await page.locator('.cart-drawer').waitFor();
  assert.match(await page.locator('.cart-total').innerText(), /11\.990/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.brand-header__order').getAttribute('aria-label'), 'Ver mi pedido, 1 producto');
  await page.locator('.brand-header__order').click();
  await page.locator('.cart-drawer').waitFor();
  assert.match(await page.locator('.cart-total').innerText(), /11\.990/);
  await page.keyboard.press('Escape');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#delivery-title').waitFor();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  assert.deepEqual(await page.locator('.mood__stamp, .mood-ticker__track, .brand-signal__words').evaluateAll(elements => elements.map(element => getComputedStyle(element).animationName)), ['none', 'none', 'none', 'none']);
  assert.equal(await page.locator('.hero video').evaluate(video => video.paused), true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !document.querySelector('.hero video').paused);
  await page.getByRole('button', { name: 'Pausar video de portada' }).click();
  await page.waitForFunction(() => document.querySelector('.hero video').paused);
  await page.getByRole('button', { name: 'Reproducir video de portada' }).click();
  await page.waitForFunction(() => !document.querySelector('.hero video').paused);
  await context.route('**/rest/v1/product_availability*', route => route.fulfill({ json: [{ product_id: 'bbq-beast', available: false }] }));
  await page.goto(`${base}/delivery`, { waitUntil: 'domcontentloaded' });
  await page.locator('.menu-item.is-sold-out').first().waitFor();
  assert.equal(await page.locator('.menu-item').first().locator('.menu-item-add').isDisabled(), true);
  assert.equal(await page.locator('.menu-item').nth(1).locator('.menu-item-add').isEnabled(), true);
  assert.equal(await page.locator('.menu-item-photo__unavailable').innerText(), 'AGOTADO');
  await context.route('**/rest/v1/store_settings*', route => route.fulfill({ json: { is_open: false } }));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.store-closed-banner').waitFor();
  assert.equal(await page.locator('.menu-item-add:disabled').count(), 29);
  assert.match(await page.locator('.delivery-intro .button').innerText(), /EXPLORAR EL MENÚ/);
  for (const path of ['/admin', '/admin/analytics']) {
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' });
    await page.locator('.admin-login').waitFor();
  }
  assert.deepEqual(errors, []);
  console.log('PASS order CTA visibility/contrast, navigation, categories, variants, cart, video controls, reduced motion, sold-out/closed states and admin guards');
} finally {
  await browser.close();
}
