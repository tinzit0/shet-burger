import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// Usa una instancia de Chromium con --remote-debugging-port=9225.
const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const debugging = process.env.TEST_BROWSER || 'http://127.0.0.1:9225';
const output = 'artifacts/menu-campaign';
await mkdir(output, { recursive: true });
const target = await (await fetch(`${debugging}/json/new?about:blank`, { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let nextId = 0;
const pending = new Map(), errors = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if (!message.id) return;
  const request = pending.get(message.id);
  if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result);
  pending.delete(message.id);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const ready = async selector => {
  for (let i = 0; i < 80; i++) { if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return; await wait(150); }
  throw new Error(`No aparece ${selector}`);
};
const screenshot = async name => { const image = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(`${output}/${name}.png`, Buffer.from(image.data, 'base64')); };
const promos = [
  {id:'qa-2x1',code:'SMASH2X1',title:'Doble antojo',discount_type:'buy_x_pay_y',value:1,buy_quantity:2,pay_quantity:1,min_subtotal:0,active:true,published:true,product_ids:['bacon-trip'],scope_label:'Bacon Trip.'},
  {id:'qa-shipping',code:'ENVIOGRATIS',title:'Hoy invita el delivery',discount_type:'free_delivery',value:1,min_subtotal:0,active:true,published:true,product_ids:[]},
];

try {
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    localStorage.clear(); localStorage.setItem('shet-demo-admin-token','qa-local-only');
    const promos=${JSON.stringify(promos)};
    const originalFetch=window.fetch.bind(window);
    window.fetch=async(input,options)=>{
      const url=typeof input==='string'?input:input.url;
      const reply=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
      if(url.includes('/rest/v1/rpc/admin_list_coupons'))return reply(promos);
      if(url.includes('/rest/v1/rpc/admin_save_coupon')){window.__qaSaved=JSON.parse(options.body);return reply({...window.__qaSaved.p_coupon,id:'qa-created'});}
      if(url.includes('/rest/v1/orders')||url.includes('/rest/v1/product_availability')||url.includes('/rest/v1/catalog_products')||url.includes('/rest/v1/reviews'))return reply([]);
      if(url.includes('/rest/v1/store_settings'))return reply({is_open:true});
      if(url.includes('/rest/v1/coupons')){const code=new URL(url).searchParams.get('code');return reply(code?promos.find(p=>p.code===code.replace('eq.',''))||null:promos);}
      return originalFetch(input,options);
    };
  ` });
  for (const width of [1440, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 700 });
    await send('Page.navigate', { url: `${base}/delivery` });
    await ready('.menu-campaign__slide.is-active .menu-campaign__photo img');
    await evaluate('document.fonts.ready');
    await wait(2700);
    const layout = await evaluate(`(()=>{const slide=document.querySelector('.menu-campaign__slide.is-active'),cta=slide.querySelector('.menu-campaign__order').getBoundingClientRect(),stage=document.querySelector('.menu-campaign__stage').getBoundingClientRect(),image=slide.querySelector('img');return{overflow:document.documentElement.scrollWidth>innerWidth,ctaVisible:cta.bottom<=stage.bottom&&cta.left>=0&&cta.right<=innerWidth,imageLoaded:image.complete&&image.naturalWidth>0}})()`);
    assert.equal(layout.overflow, false, `Sin overflow a ${width}px`);
    assert.equal(layout.ctaVisible, true, `CTA dentro del banner a ${width}px`);
    assert.equal(layout.imageLoaded, true, 'Foto cargada');
    await screenshot(`cover-${width}`);
    const sceneBefore = await evaluate(`getComputedStyle(document.querySelector('.menu-campaign__slide.is-active')).getPropertyValue('--scene')`);
    await evaluate(`document.querySelector('[aria-label="Siguiente destacado"]').click()`);
    assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('.menu-campaign__slide.is-active')).getPropertyValue('--scene')`), sceneBefore, 'El fondo cambia con el producto');
    await evaluate(`document.querySelector('.menu-campaign__slide.is-active .menu-campaign__order').click()`);
    await ready('.product-configurator');
    await evaluate(`document.querySelector('.product-configurator__close').click()`);
  }
  await send('Page.navigate', { url: `${base}/delivery` }); await ready('.menu-campaign__slide.is-active');
  const first = await evaluate(`document.querySelector('.menu-campaign__slide.is-active h2').textContent`);
  await wait(11500);
  assert.notEqual(await evaluate(`document.querySelector('.menu-campaign__slide.is-active h2').textContent`), first, 'Avanza automáticamente después de 11 segundos');
  await evaluate(`document.querySelector('[aria-label="Pausar carrusel"]').click()`);
  const paused = await evaluate(`document.querySelector('.menu-campaign__slide.is-active h2').textContent`);
  await wait(11500);
  assert.equal(await evaluate(`document.querySelector('.menu-campaign__slide.is-active h2').textContent`), paused, 'Pausa la rotación');
  await send('Emulation.setEmulatedMedia', { features: [{ name:'prefers-reduced-motion',value:'reduce' }] });
  await send('Page.navigate', { url: `${base}/delivery` }); await ready('.menu-campaign');
  assert.equal(await evaluate(`document.querySelector('.menu-campaign').classList.contains('is-playing')`), false, 'Respeta movimiento reducido');
  await send('Emulation.setEmulatedMedia', { features: [] });
  await send('Page.navigate', { url: `${base}/delivery` }); await ready('.menu-campaign__slide.is-active');
  await evaluate(`document.querySelector('.menu-campaign__slide.is-active .menu-campaign__order').click()`);
  await ready('.product-configurator__panel');
  await evaluate(`document.querySelector('.product-configurator__panel').requestSubmit()`);
  await ready('.cart-overlay');
  await evaluate(`[...document.querySelectorAll('.fulfillment-toggle button')].find(b=>b.textContent.startsWith('RETIRO')).click()`);
  await evaluate(`document.querySelector('[aria-label="Agregar una unidad de Bacon Trip"]').click()`);
  await evaluate(`(()=>{const input=document.querySelector('#cart-coupon-code');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'SMASH2X1');input.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await evaluate(`document.querySelector('.cart-coupon>div button').click()`);
  await ready('.coupon-discount');
  assert.equal(await evaluate(`document.querySelector('.cart-total strong').textContent`), '$9.590', '2×1 aplicado al total del carrito');
  assert.equal(await evaluate(`document.querySelector('.coupon-discount b').textContent`), '-$9.590', 'Ahorro visible');
  await evaluate(`document.querySelector('[aria-label="Agregar una unidad de Bacon Trip"]').click()`);
  assert.equal(await evaluate(`document.querySelector('.cart-total strong').textContent`), '$19.180', 'Tres unidades pagan dos');
  await evaluate(`document.querySelector('[aria-label="Quitar una unidad de Bacon Trip"]').click()`);
  await evaluate(`document.querySelector('[aria-label="Quitar una unidad de Bacon Trip"]').click()`);
  assert.equal(await evaluate(`document.querySelectorAll('.coupon-discount').length`), 0, 'Al bajar de dos unidades se elimina el beneficio');
  await send('Emulation.setDeviceMetricsOverride', { width:390,height:1000,deviceScaleFactor:1,mobile:true });
  await send('Page.navigate', { url: `${base}/admin` }); await ready('.admin-tabs');
  await evaluate(`[...document.querySelectorAll('.admin-tabs button')].find(b=>b.textContent==='PROMOCIONES').click()`);
  await ready('.coupon-form');
  assert.equal(await evaluate(`document.querySelectorAll('.coupon-form select')[0].options.length`), 5, 'Cinco tipos de promoción');
  await evaluate(`(()=>{const select=document.querySelectorAll('.coupon-form select')[0];Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select,'buy_x_pay_y');select.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  assert.equal(await evaluate(`document.querySelector('.coupon-form').textContent.includes('Unidades que lleva')`), true, 'Campos del 2×1');
  await evaluate(`document.querySelector('.admin-coupons').scrollIntoView({behavior:'instant',block:'start'})`);
  await wait(150);
  await screenshot('admin-promotions-390');
  await evaluate(`(()=>{const input=document.querySelector('.coupon-form input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'QA_PROMO');input.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await evaluate(`document.querySelector('.coupon-form').requestSubmit()`);
  await wait(200);
  assert.equal(await evaluate(`window.__qaSaved?.p_coupon.discount_type`), 'buy_x_pay_y', 'Guarda el tipo de promoción elegido');
  assert.equal(await evaluate(`window.__qaSaved?.p_coupon.buy_quantity`), 2, 'Guarda las unidades de 2×1');
  assert.deepEqual(errors, [], 'Sin errores de JavaScript');
  console.log('OK: móvil 320/390px, escritorio 1440px, fotos, fondos, CTA, autoplay, pausa, movimiento reducido, creación de promoción y cálculo 2×1 en carrito.');
} finally {
  socket.close(); await fetch(`${debugging}/json/close/${target.id}`).catch(() => {});
}
