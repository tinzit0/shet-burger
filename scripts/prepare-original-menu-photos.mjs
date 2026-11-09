// Native SVG framing: original WebP bytes are embedded verbatim, never reconstructed.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const photos = [
  { id:'bacon-trip', page:'page-2-2', size:[924,1383], crop:[54,247,390,310], outline:'M85 346 C80 298 133 257 221 254 C305 248 380 271 391 338 L392 359 400 369 421 377 432 390 428 403 415 408 436 438 418 444 428 463 421 479 430 495 413 503 408 525 398 540 C322 550 185 551 124 542 L104 538 87 525 69 519 70 502 63 496 66 467 72 448 70 430 79 409 74 383 90 366Z' },
  { id:'bbq-beast', page:'page-2-3', file:'assets/videos shet o fotos/foto8.jpeg', size:[1600,2400], crop:[96,232,354,218], outline:'M146 266 C180 239 229 235 270 240 C320 239 357 251 373 280 L380 302 382 330 396 340 418 361 440 371 447 381 442 390 427 394 420 400 403 392 386 380 379 386 375 401 365 418 350 432 330 438 310 442 296 445 276 442 254 447 240 443 218 446 194 440 174 437 160 428 143 424 128 426 119 410 111 398 104 382 99 365 101 344 109 321 118 302 131 284Z' },
  { id:'onion-shet', page:'page-2-4', size:[1362,1815], crop:[21,108,459,402], outline:'M81 211 C80 166 108 117 202 117 C325 111 423 129 435 198 L438 231 416 236 413 256 426 266 426 293 441 310 423 324 454 345 462 357 477 382 468 413 460 432 457 451 434 472 421 484 400 494 372 501 331 505 298 496 262 499 231 491 195 494 159 488 128 477 103 467 87 444 77 425 60 432 37 434 29 425 31 414 29 408 40 380 42 359 39 349 43 327 40 308 51 288 43 277 43 264 56 262 61 268 79 249 88 230 82 220Z' },
  { id:'cowboy-smoke', page:'page-2-1', size:[924,1383], crop:[57,246,368,302], outline:'M92 349 C97 305 140 256 216 255 C299 248 372 272 383 323 L390 338 378 344 376 355 392 363 405 376 392 386 409 394 407 410 418 419 414 434 419 450 410 461 422 477 412 488 405 506 390 517 C344 532 287 538 244 537 L239 542 222 542 216 533 C163 531 109 531 91 507 L81 488 74 474 79 454 72 439 78 420 64 407 63 397 82 399 78 384 91 376 87 365Z' },
  { id:'blue-hit', page:'page-3-1', size:[924,1383], crop:[53,225,390,304], outline:'M95 312 C111 272 158 236 228 233 C308 227 367 253 394 299 L403 318 393 326 408 347 415 366 425 382 429 399 418 407 437 418 431 435 417 444 429 459 417 476 412 497 387 509 C349 523 290 521 264 522 L240 526 218 522 208 518 C149 517 110 516 89 499 L70 483 61 477 64 466 59 458 65 447 69 437 64 421 73 403 76 385 61 373 61 363 69 351 68 340 82 326Z' },
  { id:'clasica-bacon', page:'page-3-2', size:[924,1383], crop:[39,240,412,337], outline:'M81 339 C83 295 139 249 226 247 C305 244 376 267 405 317 L410 340 400 348 417 362 410 374 428 382 416 390 433 405 415 415 418 433 438 452 447 472 441 494 426 512 414 531 407 552 392 565 C338 573 209 572 153 567 L144 571 132 567 106 559 92 544 75 532 71 515 56 503 47 488 47 474 58 463 57 455 76 446 88 427 72 416 65 415 80 402 92 392 72 383 68 373 78 358Z' },
  { id:'cheeseburger-bacon', page:'page-3-3', size:[924,924], crop:[48,106,398,296], outline:'M77 215 C75 166 134 119 219 114 C308 107 382 132 411 188 L414 213 399 224 415 240 432 255 434 270 425 280 442 295 428 309 430 328 425 345 415 360 400 382 C331 397 193 401 131 390 L113 397 101 390 87 376 70 368 57 365 54 350 62 333 68 322 61 304 68 287 57 276 68 259 84 248 92 236 79 228Z' },
  { id:'tentacion', page:'page-1-1', size:[1383,924], crop:[0,30,480,261], outline:'M164 47 Q196 37 235 45 L238 152 252 154 255 44 Q280 34 307 42 L310 133 334 116 345 112 352 102 364 109 377 98 384 113 400 113 414 103 421 119 440 121 455 130 477 133 480 271 447 274 437 278 411 280 381 276 354 279 330 278 302 278 282 270 267 271 244 269 224 275 201 279 173 283 142 280 115 279 89 277 64 278 43 269 29 263 10 266 0 254 0 114 14 112 20 105 33 108 40 100 55 107 64 99 78 106 91 103 108 110 122 115 143 124 158 134Z' },
  { id:'vicio', page:'page-1-2', size:[1383,924], crop:[0,13,480,273], outline:'M283 27 Q331 14 392 26 L402 47 400 143 420 151 426 161 445 164 467 180 480 189 480 251 459 260 437 258 421 266 399 260 381 265 363 269 345 272 322 280 299 280 272 279 248 280 220 279 186 276 158 268 148 261 133 252 125 244 109 249 88 247 63 247 50 240 32 243 14 238 0 229 0 172 19 168 23 159 46 155 63 139 85 143 91 127 112 134 130 128 143 139 157 122 C179 94 245 90 283 105Z' },
  { id:'triple-shet', page:'page-1-3', size:[1383,924], crop:[7,24,465,285], outline:'M114 43 129 34 144 38 158 33 178 39 185 43 187 130 192 122 197 42 Q233 28 272 38 L279 47 276 127 285 125 289 44 306 40 314 44 332 43 343 49 355 52 360 118 C410 119 445 132 453 161 L466 192 458 215 467 239 458 275 437 289 412 297 382 297 361 304 334 306 302 300 270 307 241 302 218 307 192 303 165 305 139 300 119 300 94 297 70 296 45 290 26 280 17 266 13 241 23 224 24 203 27 188 24 168 C24 129 70 117 111 122Z' },
];
await mkdir('public/assets/menu/original-editorial', { recursive:true });
const manifest = {};
const browser = await chromium.launch({ channel:'msedge', headless:true });
const page = await browser.newPage();
for (const photo of photos) {
  let image = await readFile(photo.file || `assets/menu/${photo.page}.webp`);
  if (photo.file) {
    const optimized = await page.evaluate(async data => {
      const image = new Image(); image.src = 'data:image/jpeg;base64,' + data; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 2400;
      const ctx = canvas.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(image,0,0,1600,2400);
      return canvas.toDataURL('image/webp',.92).split(',')[1];
    }, image.toString('base64'));
    image = Buffer.from(optimized,'base64');
  }
  const [x,y,w,h] = photo.crop;
  const scale = photo.size[0] / 480;
  const width = Math.round(w * scale), height = Math.round(h * scale);
  const src = `/assets/menu/original-editorial/${photo.id}.svg`;
  const centerX = x + w / 2, centerY = y + h / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x} ${y} ${w} ${h}"><defs><clipPath id="edge"><path d="${photo.outline}"/></clipPath><clipPath id="core"><path d="${photo.outline}" transform="translate(${centerX} ${centerY}) scale(.90) translate(${-centerX} ${-centerY})"/></clipPath><filter id="edge-key" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 6 0 -6 0 -.15" result="red"/><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 6 -6 0 -.15" result="green"/><feComposite in="red" in2="green" operator="arithmetic" k2="1" k3="1" result="key"/><feComposite in="SourceGraphic" in2="key" operator="in"/></filter><image id="original" width="480" height="${photo.size[1] / scale}" href="data:image/webp;base64,${image.toString('base64')}"/></defs><use href="#original" clip-path="url(#edge)" filter="url(#edge-key)"/><use href="#original" clip-path="url(#core)"/></svg>`;

  await writeFile(`public${src}`, svg);
  manifest[photo.id] = { catalogImage:`/assets/menu/${photo.page}.webp`, src, width, height, sourceWidth:photo.size[0], sourceHeight:photo.size[1] };
}
await browser.close();
await writeFile('src/lib/originalMenuPhotos.json', JSON.stringify(manifest,null,2));
console.log('10 original photos framed as SVG; embedded WebP bytes unchanged.');
