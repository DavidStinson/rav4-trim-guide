// Runs every check on the site in a headless browser, at real window sizes, and saves a screenshot of each.
//
//   npm run check                     both years at 390, 700, 1100, 1400 and 1500 px
//   npm run check -- --quick          2027 at 390 and 1400 only
//   npm run check -- --root ../other  check another copy of the repo (a git worktree, say)
//   npm run check -- --no-shots       skip the screenshots
//
// For each year and width (plus 1400 px in dark mode) it loads rav4-site/index.html?year=<year>, takes a full-page screenshot to
// .check/shots/<year>@<width>[-dark].png, runs the axe accessibility rules, then runs layout-check.js,
// year-check.js and photo-check.js in the page. Anything the page throws or logs with console.error and
// any file that fails to load counts as a failure. Results go to .check/results.json. Exits 1 on any
// failure, so it can gate a commit or a hook.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(opt('--root', path.join(HERE, '..')));
const OUT = path.resolve(opt('--out', path.join(ROOT, '.check')));
const PAGE = opt('--page', 'rav4-site/index.html');
const QUICK = flag('--quick');
const YEARS = QUICK ? [2027] : [2027, 2026];
const WIDTHS = QUICK ? [390, 1400] : [390, 700, 1100, 1400, 1500];
const SHOTS = !flag('--no-shots');
const HEIGHT = 900;
const CHECKS = ['layout-check.js', 'year-check.js', 'photo-check.js'];
// WCAG 2.2 A and AA, the level most accessibility laws point to.
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2' };

// A static file server for ROOT on a free local port.
function serve(){
  const server = http.createServer(async (req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(ROOT, rel);
    if(!file.startsWith(ROOT + path.sep)){ res.writeHead(403).end(); return; }
    try {
      const body = await fs.readFile(file);
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

// Scroll through the page so every lazy photo loads, then wait for them before the screenshot.
async function loadAllPhotos(page){
  await page.evaluate(async () => {
    for(let y = 0; y < document.body.scrollHeight; y += innerHeight / 2){ scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
    scrollTo(0, 0);
    await Promise.all([...document.images].filter(i => i.getClientRects().length).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    await document.fonts.ready;
  });
}

async function run(browser, base, year, width, scheme, sources, first){
  const context = await browser.newContext({ viewport: { width, height: HEIGHT }, reducedMotion: 'reduce', colorScheme: scheme });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`page error: ${e.message}`));
  page.on('console', m => { if(m.type() === 'error') errors.push(`console error: ${m.text()}`); });
  page.on('response', r => { if(r.status() >= 400) errors.push(`file failed to load (${r.status()}): ${r.url().replace(base, '')}`); });
  page.on('requestfailed', r => { if(!r.failure()?.errorText.includes('ERR_ABORTED')) errors.push(`file failed to load: ${r.url().replace(base, '')} (${r.failure()?.errorText})`); });

  await page.goto(`${base}/${PAGE}?year=${year}`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  if(SHOTS){
    // Freeze transitions and animations, so two runs of the same page give the same pixels.
    const still = await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' });
    await loadAllPhotos(page);
    await page.screenshot({ path: path.join(OUT, 'shots', `${year}@${width}${scheme === 'dark' ? '-dark' : ''}.png`), fullPage: true });
    await still.evaluate(el => el.remove());
  }
  const axe = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const fails = axe.violations.map(v => `accessibility: ${v.id} (${v.impact}) on ${v.nodes.length} element(s), e.g. ${v.nodes[0].target.join(' ')}: ${v.help}`);
  for(const src of sources) await page.addScriptTag({ content: src });
  // Year checks change the spec filter, so run the layout checks first.
  fails.push(...await page.evaluate(async y => [...layoutCheck(), ...yearCheck(y), ...await photoCheck()], year));
  const files = first ? await page.evaluate(() => photoFilesCheck()) : null;
  fails.push(...new Set(errors));
  await context.close();
  return { fails, files };
}

const started = Date.now();
// Clear old screenshots only when taking new ones, so a --no-shots run leaves the last set in place.
if(SHOTS) await fs.rm(path.join(OUT, 'shots'), { recursive: true, force: true });
await fs.mkdir(path.join(OUT, 'shots'), { recursive: true });
const sources = await Promise.all(CHECKS.map(f => fs.readFile(path.join(ROOT, 'tools', f), 'utf8')));
const server = await serve();
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const results = {};
try {
  // Light mode at every width, and dark mode once per year (the colors change, not the layout).
  const jobs = YEARS.flatMap(y => [...WIDTHS.map(w => [y, w, 'light']), [y, 1400, 'dark']]);
  // A few pages at once; more than that and the photo loads slow each other down.
  for(let i = 0; i < jobs.length; i += 4){
    await Promise.all(jobs.slice(i, i + 4).map(async ([y, w, scheme], j) => {
      const { fails, files } = await run(browser, base, y, w, scheme, sources, i + j === 0);
      results[`${y}@${w}${scheme === 'dark' ? '-dark' : ''}`] = fails;
      if(files) results.files = files;
    }));
  }
} finally {
  await browser.close();
  server.close();
}

await fs.writeFile(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
const failed = Object.entries(results).filter(([, f]) => f.length);
for(const [key, fails] of Object.entries(results)) console.log(`${fails.length ? 'FAIL' : 'pass'} ${key}${fails.length ? `: ${fails.length}` : ''}`);
for(const [key, fails] of failed) for(const f of fails) console.log(`  ${key}  ${f}`);
console.log(`${failed.length ? 'FAILED' : 'ALL PASS'} in ${((Date.now() - started) / 1000).toFixed(0)}s. Results: ${path.relative(process.cwd(), OUT)}/results.json${SHOTS ? `, screenshots: ${path.relative(process.cwd(), OUT)}/shots/` : ''}`);
process.exit(failed.length ? 1 : 0);
