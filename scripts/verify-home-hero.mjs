import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const output = 'artifacts/home-jetset';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', headless: true });
const sections = ['.hero', '.info-strip', '.scroll-marquee', '.crew', '.mood-board', '.tape-video', '.community', '.location'];
try {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    for (const selector of sections) assert.equal(await page.locator(selector).count(), 1, `${selector} missing at ${width}px`);
    assert.equal(await page.locator('.poster, .signature').count(), 0, 'old sections still rendered'); assert.equal(await page.locator('.home-split').count(), 0, 'split tiles still rendered'); assert.equal(await page.locator('.top-three').count(), 0, 'top three still rendered'); assert.equal(await page.locator('.ig-post video').count(), 1, 'instagram post missing');
    assert.ok(await page.locator('.hero__media').getAttribute('src'), 'eye video missing');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, `horizontal overflow ${overflow}px at ${width}px`);
    for (const selector of sections.slice(1)) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${output}/home-${width}.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('home jetset layout ok');
} finally { await browser.close(); }
