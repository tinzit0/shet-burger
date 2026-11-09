import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base=process.env.TEST_URL || 'http://127.0.0.1:5173';
const output='artifacts/home-refinement';
await mkdir(output,{recursive:true});
for(const [original,renamed] of [['Abrazo kawaii entre bebida y hamburguesa.gif','abrazo.gif'],['Hamburguesa animada comiendo tocino.gif','tocino.gif']]){
 const hash=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
 assert.equal(await hash(`assets/caricaturas/${original}`),await hash(`public/assets/caricaturas/${renamed}`));
}
const browser=await chromium.launch({channel:process.env.TEST_BROWSER || 'msedge',headless:true});
const results=[];
try{
 for(const width of [375,768,1280]){
  const context=await browser.newContext({viewport:{width,height:1000},isMobile:width<700,hasTouch:width<700});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base);
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.hero__media').count(),1);
  assert.equal(await page.getByRole('button',{name:/Pausar|Reproducir/}).count(),0);
  await page.waitForFunction(()=>!document.querySelector('.hero__media').paused);
  assert.equal(await page.locator('.whatsapp-button').count(),1);
  assert.match(await page.locator('.hero h1').evaluate(e=>getComputedStyle(e).fontFamily),/Impact/,'Hero typography preserved');
  await page.locator('.hero__actions a').click();
  await page.waitForURL('**/delivery');
  await page.locator('.menu-campaign__slide.is-active').waitFor();
  await page.goto(base);
  const mood=page.locator('.mood-board');
  await mood.scrollIntoViewIfNeeded();
  await mood.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  assert.equal(await mood.locator('figure').count(),4);
  assert.equal(await mood.locator('h2 img').count(),0);
  assert.equal(await page.locator('.mood-stickers .mood-board__sticker').count(),2);
  assert.equal(await page.locator('.brand-tape').count(),1);
  assert.equal(await page.locator('.slanted-tape,.community form,.community__tiktok').count(),0);
  assert.match(await mood.locator('.mood-board__side p').innerText(),/CRUJIENTE/);
  const stickerBounds=await page.locator('.mood-stickers').boundingBox();
  const stickerImages=await Promise.all([0,1].map(n=>page.locator('.mood-stickers picture').nth(n).boundingBox()));
  assert.ok(Math.abs((stickerImages[0].x+stickerImages[1].x+stickerImages[1].width)/2-width/2)<5,'GIFs centered in the light strip');
  assert.ok(stickerBounds.y>= (await mood.boundingBox()).y+(await mood.boundingBox()).height-1);
  assert.equal(await page.evaluate(()=>document.fonts.check('16px Anton')),true);
  for(const element of await mood.locator('figure').all())assert.equal(await element.evaluate(e=>getComputedStyle(e).borderRadius),'0px');
  assert.equal(await mood.locator('.mood-board__collage').evaluate(e=>getComputedStyle(e).gap),'0px');
  const big=await mood.locator('.mood-board__photo--table').boundingBox();
  const first=await mood.locator('.mood-board__photo--outside').boundingBox();
  const second=await mood.locator('.mood-board__photo--people').boundingBox();
  const last=await mood.locator('.mood-board__side').boundingBox();
  if(width>=900){
   assert.ok(Number.parseFloat(await mood.locator('h2').evaluate(e=>getComputedStyle(e).fontSize))>=128);
   assert.equal(big.height,420);
   assert.equal(first.height,260);
   assert.ok(Math.abs(first.x+first.width-second.x)<1 && Math.abs(second.x+second.width-big.x)<1 && Math.abs(big.x+big.width-last.x)<1,'Desktop collage has no gaps');
   assert.ok(Math.abs(big.y+big.height-first.y-first.height)<1 && big.y<first.y,'Photographs align at the bottom');
  }else{
   assert.ok(big.y+big.height<=first.y,'Mobile large photograph is above the small ones');
   assert.ok(Math.abs(first.x+first.width-second.x)<1,'Mobile photo columns touch');
  }
  assert.equal(await page.locator('.street-texture').evaluate(e=>e.getBoundingClientRect().height),220);
  assert.match(await page.locator('.street-texture').evaluate(e=>getComputedStyle(e).backgroundImage),/textura.svg/);
  const columns=page.locator('.community > div');
  const boxes=await Promise.all([0,1,2].map(n=>columns.nth(n).boundingBox()));
  if(width>=900){
   assert.ok(boxes.every(b=>b.height===520 && b.y===boxes[0].y));
   assert.ok(Math.abs(boxes[0].x+boxes[0].width-boxes[1].x)<1 && Math.abs(boxes[1].x+boxes[1].width-boxes[2].x)<1);
  }else assert.ok(boxes[0].y+boxes[0].height===boxes[1].y && boxes[1].y+boxes[1].height===boxes[2].y,'Mobile panels stack without gaps');
  if(width<900)assert.equal((await page.locator('.community__photo').boundingBox()).height,420);
  const feed=page.locator('.instagram-feed');
  const track=feed.locator('.instagram-feed__track');
  await feed.scrollIntoViewIfNeeded();
  await feed.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  const groups=feed.locator('.instagram-feed__tiles');
  assert.deepEqual(await groups.nth(0).locator('img').evaluateAll(images=>images.map(i=>i.src)),await groups.nth(1).locator('img').evaluateAll(images=>images.map(i=>i.src)));
  assert.equal(await groups.first().evaluate(e=>getComputedStyle(e).gap),'0px');
  await page.mouse.move(0,0);
  const before=await track.evaluate(e=>getComputedStyle(e).transform);
  await page.waitForTimeout(350);
  assert.notEqual(await track.evaluate(e=>getComputedStyle(e).transform),before);
  await feed.hover();
  assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'paused');
  await page.mouse.move(0,0);
  assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'running');
  const distinctPhoto=await page.locator('.community__photo img').getAttribute('src');
  await page.locator('.community__photo img').evaluate(i=>i.decode());
  assert.equal(await page.locator('img').evaluateAll((images,src)=>images.filter(i=>i.getAttribute('src')===src).length,distinctPhoto),1,'Replacement image appears only once');
  assert.match(await page.getByRole('link',{name:'Instagram de SHET Burger'}).getAttribute('href'),/instagram.com\/shetburger/);
  await page.locator('.location').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('.location').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(10, 10, 10)');
  assert.equal(await page.locator('.location__grid').evaluate(e=>getComputedStyle(e).borderRadius),'0px');
  assert.match(await page.locator('.location iframe').getAttribute('src'),/google.com\/maps/);
  assert.match(await page.locator('.location__details .button').getAttribute('href'),/google.com\/maps\/dir/);
  const map=await page.locator('.location__map').boundingBox(),details=await page.locator('.location__details').boundingBox();
  if(width>=900)assert.ok(map.x+map.width<=details.x+1);
  else assert.ok(map.y+map.height<=details.y+1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await track.evaluate(e=>getComputedStyle(e).animationName),'none');
  for(const ribbon of await page.locator('.brand-tape > div').all())assert.equal(await ribbon.evaluate(e=>getComputedStyle(e).animationName),'none');
  await mood.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>[...document.querySelectorAll('.mood-board__sticker img')].every(i=>i.currentSrc.endsWith('-still.png')));
  await page.screenshot({path:`${output}/collage-${width}.png`});
  await page.locator('.mood-stickers').screenshot({path:`${output}/characters-${width}.png`});
  await page.locator('.community').scrollIntoViewIfNeeded();
  await page.locator('.community').screenshot({path:`${output}/community-${width}.png`});
  await page.locator('.location').scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.locator('.location').screenshot({path:`${output}/location-${width}.png`});
  for(const route of ['/', '/delivery']){
   if(route==='/delivery')await page.goto(base+route);
   await page.locator('.site-footer').scrollIntoViewIfNeeded();
   await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
   await page.waitForTimeout(400);
   const whatsapp=await page.locator('.whatsapp-button').boundingBox();
   for(const link of await page.locator('.site-footer__nav a').all()){
    const bounds=await link.boundingBox();
    const overlaps=bounds.x<whatsapp.x+whatsapp.width && bounds.x+bounds.width>whatsapp.x && bounds.y<whatsapp.y+whatsapp.height && bounds.y+bounds.height>whatsapp.y;
    assert.equal(overlaps,false,'WhatsApp does not cover footer links');
   }
   await page.locator('.site-footer').screenshot({path:output+'/footer-'+(route==='/'?'home':'menu')+'-'+width+'.png'});
  }
  assert.deepEqual(errors,[]);
  const result={width,originalHero:true,collageGap:0,squarePhotos:true,communityPanelsTouch:true,feedLoopAndHoverPause:true,pauseButtonsRemoved:true,formReplaced:true,footerClearOfWhatsApp:true,reducedMotion:true,overflow:false,consoleErrors:errors};
  results.push(result);console.log(JSON.stringify(result));
  await context.close();
 }
 await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close();}
