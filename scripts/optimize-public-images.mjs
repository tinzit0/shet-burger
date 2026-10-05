import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const jobs = [
  { source: 'public/assets/campaign/video-01-poster.jpg', outputs: [[480, 'public/assets/campaign/hero-poster-480.webp'], [640, 'public/assets/campaign/hero-poster-640.webp'], [960, 'public/assets/campaign/hero-poster-960.webp']] },
  { source: 'assets/videos shet o fotos/foto1.jpg', outputs: [[640, 'public/assets/campaign/home-foto-1-640.webp'], [1024, 'public/assets/campaign/home-foto-1-1024.webp']] },
  { source: 'assets/videos shet o fotos/foto3.jpg', outputs: [[640, 'public/assets/campaign/home-foto-3-640.webp'], [1024, 'public/assets/campaign/home-foto-3-1024.webp']] },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  for (const job of jobs) {
    const original = await fs.readFile(job.source);
    const extension = job.source.split('.').at(-1);
    for (const [width, output] of job.outputs) {
      const result = await page.evaluate(async ({ source, width }) => {
        const image = new Image(); image.src = source; await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(width, image.width);
        canvas.height = Math.round(image.height * canvas.width / image.width);
        const context = canvas.getContext('2d'); context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/webp', 0.82).split(',')[1];
      }, { source: `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${original.toString('base64')}`, width });
      const bytes = Buffer.from(result, 'base64');
      await fs.writeFile(output, bytes);
      console.log(`${output}: ${Math.round(bytes.length / 1024)} KB`);
    }
  }
} finally {
  await browser.close();
}
