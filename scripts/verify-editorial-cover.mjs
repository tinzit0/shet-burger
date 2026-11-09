import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const output = 'artifacts/editorial-cover';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', headless: true });
const results = [];
try {
  for (const [width, height] of [[375, 844], [768, 1024], [1280, 1000]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: width < 700, isMobile: width < 700 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${base}/delivery`);
    const active = page.locator('.menu-campaign__slide.is-active');
    await active.locator('.menu-campaign__backdrop img').evaluate(image => image.decode());
    const revealArrows = async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      if (width >= 768) await page.locator('.menu-campaign__stage').hover();
      await page.waitForTimeout(300);
    };
    const arrow = page.getByRole('button', { name: 'Siguiente destacado', exact: true });
    await page.mouse.move(0, 0);
    assert.equal(await arrow.evaluate(element => getComputedStyle(element).opacity), '1', 'Arrows always remain visible');
    await revealArrows();
    assert.equal(await arrow.evaluate(element => getComputedStyle(element).opacity), '1', 'Arrows reappear on interaction');
    await page.mouse.move(0, 0);
    assert.equal(await arrow.evaluate(element => getComputedStyle(element).opacity), '1', 'Arrows remain visible after interaction');
    const names = await page.locator('.menu-campaign__slide h2').allTextContents();
    const catalogNames = await page.locator('.menu-category--burgers .menu-item h3,.menu-category--promos .menu-item h3').allTextContents();
    assert.equal(await page.locator('.delivery-outro').count(), 0, 'Pink Hecho en Nonguén block removed');
    assert.match(await page.locator('.menu-catalog > .menu-category').last().getAttribute('class'), /menu-category--extras/, 'Extras finish the menu');
    assert.deepEqual([...names].sort(), [...catalogNames].sort(), 'All existing burgers and promotions remain available');
    assert.equal(await page.getByRole('button', { name: /Pausar carrusel|Reanudar carrusel/ }).count(), 0, 'Pause/play control removed');
    await page.locator('.menu-campaign__dots button').first().click();
    assert.equal(await page.locator('.menu-campaign.is-playing').count(), 0);
    const dots = page.locator('.menu-campaign__dots button');
    for (let index = 0; index < names.length; index++) {
      await dots.nth(index).click();
      await page.waitForTimeout(700);
      assert.equal(await active.locator('h2').innerText(), names[index].toUpperCase());
      await active.locator('.menu-campaign__backdrop img').evaluate(image => image.decode());
      const imageQuality = await active.locator('.menu-campaign__framed-photo').evaluate(frame => {
        const crop=frame.viewBox.baseVal;
        const bounds=frame.getBoundingClientRect();
        const native=frame.closest('article').querySelector('.menu-campaign__backdrop img');
        const scale=Math.min(bounds.width/crop.width,bounds.height/crop.height);
        return { source:frame.querySelector('image').getAttribute('href'),fit:frame.getAttribute('preserveAspectRatio'),feather:Number(frame.querySelector('feGaussianBlur').getAttribute('stdDeviation')),pixels:native.naturalWidth,needed:480*scale*Math.min(devicePixelRatio,1.5) };
      });
      assert.match(imageQuality.source,/\/assets\/(campaign\/[^/]+\.jpg|menu\/page-[\d-]+\.webp)$/,'Use authentic photographs, without generated or silhouette cutouts');
      assert.equal(imageQuality.fit,'xMidYMid meet','The complete product frame fits without being cropped to fill');
      assert.ok(imageQuality.feather>0,'Soft feathered edges instead of rectangular cuts');
      assert.equal(await active.locator('.menu-campaign__price b').evaluate(element=>getComputedStyle(element).backgroundColor),'rgba(0, 0, 0, 0)','Prices have no black box');
      assert.ok(imageQuality.pixels>=imageQuality.needed*.8,'Keep enlargement within the original photo resolution');
      const photo = await active.locator('.menu-campaign__visual').boundingBox();
      const name = await active.locator('.menu-campaign__name').boundingBox();
      const cta = await active.locator('.menu-campaign__order').boundingBox();
      const controls = await page.locator('.menu-campaign__controls').boundingBox();
      const spread = await active.locator('.menu-campaign__spread').boundingBox();
      const previousArrow = await page.locator('.menu-campaign__arrow--prev').boundingBox();
      const nextArrow = await arrow.boundingBox();
      const stage = await page.locator('.menu-campaign__stage').boundingBox();
      assert.ok(previousArrow.x >= stage.x && previousArrow.x < stage.x + 12 && nextArrow.x + nextArrow.width <= stage.x + stage.width, 'Arrows stay at the outer edges');
      const arrowCenter = width <= 1000 ? photo.y + photo.height / 2 : stage.y + stage.height / 2;
      assert.ok(Math.abs(previousArrow.y + previousArrow.height / 2 - arrowCenter) < 1 && Math.abs(nextArrow.y + nextArrow.height / 2 - arrowCenter) < 1, 'Arrows center on the photo on mobile and banner on desktop');
      if (width > 1000) assert.equal(Math.round(stage.height),460,'Compact desktop banner');
      if (width >= 768 && width <= 1000) assert.ok(photo.y + photo.height <= name.y + 1,'Tablet text and purchase button do not obscure the photo');
      const layers = await active.evaluate(element => ({ tint:element.style.getPropertyValue('--slide-bg'), blur:getComputedStyle(element.querySelector('.menu-campaign__backdrop img')).filter, mask:element.querySelector('.menu-campaign__framed-photo image').getAttribute('mask') }));
      assert.equal(layers.tint,['#F09AC4','#4A3A47','#C2185B'][index%3]);
      assert.match(layers.blur,/blur\(35px\)/);
      assert.match(layers.mask,/url\(#.+-edge\)/,'Photo edges fade into background');
      assert.equal(await active.locator('.menu-campaign__backdrop img').getAttribute('src'), imageQuality.source,'Background and foreground use the same photo');
      for (const selector of ['.menu-campaign__visual', '.menu-campaign__name', '.menu-campaign__description', '.menu-campaign__price', '.menu-campaign__order']) {
        const bounds = await active.locator(selector).boundingBox();
        assert.ok(bounds.x >= spread.x - 1 && bounds.x + bounds.width <= spread.x + spread.width + 1, `${selector} stays inside its composition`);
      }
      if (width < 768) assert.ok(photo.y + photo.height <= name.y + 16, 'Mobile content follows the photo with a slight overlap');
      assert.ok(cta.y + cta.height < controls.y, 'CTA remains above carousel controls');
      assert.equal(await active.locator('h2').evaluate(element => element.scrollWidth <= element.clientWidth + 1), true, `Product title fits: ${names[index]} at ${width}`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No accidental horizontal scrolling');
      const pattern = await active.locator('.menu-campaign__texture').evaluate(element => ({ image: getComputedStyle(element).backgroundImage, size: getComputedStyle(element).backgroundSize, repeat: getComputedStyle(element).backgroundRepeat, position: getComputedStyle(element).backgroundPosition }));
      assert.match(pattern.image, new RegExp(index % 2 ? 'antigrasa-pink' : 'antigrasa-white'));
      assert.equal(pattern.size, 'cover', 'One continuous original artwork');
      assert.equal(pattern.repeat, 'no-repeat', 'No mismatched tile seams');
      assert.equal(pattern.position, '50% 50%', 'Artwork centered symmetrically');
      const price = (await active.locator('.menu-campaign__price b').innerText()).replace(/\D/g, '');
      await active.locator('.menu-campaign__order').click();
      const modal = page.locator('.product-configurator');
      await modal.waitFor();
      assert.equal((await modal.locator('h2').textContent()).trim(), names[index]);
      assert.equal((await modal.locator('.product-configurator__submit b').innerText()).replace(/\D/g, ''), price, 'Matching product and catalog price reach personalization');
      await modal.getByRole('button', { name: 'Cerrar', exact: true }).click();
    }
    await dots.first().click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${output}/white-${width}.png` });
    await revealArrows();
    await page.getByRole('button', { name: 'Siguiente destacado', exact: true }).click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${output}/pink-${width}.png` });
    await dots.nth(2).click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${output}/light-${width}.png` });
    await dots.nth(1).click();
    await page.waitForTimeout(700);
    if (width < 700) {
      const cdp = await context.newCDPSession(page);
      const bounds = await active.locator('.menu-campaign__photo').boundingBox();
      const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x + 60, y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 60, y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(name => document.querySelector('.menu-campaign__slide.is-active h2')?.textContent === name, names[2]);
      assert.equal(await page.locator('.product-configurator').count(), 0, 'Swipe does not accidentally open personalization');
      const controls = await page.locator('.menu-campaign__controls').boundingBox();
      const whatsapp = await page.locator('.whatsapp-button').boundingBox();
      const intersects = controls.x < whatsapp.x + whatsapp.width && controls.x + controls.width > whatsapp.x && controls.y < whatsapp.y + whatsapp.height && controls.y + controls.height > whatsapp.y;
      assert.equal(intersects,false,`WhatsApp does not cover controls: ${JSON.stringify({controls,whatsapp})}`);
    }
    await revealArrows();
    await page.getByRole('button', { name: 'Destacado anterior', exact: true }).click();
    const before = await active.locator('h2').textContent();
    await page.evaluate(() => document.activeElement?.blur());
    await page.mouse.move(0, 0);
    await page.waitForFunction(() => document.querySelector('.menu-campaign')?.classList.contains('is-playing'));
    if (width === 1280) {
      await page.waitForFunction(name => document.querySelector('.menu-campaign__slide.is-active h2')?.textContent !== name, before, { timeout: 7500 });
    }
    await page.locator('.menu-campaign__arrow--next').focus();
    assert.equal(await page.locator('.menu-campaign.is-playing').count(),0,'Keyboard focus pauses autoplay');
    await page.evaluate(()=>document.activeElement?.blur());
    if (width >= 768) {
      await page.locator('.menu-campaign__stage').hover();
      assert.equal(await page.locator('.menu-campaign.is-playing').count(),0,'Hover pauses autoplay');
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.mouse.move(0,0);
    assert.equal(await page.locator('.menu-campaign.is-playing').count(),0,'Reduced motion disables autoplay');
    assert.ok(await active.evaluate(element=>getComputedStyle(element).transitionDuration.split(',').every(duration=>parseFloat(duration)<=.001)),'Reduced motion disables slide transitions');
    assert.deepEqual(errors, [], `Console at ${width}`);
    const result = { width, height, products: names.length, integratedPhotoLayers: true, originalPhotos: true, arrowsAlwaysVisible: true, centeredOuterArrows: true, autoplaySeconds:6, pausePlayRemoved: true, matchingProductAndPrice: true, touch: width < 700, horizontalOverflow: false, consoleErrors: errors };
    results.push(result);
    console.log(JSON.stringify(result));
    await context.close();
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally { await browser.close(); }
