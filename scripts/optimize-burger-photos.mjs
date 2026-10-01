// Export reviewed imagegen restorations to responsive WebP; retain PNG masters.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const ids = ['bbq-beast','onion-shet','bacon-trip','cowboy-smoke','blue-hit','clasica-bacon','cheeseburger-bacon'];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  await fs.mkdir('public/assets/menu/hd', { recursive: true });
  for (const id of ids) {
    const original = await fs.readFile(`artifacts/image-restoration/${id}-v2.png`);
    for (const width of [640, 1024]) {
      const result = await page.evaluate(async ({ source, width }) => {
        const image = new Image(); image.src = source; await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(width, image.width);
        canvas.height = Math.round(image.height * canvas.width / image.width);
        const ctx = canvas.getContext('2d'); ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/webp', .91).split(',')[1];
      }, { source: `data:image/png;base64,${original.toString('base64')}`, width });
      const output = `public/assets/menu/hd/${id}-v2-${width}.webp`;
      const bytes = Buffer.from(result, 'base64'); await fs.writeFile(output, bytes);
      console.log(`${output}: ${Math.round(bytes.length / 1024)} KB`);
    }
  }
} finally { await browser.close(); }
