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
import fs from 'node:fs/promises';
import path from 'node:path';
import { REPO, PAGE as DEFAULT_PAGE, options, serve, freeze, loadAllPhotos } from './lib/site.mjs';

const { flag, opt } = options();
const ROOT = path.resolve(opt('--root', REPO));
const OUT = path.resolve(opt('--out', path.join(ROOT, '.check')));
const PAGE = opt('--page', DEFAULT_PAGE);
const QUICK = flag('--quick');
const YEARS = QUICK ? [2027] : [2027, 2026];
const WIDTHS = QUICK ? [390, 1400] : [390, 700, 1100, 1400, 1500];
const SHOTS = !flag('--no-shots');
const HEIGHT = 900;
const CHECKS = ['layout-check.js', 'year-check.js', 'photo-check.js'];
// WCAG 2.2 A and AA, the level most accessibility laws point to.
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

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
    const unfreeze = await freeze(page);
    await loadAllPhotos(page);
    await page.screenshot({ path: path.join(OUT, 'shots', `${year}@${width}${scheme === 'dark' ? '-dark' : ''}.png`), fullPage: true });
    await unfreeze();
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
const server = await serve(ROOT);
const base = server.base;
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
