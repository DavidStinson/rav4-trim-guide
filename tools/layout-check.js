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

  // 3. When four cards fit (wide desktop), all four show and no arrows appear. A slider with a
  //    data-sl-max cap (the package cards) is checked in 6 instead.
  if(W >= 1280) sliders.filter(sl => !sl.dataset.slMax).forEach((sl, i) => {
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

  // 6. Package cards never go four across: their option names need a card's width at three across.
  //    On a wide screen, three show with an arrow for the fourth, and the arrow brings the Plug-in in.
  const pk = document.querySelector('#pkGrid')?.closest('[data-sl]');
  if(!pk) fails.push('no package slider');
  else {
    const items = [...pk.querySelector('.sl-track').children];
    const shown = () => items.filter(el => !el.classList.contains('sl-out')).length;
    if(shown() > 3) fails.push(`package slider shows ${shown()} cards at ${W}px; at most 3`);
    const minW = Math.min(...items.filter(el => !el.classList.contains('sl-out')).map(el => el.getBoundingClientRect().width));
    if(W >= 1000 && minW < 260) fails.push(`package cards are ${Math.round(minW)}px wide at ${W}px; expected at least 260`);
    if(W >= 1280){
      const next = pk.querySelector('.sl-next');
      if(shown() !== 3 || !next || !visible(next)) fails.push(`package slider at ${W}px: ${shown()} cards and ${next && visible(next) ? 'a' : 'no'} next arrow; expected 3 and an arrow`);
      else {
        next.click();
        if(items[items.length-1].classList.contains('sl-out')) fails.push(`package slider at ${W}px: the next arrow didn't bring the last card into view`);
        pk.querySelector('.sl-prev')?.click();
      }
    }
  }

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
  }

  return fails;
};
