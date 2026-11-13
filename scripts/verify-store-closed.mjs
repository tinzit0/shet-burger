import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// Forces the closed state locally (Supabase blocked) and screenshots the notices.
const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const output = 'artifacts/store-closed';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', headless: true });
try {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700 });
    await page.route(/supabase\.co/, route => route.abort());
    await page.addInitScript(() => localStorage.setItem('shet-store-open', 'false'));
    await page.goto(`${base}/delivery`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const popup = page.locator('.closed-popup');
    assert.equal(await popup.count(), 1, 'popup missing');
    assert.match(await popup.innerText(), /ABRIMOS[\s\S]*18:00/);
    assert.equal(await page.locator('.sad-face').count(), 0);
    await page.screenshot({ path: `${output}/popup-${width}.png` });
    await page.locator('.closed-popup__cta').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${output}/delivery-${width}.png` });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('.closed-popup__close').click();
    await page.screenshot({ path: `${output}/home-alert-${width}.png` });
    await page.close();
  }
  console.log('store closed ok');
} finally { await browser.close(); }
