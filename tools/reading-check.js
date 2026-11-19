// Reading checks for rav4-site: things an older reader notices that layout checks miss.
// Run in the page after it loads (npm run check does this): `await readingCheck()` returns a list of failures.
// It scrolls the page, so run it after checks that expect the page at the top.
window.readingCheck = async function readingCheck(){
  const fails = [];
  const frames = n => new Promise(r => { const f = () => (--n ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); });
  await document.fonts.ready;

  // 1. A zero in body text is an open zero, not a slashed one: prices like $45,610 must not read as $45,61Ø.
  //    Draw "0" in the body font and in Atkinson Hyperlegible (whose zero is slashed); they must differ.
  const body = getComputedStyle(document.body);
  const draw = family => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); x.font = `400 48px ${family}`; x.textBaseline = 'top'; x.fillText('0', 8, 4);
    return x.getImageData(0, 0, 64, 64).data.join(',');
  };
  if(draw(body.fontFamily) === draw('"Atkinson Hyperlegible"'))
    fails.push(`body text draws a slashed zero (font-family ${body.fontFamily}): prices read as $45,61Ø`);

  // 2. Text that carries meaning is at least 16px, so an older reader never has to squint at a price note,
  //    a package requirement or a caption. Exempt: text inside drawings (SVG, sized with the drawing), decorative
  //    glyphs hidden from screen readers, and the slider arrows' labels (they repeat the trim name beside it).
  const small = new Map();
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for(let n = walk.nextNode(); n; n = walk.nextNode()){
    const el = n.parentElement;
    if(!n.textContent.trim() || !el || el.closest('svg, dialog:not([open]), [hidden], [aria-hidden="true"], .sl-btn')) continue;
    if(!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if(px < 16){
      const key = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''} (${px}px)`;
      if(!small.has(key)) small.set(key, n.textContent.trim().slice(0, 40));
    }
  }
  for(const [key, text] of small) fails.push(`text under 16px: ${key}, e.g. "${text}"`);

  // 3. The section nav highlights the section you are reading, and back at the top of the page
  //    (above the first section) no link stays highlighted from the section you left.
  const nav = document.querySelector('.nav');
  if(nav){
    const settle = async () => { await frames(4); await new Promise(r => setTimeout(r, 150)); };
    const links = [...nav.querySelectorAll('a')];
    const last = links.at(-1), sec = document.querySelector(last.getAttribute('href'));
    // Lazy photos above can load and push the section down after the jump, so jump again until the page stays put.
    for(let i = 0, prev = NaN; i < 8 && scrollY !== prev; i++){
      prev = scrollY; sec.scrollIntoView({ block: 'start', behavior: 'instant' });
      await settle(); await new Promise(r => setTimeout(r, 250));
    }
    if(!last.classList.contains('on')) fails.push(`section nav does not highlight "${last.textContent.trim()}" while that section fills the screen (section top ${Math.round(sec.getBoundingClientRect().top)}px, scrolled ${Math.round(scrollY)} of ${document.documentElement.scrollHeight - innerHeight}; highlighted: ${[...nav.querySelectorAll('a.on')].map(a => a.textContent.trim()).join(', ') || 'none'})`);
    scrollTo({ top: 0, behavior: 'instant' });
    await settle();
    const stale = [...nav.querySelectorAll('a.on, a[aria-current]')].map(a => a.textContent.trim());
    if(stale.length) fails.push(`section nav still highlights "${stale.join('", "')}" at the top of the page`);
  }
  return fails;
};
