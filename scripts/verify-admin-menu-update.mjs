import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Read the actual catalog before creating isolated UI response fixtures.
  const catalogResponse = page.waitForResponse(response => response.url().includes('/shet_catalog_products') && response.ok());
  const stockResponse = page.waitForResponse(response => response.url().includes('/product_availability') && response.ok());
  const contentResponse = page.waitForResponse(response => response.url().includes('/shet_site_content') && response.ok());
  await page.goto('http://127.0.0.1:5173/');
  let catalog = await (await catalogResponse).json();
  let stock = await (await stockResponse).json();
  let content = await (await contentResponse).json();
  let storeOpen = true;
  const writes = [];
  await context.addInitScript(() => localStorage.setItem('shet-demo-admin-token', '00000000-0000-0000-0000-000000000000'));
  await page.route('**/rest/v1/shet_catalog_products*', route => route.fulfill({ json: catalog }));
  await page.route('**/rest/v1/shet_site_content*', route => route.fulfill({ json: content }));
  await page.route('**/rest/v1/product_availability*', route => route.fulfill({ json: stock }));
  await page.route('**/rest/v1/store_settings*', route => route.fulfill({ json: { id: 1, is_open: storeOpen } }));
  // Every mutation is handled in memory: no test action reaches production writes.
  await page.route('**/rest/v1/rpc/*', async route => {
    const name = new URL(route.request().url()).pathname.split('/').at(-1);
    const args = route.request().postDataJSON();
    writes.push({ name, args });
    if (name === 'demo_update_product_availability') {
      stock = [...stock.filter(row => row.product_id !== args.p_product_id), { product_id: args.p_product_id, available: args.p_available }];
    } else if (name === 'demo_update_store_open') storeOpen = args.p_is_open;
    else if (name === 'shet_save_catalog') {
      catalog = catalog.map(row => ({ ...row, payload: args.p_products.find(product => product.id === row.payload.id) || row.payload }));
    } else if (name === 'shet_save_content') content = { payload: args.p_content };
    else throw new Error(`Unexpected mutation in admin QA: ${name}`);
    await route.fulfill({ json: true });
  });
  await page.goto('http://127.0.0.1:5173/admin');
  await page.getByRole('button', { name: 'DISPONIBILIDAD', exact: true }).click();
  for (const name of ['BBQ Beast', 'Extra carne y cheddar', 'Tocino', 'Coca Cola']) {
    const row = page.locator('.admin-product-list > article').filter({ has: page.getByText(name, { exact: true }) });
    const button = row.getByRole('button');
    await button.click();
    assert.match(await button.innerText(), /AGOTADO/);
    await button.click();
    assert.match(await button.innerText(), /DISPONIBLE/);
  }
  await page.getByRole('switch').click();
  assert.equal(await page.getByRole('switch').getAttribute('aria-checked'), 'false');
  await page.getByRole('switch').click();
  assert.equal(await page.getByRole('switch').getAttribute('aria-checked'), 'true');
  await page.goto('http://127.0.0.1:5173/admin/content');
  const extra = page.locator('.admin-catalog-groups article').filter({ has: page.getByText('Extra carne y cheddar', { exact: true }) });
  await extra.getByRole('button', { name: 'EDITAR', exact: true }).click();
  await page.getByLabel('Precio opción 1', { exact: true }).fill('2501');
  await page.getByLabel('Mostrar en MEJORA TUS PAPAS', { exact: true }).check();
  await page.getByRole('button', { name: 'GUARDAR Y PUBLICAR', exact: true }).click();
  await page.locator('.admin-editor-form').waitFor({ state: 'detached' });
  const savedExtra = writes.findLast(item => item.name === 'shet_save_catalog').args.p_products[0];
  assert.equal(savedExtra.prices[0][1], '$2.501');
  assert.equal(savedExtra.friesExtra, true);
  assert.equal(savedExtra.standalone, false);
  const promo = page.locator('.admin-catalog-groups article').filter({ has: page.getByText('Tentación', { exact: true }) });
  await promo.getByRole('button', { name: 'EDITAR', exact: true }).click();
  assert.equal(await page.getByLabel('Hamburguesas a elegir', { exact: true }).inputValue(), '2');
  assert.equal(await page.getByLabel('Bebidas a elegir', { exact: true }).inputValue(), '2');
  await page.getByLabel('Permitir doble cobrando la diferencia del precio del catálogo').uncheck();
  const slot = page.locator('.promo-rules-editor details').first();
  await slot.locator('summary').click();
  await slot.getByLabel('Permitir doble en hamburguesa 1', { exact: true }).uncheck();
  await slot.getByLabel('BBQ Beast', { exact: true }).check();
  await slot.getByLabel('Tocino', { exact: true }).check();
  await page.locator('fieldset').filter({ has: page.getByText('Hamburguesas participantes (sin selección: todas)', { exact: true }) }).getByLabel('BBQ Beast', { exact: true }).check();
  await page.getByRole('button', { name: 'GUARDAR Y PUBLICAR', exact: true }).click();
  await page.locator('.admin-editor-form').waitFor({ state: 'detached' });
  const savedPromo = writes.findLast(item => item.name === 'shet_save_catalog').args.p_products[0];
  assert.equal(savedPromo.allowBurgerVariants, false);
  assert.deepEqual(savedPromo.allowedBurgerIds, ['bbq-beast']);
  assert.equal(savedPromo.promotionSlots[0].allowBurgerVariants, false);
  assert.deepEqual(savedPromo.promotionSlots[0].allowedExtraIds, ['extra-6']);
  await page.getByRole('button', { name: 'TEXTOS DEL SITIO', exact: true }).click();
  await page.getByLabel('Mensaje del pop-up', { exact: true }).fill('Mensaje de verificación aislada');
  await page.getByLabel('Horario de atención (opcional)', { exact: true }).fill('Horario de verificación aislada');
  await page.getByRole('button', { name: 'PUBLICAR TEXTOS', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.admin-editor-message')?.textContent.includes('Textos publicados'));
  assert.equal(writes.findLast(item => item.name === 'shet_save_content').args.p_content.closedMessage, 'Mensaje de verificación aislada');
  assert.deepEqual(errors, []);
  const result = { status: 'passed', stockRecovery: ['burger', 'meat-extra', 'bacon', 'drink'], catalogEditing: true, promotionConfig: true, closureMessage: true, productionWrites: 0, consoleErrors: errors };
  await writeFile('artifacts/menu-update/admin-results.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); }
