// What check.mjs and shoot.mjs share: serving a copy of the repo and getting the page ready to screenshot.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const PAGE = 'rav4-site/index.html';

// `--name value` and `--flag` options.
export function options(argv = process.argv.slice(2)){
  return {
    flag: name => argv.includes(name),
    opt: (name, fallback) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback; },
  };
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2' };

// Serves `root` on a free local port. Resolves to { base, close }.
export async function serve(root){
  const server = http.createServer(async (req, res) => {
    const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if(!file.startsWith(root + path.sep)){ res.writeHead(403).end(); return; }
    try {
      const body = await fs.readFile(file);
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

// Freezes transitions and animations, so two runs of the same page give the same pixels. Returns a
// function that unfreezes them.
export async function freeze(page){
  const style = await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' });
  return () => style.evaluate(el => el.remove());
}

// Loads every photo (lazy ones too) and the fonts, scrolling through the page on the way so anything
// that reacts to scrolling has run. Gives up waiting on a photo after 20 s rather than hanging; the
// checks report photos that fail to load.
export async function loadAllPhotos(page){
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    // Instant, because the page may ask for smooth scrolling, which wouldn't arrive before the next step.
    for(let y = 0; y < document.body.scrollHeight; y += innerHeight / 2){ scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 40)); }
    // Back up in steps too, as a reader would, so scroll watchers end in their at-the-top state.
    for(let y = scrollY; y > 0; y -= innerHeight / 2){ scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 40)); }
    scrollTo({ top: 0, behavior: 'instant' });
    const loads = [...document.images].filter(i => i.getClientRects().length && !i.complete).map(i => new Promise(r => { i.addEventListener('load', r); i.addEventListener('error', r); }));
    await Promise.race([Promise.all(loads), new Promise(r => setTimeout(r, 20000))]);
    await document.fonts.ready;
    // Let scroll watchers (the section nav's highlight) catch up with the jump back to the top.
    await new Promise(r => setTimeout(r, 300));
  });
}
