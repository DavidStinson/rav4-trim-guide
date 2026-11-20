// Reading checks for rav4-site: things an older reader notices that layout checks miss.
// Run in the page after it loads (npm run check does this): `await readingCheck()` returns a list of failures.
// It scrolls the page, so run it after checks that expect the page at the top.
window.readingCheck = async function readingCheck(){
  const fails = [];
  const frames = n => new Promise(r => { const f = () => (--n ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); });
  await document.fonts.ready;
  const settle = async () => { await frames(4); await new Promise(r => setTimeout(r, 150)); };

  // 2. One type scale. Like elements share one size at each width, so the page reads as one system:
  //    every caption one size, every note and card description one size, every label one size, and so on.
  //    Captions sit below notes, and notes below body text. Nothing a reader needs is under 15px.
  //    Exempt: text inside drawings (SVG, sized with the drawing), decorative glyphs hidden from screen
  //    readers, the slider arrows' labels (they repeat the trim name beside them) and closed dialogs.
  //    Kinds come from David's review of the climb (REVIEW-DECISIONS.md, "Text size and line length").
  const KINDS = {
    caption: 'figcaption, .cap, .demo-cap, .wheel-caps p',
    note:    '.note, .small, .gain span.why, .basic span, .score ul, .rung .pc, .rung .req, .car .tag, .road-foot, .avail .note, .f-text .aka, .chg-need, .ev-sliders label, .pk-note, .pk-callout, .cp-note, .tw summary, .spec-table .common, .spec-table .mo, .cp-sub, footer p, .seelist li',
    label:   '.pill, .legend, .avail .tn, .yd-table thead th, .spec-table thead .tp, .count, .ev-key, .ap-scale, .cost-row, .trio figcaption b, .cp-price, .cp-lines dt a, .score .best-badge, .ap-chips .chip small, .tw li span, .lb-count, .spec-cat > summary .n, .f-text .why b',
    nav:     '.nav a, .year-switch a, .sl-tabs button, .group-nav a',
    control: '.chip, .seg button, .toggle',
    ui:      '.demo-text, .ev-demo > label, .search, .basic b, .score-price, .wheel-caps b, .rung .pp',
  };
  const ALL = Object.values(KINDS).join(', ');
  const shown = el => !el.closest('svg, dialog:not([open]), [hidden], [aria-hidden="true"], .sl-btn') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
  // An element's own size: the size of its first text node that isn't inside another kind's element.
  const own = (el, sel) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){
      const p = n.parentElement;
      if(!n.textContent.trim() || !shown(p)) continue;
      if(p.closest(ALL) !== el) continue;  // belongs to a smaller element of another kind inside this one
      return parseFloat(getComputedStyle(p).fontSize);
    }
    return null;
  };
  const sizeOf = {};
  for(const [kind, sel] of Object.entries(KINDS)){
    const sizes = new Map();
    document.querySelectorAll(sel).forEach(el => {
      if(!shown(el)) return;
      const px = own(el, sel); if(px == null) return;
      const name = `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`;
      if(!sizes.has(px)) sizes.set(px, name);
    });
    if(sizes.size > 1) fails.push(`${kind} text comes in ${sizes.size} sizes at ${innerWidth}px: ${[...sizes].map(([px, n]) => `${px}px (${n})`).join(', ')}; like elements share one size`);
    if(sizes.size) sizeOf[kind] = Math.min(...sizes.keys());
  }
  const bodyPx = parseFloat(getComputedStyle(document.body).fontSize);
  if(sizeOf.caption && sizeOf.note && sizeOf.caption >= sizeOf.note) fails.push(`captions (${sizeOf.caption}px) aren't smaller than notes (${sizeOf.note}px)`);
  if(sizeOf.note && sizeOf.note >= bodyPx) fails.push(`notes (${sizeOf.note}px) aren't smaller than body text (${bodyPx}px)`);
  const under = new Map();
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for(let n = walk.nextNode(); n; n = walk.nextNode()){
    const el = n.parentElement;
    if(!n.textContent.trim() || !el || !shown(el)) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if(px < 15){
      const key = `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : ''} (${px}px)`;
      if(!under.has(key)) under.set(key, n.textContent.trim().slice(0, 40));
    }
  }
  for(const [key, text] of under) fails.push(`text under 15px: ${key}, e.g. "${text}"`);

  // 3. The section nav highlights the section you are reading, and back at the top of the page
  //    (above the first section) no link stays highlighted from the section you left.
  const nav = document.querySelector('.nav');
  if(nav){
    const links = [...nav.querySelectorAll('a')];
    const last = links.at(-1), sec = document.querySelector(last.getAttribute('href'));
    // Lazy photos above can load and push the section down after the jump, so jump again until the page stays put.
    for(let i = 0, moved = true; i < 8 && moved; i++){
      sec.scrollIntoView({ block: 'start', behavior: 'instant' });
      const landed = scrollY;
      await settle(); await new Promise(r => setTimeout(r, 250));
      moved = Math.abs(scrollY - landed) > 1;
    }
    if(!last.classList.contains('on')) fails.push(`section nav does not highlight "${last.textContent.trim()}" while that section fills the screen (section top ${Math.round(sec.getBoundingClientRect().top)}px, scrolled ${Math.round(scrollY)} of ${document.documentElement.scrollHeight - innerHeight}; highlighted: ${[...nav.querySelectorAll('a.on')].map(a => a.textContent.trim()).join(', ') || 'none'})`);
    scrollTo({ top: 0, behavior: 'instant' });
    await settle();
    const stale = [...nav.querySelectorAll('a.on, a[aria-current]')].map(a => a.textContent.trim());
    if(stale.length) fails.push(`section nav still highlights "${stale.join('", "')}" at the top of the page`);
  }
  // 4. Labels drawn inside a picture (SVG text) shrink with it; on a laptop they stay at least 14px.
  //    (On a phone a drawing can't hold 14px labels; meaningful captions belong in HTML under it.)
  const tiny = new Map();
  if(innerWidth >= 901) document.querySelectorAll('svg text').forEach(t => {
    if(!t.getClientRects().length || t.closest('[hidden], [aria-hidden="true"]:not(svg)') || !t.textContent.trim()) return;
    const svg = t.ownerSVGElement, m = svg && svg.getScreenCTM(); if(!m) return;
    const px = parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b);
    if(px < 13.5){ const k = (svg.closest('[id]')?.id || 'svg') + ' ' + Math.round(px) + 'px'; if(!tiny.has(k)) tiny.set(k, t.textContent.trim().slice(0, 30)); }
  });
  if(tiny.size) fails.push(`picture labels under 14px on screen: ${[...tiny].slice(0, 5).map(([k, v]) => `${k} "${v}"`).join('; ')}`);

  // 5. On a wide screen the spec table keeps its header row (trim names and prices) on screen while
  //    you read down a long category, pinned just under the sticky section nav.
  //    Use the tallest open category so the table runs well past the bottom of the screen.
  const table = innerWidth > 760 && [...document.querySelectorAll('#specList details[open] .spec-table')]
    .sort((a, b) => b.offsetHeight - a.offsetHeight)[0];
  if(table && table.offsetHeight < innerHeight + 400) fails.push(`spec table check needs a category taller than ${innerHeight + 400}px; the tallest is ${table.offsetHeight}px`);
  else if(table){
    const bar = document.querySelector('.subnav').getBoundingClientRect().height;
    scrollTo({ top: scrollY + table.getBoundingClientRect().top + 400, behavior: 'instant' });
    await settle();
    const heads = [...table.querySelectorAll('thead th.t')];
    const off = heads.filter(th => { const r = th.getBoundingClientRect();
      return Math.abs(r.top - bar) > 2 || !th.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)); });
    if(off.length) fails.push(`spec table header scrolls away: with the table 400px past the top, its trim names sit at ${Math.round(heads[0].getBoundingClientRect().top)}px, not pinned under the ${Math.round(bar)}px section nav`);
    const unpriced = heads.filter(th => !/\$\d/.test(th.textContent)).map(th => th.textContent.trim());
    if(unpriced.length) fails.push(`spec table header names no price for ${unpriced.join(', ')}`);
    scrollTo({ top: 0, behavior: 'instant' });
    await settle();
  }

  // 6. Running text fills its container: the reading column (or the panel, box or column it sits in) is the only
  //    limit on a line, with no separate cap on paragraphs, notes, captions or leads (David, REVIEW-DECISIONS.md:
  //    "fills its container ... with no separate cap"; he never set a character limit). The one exception
  //    is the section lead, which keeps the width David settled on: 41em (861px at 21px), just wide enough
  //    for the priorities lead on one line.
  const capped = new Map();
  document.querySelectorAll('.lede').forEach(el => {
    if(!el.getClientRects().length) return;
    const cs = getComputedStyle(el), want = 41 * parseFloat(cs.fontSize);
    if(!(Math.abs(parseFloat(cs.maxWidth) - want) <= 1)) fails.push(`section lead "${el.textContent.trim().slice(0, 40)}..." has max-width ${cs.maxWidth} at ${innerWidth}px; expected 41em (${want}px)`);
  });
  document.querySelectorAll('p, li, figcaption, small, dd').forEach(el => {
    if(!el.getClientRects().length || el.closest('svg, table, [hidden], dialog:not([open])')) return;
    if(el.textContent.replace(/\s+/g, ' ').trim().length < 60) return;
    // The roof caption's container is the photo above it, so it shares the photo's limit (layout check 27).
    if(el.id === 'roofSummary' || el.classList.contains('lede')) return;
    const mw = getComputedStyle(el).maxWidth;
    if(mw !== 'none' && mw !== '100%'){
      const key = `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`;
      capped.set(key, mw);
    }
  });
  // Captions run their photo's full width too: balanced wrapping would pull their lines in short (David).
  const balanced = new Set();
  document.querySelectorAll('figcaption, .cap, .demo-cap').forEach(el => {
    if(el.getClientRects().length && getComputedStyle(el).textWrapStyle === 'balance') balanced.add(el.tagName.toLowerCase() + (el.classList.length ? '.' + [...el.classList].join('.') : ''));
  });
  for(const [key, mw] of capped) fails.push(`text capped narrower than its container at ${innerWidth}px: ${key} has max-width ${mw}`);
  for(const key of balanced) fails.push(`caption wraps short of its container at ${innerWidth}px: ${key} uses balanced wrapping`);

  // 7. No orphans: running text never ends on a line holding a single word ("it." alone on the last line
  //    shipped once). Checked at every width; text-wrap: pretty does most of the work.
  const orphans = new Map();
  document.querySelectorAll('p, li, figcaption, dd, .tag, .note, .cap, .why').forEach(el => {
    if(!el.getClientRects().length || el.closest('svg, table, [hidden], dialog:not([open]), [aria-hidden="true"]')) return;
    if([...el.children].some(c => ['block', 'flex', 'grid'].includes(getComputedStyle(c).display))) return;
    // A hyphenated word can break across lines; its last piece is what shares a line with the next word.
    const words = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()){
      const re = /\S+/g; let m;
      while((m = re.exec(n.textContent))){ const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const rects = r.getClientRects(), box = rects[rects.length - 1]; if(box) words.push([m[0], box]); }
    }
    if(words.length < 4) return;
    const [lastWord, last] = words.at(-1), prev = words.at(-2)[1];
    if(last.top > prev.top + last.height / 2){
      const key = `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`;
      if(!orphans.has(key)) orphans.set(key, [lastWord, el.textContent.trim().slice(0, 40)]);
    }
  });
  for(const [key, [word, text]] of orphans) fails.push(`orphan at ${innerWidth}px: ${key} ends with "${word}" alone on its last line, in "${text}"`);

  // 8. Section leads share one width, set so the priorities lead ("Tap the things you care about...") reads as one
  //    line on a laptop (David, after the rework). Every other lead wraps at that same right edge.
  {
    const ledes = [...document.querySelectorAll('.lede')].filter(el => el.getClientRects().length);
    const widths = new Set(ledes.map(el => getComputedStyle(el).maxWidth));
    if(widths.size > 1) fails.push(`section leads have different max widths at ${innerWidth}px: ${[...widths].join(', ')}`);
    const pick = document.querySelector('#picker .lede');
    if(pick && innerWidth >= 1100){
      const rg = document.createRange(); rg.selectNodeContents(pick);
      const lines = new Set([...rg.getClientRects()].map(x => Math.round(x.top))).size;
      if(lines > 1) fails.push(`the priorities lead takes ${lines} lines at ${innerWidth}px; it should fit on one`);
    }
  }

  return fails;
};
