import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const out = process.env.SHOT_DIR || '.';
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', headless: true });
try {
  for (const width of [1280, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => msg.type() === 'error' && errors.push(msg.text()));
    let coupons = [
      { id: 'a', code: 'SHET10', title: 'Martes 10%', discount_type: 'percent', value: 10, min_subtotal: 0, expires_at: null, active: true, published: true, product_ids: [], scope_label: 'Todos los productos.' },
      { id: 'b', code: 'DOSXUNO', title: '2×1 burgers', discount_type: 'buy_x_pay_y', value: 1, buy_quantity: 2, pay_quantity: 1, min_subtotal: 5000, expires_at: null, active: false, published: false, product_ids: [], scope_label: 'Todos los productos.' },
    ];
    const deletes = [], saves = [];
    await context.addInitScript(() => localStorage.setItem('shet-demo-admin-token', '00000000-0000-0000-0000-000000000000'));
    // Every mutation is answered in memory: nothing reaches production.
    await page.route('**/rest/v1/rpc/*', async route => {
      const name = new URL(route.request().url()).pathname.split('/').at(-1);
      const args = route.request().postDataJSON();
      if (name === 'admin_list_coupons') return route.fulfill({ json: coupons });
      if (name === 'admin_delete_coupon') { deletes.push(args.p_id); coupons = coupons.filter(c => c.id !== args.p_id); return route.fulfill({ status: 204, body: '' }); }
      if (name === 'admin_save_coupon') { saves.push(args.p_coupon); coupons = coupons.map(c => c.id === args.p_coupon.id ? { ...c, ...args.p_coupon } : c); return route.fulfill({ json: args.p_coupon }); }
      return route.fulfill({ json: [] });
    });
    await page.goto('http://127.0.0.1:5173/admin');
    await page.getByRole('button', { name: 'PROMOCIONES', exact: true }).click();
    await page.locator('.coupon-form').waitFor();
    assert.equal(await page.locator('.coupon-list').count(), 0, 'la lista no debe verse en la pestaña de creación');
    await page.getByRole('button', { name: /CUPONES CREADOS/ }).click();
    await page.locator('.coupon-list article').first().waitFor();
    assert.equal(await page.locator('.coupon-form').count(), 0);
    assert.equal(await page.locator('.coupon-list article').count(), 2);
    await page.screenshot({ path: `${out}/coupons-list-${width}.png`, fullPage: true });
    // Editar: el formulario llega precargado y guarda con edit:true.
    await page.locator('.coupon-list article').filter({ hasText: 'DOSXUNO' }).getByRole('button', { name: 'EDITAR', exact: true }).click();
    await page.getByRole('button', { name: 'EDITAR PROMOCIÓN', exact: true }).waitFor();
    assert.equal(await page.getByLabel('Código').inputValue(), 'DOSXUNO');
    assert.equal(await page.getByLabel('Unidades que lleva').inputValue(), '2');
    await page.getByLabel('Unidades que lleva').fill('3');
    await page.getByLabel('Unidades que paga').fill('2');
    await page.getByLabel('Nombre de la promoción').fill('3×2 burgers');
    await page.screenshot({ path: `${out}/coupons-edit-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true }).click();
    await page.locator('.coupon-list').waitFor();
    const saved = saves.at(-1);
    assert.equal(saved.id, 'b'); assert.equal(saved.edit, true); assert.equal(saved.buy_quantity, 3); assert.equal(saved.pay_quantity, 2); assert.equal(saved.active, false);
    await page.getByText('3×2 burgers').waitFor();
    // Pausar sigue mandando solo el cambio de estado (sin edit).
    await page.locator('.coupon-list article').filter({ hasText: 'SHET10' }).getByRole('button', { name: 'PAUSAR' }).click();
    await page.getByText('Cupón guardado').waitFor();
    assert.equal(saves.at(-1).edit, undefined);
    // Cancelar una edición no guarda nada.
    await page.locator('.coupon-list article').filter({ hasText: 'SHET10' }).getByRole('button', { name: 'EDITAR', exact: true }).click();
    await page.getByRole('button', { name: 'CANCELAR', exact: true }).click();
    await page.locator('.coupon-list').waitFor();
    assert.equal(saves.length, 2);
    const row = page.locator('.coupon-list article').filter({ hasText: 'SHET10' });
    await row.getByRole('button', { name: 'ELIMINAR', exact: true }).click();
    assert.equal(deletes.length, 0, 'el primer toque solo pide confirmación');
    await row.getByRole('button', { name: 'CANCELAR', exact: true }).click();
    await row.getByRole('button', { name: 'ELIMINAR', exact: true }).click();
    await page.screenshot({ path: `${out}/coupons-confirm-${width}.png`, fullPage: true });
    await row.getByRole('button', { name: 'SÍ, ELIMINAR', exact: true }).click();
    await page.getByText('Cupón SHET10 eliminado').waitFor();
    assert.deepEqual(deletes, ['a']);
    assert.equal(await page.locator('.coupon-list article').count(), 1);
    assert.equal(await page.getByRole('button', { name: /CUPONES CREADOS/ }).innerText(), 'CUPONES CREADOS 1');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, 'sin scroll horizontal');
    assert.deepEqual(errors.filter(e => !/Failed to load resource/.test(e)), []);
    console.log(`ok ${width}px`);
    await context.close();
  }
} finally { await browser.close(); }
