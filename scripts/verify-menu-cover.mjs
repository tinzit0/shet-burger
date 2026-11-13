import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// Screenshots the /delivery cover (and the closed notices when the store is closed).
const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const output = 'artifacts/menu-cover';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', headless: true });
try {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/delivery`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const popup = page.locator('.closed-popup');
    if (await popup.count()) {
      await page.screenshot({ path: `${output}/popup-${width}.png` });
      assert.equal(await page.locator('.sad-face').count(), 0, 'sad faces still rendered');
      assert.match(await popup.innerText(), /18:00/);
      await page.locator('.closed-popup__cta').click();
    }
    await page.screenshot({ path: `${output}/cover-${width}.png` });
    if (await page.locator('.store-closed').count()) {
      await page.locator('.menu-campaign').scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${output}/cover-scrolled-${width}.png` });
    }
    await page.locator('.menu-campaign__arrow--next').click();
    await page.waitForTimeout(1600);
    await page.locator('.menu-campaign__stage').screenshot({ path: `${output}/slide2-${width}.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, `horizontal overflow ${overflow}px at ${width}px`);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('menu cover ok');
} finally { await browser.close(); }
