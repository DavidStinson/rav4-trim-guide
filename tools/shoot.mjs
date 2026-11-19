// Screenshots the page section by section, for reviewing a design: each image is a readable size, where
// one full-page screenshot is tens of thousands of pixels tall.
//
//   node tools/shoot.mjs                        2027, light, at 1400 and 390 px, into .check/sections/
//   node tools/shoot.mjs --root ../worktree --out /some/dir --widths 1400 --year 2026 --scheme dark
//
// For each width it writes <out>/<width>/00-fold.png (the first screen, as a visitor sees it on arrival)
// and then one image per top-level block of the page (the children of <body>, and of <main> in place of
// <main> itself), in page order, named by the block's id or class. Blocks taller than 1600 px are cut into
// several images. Transitions and animations are frozen, so the same page gives the same pixels.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { REPO, PAGE, options, serve, freeze, loadAllPhotos } from './lib/site.mjs';

const { opt } = options();
const ROOT = path.resolve(opt('--root', REPO));
const OUT = path.resolve(opt('--out', path.join(ROOT, '.check', 'sections')));
const WIDTHS = opt('--widths', '1400,390').split(',').map(Number);
const YEAR = Number(opt('--year', '2027'));
const SCHEME = opt('--scheme', 'light');
const HEIGHT = 900, SLICE = 1600;

const server = await serve(ROOT);
const browser = await chromium.launch();
try {
  for(const width of WIDTHS){
    const dir = path.join(OUT, String(width));
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const context = await browser.newContext({ viewport: { width, height: HEIGHT }, colorScheme: SCHEME });
    const page = await context.newPage();
    await page.goto(`${server.base}/${PAGE}?year=${YEAR}`, { waitUntil: 'load' });
    await freeze(page);
    await loadAllPhotos(page);
    await page.screenshot({ path: path.join(dir, '00-fold.png') });
    const blocks = await page.evaluate(() => {
      const visible = el => el.getClientRects().length && getComputedStyle(el).display !== 'none' && el.offsetHeight > 4;
      const tops = [...document.body.children].flatMap(el => el.tagName === 'MAIN' ? [...el.children] : [el])
        .filter(el => !['SCRIPT', 'DIALOG', 'TEMPLATE'].includes(el.tagName) && visible(el));
      return tops.map(el => {
        const r = el.getBoundingClientRect();
        const name = (el.id || el.classList[0] || el.tagName.toLowerCase()).replace(/[^\w-]/g, '');
        return { name, y: Math.round(r.top + scrollY), h: Math.round(r.height) };
      });
    });
    let n = 1;
    for(const b of blocks){
      const parts = Math.ceil(b.h / SLICE);
      for(let i = 0; i < parts; i++){
        const y = b.y + i * SLICE, h = Math.min(SLICE, b.h - i * SLICE);
        const file = `${String(n++).padStart(2, '0')}-${b.name}${parts > 1 ? `-${i + 1}of${parts}` : ''}.png`;
        await page.screenshot({ path: path.join(dir, file), fullPage: true, clip: { x: 0, y, width, height: h } });
      }
    }
    await context.close();
    console.log(`${width}px: ${n} images in ${path.relative(process.cwd(), dir)}/`);
  }
} finally {
  await browser.close();
  server.close();
}
