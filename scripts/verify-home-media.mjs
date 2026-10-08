import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { measureHeroComposition } from './hero-composition.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const artifacts = process.env.TEST_ARTIFACTS || 'artifacts/home-media-refresh';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
await mkdir(artifacts, { recursive: true });

const scrollTo = (page, selector) => page.locator(selector).evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'start' }));
const videoPaused = (page, selector, paused) => page.waitForFunction(({ selector, paused }) => document.querySelector(selector).paused === paused, { selector, paused });
const videos = [
  { section: '.hero__scene', video: '.hero video', control: '.hero__video-control', away: '#ambiente' },
  { section: '#ambiente', video: '.film video', control: '.film__control', away: '.hero__scene' },
];

try {
  for (const width of [390, 1440]) {
    const touch = width === 390;
    const context = await browser.newContext({ viewport: { width, height: touch ? 844 : 1000 }, hasTouch: touch, isMobile: touch });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.querySelector('.hero video').videoWidth > 0);

    const composition = await page.locator('.hero video').evaluate(measureHeroComposition);
    assert.ok(composition.fullBleed && composition.fillsScreen && composition.naturalCover, 'El video debe llenar la pantalla sin marcos ni deformaciones');
    assert.equal(touch ? composition.titleAboveEye : composition.titleBesideEye, true, 'El título debe quedar arriba del ojo en teléfono y a su costado en escritorio');
    assert.equal(composition.controlClear, true, 'El control no debe tapar el ojo');

    for (const item of videos) {
      const control = page.locator(item.control);
      const activate = () => touch ? control.tap() : control.click();
      await scrollTo(page, item.section);
      await videoPaused(page, item.video, false);
      await control.scrollIntoViewIfNeeded();
      assert.equal(await control.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
      }), true, `Otra capa tapa ${item.control} a ${width}px`);
      await activate();
      await videoPaused(page, item.video, true);
      const frozen = await page.locator(item.video).evaluate(video => video.currentTime);
      await page.waitForTimeout(350);
      assert.ok(Math.abs(await page.locator(item.video).evaluate(video => video.currentTime) - frozen) < 0.06, 'El video debe detenerse realmente');
      assert.match(await control.getAttribute('aria-label'), /^Reproducir/);

      await scrollTo(page, item.away);
      await page.waitForTimeout(150);
      await scrollTo(page, item.section);
      await page.waitForTimeout(250);
      assert.equal(await page.locator(item.video).evaluate(video => video.paused), true, 'Volver al video debe respetar la pausa manual');
      await activate();
      await videoPaused(page, item.video, false);
      await page.waitForFunction(({ selector, previous }) => Math.abs(document.querySelector(selector).currentTime - previous) > 0.1, { selector: item.video, previous: frozen });
      await control.focus();
      await page.keyboard.press('Space');
      await videoPaused(page, item.video, true);
      await page.keyboard.press('Enter');
      await videoPaused(page, item.video, false);
    }

    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise(resolve => setTimeout(resolve, 55));
      }
      await Promise.all([...document.querySelectorAll('main img')].map(image => image.decode()));
    });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const photos = await page.locator('.mood-card').evaluateAll(cards => cards.map(card => {
      const frame = card.querySelector('.mood-card__image').getBoundingClientRect();
      const image = card.querySelector('img');
      const caption = card.querySelector('figcaption').getBoundingClientRect();
      return { square: Math.abs(frame.width - frame.height) < 1, fullPhoto: getComputedStyle(image).objectFit === 'contain' && getComputedStyle(image).transform === 'none', unobscured: caption.top >= frame.bottom - 1, loaded: image.naturalWidth > 0 };
    }));
    assert.equal(photos.length, 4);
    assert.ok(photos.every(photo => photo.square && photo.fullPhoto && photo.unobscured && photo.loaded));
    assert.equal(await page.locator('.hero__overlay, .hero__lead, .hero img').count(), 0);
    assert.equal(await page.getByText('LA MESA', { exact: true }).count(), 0);
    assert.equal(await page.getByText('02 · EL CÓDIGO', { exact: true }).count(), 0);
    assert.equal(await page.locator('.shet-plans__links a').count(), 3);
    for (const [name, selector] of [['hero', '.hero'], ['mood', '.mood'], ['club', '.shet-club'], ['plans', '.shet-plans'], ['film', '.film']]) {
      await scrollTo(page, selector);
      await page.waitForTimeout(750);
      await page.locator(selector).screenshot({ path: `${artifacts}/${name}-${width}.png` });
    }
    await context.close();
    console.log(`PASS ${width}px: real ${touch ? 'touch' : 'mouse'} controls, frozen video time, pause persistence, keyboard, complete square photos and new content`);
  }

  const compact = await browser.newPage();
  for (const [width, height] of [[320, 568], [540, 720], [720, 844], [640, 390]]) {
    await compact.setViewportSize({ width, height });
    await compact.goto(base, { waitUntil: 'domcontentloaded' });
    await compact.evaluate(() => document.fonts.ready);
    await compact.waitForFunction(() => document.querySelector('.hero video').videoWidth > 0);
    const composition = await compact.locator('.hero video').evaluate(measureHeroComposition);
    assert.ok(composition.fullBleed && composition.fillsScreen && composition.naturalCover);
    assert.equal(width > height ? composition.titleBesideEye : composition.titleAboveEye, true, `El título tapa el ojo a ${width} × ${height}`);
    const control = await compact.locator('.hero__video-control').boundingBox();
    assert.ok(control.y >= 0 && control.y + control.height <= height, 'La pausa debe permanecer visible en pantallas bajas');
  }
  await compact.close();
  console.log('PASS compact phones, small tablets and landscape: full-screen video and unobscured gaze');

  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const page = await reduced.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  for (const item of videos) {
    await scrollTo(page, item.section);
    await page.waitForTimeout(200);
    assert.equal(await page.locator(item.video).evaluate(video => video.paused), true, 'Movimiento reducido desactiva autoplay');
    await page.locator(item.control).click();
    await videoPaused(page, item.video, false);
    await page.locator(item.control).click();
    await videoPaused(page, item.video, true);
  }
  await reduced.close();
  assert.deepEqual(errors, []);
  console.log('PASS reduced motion: no autoplay, explicit play and pause work on both videos');
} finally {
  await browser.close();
}
