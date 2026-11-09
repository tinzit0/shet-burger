import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

// Render the supplied PDF artwork, preserving its proportions and original graphics.
// PDF.js is used only by this offline export; the storefront serves optimized WebP files.
const jobs = [
  ['assets/como quiero el menu/ANTIGRASAA.pdf', 'antigrasa-white'],
  ['assets/como quiero el menu/Papel antigrasas.pdf', 'antigrasa-pink'],
];
const output = 'public/assets/brand-papers';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173/');
  for (const [source, name] of jobs) {
    const data = (await readFile(source)).toString('base64');
    const results = await page.evaluate(async ({ data }) => {
      const pdfjs = await import('/node_modules/pdfjs-dist/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.mjs';
      const task = pdfjs.getDocument({ data: Uint8Array.from(atob(data), char => char.charCodeAt(0)), standardFontDataUrl: '/node_modules/pdfjs-dist/standard_fonts/', cMapUrl: '/node_modules/pdfjs-dist/cmaps/', cMapPacked: true });
      const pdf = await task.promise;
      if (pdf.numPages !== 1) throw new Error(`Expected single-page artwork; found ${pdf.numPages} pages`);
      const art = await pdf.getPage(1);
      const original = art.getViewport({ scale: 1 });
      const results = [];
      for (const size of [960, 1920]) {
        const viewport = art.getViewport({ scale: size / Math.max(original.width, original.height) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await art.render({ canvasContext: canvas.getContext('2d'), viewport, background: '#ffffff' }).promise;
        results.push({ size, width: canvas.width, height: canvas.height, data: canvas.toDataURL('image/webp', 0.88).split(',')[1] });
      }
      await task.destroy();
      return results;
    }, { data });
    for (const { size, width, height, data } of results) {
      const bytes = Buffer.from(data, 'base64');
      const path = `${output}/${name}-${size}.webp`;
      await writeFile(path, bytes);
      console.log(`${path}: ${width}x${height}, ${Math.round(bytes.length / 1024)} KB`);
    }
  }
} finally { await browser.close(); }
