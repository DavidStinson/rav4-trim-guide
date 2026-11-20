// Layout regression checks for rav4-site. Run in the page (for example through the browser's
// console or a test driver) after it loads: `await import('/tools/layout-check.js')` then
// `layoutCheck()`. Returns a list of failures; an empty list means every check passed.
// Checks are tied to viewport width, so run it at a phone width, a laptop width and a wide desktop.
window.layoutCheck = function layoutCheck(){
  const fails = [];
  const W = innerWidth;
  // The colors header's height before any check switches models (and so before any switch message), for check 26.
  const cpTopAtLoad = document.getElementById('cpNote')?.textContent.trim() ? null : document.querySelector('.cp-top')?.getBoundingClientRect().height;
  // What the reader sees, not what the markup says: a `hidden` element that CSS still displays counts as visible.
  const visible = el => getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
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

  // 3. On a wide desktop, every slider shows all four trims side by side with no arrows where four fit:
  //    the hero always, the package ladders and priority cards whenever the window has room for four
  //    cards at their data-sl-col width plus three 20px gaps inside the 24px gutters (David: "show all
  //    the columns at once, when the screen width will allow"). Where four don't fit, a next arrow
  //    shows (check 6 tries it). The room is measured from the window, not the slider, so a slider
  //    held too narrow by the page fails here rather than skipping.
  if(W >= 1280) sliders.forEach((sl, i) => {
    const items = [...sl.querySelector('.sl-track').children];
    if(!items.length) return;
    const col = +sl.dataset.slCol || 0;
    if(col && document.documentElement.clientWidth - 2 * 24 < 4 * col + 3 * 20) return;
    const out = items.filter(el => el.classList.contains('sl-out')).length;
    const btns = [...sl.querySelectorAll('.sl-btn')].filter(visible).length;
    const box = sl.querySelector('.sl-view').getBoundingClientRect();
    const clipped = items.filter(el => { const r = el.getBoundingClientRect(); return r.left < box.left - 1 || r.right > box.right + 1; }).length;
    if(out || btns || clipped) fails.push(`slider ${i} at ${W}px (${sl.clientWidth}px wide): ${out} cards out of view, ${clipped} clipped, ${btns} arrows showing; expected all four`);
  });

  // 4. On narrower screens (below 1000px, where four never fit), sliders still slide: something is hidden
  //    and there is a way to reach it: a next arrow where two or three show, the trim tabs on a phone.
  if(W < 1000) sliders.forEach((sl, i) => {
    const items = [...sl.querySelector('.sl-track').children];
    if(items.length < 2) return;
    const anyOut = items.some(el => el.classList.contains('sl-out'));
    const ways = [...sl.querySelectorAll('.sl-next, .sl-prev, .sl-tabs')].filter(visible);
    if(!anyOut || !ways.length)
      fails.push(`slider ${i} at ${W}px: expected a sliding view with an arrow or trim tabs (cards out of view: ${anyOut})`);
  });

  // 4b. On a phone, where one card shows at a time, nothing peeks in from the sides (a faded sliver of the
  //     next card reads as a mistake). Instead a row of four trim tabs, each a 44px target naming its trim,
  //     sits above the cards; the one showing is marked pressed, and picking one shows that trim in every slider.
  if(W < 568) sliders.forEach((sl, i) => {
    const view = sl.querySelector('.sl-view').getBoundingClientRect();
    const items = [...sl.querySelector('.sl-track').children];
    const peeking = items.filter(el => { const r = el.getBoundingClientRect(); return el.classList.contains('sl-out') && r.right > view.left + 1 && r.left < view.right - 1; });
    if(peeking.length) fails.push(`slider ${i} at ${W}px: ${peeking.length} hidden card(s) peek into view`);
    if([...sl.querySelectorAll('.sl-btn')].some(visible)) fails.push(`slider ${i} at ${W}px: side arrows show on a phone; expected trim tabs`);
    const tabs = [...sl.querySelectorAll('.sl-tabs button')];
    if(tabs.length !== items.length || !tabs.every(visible)) { fails.push(`slider ${i} at ${W}px: ${tabs.filter(visible).length} trim tabs; expected ${items.length}`); return; }
    if(tabs[0].getBoundingClientRect().bottom > view.top + 1) fails.push(`slider ${i} at ${W}px: trim tabs sit below the cards`);
    const small = tabs.filter(t => t.getBoundingClientRect().height < 44);
    if(small.length) fails.push(`slider ${i} at ${W}px: ${small.length} trim tabs under 44px tall`);
    const pressed = tabs.map(t => t.getAttribute('aria-pressed') === 'true'), shownIdx = items.findIndex(el => !el.classList.contains('sl-out'));
    if(pressed.filter(Boolean).length !== 1 || !pressed[shownIdx]) fails.push(`slider ${i} at ${W}px: the pressed trim tab doesn't match the card showing`);
  });
  if(W < 568 && sliders.length > 1){
    const tab = sliders[0].querySelectorAll('.sl-tabs button')[2];
    if(tab){
      tab.click();
      const wrong = sliders.filter(sl => sl.querySelector('.sl-track').children[2]?.classList.contains('sl-out'));
      if(wrong.length) fails.push(`picking the third trim tab at ${W}px leaves ${wrong.length} slider(s) on another trim`);
      sliders[0].querySelectorAll('.sl-tabs button')[0].click();
    }
  }

  // 5. The page never scrolls sideways.
  if(document.documentElement.scrollWidth > W + 1)
    fails.push(`page is ${document.documentElement.scrollWidth}px wide at ${W}px viewport`);

  // 6. The package ladders and priority cards need room: their cards are never narrower than their
  //    data-sl-col minimum, and they share one width. Where four don't fit at that width,
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
    if(W >= 1000 && sl.clientWidth < 4 * minCol + 3 * 20){
      const next = sl.querySelector('.sl-next');
      if(shownEls().length >= items.length || !next || !visible(next)) fails.push(`${id} slider at ${W}px: ${shownEls().length} of ${items.length} cards and ${next && visible(next) ? 'a' : 'no'} next arrow; expected some hidden behind an arrow`);
      else {
        // Click next until the last card is in view (two clicks where only two cards fit), then back.
        let clicks = 0;
        while(clicks < 3 && items[items.length-1].classList.contains('sl-out') && visible(next)){ next.click(); clicks++; }
        if(items[items.length-1].classList.contains('sl-out')) fails.push(`${id} slider at ${W}px: the next arrow didn't bring the last card into view`);
        for(let k = 0; k < clicks; k++) sl.querySelector('.sl-prev')?.click();
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

  // 8. Two page widths (REVIEW-DECISIONS.md, "two page widths"). Text sits in one centered reading
  //    column of 1,060px. The rows that compare four trims (hero cars, priority cards, package ladders,
  //    spec table) break out wider, up to 1,420px (four 340px cards and three 20px gaps, check 3), when
  //    the window allows; below about 1,100px the two match. Every section heading starts on the reading
  //    column's left edge. The top bar spans the wide width plus its gutters.
  const READ = 1060, WIDE = 1420, vw = document.documentElement.clientWidth;
  const content = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return { left: r.left + parseFloat(cs.paddingLeft), right: r.right - parseFloat(cs.paddingRight) }; };
  const wrapW = Math.round(document.querySelector('.topbar .wrap').getBoundingClientRect().width);
  if(wrapW > WIDE + 48) fails.push(`top bar is ${wrapW}px wide at ${W}px; at most ${WIDE + 48}`);
  const col = content(document.querySelector('#steps > .wrap'));
  const colW = Math.round(col.right - col.left);
  if(colW > READ + 1) fails.push(`reading column is ${colW}px wide at ${W}px; at most ${READ}`);
  if(Math.abs(col.left - (vw - col.right)) > 2) fails.push(`reading column isn't centered at ${W}px: ${Math.round(col.left)}px left, ${Math.round(vw - col.right)}px right`);
  document.querySelectorAll('section > .wrap, main > .wrap, footer > .wrap').forEach(w => {
    if(!visible(w)) return;
    const c = content(w);
    if(Math.abs(c.left - col.left) > 1 || Math.abs(c.right - col.right) > 1) fails.push(`${w.parentElement.id || w.parentElement.tagName.toLowerCase()} text column runs ${Math.round(c.left)}-${Math.round(c.right)}px at ${W}px; the reading column is ${Math.round(col.left)}-${Math.round(col.right)}px`);
  });
  document.querySelectorAll('main h1, section .sec-head h2').forEach(h => {
    if(visible(h) && Math.abs(h.getBoundingClientRect().left - col.left) > 1) fails.push(`heading "${h.textContent.trim().slice(0, 30)}" starts at ${Math.round(h.getBoundingClientRect().left)}px at ${W}px; the reading column starts at ${Math.round(col.left)}px`);
  });
  const want = Math.min(WIDE, vw - 2 * (col.left > 20 && vw > READ + 48 ? 24 : col.left));
  [['hero cars', '.road'], ['priority cards', '#scoresSl'], ['package ladders', '#pkGrid'], ['spec table', '#specList']].forEach(([name, sel]) => {
    let el = document.querySelector(sel); if(sel === '#pkGrid') el = el?.closest('[data-sl]');
    if(!el || !visible(el)) return;
    const r = el.getBoundingClientRect(), w = Math.round(r.width);
    const expect = vw <= 1100 ? colW : Math.round(want);
    if(Math.abs(w - expect) > 2) fails.push(`${name} row is ${w}px wide at ${W}px; expected ${expect} (${vw <= 1100 ? 'the reading column' : 'the wide width'})`);
    if(Math.abs(r.left - (vw - r.right)) > 2) fails.push(`${name} row isn't centered at ${W}px`);
  });

  // 14. Hero blurbs take at most two lines on a laptop, so the four cars read as one even row.
  if(W >= 1100) document.querySelectorAll('.road .car .tag').forEach(t => {
    const n = Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight));
    if(n > 2) fails.push(`hero blurb "${t.textContent.trim().slice(0, 30)}" takes ${n} lines at ${W}px; at most 2`);
  });

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
    // The column sits beside the copy only (REVIEW-DECISIONS.md, "feature panel layout"): it never runs
    // down beside a picture, demo or photo row, which sit underneath it.
    const beside = lists.filter(a => {
      const f = a.closest('.feature'), b = a.getBoundingClientRect().bottom;
      return [...f.querySelectorAll(':scope > .f-vis, :scope > .f-below, :scope > .trio')].some(v => v.getBoundingClientRect().top < b - 1);
    }).map(a => a.closest('.feature').id);
    if(beside.length) fails.push(`feature availability column runs beside a picture or demo in ${beside.length} panels (${beside.slice(0, 4).join(', ')}): keep it beside the copy only`);
  }

  // 15. Each feature panel declares its layout in FEATURES (data.js): text (copy alone) or below (a
  //     picture, demo or photo set under the copy and the column, spanning the panel's content width).
  //     David retired beside: a picture under the copy at the copy's width left an empty block beside it.
  document.querySelectorAll('.feature').forEach(f => {
    const L = f.dataset.layout, v = f.querySelector(':scope > .f-vis'), t = f.querySelector(':scope > .f-text');
    if(!['text', 'below'].includes(L)) { fails.push(`${f.id}: layout "${L}" is not text or below (set layout: next to visual: in FEATURES)`); return; }
    if((L === 'text') !== !v) { fails.push(`${f.id}: layout ${L} ${v ? 'has a picture' : 'has no picture'}`); return; }
    if(!v) return;
    const cs = getComputedStyle(f), p = f.getBoundingClientRect(), r = v.getBoundingClientRect(), c = t.getBoundingClientRect();
    const left = p.left + parseFloat(cs.paddingLeft), right = p.right - parseFloat(cs.paddingRight);
    const under = r.top >= c.bottom - 1;
    if(L === 'below' && (!under || Math.abs(r.left - left) > 2 || Math.abs(r.right - right) > 2)) fails.push(`${f.id} at ${W}px: the demo doesn't span the panel under the copy (${Math.round(r.left - left)}px from the left, ${Math.round(right - r.right)}px from the right)`);
  });

  // 10. Package ladders read at a glance where all four sit side by side: a package name takes at most
  //     two lines, its "with the ones above" price at most two, and the card names its base price once
  //     (in the "No packages" row and the running total, not again under the heading).
  if(W >= 1280){
    const lines = el => { const lh = parseFloat(getComputedStyle(el).lineHeight); return Math.round(el.getBoundingClientRect().height / lh); };
    const long = [...document.querySelectorAll('#pkGrid .rung .pn, #pkGrid .rung .req')].filter(el => lines(el) > 2).map(el => `"${el.textContent.trim()}" (${lines(el)} lines)`);
    if(long.length) fails.push(`package ladder text wraps past two lines: ${long.slice(0, 3).join('; ')}`);
    if(document.querySelector('#pkGrid .pk-head p')) fails.push('package cards repeat the base price under the heading');
  }
  // At any width, a package's "with the ones above" total stays on one line.
  const ragged = [...document.querySelectorAll('#pkGrid .rung .req')].filter(el => {
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    return el.getClientRects().length && Math.round(el.getBoundingClientRect().height / lh) > 1;
  }).map(el => `"${el.textContent.trim()}"`);
  if(ragged.length) fails.push(`package total wraps at ${W}px: ${ragged.slice(0, 2).join('; ')}`);

  // 16. The packages-stack rule is said once, in its own callout right above the package cards, and
  //     not again in the section intro (REVIEW-DECISIONS.md, r08 rework), in David's words.
  {
    const sec = document.getElementById('packages'), grid = document.getElementById('pkGrid');
    const said = [...sec.querySelectorAll('p')].filter(p => /every package above\s+it/.test(p.textContent));
    const stack = sec.querySelector('.pk-stack'), slider = grid && grid.closest('[data-sl]');
    const words = 'Packages stack. Some packages require others, so each trim lists its available packages in that order. Adding a package adds every package above it.';
    if(stack && stack.textContent.replace(/\s+/g, ' ').trim() !== words) fails.push(`the packages-stack callout reads "${stack.textContent.replace(/\s+/g, ' ').trim()}"; expected "${words}"`);
    if(said.length !== 1 || said[0] !== stack) fails.push(`the packages-stack rule appears ${said.length} times in #packages; say it once, in the .pk-stack callout`);
    else {
      const gap = slider.getBoundingClientRect().top - stack.getBoundingClientRect().bottom;
      const between = [...sec.querySelectorAll('*')].some(el => el !== stack && !stack.contains(el) && !slider.contains(el) && !el.contains(stack) && el.getClientRects().length
        && (stack.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) && (el.compareDocumentPosition(slider) & Node.DOCUMENT_POSITION_FOLLOWING));
      if(gap < 0 || gap > 48 || between) fails.push(`the packages-stack callout isn't directly above the package cards (${Math.round(gap)}px gap${between ? ', with something between' : ''})`);
    }
  }

  // 11. The hero gets to the cars quickly. On a laptop the heading is one line and the first car's
  //     name, price and price chip are on the first screen; on any width the slider's arrow and its
  //     label never sit on a car's name, price or chip.
  const h1 = document.querySelector('.hero h1');
  if(W >= 1100 && h1){
    const lh = parseFloat(getComputedStyle(h1).lineHeight) || parseFloat(getComputedStyle(h1).fontSize) * 1.1;
    const n = Math.round(h1.getBoundingClientRect().height / lh);
    if(n > 1) fails.push(`hero heading takes ${n} lines at ${W}px; one fits`);
    const chip = document.querySelector('.road .car .jump'), top = chip && chip.getBoundingClientRect().bottom + scrollY;
    if(chip && top > 900) fails.push(`the first car's price chip ends ${Math.round(top)}px down, below a 900px laptop screen`);
    // Every price includes the destination fee; that note belongs on the same first screen as the prices.
    const fee = document.querySelector('.road-foot > span'), fr = fee && fee.getBoundingClientRect();
    const feeLine = fr && fr.top + scrollY + parseFloat(getComputedStyle(fee).lineHeight || 24);
    if(fee && feeLine > 900) fails.push(`the price-fee note's first line ends ${Math.round(feeLine)}px down, below a 900px laptop screen`);
  }
  const words = [...document.querySelectorAll('.road .car .name, .road .car .price, .road .car .jump')].map(e => e.getBoundingClientRect());
  document.querySelectorAll('.road .sl-btn:not([hidden]) .sl-in > *').forEach(b => {
    const r = b.getBoundingClientRect();
    if(r.width && words.some(w => w.width && r.left < w.right && r.right > w.left && r.top < w.bottom && r.bottom > w.top))
      fails.push(`hero slider arrow or label covers a car's name, price or chip at ${W}px`);
  });

  // 12. The priority picker shows something before anything is picked: all four trim cards, each naming
  //     its trim and price and nothing else (no empty bars), and no extra prompt under the chips: the
  //     section intro already says what to do (REVIEW-DECISIONS.md, r12 rework). The legend explains
  //     the cards' marks, so it appears with them once a priority is picked, between the chips and the
  //     cards. An unpicked chip's outline stands out from what's behind it (3:1, so it reads as a button).
  const say = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
  const pickChips = [...document.querySelectorAll('#chips .chip')], wasPicked = pickChips.filter(c => c.getAttribute('aria-pressed') === 'true');
  wasPicked.forEach(c => c.click());
  const cards = [...document.querySelectorAll('#scores > .score')].filter(visible);
  const prices = [...document.querySelectorAll('.road .car')].map(c => [say(c.querySelector('.name')).replace(/^Hybrid /, ''), say(c.querySelector('.price'))]);
  if(cards.length !== 4) fails.push(`priority picker shows ${cards.length} trim cards before anything is picked; expected all four`);
  else prices.forEach(([name, price], i) => { if(!say(cards[i]).includes(name) || !say(cards[i]).includes(price)) fails.push(`priority card ${i + 1} doesn't name ${name} and ${price} before anything is picked`); });
  const legend = document.querySelector('.picker .legend');
  if(legend && visible(legend)) fails.push('priority picker shows the Included/Optional/Not offered legend before there is anything for it to explain');
  if([...document.querySelectorAll('#scores .best-badge')].some(b => visible(b) && getComputedStyle(b).visibility !== 'hidden')) fails.push('a priority card says "Best match" before anything is picked');
  if(document.querySelector('#scores .meter')) fails.push('priority cards show empty bars before anything is picked');
  const prompt = [...document.querySelectorAll('.picker p')].filter(el => visible(el) && /pick|tap/i.test(say(el)));
  if(prompt.length) fails.push(`priority picker repeats the intro under the chips: "${say(prompt[0])}"`);
  const rgb = c => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number).map(v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  const lum = c => { const [r, g, b] = rgb(c); return .2126 * r + .7152 * g + .0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
  const c0 = pickChips[0];
  if(c0){
    // What's behind the chip: the nearest ancestor with a solid background.
    let bg = c0.parentElement; while(bg && /rgba\(.*,\s*0\)$|transparent/.test(getComputedStyle(bg).backgroundColor)) bg = bg.parentElement;
    const cs = getComputedStyle(c0), behind = getComputedStyle(bg || document.body).backgroundColor;
    const r = ratio(cs.borderTopColor, behind);
    if(r < 3) fails.push(`an unpicked priority chip's outline is ${r.toFixed(2)}:1 against the panel; a button outline needs 3:1`);
    const tick = c0.querySelector('.tick'), tc = tick && getComputedStyle(tick).color;
    if(tick && !/rgba\(.*,\s*0\)$|transparent/.test(tc) && getComputedStyle(tick).visibility !== 'hidden') fails.push('an unpicked priority chip already shows a check mark, so it looks picked');
    c0.click();
    if(!legend || !visible(legend)) fails.push('priority picker hides the legend after a priority is picked');
    else {
      const top = legend.getBoundingClientRect().top, chipsBottom = document.querySelector('#chips').getBoundingClientRect().bottom, firstCard = document.querySelector('#scores > .score');
      if(top < chipsBottom || (firstCard && top > firstCard.getBoundingClientRect().top)) fails.push('priority legend is not between the chips and the cards');
    }
    if(document.querySelector('#scores > .score') && !document.querySelector('#scores .best-badge')) fails.push('priority cards lost their "Best match" badge');
    // 19. On a phone, where one card shows at a time under four trim tabs, the tabs say which trim is the
    //     best match, in what they show and in their accessible names, and no other tab does.
    const tabs = [...document.querySelectorAll('#scoresSl .sl-tabs button')].filter(visible);
    if(tabs.length){
      const best = [...document.querySelectorAll('#scores > .score')].map(c => c.classList.contains('best'));
      const name = b => (b.getAttribute('aria-label') || say(b)).toLowerCase();
      tabs.forEach((b, i) => {
        const marked = /best/i.test(say(b)), named = name(b).includes('best match');
        if(best[i] && !(marked && named)) fails.push(`phone tab ${say(b)} is the best match but ${marked ? 'its accessible name doesn\'t say so' : 'doesn\'t show it'}`);
        if(!best[i] && (marked || named)) fails.push(`phone tab ${say(b)} is marked best match but isn't`);
      });
    }
    c0.click();
    if([...document.querySelectorAll('#scoresSl .sl-tabs button')].some(b => /best/i.test(say(b) + (b.getAttribute('aria-label') || '')))) fails.push('a phone tab still says best match after the picks are cleared');
  }
  wasPicked.forEach(c => c.click());

  // 17. A picked chip's check mark sits in the middle of its circle (within 1px).
  {
    const chip = document.querySelector('#chips .chip');
    if(chip){
      const was = chip.getAttribute('aria-pressed') === 'true';
      if(!was) chip.click();
      const tick = chip.querySelector('.tick'), mark = tick && tick.querySelector('path');
      if(!mark) fails.push('priority chip check mark is not a drawn shape, so its position can\'t be checked');
      else {
        const a = tick.getBoundingClientRect(), b = mark.getBoundingClientRect();
        const dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
        if(Math.abs(dx) > 1 || Math.abs(dy) > 1) fails.push(`priority chip check mark is ${dx.toFixed(1)}px across and ${dy.toFixed(1)}px down from its circle's center`);
      }
      if(!was) chip.click();
    }
  }

  // 18. The priority cards sit straight in the section, like the hero cars and package cards: no box
  //     around the row, and the row's outer edges line up with the package cards' at the same width.
  {
    const sl = document.getElementById('scoresSl'), sec = document.getElementById('picker'), pk = document.getElementById('pkGrid')?.closest('[data-sl]');
    for(let el = sl?.parentElement; el && el !== sec; el = el.parentElement){
      const cs = getComputedStyle(el);
      if(!/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor) || cs.boxShadow !== 'none' || parseFloat(cs.borderTopWidth) > 0)
        fails.push(`priority cards sit inside a box (${el.className || el.tagName}); they should sit straight in the section`);
    }
    if(sl && pk){
      const a = sl.getBoundingClientRect(), b = pk.getBoundingClientRect();
      if(Math.abs(a.left - b.left) > 1 || Math.abs(a.right - b.right) > 1) fails.push(`priority card row spans ${Math.round(a.left)} to ${Math.round(a.right)}px; the package cards span ${Math.round(b.left)} to ${Math.round(b.right)}px`);
    }
  }


  // 13. Step-up items: one with a write-up further down is a link that looks like one (a visible "more"
  //     cue at its end); one without a write-up is plain text, never a link that jumps somewhere unrelated.
  const stepLinks = [...document.querySelectorAll('.steps .gain a')];
  const nowhere = stepLinks.filter(a => { const h = a.getAttribute('href') || ''; return !h.startsWith('#f-') || !document.querySelector(h); });
  if(nowhere.length) fails.push(`${nowhere.length} step-up item(s) link to no feature write-up (e.g. "${(nowhere[0].querySelector('b')?.textContent || '').trim()}" -> ${nowhere[0].getAttribute('href')})`);
  const noCue = stepLinks.filter(a => { const c = a.querySelector('.go'); return !c || !visible(c) || c.getBoundingClientRect().right < a.getBoundingClientRect().right - 40; });
  if(noCue.length) fails.push(`${noCue.length} step-up links show no "more" cue at their end, so they don't look tappable`);
  const lede = document.querySelector('#steps .lede, .steps')?.closest('section')?.querySelector('.lede');
  if(lede && /tap any item/i.test(lede.textContent)) fails.push('step-ups intro says "Tap any item" but only some items have more to read');

  // 20. In the parking diagram the camera dots stand apart from the yellow area they see: 3:1 contrast
  //     or more between the two fills (REVIEW-DECISIONS.md, caption batch 1).
  {
    const hex = c => (c.match(/^#([0-9a-f]{6})$/i) || [])[1];
    const L = h => { const v = [0, 2, 4].map(k => parseInt(h.slice(k, k + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
    const dots = [...document.querySelectorAll('#f-cam360 .cam-dot')], zones = [...document.querySelectorAll('#f-cam360 .view-zone')];
    if(!dots.length || !zones.length) fails.push('parking diagram: camera dots (.cam-dot) or view areas (.view-zone) not found');
    dots.forEach(d => zones.forEach(z => {
      const a = hex(d.getAttribute('fill') || ''), b = hex(z.getAttribute('fill') || '');
      if(!a || !b) { fails.push('parking diagram: camera dot and view area need plain #rrggbb fills'); return; }
      const [x, y] = [L(a), L(b)].sort((m, n) => n - m), r = (x + .05) / (y + .05);
      if(r < 3) fails.push(`parking diagram: camera dot #${a} is ${r.toFixed(2)}:1 against the view area #${b}; needs 3:1`);
    }));
  }

  // 21. Trim colors. Each trim keeps one color family across the page (David, after the rework): the XLE
  //     Premium green, the XSE red, the Limited bronze, the Plug-in XSE blue. Each is readable as text on
  //     cards and on the page (4.5:1), the XLE green stays clear of the green "Included" marks (20 degrees
  //     of hue apart), and in dark mode each is vivid (chroma, max minus min channel, at least 0.5).
  {
    const root = getComputedStyle(document.documentElement), tok = n => root.getPropertyValue(n).trim();
    const rgb = h => { const m = h.match(/^#([0-9a-f]{6})$/i); return m ? [0, 2, 4].map(k => parseInt(m[1].slice(k, k + 2), 16)) : null; };
    const lum = c => { const v = c.map(x => x / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
    const hue = c => { const [r, g, b] = c.map(x => x / 255), M = Math.max(r, g, b), d = M - Math.min(r, g, b); if(!d) return 0; const h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
    const near = (h, lo, hi) => lo <= hi ? h >= lo && h <= hi : h >= lo || h <= hi;
    const card = rgb(tok('--card')), paper = rgb(tok('--paper')), sign = rgb(tok('--sign'));
    const dark = paper && lum(paper) < .1, mode = dark ? 'dark' : 'light';
    [['--xle', 'XLE Premium', 'green', 100, 150], ['--xse', 'XSE', 'red', 340, 10], ['--ltd', 'Limited', 'bronze', 20, 45], ['--phv', 'Plug-in XSE', 'blue', 195, 225]].forEach(([n, name, fam, lo, hi]) => {
      const c = rgb(tok(n));
      if(!c || !card || !paper){ fails.push(`trim color ${n} (${mode}) needs a plain #rrggbb value`); return; }
      if(!near(hue(c), lo, hi)) fails.push(`${name} color ${tok(n)} (${mode}) has hue ${Math.round(hue(c))}; expected ${fam} (${lo} to ${hi})`);
      [['card', card], ['page', paper]].forEach(([w, bg]) => { const r = ratio(c, bg); if(r < 4.5) fails.push(`${name} color ${tok(n)} is ${r.toFixed(2)}:1 on the ${mode} ${w}; needs 4.5:1`); });
      const chroma = (Math.max(...c) - Math.min(...c)) / 255;
      if(dark && chroma < .5) fails.push(`${name} color ${tok(n)} is dull in dark mode (chroma ${chroma.toFixed(2)}); needs 0.5`);
      if(n === '--xle' && sign){ const dh = Math.abs(hue(c) - hue(sign)); if(Math.min(dh, 360 - dh) < 20) fails.push(`XLE Premium green ${tok(n)} (${mode}) is within ${Math.round(Math.min(dh, 360 - dh))} degrees of the "Included" green ${tok('--sign')}`); }
    });
  }

  // 22. Sections stand well apart, all by the same amount (David, after the rework: "double the spacing
  //     between each section" and "unify the space between the sections", then "cut this to 120"). The gap
  //     from the end of one section's visible content to the next section's heading is 120px on a laptop,
  //     96px on a tablet and 80px on a phone, where the screen is short; every gap within 2px of that.
  {
    const want = W >= 1100 ? 120 : W <= 640 ? 80 : 96;
    const secs = [...document.querySelectorAll('main ~ section, body > section, main section')].filter((el, i, a) => visible(el) && a.indexOf(el) === i && el.querySelector('.sec-head h2'));
    secs.forEach(sec => {
      const prev = sec.previousElementSibling;
      if(!prev || !visible(prev)) return;
      // Measured from what you see: the lowest visible thing in the section before (a card, a line of text),
      // not the section's own box, which can end with padding of its own.
      // Something you can see paints text, an image, a background, a border or a shadow; wrappers don't.
      const paints = el => { const cs = getComputedStyle(el); return [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || /^(IMG|SVG|INPUT)$/i.test(el.tagName) || !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor) || cs.boxShadow !== 'none' || parseFloat(cs.borderBottomWidth) > 0; };
      // A row of trim cards counts as one block as tall as its tallest card, shown or not, since that's
      // the room the row keeps (so switching trims never moves the page).
      const bottom = Math.max(...[...prev.querySelectorAll('*')].filter(el => el.matches('.sl-track') || !el.closest('[hidden], .sl-track, dialog:not([open]), svg *') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && paints(el)).map(el => el.getBoundingClientRect().bottom));
      const gap = sec.querySelector('.sec-head h2').getBoundingClientRect().top - bottom;
      if(Math.abs(gap - want) > 2) fails.push(`${Math.round(gap)}px between ${prev.id || prev.className || prev.tagName.toLowerCase()} and the ${sec.id} heading at ${W}px; expected ${want}`);
    });
  }

  // 23. Inside each section's header, the lead sits close under its heading and the content stands clear
  //     of the lead (David: "8 above / 24 below", then 36 below once the lead's stray margin was gone):
  //     8px from heading to lead and 36px from the lead to the content, at every width.
  {
    const [head, after] = [8, 36];
    document.querySelectorAll('main .sec-head, body > section .sec-head').forEach(h => {
      if(!visible(h)) return;
      const id = h.closest('section')?.id || 'a section', h2 = h.querySelector('h2'), next = h2?.nextElementSibling, body = h.nextElementSibling;
      if(next && visible(next)) {
        const g = next.getBoundingClientRect().top - h2.getBoundingClientRect().bottom;
        if(Math.abs(g - head) > 1) fails.push(`${id}: ${Math.round(g)}px from the heading to the lead at ${W}px; expected ${head}`);
      }
      // Measured from the header's last line of text, not the header's box, so a stray margin on the
      // lead can't hide inside the header and widen the gap unseen.
      const last = [...h.children].filter(visible).at(-1);
      if(body && visible(body) && last) {
        const g = body.getBoundingClientRect().top - last.getBoundingClientRect().bottom;
        if(Math.abs(g - after) > 1) fails.push(`${id}: ${Math.round(g)}px from the header to the content at ${W}px; expected ${after}`);
      }
    });
  }

  // 24. Features steps down from the section gap: 72px before each group heading, 32px between panels,
  //     and 24px from a group heading to its first panel, so a heading sits closer to its panels than
  //     the panels sit to each other (David picked 32 / 72 / 24). The group links sit 32px above the
  //     first group, a little more than a group heading to its panel. On a phone: 48, 20, 16 and 32.
  {
    const [group, panel, head, nav] = W <= 640 ? [48, 20, 16, 32] : [72, 32, 24, 32];
    const top = el => el.getBoundingClientRect().top, bot = el => el.getBoundingClientRect().bottom;
    const want = (g, w, what) => { if(Math.abs(g - w) > 1) fails.push(`features: ${Math.round(g)}px ${what} at ${W}px; expected ${w}`); };
    const groups = [...document.querySelectorAll('#features .fgroup')].filter(visible), navEl = document.querySelector('#features .group-nav');
    if(!groups.length) fails.push('features: no feature groups found');
    if(groups.length && navEl && visible(navEl)) want(top(groups[0].querySelector('h3')) - bot(navEl), nav, 'from the group links to the first group');
    groups.forEach((g, i) => {
      const h3 = g.querySelector(':scope > h3'), panels = [...g.querySelectorAll(':scope > .feature')].filter(visible);
      if(!h3 || !panels.length) return;
      want(top(panels[0]) - bot(h3), head, `from the ${g.id} heading to its first panel`);
      panels.slice(1).forEach((p, k) => want(top(p) - bot(panels[k]), panel, `between ${panels[k].id || 'a panel'} and ${p.id || 'the next'}`));
      if(groups[i + 1]) want(top(groups[i + 1].querySelector('h3')) - bot(panels.at(-1)), group, `before the ${groups[i + 1].id} heading`);
    });
  }

  // 25. In Specs the tables stand apart like the feature panels: the search and filter bar sits 24px
  //     above the first table and each table 20px below the one before (David agreed to 24 / 20), so
  //     the nine tables don't read as one block.
  {
    const tools = document.querySelector('#specs .tools'), cats = [...document.querySelectorAll('#specs .spec-cat')].filter(visible);
    const gap = (a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
    if(!tools || !cats.length) fails.push('specs: search bar (.tools) or tables (.spec-cat) not found');
    else {
      if(Math.abs(gap(tools, cats[0]) - 24) > 1) fails.push(`specs: ${Math.round(gap(tools, cats[0]))}px from the search bar to the first table at ${W}px; expected 24`);
      cats.slice(1).forEach((c, k) => { const g = gap(cats[k], c); if(Math.abs(g - 20) > 1) fails.push(`specs: ${Math.round(g)}px between tables at ${W}px; expected 20`); });
    }
  }

  // 26. No rounded box wears a thick stripe down one side (David: "very kind of AI looking"). Instead:
  //     a trim card shows its trim with a header tinted in the trim's soft color, its name still 4.5:1
  //     against the tint; the two standalone notes ("Packages stack" and the spec footnote) open with a
  //     yellow "Good to know" tag above their text; the year comparison, demo summaries and the colors
  //     switch message take a soft yellow fill.
  {
    const rgb = c => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const lum = c => { const v = rgb(c).map(x => x / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
    const resolve = (host, value) => { const i = document.createElement('i'); i.style.cssText = `position:absolute;background:${value}`; host.append(i); const c = getComputedStyle(i).backgroundColor; i.remove(); return c; };
    const name = el => el.id ? '#' + el.id : '.' + [...el.classList].join('.');
    document.querySelectorAll('body *').forEach(el => {
      if(el.closest('svg') || !visible(el)) return;
      const cs = getComputedStyle(el);
      if(!['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'].some(k => parseFloat(cs[`border${k}Radius`]) > 0)) return;
      const w = ['Top', 'Right', 'Bottom', 'Left'].map(k => cs[`border${k}Style`] === 'none' ? 0 : parseFloat(cs[`border${k}Width`]));
      if(Math.max(...w) >= 3 && new Set(w).size > 1) fails.push(`${name(el)} has a ${Math.max(...w)}px stripe on one side of a rounded box at ${W}px; use a tinted header, a tag or a soft fill`);
    });
    // Nor a side marker drawn as an inset shadow, like the yellow edge spec rows once had (David: "basically
    // noise"). An inset shadow offset sideways with no blur is a stripe down one edge.
    document.querySelectorAll('body *').forEach(el => {
      if(el.closest('svg') || !visible(el)) return;
      const sh = getComputedStyle(el).boxShadow;
      if(sh === 'none' || !/inset/.test(sh)) return;
      sh.split(/,(?![^(]*\))/).filter(x => /inset/.test(x)).forEach(x => {
        const [dx, , blur = 0] = (x.replace(/rgba?\([^)]*\)/g, '').match(/-?[\d.]+px/g) || []).map(parseFloat);
        if(Math.abs(dx) >= 3 && !blur) fails.push(`${name(el)} has a ${Math.abs(dx)}px inset side marker at ${W}px`);
      });
    });
    const tinted = (box, head, id) => {
      const want = resolve(box, `var(--${id}-soft)`), got = getComputedStyle(head).backgroundColor;
      if(got !== want) fails.push(`${name(box)} (${id}): header background ${got}; expected the trim's soft tint ${want}`);
      const h = head.querySelector('h3');
      if(h && ratio(getComputedStyle(h).color, got) < 4.5) fails.push(`${name(box)} (${id}): trim name is ${ratio(getComputedStyle(h).color, got).toFixed(2)}:1 on its tinted header; needs 4.5:1`);
    };
    document.querySelectorAll('.pk[data-t]').forEach(pk => { const head = pk.querySelector('.pk-head'); if(visible(pk) && head) tinted(pk, head, pk.dataset.t); });
    const cp = document.querySelector('.cp'), on = cp && cp.querySelector('#cpModel button[aria-pressed="true"]');
    if(cp && on && cp.querySelector('.cp-top')) tinted(cp, cp.querySelector('.cp-top'), on.dataset.t);
    ['.pk-stack'].forEach(sel => {
      const p = document.querySelector(sel), box = p && p.closest('.tagged'), tag = box && box.querySelector(':scope > .note-tag');
      if(!p || !visible(p)) return;
      if(!tag || tag.textContent.trim() !== 'Good to know') { fails.push(`${sel}: needs a "Good to know" tag (.tagged > .note-tag) at ${W}px`); return; }
      if(tag.getBoundingClientRect().bottom > p.getBoundingClientRect().top + 1) fails.push(`${sel}: its tag should sit above the text at ${W}px`);
    });
    // The year comparison is a card in the opposite scheme to the page, dark on the light page and light on the
    // dark one, with no heading line: a yellow "2026 vs. 2027" tag names it (David).
    const yd = document.querySelector('.year-diff');
    if(yd && visible(yd)) {
      const tag = yd.firstElementChild, page = getComputedStyle(document.body).backgroundColor, bg = getComputedStyle(yd).backgroundColor;
      if(!tag || !tag.matches('h2.note-tag') || !/^\d{4} vs\. \d{4}$/.test(tag.textContent.trim())) fails.push(`.year-diff: should open with a yellow tag heading (h2.note-tag) reading "2026 vs. 2027", found "${tag ? tag.outerHTML.slice(0, 60) : 'nothing'}"`);
      if(yd.querySelectorAll('h2:not(.note-tag), h3').length) fails.push('.year-diff: the tag replaces its heading; found another heading');
      if((lum(page) > .5) === (lum(bg) > .5)) fails.push(`.year-diff: background ${bg} should be the opposite scheme to the page ${page} at ${W}px`);
      yd.querySelectorAll(':scope > p, .yd-table th, .yd-table td').forEach(el => {
        const r = ratio(getComputedStyle(el).color, bg);
        if(r < 4.5) fails.push(`.year-diff: "${el.textContent.trim().slice(0, 30)}" is ${r.toFixed(2)}:1 on its card; needs 4.5:1`);
      });
    }
    // The colors switch message sits in a box filled like the model toggle beside it (David), and its space is
    // always reserved, so nothing below moves when it appears or goes (David: fix the layout shift). Switching
    // from the Plug-in XSE to the XLE Premium always changes the paint, so it brings the message up.
    const cpNote = document.getElementById('cpNote'), cpModel = document.getElementById('cpModel'), cpTop = document.querySelector('.cp-top');
    if(cpNote && cpModel && cpTop && visible(cpModel)) {
      const was = cpModel.querySelector('button[aria-pressed="true"]'), btn = t => cpModel.querySelector(`button[data-t="${t}"]`);
      const box = cpNote.closest('.cp-note') || cpNote, tall = () => Math.round(cpTop.getBoundingClientRect().height);
      const before = cpTopAtLoad == null ? null : Math.round(cpTopAtLoad);
      btn('phv').click(); btn('xle').click();
      if(!visible(cpNote) || !cpNote.textContent.trim()) fails.push('colors panel: switching from the Plug-in XSE to the XLE Premium shows no message');
      else {
        const want = getComputedStyle(cpModel).backgroundColor, got = getComputedStyle(box).backgroundColor;
        if(got !== want) fails.push(`colors switch message: background ${got}; expected ${want}, the model toggle's fill, at ${W}px`);
        if(before !== null && Math.abs(tall() - before) > 1) fails.push(`colors panel: the header grows from ${before}px to ${tall()}px when the switch message appears at ${W}px; its space should be reserved`);
        if(W >= 1100 && box.getBoundingClientRect().height > cpModel.getBoundingClientRect().height + 1) fails.push(`colors switch message is ${Math.round(box.getBoundingClientRect().height)}px tall beside a ${Math.round(cpModel.getBoundingClientRect().height)}px toggle at ${W}px; it should be no taller`);
      }
      if(was) was.click();
    }
  }

  // 27. The camera demo's toggle names the cameras only, not the trims (who has which is in the panel's
  //     who-has-it column), and its result is plain text with no box, starting level with the toggle
  //     where the two sit side by side. The roof demo's result is a plain caption under its photo
  //     (David, demo results walkthrough).
  {
    const demo = document.querySelector('#f-cam360 .demo'), seg = demo && demo.querySelector('.seg'), sum = document.getElementById('camSummary');
    if(!demo || !seg || !sum) fails.push('camera demo: toggle (.seg) or result (#camSummary) not found');
    else {
      [...seg.querySelectorAll('button')].forEach(b => { if(/XLE|XSE|Limited|Plug-in|other three/i.test(b.textContent)) fails.push(`camera demo: toggle "${b.textContent.trim()}" names trims`); });
      const a = seg.getBoundingClientRect(), b = sum.getBoundingClientRect();
      if(b.left - a.left > 200 && Math.abs(b.top - a.top) > 2) fails.push(`camera demo: result starts ${Math.round(b.top - a.top)}px below the toggle at ${W}px; expected level with it`);
    }
    // The roof caption spans its photo, and the photo's 3:1 crop keeps the top of the picture, where the
    // roof is (David).
    const roofImg = document.querySelector('.roof-photo img'), roofCap = document.getElementById('roofSummary');
    if(roofImg && roofCap && visible(roofImg)) {
      const iw = roofImg.getBoundingClientRect().width, cw = roofCap.getBoundingClientRect().width;
      if(Math.abs(iw - cw) > 2) fails.push(`roof demo: caption is ${Math.round(cw)}px wide under a ${Math.round(iw)}px photo at ${W}px; expected the photo's width`);
      const pos = getComputedStyle(roofImg).objectPosition.split(' ')[1];
      if(parseFloat(pos) !== 0) fails.push(`roof demo: photo crop is anchored at ${pos} from the top at ${W}px; expected the top (0%)`);
    }
    // The plug-in demo's slider-driven results lead with a yellow tag holding the short answer, and the
    // tag follows the sliders; the rest is plain text with no bold lead of its own. Tag wording is
    // David's: the miles result uses "a more concise version of the bold text", the charging result
    // "X hours on your typical day of driving on a regular outlet", and the savings result says "No
    // savings with these figures" when the Plug-in costs more to fuel.
    const sliders = ['evMiles', 'evDays', 'evGas', 'evKwh'].map(id => document.getElementById(id));
    [['evSum', [[{evMiles: 30}, /^All 30 miles electric$/], [{evMiles: 80}, /^\d+ miles electric, \d+ on gas$/]]],
     ['chgSum', [[{evMiles: 30}, /^\d+½? hours? for your typical day of driving, on a regular outlet$/], [{evMiles: 5}, /^\d+½? (minutes|hours?) for your typical day of driving, on a regular outlet$/]]],
     ['evSave', [[{evMiles: 30}, /^Saves about \$[\d,]+ over 5 years of your typical driving$/], [{evMiles: 30, evGas: 2.5, evKwh: 40}, /^No savings with these figures$/]]]
    ].forEach(([id, cases]) => {
      const box = document.getElementById(id);
      if(!box || sliders.some(s => !s)) { fails.push(`plug-in demo: result (#${id}) or one of its sliders not found`); return; }
      if(!visible(box)) return;
      const was = sliders.map(s => s.value), set = vals => sliders.forEach((s, k) => {
        s.value = vals[k]; s.dispatchEvent(new Event('input', {bubbles: true}));
      });
      cases.forEach(([vals, want]) => {
        set(sliders.map((s, k) => vals[s.id] ?? was[k]));
        const tag = box.querySelector(':scope > .note-tag'), text = box.querySelector(':scope > .demo-text');
        const got = tag ? tag.textContent.trim() : '', at = JSON.stringify(vals);
        if(!want.test(got)) fails.push(`#${id} at ${at}: tag reads "${got}"; expected ${want}`);
        if(!text || text.querySelector('b')) fails.push(`#${id} at ${at}: needs plain text (.demo-text, no bold) under the tag`);
        else if(tag && tag.getBoundingClientRect().bottom > text.getBoundingClientRect().top + 1) fails.push(`#${id}: tag should sit above the text at ${W}px`);
      });
      set(was);
      // Each sits in a box of its own, filled with the page color rather than yellow (David: "bring
      // those back ... just not yellow"), so the yellow stays on the tag.
      const i = document.createElement('i'); i.style.cssText = 'position:absolute;background:var(--paper)'; box.parentElement.append(i);
      const want = getComputedStyle(i).backgroundColor; i.remove();
      const cs = getComputedStyle(box);
      if(cs.backgroundColor !== want || parseFloat(cs.paddingLeft) < 12 || parseFloat(cs.borderTopLeftRadius) < 8) fails.push(`#${id}: expected a box filled with the page color ${want} (background ${cs.backgroundColor}, padding ${cs.paddingLeft}, radius ${cs.borderTopLeftRadius}) at ${W}px`);
    });
    // The outlet demo's result follows the same pattern as the plug-in demo's (David): a page-color box,
    // a yellow tag with the short answer once something is picked, plain text under it.
    const ap = document.getElementById('apSum'), apChips = [...document.querySelectorAll('.ap-chips .chip')];
    if(!ap || !apChips.length) fails.push('outlet demo: result (#apSum) or appliance chips not found');
    else if(visible(ap)) {
      const was = apChips.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.id);
      const pick = ids => apChips.forEach(c => { if((c.getAttribute('aria-pressed') === 'true') !== ids.includes(c.dataset.id)) c.click(); });
      [[[], null], [['phones', 'lamps'], /^(About \d+½? (hours?|days)|Less than an hour) on the battery alone$/], [['ac', 'heater'], /^[\d,]+ W is more than the outlet’s [\d,]+ W$/]].forEach(([ids, want]) => {
        pick(ids);
        const tag = ap.querySelector(':scope > .note-tag'), text = ap.querySelector(':scope > .demo-text'), at = `[${ids.join(', ')}]`;
        const got = tag ? tag.textContent.trim() : null;
        if(want ? !want.test(got || '') : got !== null) fails.push(`#apSum with ${at}: tag reads ${got === null ? 'nothing' : `"${got}"`}; expected ${want || 'no tag'}`);
        if(!text || text.querySelector('b')) fails.push(`#apSum with ${at}: needs plain text (.demo-text, no bold)`);
      });
      pick(was);
      const i = document.createElement('i'); i.style.cssText = 'position:absolute;background:var(--paper)'; ap.parentElement.append(i);
      const want = getComputedStyle(i).backgroundColor; i.remove();
      const cs = getComputedStyle(ap);
      if(cs.backgroundColor !== want || parseFloat(cs.paddingLeft) < 12) fails.push(`#apSum: expected a box filled with the page color ${want} (background ${cs.backgroundColor}) at ${W}px`);
    }
    // Text in a demo's answer box runs the box's full width (David: no "awkward blank space").
    document.querySelectorAll('.demo-result').forEach(box => {
      const text = box.querySelector(':scope > .demo-text');
      if(!text || !visible(box)) return;
      const cs = getComputedStyle(box), inner = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if(Math.abs(text.getBoundingClientRect().width - inner) > 2) fails.push(`#${box.id}: text is ${Math.round(text.getBoundingClientRect().width)}px wide in a ${Math.round(inner)}px box at ${W}px; expected the box's full width`);
    });
    // These demo results are plain text, no box: the camera's heads its column, the roof's captions the photo.
    ['camSummary', 'roofSummary'].forEach(id => {
      const el = document.getElementById(id);
      if(!el) { fails.push(`demo result #${id} not found`); return; }
      const cs = getComputedStyle(el);
      if(!/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) || parseFloat(cs.paddingLeft) > 0) fails.push(`#${id} has a box (background ${cs.backgroundColor}, padding ${cs.paddingLeft}) at ${W}px; expected plain text`);
    });
  }

  // 28. Photo pairs sit 18px apart (David: half again the old 12px), and the year comparison's table draws no
  //     rule above its empty corner cell.
  document.querySelectorAll('.photo-pair').forEach(pp => {
    if(!visible(pp)) return;
    const gap = parseFloat(getComputedStyle(pp).columnGap);
    if(gap !== 18) fails.push(`photo pair in ${pp.closest('[id]')?.id || 'page'}: photos ${gap}px apart at ${W}px; expected 18`);
  });
  document.querySelectorAll('.yd-table thead th, .yd-table thead td').forEach(c => {
    if(visible(c) && parseFloat(getComputedStyle(c).borderTopWidth) > 0) fails.push(`year comparison: header cell "${c.textContent.trim()}" draws a rule above it`);
  });

  // 29. The paint list shows Toyota's paint names only, with no plain color word under them (David).
  document.querySelectorAll('#cpPaint .cp-name small').forEach(s => fails.push(`paint list: "${s.textContent.trim()}" sits under a paint name`));

  // 30. Where the who-has-it column sits at the card's right edge with a fill of its own, in light mode
  //     the fill is a grey clearly darker than the page (David: the old fill nearly matched the page).
  //     "Clearly" is a CIELAB difference of 4 or more (2.3 is the smallest a reader notices). Every pill
  //     in the column keeps the same distance from the fill, so no pill's shape fades into it. Dark mode
  //     keeps its old fill, 60% page and 40% card, and its old pills (David: "it was fine how it was").
  {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const cx = cv.getContext('2d', {willReadFrequently: true});
    const rgba = c => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data]; };
    const lab = ([r, g, b]) => {
      const [R, G, B] = [r, g, b].map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
      const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
      const [x, y, z] = [(.4124 * R + .3576 * G + .1805 * B) / .95047, .2126 * R + .7152 * G + .0722 * B, (.0193 * R + .1192 * G + .9505 * B) / 1.08883].map(f);
      return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    };
    const dE = (a, b) => Math.hypot(...lab(a).map((v, k) => v - lab(b)[k]));
    const page = rgba(getComputedStyle(document.body).backgroundColor);
    document.querySelectorAll('.feature > .avail').forEach(col => {
      if(!visible(col)) return;
      const bg = rgba(getComputedStyle(col).backgroundColor);
      if(bg[3] === 0) return;
      const id = col.closest('.feature')?.id || 'feature', d = dE(bg, page);
      if(lab(page)[0] < 50) {
        const card = rgba(getComputedStyle(col.closest('.feature')).backgroundColor), want = page.slice(0, 3).map((v, k) => .6 * v + .4 * card[k]);
        if(want.some((v, k) => Math.abs(v - bg[k]) > 1.5)) fails.push(`${id}: dark who-has-it fill rgb(${bg.slice(0, 3)}) at ${W}px; expected the old blend rgb(${want.map(Math.round)})`);
        col.querySelectorAll('.pill.no').forEach(pl => { if(getComputedStyle(pl).backgroundColor !== getComputedStyle(document.documentElement).getPropertyValue('--no-soft').trim() && rgba(getComputedStyle(pl).backgroundColor).join() !== rgba(getComputedStyle(document.documentElement).getPropertyValue('--no-soft')).join()) fails.push(`${id}: dark "Not offered" pill changed its fill at ${W}px`); });
        return;
      }
      if(lab(bg)[0] >= lab(page)[0] || d < 4) fails.push(`${id}: who-has-it fill rgb(${bg.slice(0, 3)}) is ${d.toFixed(1)} from the page rgb(${page.slice(0, 3)}) at ${W}px; needs a darker grey, 4 or more away`);
      col.querySelectorAll('.pill').forEach(pl => {
        const pb = rgba(getComputedStyle(pl).backgroundColor);
        if(pb[3] && dE(pb, bg) < 4) fails.push(`${id}: "${pl.textContent.trim()}" pill fill is ${dE(pb, bg).toFixed(1)} from the column's at ${W}px; needs 4`);
      });
    });
  }

  // 31. The gear selector card shows the two shifters side by side under its copy: the regular lever and
  //     the toggle switch, each a photo with a caption, so a reader sees the difference before a test drive.
  {
    const card = document.getElementById('f-shifter');
    const pair = card?.querySelector('.f-vis .photo-pair');
    const copy = card?.querySelector('.f-text');
    if(!card) fails.push('feature #f-shifter not found');
    else if(!pair || !visible(pair)) fails.push(`#f-shifter shows no photo pair at ${W}px`);
    else {
      const figs = [...pair.querySelectorAll(':scope > figure')];
      if(figs.length !== 2 || figs.some(f => !f.querySelector('img') || !f.querySelector('figcaption')?.textContent.trim()))
        fails.push(`#f-shifter: photo pair has ${figs.length} photos at ${W}px; expected 2, each with a caption`);
      if(card.dataset.layout !== 'below' || pair.getBoundingClientRect().top < copy.getBoundingClientRect().bottom - 1)
        fails.push(`#f-shifter: photo pair sits beside its copy (layout "${card.dataset.layout}") at ${W}px; expected below`);
      // Both photos keep the pair's 16:10 shape, so neither is cropped harder than the other.
      const sizes = figs.map(f => f.querySelector('img')?.getBoundingClientRect()).filter(Boolean).map(r => [Math.round(r.width), Math.round(r.height)]);
      if(sizes.some(([w, h]) => Math.abs(w / h - 1.6) > .02)) fails.push(`#f-shifter: photos are ${sizes.map(s => s.join('x')).join(' and ')}px at ${W}px; expected both 16:10`);
    }
  }

  // 32. The styling card has no photo of its own: David removed the Limited-on-the-beach rear shot. The four
  //     trims in white, front and back, still sit under the card.
  {
    const card = document.getElementById('f-style');
    if(card?.querySelector('.f-vis')) fails.push(`#f-style still shows a photo beside its copy at ${W}px`);
    if(card && card.dataset.layout !== 'text') fails.push(`#f-style: layout "${card.dataset.layout}"; expected text`);
    if(document.querySelector('img[src*="RHV_MY26_0016"]')) fails.push('the Limited beach photo (RHV_MY26_0016) is still on the page');
  }

  // 33. The spec list ends with the list itself: no "Good to know" note under it pointing back to the package
  //     prices (David cut it).
  document.querySelectorAll('#specs .tagged, #specs .spec-more').forEach(el => fails.push(`#specs: a note sits under the spec list ("${el.textContent.trim().slice(0, 40)}...")`));

  // 34. The page ends with the spec list: no dealer-questions section, no checklist, no print button, and no
  //     nav link to them (David cut them).
  if(document.querySelector('#dealer, #checklist, .print-btn')) fails.push('the dealer questions, checklist or print button is still on the page');
  if(document.querySelector('a[href="#dealer"]')) fails.push('a link to the dealer questions is still on the page');
  if(document.querySelector('main > section:last-of-type')?.id !== 'specs') fails.push(`the last section is #${document.querySelector('main > section:last-of-type')?.id}; expected the spec list`);

  // 35. Spacing inside feature cards comes in three steps:
  //     tight    things that belong together: a caption under its photo or drawing, a toggle above what it
  //              controls, "Why it matters" under the description;
  //     part     separate parts of one demo: the camera diagram beside its list, each block of the plug-in
  //              calculator;
  //     section  the write-up to the picture or demo under it, and a demo to the photo row under it.
  //     David tried 16 / 40 / 64 on every card and liked it only on the 360° camera card, which keeps it.
  //     Every other card takes about a third of that, rounded up to 8px steps: 8 / 16 / 24. The card's
  //     padding is not part of the scale: on every card the last row ends 40px above the card's bottom.
  {
    const near = (a, b) => Math.abs(a - b) <= 1;
    const R = el => el.getBoundingClientRect();
    const PAD = 40;
    const scale = card => card.id === 'f-cam360' ? { tight: 16, part: 40, section: 64 } : { tight: 8, part: 16, section: 24 };
    const where = el => `${el.closest('.feature')?.id || 'feature'} ${el.className || el.tagName.toLowerCase()}`.trim();
    const gap = (above, below, want, what) => { const g = R(below).top - R(above).bottom; if(!near(g, want)) fails.push(`${what}: ${Math.round(g)}px at ${W}px; expected ${want}`); };
    document.querySelectorAll('.feature').forEach(card => {
      if(!visible(card)) return;
      const sp = scale(card), copy = card.querySelector(':scope > .f-text');
      // Section steps: whatever sits under the write-up starts one section step below it (or below the who-has-it list on a phone).
      card.querySelectorAll(':scope > .f-vis, :scope > .f-below, :scope > .trio').forEach(el => {
        if(!visible(el) || R(el).top < R(copy).bottom - 1) return; // beside the copy, not under it
        const mt = parseFloat(getComputedStyle(el).marginTop);
        if(mt !== sp.section) fails.push(`${where(el)}: starts ${mt}px under the card's write-up at ${W}px; expected ${sp.section}`);
      });
      // Padding: the card's last row ends 40px above the card's bottom edge.
      const last = [...card.children].filter(visible).pop();
      if(last && !last.classList.contains('avail') && !near(R(card).bottom - R(last).bottom, PAD)) fails.push(`${where(last)}: ends ${Math.round(R(card).bottom - R(last).bottom)}px above the card's bottom at ${W}px; expected ${PAD}`);
      // Tight steps.
      card.querySelectorAll('figcaption, .demo-cap, .demo-cols .cap').forEach(c => { const prev = c.previousElementSibling; if(visible(c) && prev && visible(prev)) gap(prev, c, sp.tight, `${where(c)} under its picture`); });
      card.querySelectorAll('.f-text .why').forEach(w => { const prev = w.previousElementSibling; if(visible(w) && prev) gap(prev, w, sp.tight, `${where(w)} under the description`); });
      card.querySelectorAll('.cam-seg').forEach(t => { const next = t.nextElementSibling; if(visible(t) && next) gap(t, next, sp.tight, `${where(t)} above what it controls`); });
      // The plug-in calculator: each block sits one part step from the rule above it, and the rule one part step below what came before.
      card.querySelectorAll('.ev-block').forEach(b => {
        if(!visible(b)) return;
        const prev = b.previousElementSibling, first = [...b.children].find(visible);
        if(prev) gap(prev, b, sp.part, `${where(b)}: rule under the part above`);
        if(first && !near(R(first).top - R(b).top - 1, sp.part)) fails.push(`${where(b)}: first line ${Math.round(R(first).top - R(b).top - 1)}px under its rule at ${W}px; expected ${sp.part}`);
      });
    });
    // The camera card: diagram and list one part step apart, the photo pair one section step under the demo.
    const cam = document.getElementById('f-cam360'), camSp = cam && scale(cam);
    const cols = cam && [...cam.querySelectorAll('.demo-cols > *')], pair = cam && cam.querySelector('.demo > .photo-pair');
    if(cols && cols.length === 2 && visible(cols[0])) {
      const [a, b] = cols.map(R), side = b.top < a.bottom - 1, g = side ? b.left - a.right : b.top - a.bottom;
      if(!near(g, camSp.part)) fails.push(`f-cam360: diagram and camera list ${Math.round(g)}px apart at ${W}px; expected ${camSp.part}`);
    }
    if(pair && visible(pair)) gap(cam.querySelector('.demo-cols'), pair, camSp.section, 'f-cam360: photo pair under the demo');
  }

  // 36. A photo's caption runs the full width of its photo (David: the camera pair's caption wrapped well
  //     short of the image). The caption box matches the photo, and where the caption wraps, its first line
  //     is full: the next line's first word would not have fit on it.
  document.querySelectorAll('figure').forEach(fig => {
    const img = fig.querySelector('img'), cap = fig.querySelector(':scope > figcaption');
    if(!img || !cap || !visible(cap)) return;
    const iw = img.getBoundingClientRect().width, cw = cap.getBoundingClientRect().width;
    const what = `${fig.closest('.feature, section')?.id || 'page'} caption "${cap.textContent.trim().slice(0, 40)}"`;
    if(Math.abs(cw - iw) > 1) { fails.push(`${what} is ${Math.round(cw)}px wide under a ${Math.round(iw)}px photo at ${W}px`); return; }
    const text = [...cap.childNodes].filter(n => n.nodeType === 3).map(n => n).pop();
    if(!text || cap.childNodes.length !== 1) return; // plain-text captions only
    const s = text.data, rg = document.createRange(), at = i => { rg.setStart(text, i); rg.setEnd(text, i + 1); return rg.getBoundingClientRect(); };
    const top = at(0).top;
    let i = 0; while(i < s.length && (s[i] === ' ' || at(i).top < top + 2)) i++;
    if(i >= s.length) return; // one line
    let j = i; while(j < s.length && s[j] !== ' ') j++;
    rg.setStart(text, 0); rg.setEnd(text, i);
    const first = Math.max(...[...rg.getClientRects()].filter(r => r.top < top + 2).map(r => r.right)) - cap.getBoundingClientRect().left;
    rg.setStart(text, i); rg.setEnd(text, j); const word = rg.getBoundingClientRect().width;
    if(first + word + 6 < cw) fails.push(`${what}: first line stops at ${Math.round(first)}px of ${Math.round(cw)}px at ${W}px, though "${s.slice(i, j)}" would fit`);
  });


  // 37. Images take up the full width of the card where it's the only image (David). A card whose only
  //     picture is one photo (no demo, drawing, second photo or row of trims) shows it under the copy, with
  //     layout below, as wide as the card's content box: the card's width less its side padding. The photo
  //     keeps its own shape, with no CSS crop: the file's shape once it has loaded, and before that the shape
  //     its width and height attributes give it, so the page doesn't jump when the file arrives.
  document.querySelectorAll('.feature').forEach(card => {
    if(!visible(card)) return;
    const imgs = [...card.querySelectorAll('img')];
    if(imgs.length !== 1 || card.querySelector('.f-vis svg:not(.zi svg), .f-vis canvas, .demo, .mini-demo, .f-below, .trio')) return;
    const img = imgs[0], copy = card.querySelector(':scope > .f-text'), cs = getComputedStyle(card);
    const r = img.getBoundingClientRect(), c = card.getBoundingClientRect(), box = c.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if(card.dataset.layout !== 'below') fails.push(`${card.id}: its only photo has layout "${card.dataset.layout}"; expected below`);
    if(r.top < copy.getBoundingClientRect().bottom - 1) fails.push(`${card.id}: its only photo sits beside the copy at ${W}px; expected under it`);
    if(Math.abs(r.width - box) > 1) fails.push(`${card.id}: its only photo is ${Math.round(r.width)}px wide at ${W}px; expected the card's ${Math.round(box)}px content width`);
    const aw = +img.getAttribute('width'), ah = +img.getAttribute('height');
    if(img.complete && img.naturalWidth){
      if(Math.abs(r.height - r.width * img.naturalHeight / img.naturalWidth) > 1)
        fails.push(`${card.id}: its only photo shows at ${Math.round(r.width)}x${Math.round(r.height)} at ${W}px; its own shape is ${img.naturalWidth}x${img.naturalHeight}`);
    }
    else if(!aw || !ah) fails.push(`${card.id}: its only photo has no width and height at ${W}px, so nothing holds its shape before it loads`);
    else if(Math.abs(r.height - r.width * ah / aw) > 1)
      fails.push(`${card.id}: its only photo holds ${Math.round(r.width)}x${Math.round(r.height)} at ${W}px before it loads; its width and height say ${aw}x${ah}`);
  });


  // 38. "Toyota calls it" reads as one sentence: Toyota's name follows the label on the same line and wraps
  //     like text, each line keeping its own rounded box (David: an inline effect, not a block).
  document.querySelectorAll('.f-text .aka').forEach(p => {
    const name = p.querySelector('i'); if(!name || !visible(p)) return;
    const cs = getComputedStyle(name), what = `${p.closest('.feature')?.id} "Toyota calls it"`;
    if(cs.display !== 'inline') fails.push(`${what}: Toyota's name is display:${cs.display} at ${W}px; expected inline`);
    if((cs.boxDecorationBreak || cs.webkitBoxDecorationBreak) !== 'clone') fails.push(`${what}: wrapped lines of Toyota's name don't each get their own box at ${W}px`);
    const rg = document.createRange(); rg.selectNodeContents(p.firstChild); const label = rg.getClientRects()[0], first = name.getClientRects()[0];
    if(label && first && Math.abs(first.top - label.top) > 4) fails.push(`${what}: Toyota's name starts on a new line at ${W}px, under its label`);
  });

  // 39. The drawings (head-up display, screen sizes, wheels) span the card like a lone photo (David picked
  //     this over a drawing in the column): their panel is the card's content width, and each drawing is a
  //     wide shape, at least twice as wide as tall, so it fills that width without towering. The HUD shows
  //     the navigation arrow its copy mentions. The screens overlap, the smaller inside the larger from a shared
  //     bottom-left corner and to scale (David: the overlap is the point), with their labels beside the drawing
  //     from 641px, so the drawing stays under 40% of the panel's width in height.
  ['hud', 'screen', 'wheels'].forEach(id => {
    const card = document.getElementById('f-' + id); if(!card || !visible(card)) return;
    const vis = card.querySelector(':scope > .f-vis'), panel = vis?.firstElementChild, svg = vis?.querySelector('svg[role="img"]');
    if(!panel || !svg) { fails.push(`#f-${id}: no drawing`); return; }
    const cs = getComputedStyle(card), c = card.getBoundingClientRect(), box = c.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const p = panel.getBoundingClientRect(), s = svg.getBoundingClientRect();
    if(Math.abs(p.width - box) > 1) fails.push(`#f-${id}: drawing panel is ${Math.round(p.width)}px wide at ${W}px; expected the card's ${Math.round(box)}px content width`);
    if(id !== 'screen' && s.width < 2 * s.height) fails.push(`#f-${id}: drawing is ${Math.round(s.width)}x${Math.round(s.height)} at ${W}px; expected at least twice as wide as tall`);
    if(id === 'hud') {
      if(!svg.querySelector('.nav-arrow')) fails.push('#f-hud: the drawing has no navigation arrow, though the copy mentions one');
      // David: the speed differs from the limit, so the two readings can't be mistaken for one; and a caption
      // says the shaded box behind them is only there for the drawing.
      const sp = svg.querySelector('.hud-speed')?.textContent.trim(), lim = svg.querySelector('.hud-limit')?.textContent.trim();
      if(!sp || !lim || sp === lim) fails.push(`#f-hud: the speed (${sp}) and the speed limit (${lim}) should both show and differ`);
      if(!/shaded box/i.test(panel.querySelector('.cap')?.textContent || '')) fails.push('#f-hud: no caption saying the shaded box is only for the drawing');
      // A windshield seen from the driver's seat, like Toyota's own HUD photo (David): the glass fills the
      // view, cut by the left pillar and the long flat dashboard, with the top of the steering wheel; the
      // display floats in front of the driver, over the wheel.
      ['.hud-wheel', '.hud-pillar'].forEach(k => { if(!svg.querySelector(k)) fails.push(`#f-hud: the windshield view has no ${k.slice(5)}`); });
      const sb = svg.querySelector('.hud-speed')?.getBoundingClientRect(), wb = svg.querySelector('.hud-wheel')?.getBoundingClientRect();
      if(sb && wb && (sb.left + sb.width / 2 < wb.left || sb.left + sb.width / 2 > wb.right)) fails.push(`#f-hud: the display isn't over the steering wheel at ${W}px`);
    }
    if(id === 'screen') {
      const [a, b] = [...svg.querySelectorAll('.scr')].map(r => r.getBoundingClientRect()).sort((x, y) => x.width - y.width); // smaller first
      if(!a || !b) { fails.push('#f-screen: expected two screens (.scr) in the drawing'); return; }
      if(Math.abs(a.left - b.left) > 1 || Math.abs(a.bottom - b.bottom) > 1 || a.right > b.right || a.top < b.top) fails.push(`#f-screen: the smaller screen doesn't sit inside the larger from their shared bottom-left corner at ${W}px`);
      if(W >= 641 && s.height > 0.4 * p.width) fails.push(`#f-screen: drawing is ${Math.round(s.height)}px tall in a ${Math.round(p.width)}px panel at ${W}px; at most 40% of the width (labels beside it)`);
      if(Math.abs(b.width / a.width - 12.9 / 10.5) > 0.01 || Math.abs(b.height / a.height - 12.9 / 10.5) > 0.01) fails.push(`#f-screen: the screens aren't to scale (12.9 to 10.5) at ${W}px`);
    }
  });
  return fails;
};
