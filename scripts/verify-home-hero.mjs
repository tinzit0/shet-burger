import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const output = 'artifacts/home-hero';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', headless: true });
const sections = ['poster', 'hero-intro', 'scroll-marquee', 'signature', 'promo-vibe', 'sides'];
try {
  for (const [width, height] of [[390, 844], [820, 1180], [1440, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 700, hasTouch: width < 700, reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(base + '/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${output}/cover-${width}.png` });
    assert.ok(await page.locator('.hero video').count(), 'Eye video stays on the cover');
    const before = await page.locator('.signature__label strong').textContent();
    await page.getByRole('button', { name: 'Hamburguesa siguiente' }).click();
    assert.notEqual(await page.locator('.signature__label strong').textContent(), before, 'Signature carousel advances');
    await page.getByRole('button', { name: 'Hamburguesa anterior' }).click();
    for (const name of sections) {
      const section = page.locator(`.${name}`).first();
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(2800);
      await section.screenshot({ path: `${output}/${name}-${width}.png`, animations: 'disabled' });
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.equal(overflow, 0, `No horizontal overflow at ${width}px`);
    assert.deepEqual(errors, [], `No console errors at ${width}px`);
    console.log(width, 'ok');
    await context.close();
  }
} finally { await browser.close(); }
