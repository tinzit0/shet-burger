// Web delivery copies of the existing transparent ingredients. Originals stay intact.
import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const names = ['pan-superior', 'salsa', 'bacon-cebolla', 'carne-superior', 'cheddar', 'carne-inferior', 'pan-inferior'];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  await mkdir('public/assets/atelier', { recursive: true });
  for (const name of names) {
    const source = await readFile(`public/assets/${name}.png`);
    const result = await page.evaluate(async source => {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(840, image.width);
      canvas.height = Math.round(image.height * canvas.width / image.width);
      const context = canvas.getContext('2d');
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return { data: canvas.toDataURL('image/webp', .86).split(',')[1], width: canvas.width, height: canvas.height };
    }, `data:image/png;base64,${source.toString('base64')}`);
    const bytes = Buffer.from(result.data, 'base64');
    await writeFile(`public/assets/atelier/${name}.webp`, bytes);
    console.log(`${name}: ${result.width} × ${result.height}, ${Math.round(bytes.length / 1024)} KB`);
  }
} finally {
  await browser.close();
}
