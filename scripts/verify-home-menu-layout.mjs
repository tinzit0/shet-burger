import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('artifacts/home-menu-layout', { recursive:true });
const browser = await chromium.launch({channel:'msedge',headless:true});
const results=[];
try {
  for (const [width,height] of [[375,844],[768,1024],[1280,900],[1440,1000],[844,390]]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/');
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('.hero__media').evaluate(async video=>{const poster=new Image();poster.src=video.poster;await poster.decode();});
    const hero=await page.locator('.hero').boundingBox();
    assert.ok(Math.abs(hero.height-height)<2,'Eye hero fills the viewport');
    const media=await page.locator('.hero__media').boundingBox();
    assert.equal(Math.round(media.width),width);
    assert.equal(Math.round(media.height),height);
    const cta=await page.locator('.hero__actions a').boundingBox();
    assert.ok(cta.y>=0 && cta.y+cta.height<=height,'Order button stays in the first screen');
    await page.screenshot({path:`artifacts/home-menu-layout/hero-${width}.png`});
    await page.locator('.location__video').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.location__video video').count(),1);
    assert.equal(await page.locator('.community__instagram > h2 + .location__video').count(),1,'Video sits immediately below the Instagram heading');
    assert.equal(await page.locator('#ubicacion video').count(),0,'No video beside the map');
    const video=await page.locator('.location__video video').evaluate(element=>({muted:element.muted,inline:element.playsInline,fit:getComputedStyle(element).objectFit}));
    assert.deepEqual(video,{muted:true,inline:true,fit:'cover'});
    const photo=await page.locator('.community__photo').boundingBox();
    assert.equal(Math.round(photo.height),width>=900?520:420,'Community photos keep their original compact height');
    assert.equal(await page.locator('.location__video').getByRole('link',{name:/VER EN INSTAGRAM/}).getAttribute('href'),'https://www.instagram.com/shetburger/');
    assert.equal(await page.locator('.location__map iframe').count(),1);
    if(width===1280) {
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.waitForFunction(()=>document.querySelector('.location__video video')?.currentTime>0,{},{timeout:15000});
      assert.equal(await page.locator('.location__video video').evaluate(element=>element.paused),false,'Scroll video actually plays');
      await page.emulateMedia({reducedMotion:'reduce'});
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Home has no horizontal overflow');
    await page.locator('.community').screenshot({path:`artifacts/home-menu-layout/instagram-${width}.png`,style:'.brand-header,.whatsapp-button{visibility:hidden!important}'});
    await page.goto('http://127.0.0.1:5173/delivery');
    await page.locator('#menu-title').scrollIntoViewIfNeeded();
    assert.equal((await page.locator('#menu-title').innerText()).trim(),'BURGERS');
    assert.equal(await page.locator('.editorial-menu-heading .menu-eyebrow').count(),0,'Pasa Smash removed');
    const grid=page.locator('.menu-category--burgers .editorial-products');
    const columns=await grid.evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').length);
    assert.equal(columns,width>=1024?3:1,'Desktop uses three burger columns; phone/tablet retain rows');
    if(width>=1024) {
      const categoryColumns=await page.locator('.menu-category .editorial-products').evaluateAll(grids=>grids.map(grid=>getComputedStyle(grid).gridTemplateColumns.split(' ').length));
      assert.ok(categoryColumns.every(count=>count===3),'Every menu category has three columns on desktop');
    }
    const cards=page.locator('.menu-category--burgers .menu-item');
    if(width>=1024) {
      const boxes=await cards.evaluateAll(items=>items.slice(0,4).map(item=>{const r=item.getBoundingClientRect();return {x:r.x,y:r.y};}));
      assert.ok(Math.abs(boxes[0].y-boxes[2].y)<1 && boxes[3].y>boxes[0].y,'Cards form rows of three');
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Menu has no horizontal overflow');
    await cards.locator('img').evaluateAll(images=>Promise.all(images.map(async image=>{image.loading='eager';await image.decode();})));
    await page.locator('.menu-category--burgers').screenshot({path:`artifacts/home-menu-layout/burgers-${width}.png`,style:'.brand-header,.menu-jump,.whatsapp-button,.skip-link{visibility:hidden!important}'});
    await cards.first().getByRole('button',{name:/Elegir/}).click();
    await page.locator('.product-configurator').waitFor();
    await page.locator('.product-configurator').getByRole('button',{name:'Cerrar',exact:true}).click();
    const drinks=page.locator('.menu-category--bebidas .menu-item');
    const drink=drinks.first();
    const quantity=drink.locator('.quantity-control output');
    const before=Number(await quantity.innerText());
    await drink.locator('.quantity-control button').last().click();
    assert.equal(Number(await quantity.innerText()),before+1,'Drink quantities still work');
    for(const category of ['fritos','extras']) {
      const item=page.locator(`.menu-category--${category} .menu-item`).first();
      const label=(await item.locator('h3').textContent()).trim();
      const controls=item.locator('.quantity-control');
      await controls.getByRole('button',{name:`Agregar ${label}`,exact:true}).click();
      await controls.getByRole('button',{name:`Agregar ${label}`,exact:true}).click();
      assert.equal(await controls.locator('output').innerText(),'3');
      await controls.getByRole('button',{name:`Quitar ${label}`,exact:true}).click();
      assert.equal(await controls.locator('output').innerText(),'2');
      await item.locator('.menu-item-add').click();
      const cart=page.locator('.cart-drawer');
      await cart.waitFor();
      const line=cart.locator('.cart-item').filter({has:page.locator('h3',{hasText:label})});
      assert.equal(await line.locator('.cart-quantity > span').innerText(),'2','Selected quantity reaches the cart');
      if(category==='extras') assert.match(await line.innerText(),/independiente/i,'Extras remain separate products');
      await cart.getByRole('button',{name:'Cerrar',exact:true}).click();
    }
    if(width===1280) {
      for(const category of ['promos','bebidas','extras']) {
        const section=page.locator(`.menu-category--${category}`);
        await section.locator('img').evaluateAll(images=>Promise.all(images.map(async image=>{image.loading='eager';await image.decode();})));
        await section.screenshot({path:`artifacts/home-menu-layout/${category}-${width}.png`,style:'.brand-header,.menu-jump,.whatsapp-button,.skip-link{visibility:hidden!important}'});
      }
    }
    assert.deepEqual(errors,[],'No JavaScript exceptions');
    results.push({width,height,fullScreenHero:true,instagramVideo:true,burgerColumns:columns,heading:'BURGERS',personalization:true,horizontalOverflow:false});
    console.log(JSON.stringify(results.at(-1)));
    await page.close();
  }
  await writeFile('artifacts/home-menu-layout/results.json',JSON.stringify(results,null,2));
} finally {await browser.close();}
