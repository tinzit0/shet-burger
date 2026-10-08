import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const artifacts = process.env.TEST_ARTIFACTS || 'artifacts/mood-filled';
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];

try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);

  for (const width of [320, 390, 540, 720, 768, 960, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('#promesa').evaluate(section => section.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await page.locator('.mood img').evaluateAll(images => Promise.all(images.map(image => image.decode())));

    const composition = await page.locator('.mood__intro').evaluate(intro => {
      const panel = intro.getBoundingClientRect();
      const title = intro.querySelector('.mood__title').getBoundingClientRect();
      const photo = intro.querySelector('.mood__moment').getBoundingClientRect();
      const origin = intro.querySelector('.mood__stamp').getBoundingClientRect();
      const boxes = [title, photo, origin];
      const overlap = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
      return {
        colored: getComputedStyle(intro).backgroundColor !== getComputedStyle(intro.parentElement).backgroundColor,
        contained: boxes.every(box => box.left >= panel.left && box.right <= panel.right && box.top >= panel.top && box.bottom <= panel.bottom),
        overlapping: boxes.some((box, index) => boxes.slice(index + 1).some(other => overlap(box, other))),
        filledMiddle: innerWidth <= 960 || (photo.left >= title.right && photo.right <= origin.left && photo.left - title.right <= 49 && origin.left - photo.right <= 49),
        clippedText: [...intro.querySelectorAll('h2, p, span, strong, figcaption, a')].filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.textContent.trim()),
      };
    });
    assert.ok(composition.colored && composition.contained && !composition.overlapping && composition.filledMiddle, `Composición inválida a ${width}px: ${JSON.stringify(composition)}`);
    assert.deepEqual(composition.clippedText, [], `Textos cortados a ${width}px`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('.mood__moment img, .mood-card img').evaluateAll(images => images.length === 5 && images.every(image => image.complete && image.naturalWidth && getComputedStyle(image).objectFit === 'contain')), true, 'Las cinco fotografías deben verse completas');
    assert.equal(await page.locator('.mood-card__image').evaluateAll(frames => frames.length === 4 && frames.every(frame => Math.abs(frame.clientWidth - frame.clientHeight) <= 1)), true, 'La galería debe mantener sus cuatro cuadrados');

    const directions = page.locator('.mood__stamp a');
    assert.match(await directions.getAttribute('href'), /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=.+/);
    assert.equal(await directions.getAttribute('target'), '_blank');
    await directions.scrollIntoViewIfNeeded();
    await directions.focus();
    assert.equal(await directions.evaluate(link => {
      const box = link.getBoundingClientRect();
      return box.height >= 44 && link === document.activeElement && link.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }), true, 'Cómo llegar debe ser accesible y no quedar tapado');

    if ([390, 1440].includes(width)) {
      await page.locator('.mood').screenshot({ path: `${artifacts}/mood-${width}.png` });
    }
    console.log(`PASS SHET Mood ${width}px: filled layout, complete photos, no clipped text, accessible directions`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
