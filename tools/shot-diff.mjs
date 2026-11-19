// Compares two folders of screenshots from `npm run check` and reports how much of each changed.
//
//   node tools/shot-diff.mjs <before-dir> <after-dir> [--out <dir>] [--max <percent>]
//
// Writes a diff image for each pair to --out (default .check/diff/), with changed pixels in red. A
// screenshot whose page got taller or shorter counts the extra height as changed. Exits 1 if any pair
// changed more than --max percent (default 0), so "the page looks exactly the same" is a command.
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : fallback; };
const OUT = opt('--out', '.check/diff');
const MAX = Number(opt('--max', '0'));
const [before, after] = args;
if(!before || !after){ console.error('usage: node tools/shot-diff.mjs <before-dir> <after-dir> [--out <dir>] [--max <percent>]'); process.exit(2); }

const read = async file => PNG.sync.read(await fs.readFile(file));
// Pad an image with white to the given size, so pages of different heights can be compared.
function pad(img, width, height){
  if(img.width === width && img.height === height) return img;
  const out = new PNG({ width, height });
  out.data.fill(255);
  PNG.bitblt(img, out, 0, 0, Math.min(img.width, width), Math.min(img.height, height), 0, 0);
  return out;
}

await fs.mkdir(OUT, { recursive: true });
const names = (await fs.readdir(before)).filter(f => f.endsWith('.png')).sort();
if(!names.length){ console.error(`no screenshots in ${before}`); process.exit(2); }
let worst = 0;
for(const name of names){
  const b = await read(path.join(before, name));
  const a = await read(path.join(after, name)).catch(() => null);
  if(!a){ console.log(`${name}: missing from ${after}`); worst = 100; continue; }
  const width = Math.max(a.width, b.width), height = Math.max(a.height, b.height);
  const diff = new PNG({ width, height });
  const changed = pixelmatch(pad(b, width, height).data, pad(a, width, height).data, diff.data, width, height, { threshold: 0.1 });
  const pct = 100 * changed / (width * height);
  worst = Math.max(worst, pct);
  await fs.writeFile(path.join(OUT, name), PNG.sync.write(diff));
  console.log(`${name}: ${pct.toFixed(3)}% changed (${changed} px)${a.height !== b.height ? ` (height ${b.height} -> ${a.height})` : ''}`);
}
console.log(`${worst > MAX ? 'CHANGED' : 'SAME'}: largest change ${worst.toFixed(3)}% (limit ${MAX}%). Diff images: ${OUT}/`);
process.exit(worst > MAX ? 1 : 0);
