// Layout regression checks for rav4-site. Run in the page (for example through the browser's
// console or a test driver) after it loads: `await import('/tools/layout-check.js')` then
// `layoutCheck()`. Returns a list of failures; an empty list means every check passed.
// Checks are tied to viewport width, so run it at a phone width, a laptop width and a wide desktop.
window.layoutCheck = function layoutCheck(){
  const fails = [];
  const W = innerWidth;
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

  // 15. Each feature panel declares its layout in FEATURES (data.js): text (copy alone), beside (a small
  //     picture beside the copy) or below (a demo or photo set under the copy and the column).
  //     A beside picture moves under the copy when the copy would be narrower than 520px. A picture that
  //     sits under the copy fills the space under it: a below visual spans the panel's content width,
  //     a beside one that moved down spans the copy's width.
  document.querySelectorAll('.feature').forEach(f => {
    const L = f.dataset.layout, v = f.querySelector(':scope > .f-vis'), t = f.querySelector(':scope > .f-text');
    if(!['text', 'beside', 'below'].includes(L)) { fails.push(`${f.id}: layout "${L}" is not text, beside or below (set layout: next to visual: in FEATURES)`); return; }
    if((L === 'text') !== !v) { fails.push(`${f.id}: layout ${L} ${v ? 'has a picture' : 'has no picture'}`); return; }
    if(!v) return;
    const cs = getComputedStyle(f), p = f.getBoundingClientRect(), r = v.getBoundingClientRect(), c = t.getBoundingClientRect();
    const left = p.left + parseFloat(cs.paddingLeft), right = p.right - parseFloat(cs.paddingRight);
    const under = r.top >= c.bottom - 1;
    if(L === 'beside' && !under && c.width < 519) fails.push(`${f.id} at ${W}px: copy beside its picture is ${Math.round(c.width)}px wide; move the picture under the copy below 520px`);
    if(L === 'below' && (!under || Math.abs(r.left - left) > 2 || Math.abs(r.right - right) > 2)) fails.push(`${f.id} at ${W}px: the demo doesn't span the panel under the copy (${Math.round(r.left - left)}px from the left, ${Math.round(right - r.right)}px from the right)`);
    if(L === 'beside' && under && (Math.abs(r.left - c.left) > 2 || Math.abs(r.right - c.right) > 2)) fails.push(`${f.id} at ${W}px: the picture under the copy isn't the copy's width`);
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
  //     not again in the section intro (REVIEW-DECISIONS.md, r08 rework).
  {
    const sec = document.getElementById('packages'), grid = document.getElementById('pkGrid');
    const said = [...sec.querySelectorAll('p')].filter(p => /every package above it/.test(p.textContent));
    const stack = sec.querySelector('.pk-stack'), slider = grid && grid.closest('[data-sl]');
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
  //     of the lead (David: "8 above / 24 below"): 8px from heading to lead and 24px from the header to
  //     the content, at every width.
  {
    const [head, after] = [8, 24];
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

  return fails;
};
