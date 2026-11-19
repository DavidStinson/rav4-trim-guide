// Layout regression checks for rav4-site. Run in the page (for example through the browser's
// console or a test driver) after it loads: `await import('/tools/layout-check.js')` then
// `layoutCheck()`. Returns a list of failures; an empty list means every check passed.
// Checks are tied to viewport width, so run it at a phone width, a laptop width and a wide desktop.
window.layoutCheck = function layoutCheck(){
  const fails = [];
  const W = innerWidth;
  const visible = el => !el.hidden && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
  const sliders = [...document.querySelectorAll('[data-sl]')].filter(visible);

  // 1. A slider's arrow button (and its fade) stays inside the slider, so it never covers
  //    the text before or after it.
  sliders.forEach((sl, i) => {
    const box = sl.getBoundingClientRect();
    sl.querySelectorAll('.sl-btn').forEach(b => {
      if(!visible(b)) return;
      const r = b.getBoundingClientRect();
      if(r.top < box.top - 1 || r.bottom > box.bottom + 1)
        fails.push(`slider ${i} (${sl.id || sl.parentElement.id || sl.className}): arrow button spans ${Math.round(r.top - box.top)}px above / ${Math.round(r.bottom - box.bottom)}px below the slider`);
    });
  });

  // 2. On laptop and wider screens, every section link fits without scrolling the nav.
  const nav = document.querySelector('.nav');
  if(nav && W >= 1024 && nav.scrollWidth > nav.clientWidth + 1)
    fails.push(`section nav overflows at ${W}px: ${nav.scrollWidth}px of links in ${nav.clientWidth}px`);

  // 3. On a wide desktop, every slider shows all four trims side by side with no arrows, the package
  //    ladders and priority cards included, so the reader compares four without clicking.
  if(W >= 1280) sliders.forEach((sl, i) => {
    const items = [...sl.querySelector('.sl-track').children];
    if(!items.length) return;
    const out = items.filter(el => el.classList.contains('sl-out')).length;
    const btns = [...sl.querySelectorAll('.sl-btn')].filter(visible).length;
    const box = sl.querySelector('.sl-view').getBoundingClientRect();
    const clipped = items.filter(el => { const r = el.getBoundingClientRect(); return r.left < box.left - 1 || r.right > box.right + 1; }).length;
    if(out || btns || clipped) fails.push(`slider ${i} at ${W}px: ${out} cards out of view, ${clipped} clipped, ${btns} arrows showing; expected all four`);
  });

  // 4. On narrower screens (below 1000px, where four never fit), sliders still slide: something is hidden and a next arrow shows.
  if(W < 1000) sliders.forEach((sl, i) => {
    const items = [...sl.querySelector('.sl-track').children];
    if(items.length < 2) return;
    const anyOut = items.some(el => el.classList.contains('sl-out'));
    const next = sl.querySelector('.sl-next');
    const prev = sl.querySelector('.sl-prev');
    if(!anyOut || !((next && visible(next)) || (prev && visible(prev))))
      fails.push(`slider ${i} at ${W}px: expected a sliding view with an arrow (cards out of view: ${anyOut})`);
  });

  // 5. The page never scrolls sideways.
  if(document.documentElement.scrollWidth > W + 1)
    fails.push(`page is ${document.documentElement.scrollWidth}px wide at ${W}px viewport`);

  // 6. The package ladders and priority cards need room: their cards are never narrower than their
  //    data-sl-col minimum, and they share one width. Where four don't fit (laptop widths below 1280),
  //    an arrow shows and brings the last card in. The priority cards only show once a priority is
  //    picked, so pick one for the check and put it back after.
  const chip = document.querySelector('#chips [data-id="price"]');
  const chipWasOn = chip?.getAttribute('aria-pressed') === 'true';
  if(chip && !chipWasOn) chip.click();
  const roomy = ['#pkGrid', '#scores'].map(id => [id, document.querySelector(id)?.closest('[data-sl]')]);
  const widths = {};
  roomy.forEach(([id, sl]) => {
    if(!sl || !visible(sl)) { fails.push(`no visible ${id} slider`); return; }
    const minCol = +sl.dataset.slCol;
    if(!minCol) { fails.push(`${id} slider has no data-sl-col minimum card width`); return; }
    const items = [...sl.querySelector('.sl-track').children];
    const shownEls = () => items.filter(el => !el.classList.contains('sl-out'));
    const minW = Math.min(...shownEls().map(el => el.getBoundingClientRect().width));
    widths[id] = minW;
    if(minW < Math.min(minCol, W - 120) - 1) fails.push(`${id} cards are ${Math.round(minW)}px wide at ${W}px; expected at least ${minCol}`);
    if(W >= 1000 && W < 1280){
      const next = sl.querySelector('.sl-next');
      if(shownEls().length >= items.length || !next || !visible(next)) fails.push(`${id} slider at ${W}px: ${shownEls().length} of ${items.length} cards and ${next && visible(next) ? 'a' : 'no'} next arrow; expected some hidden behind an arrow`);
      else {
        next.click();
        if(items[items.length-1].classList.contains('sl-out')) fails.push(`${id} slider at ${W}px: the next arrow didn't bring the last card into view`);
        sl.querySelector('.sl-prev')?.click();
      }
    }
  });
  if(widths['#pkGrid'] && widths['#scores'] && Math.abs(widths['#pkGrid'] - widths['#scores']) > 2)
    fails.push(`priority cards are ${Math.round(widths['#scores'])}px wide and package cards ${Math.round(widths['#pkGrid'])}px at ${W}px; expected the same`);
  if(chip && !chipWasOn) chip.click();

  // 7. Color picker: both photos show at a usable size, side by side with their choices from 860px
  //    up and stacked below that, and every choice is a comfortable tap target.
  const cp = document.querySelector('#colors .cp');
  if(!cp) fails.push('no color picker');
  else {
    const ext = cp.querySelector('#cpExt'), int = cp.querySelector('#cpIntImg'), paints = cp.querySelector('#cpPaint');
    const r = el => el.getBoundingClientRect();
    [ext, int].forEach(img => { if(!img || r(img).width < Math.min(300, W - 40)) fails.push(`color picker photo ${img?.id} is ${img ? Math.round(r(img).width) : 0}px wide at ${W}px`); });
    if(ext && paints){
      const side = r(paints).left >= r(ext).right - 1;
      if(W >= 900 && !side) fails.push(`color picker at ${W}px: paints should sit beside the photo`);
      if(W < 820 && side) fails.push(`color picker at ${W}px: paints should stack under the photo`);
    }
    [...cp.querySelectorAll('button')].filter(visible).forEach(b => {
      if(r(b).height < 44) fails.push(`color picker button "${b.textContent.trim().slice(0,30)}" is ${Math.round(r(b).height)}px tall at ${W}px`);
    });
    // Photos keep their shape whether or not they have loaded. (From 860px up the seat photo
    // fills its row instead, cropped to fit.)
    [[ext, 680/296], W < 860 && [int, 900/507]].filter(Boolean).forEach(([img, ar]) => {
      if(img && Math.abs(r(img).width / r(img).height - ar) > 0.03) fails.push(`color picker photo ${img.id} is ${Math.round(r(img).width)}x${Math.round(r(img).height)} at ${W}px; expected a ${ar.toFixed(2)} ratio`);
    });
    // Nothing moves when you pick a paint or a seat color, or switch models: the photo and choice
    // areas keep one height for every model. (The note above can appear on a model switch, so
    // heights are compared, not positions.)
    const grid = cp.querySelector('.cp-grid'), rows = () => [...grid.children].map(el => Math.round(r(el).height)).join(',');
    const pressed = sel => cp.querySelector(`${sel} [aria-pressed="true"]`);
    const start = [pressed('#cpModel'), pressed('#cpPaint'), pressed('#cpInt')].map(b => b && (b.dataset.t || b.dataset.code));
    const before = rows();
    const moved = [];
    cp.querySelectorAll('#cpModel button').forEach(m => {
      m.click();
      if(rows() !== before) moved.push(`model ${m.dataset.t}`);
      cp.querySelectorAll('#cpPaint button, #cpInt button').forEach(b => {
        b.click();
        if(rows() !== before) moved.push(`${m.dataset.t} ${b.dataset.code}`);
      });
    });
    if(moved.length) fails.push(`color picker at ${W}px changes height (${before}) after: ${moved.slice(0,4).join(', ')}${moved.length>4?' and more':''}`);
    if(start[0]){
      cp.querySelector(`#cpModel [data-t="${start[0]}"]`)?.click();
      cp.querySelector(`#cpPaint [data-code="${start[1]}"]`)?.click();
      cp.querySelector(`#cpInt [data-code="${start[2]}"]`)?.click();
    }
  }

  // 8. Content and the top bar stop widening at 1420px.
  const wrapW = Math.round(document.querySelector('.topbar .wrap').getBoundingClientRect().width);
  if(wrapW > 1420) fails.push(`content is ${wrapW}px wide at ${W}px; at most 1420`);
  if(W >= 1440 && wrapW !== 1420) fails.push(`content is ${wrapW}px wide at ${W}px; expected 1420`);

  // 9. Who has each feature sits in the same place in every feature panel: from 901px, a column down
  //    the panel's right edge listing the four trims top to bottom, so a reader following one trim
  //    finds it at the same spot every time.
  if(W >= 901){
    const lists = [...document.querySelectorAll('.feature > .avail')];
    const edge = lists.map(a => { const p = a.closest('.feature').getBoundingClientRect(), r = a.getBoundingClientRect(); return Math.round(p.right - r.left); });
    const odd = lists.filter((a, i) => edge[i] !== edge[0]).map(a => a.closest('.feature').id);
    if(odd.length) fails.push(`feature availability is not in one right-hand column: ${odd.length} of ${lists.length} panels place it elsewhere (${odd.slice(0, 4).join(', ')})`);
    const rows = lists.filter(a => new Set([...a.children].map(d => Math.round(d.getBoundingClientRect().left))).size > 1).map(a => a.closest('.feature').id);
    if(rows.length) fails.push(`feature availability is laid out side by side instead of as a list in ${rows.length} panels (${rows.slice(0, 4).join(', ')})`);
  }

  return fails;
};
