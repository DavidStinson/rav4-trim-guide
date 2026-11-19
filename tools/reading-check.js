// Reading checks for rav4-site: things an older reader notices that layout checks miss.
// Run in the page after it loads (npm run check does this): `await readingCheck()` returns a list of failures.
// It scrolls the page, so run it after checks that expect the page at the top.
window.readingCheck = async function readingCheck(){
  const fails = [];
  const frames = n => new Promise(r => { const f = () => (--n ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); });
  await document.fonts.ready;
  const settle = async () => { await frames(4); await new Promise(r => setTimeout(r, 150)); };

  // 2. Text that carries meaning is at least 16px, so an older reader never has to squint at a price note,
  //    a package requirement or a caption. Exempt: text inside drawings (SVG, sized with the drawing), decorative
  //    glyphs hidden from screen readers, and the slider arrows' labels (they repeat the trim name beside it).
  const small = new Map();
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for(let n = walk.nextNode(); n; n = walk.nextNode()){
    const el = n.parentElement;
    if(!n.textContent.trim() || !el || el.closest('svg, dialog:not([open]), [hidden], [aria-hidden="true"], .sl-btn')) continue;
    if(!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') continue;
    // On a laptop, a sentence (anything 30 characters or longer) is at least 17px: a step-up description,
    // a "Toyota calls it" name, a charging step, a spec row. Short labels may stay at 16px.
    const px = parseFloat(getComputedStyle(el).fontSize), min = innerWidth >= 901 && el.textContent.trim().length >= 30 ? 17 : 16;
    if(px < min){
      const key = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''} (${px}px, needs ${min})`;
      if(!small.has(key)) small.set(key, n.textContent.trim().slice(0, 40));
    }
  }
  for(const [key, text] of small) fails.push(`text too small: ${key}, e.g. "${text}"`);

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

  // 6. Running text keeps a readable measure: a paragraph, list item, caption or note averages at most
  //    85 characters a line, so the eye finds the start of the next line. (Table cells are exempt; their
  //    width comes from the table.)
  const wide = new Map();
  document.querySelectorAll('p, li, figcaption, small, dd').forEach(el => {
    if(!el.getClientRects().length || el.closest('svg, table, [hidden], dialog:not([open])')) return;
    if([...el.children].some(c => getComputedStyle(c).display === 'block')) return;
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if(text.length < 60) return;
    const lines = Math.max(1, Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));
    const cpl = Math.round(text.length / lines);
    if(cpl > 85){
      const key = `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`;
      if(!wide.has(key) || wide.get(key)[0] < cpl) wide.set(key, [cpl, text.slice(0, 40)]);
    }
  });
  for(const [key, [cpl, text]] of wide) fails.push(`lines too long to read at ${innerWidth}px: ${key} runs about ${cpl} characters a line, e.g. "${text}"`);

  return fails;
};
