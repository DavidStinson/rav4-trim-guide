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
    // The column runs to the panel's bottom, or, above a full-width demo, to a rule that crosses the
    // whole panel, so it never stops partway down with a loose corner.
    const short = lists.filter(a => {
      const f = a.closest('.feature'), p = f.getBoundingClientRect(), b = a.getBoundingClientRect().bottom;
      if(Math.abs(p.bottom - b) <= 1) return false;
      const v = f.querySelector(':scope > .f-vis'), r = v && v.getBoundingClientRect();
      return !(r && Math.abs(r.top - b) <= 1 && r.width >= p.width - 2 && parseFloat(getComputedStyle(v).borderTopWidth) >= 1);
    }).map(a => a.closest('.feature').id);
    if(short.length) fails.push(`feature availability column stops partway down ${short.length} panels (${short.slice(0, 4).join(', ')}): run it to the bottom or to a full-width rule`);
  }

  // 10. Package ladders read at a glance where all four sit side by side: a package name takes at most
  //     two lines, its "with the ones above" price at most two, and the card names its base price once
  //     (in the "No packages" row and the running total, not again under the heading).
  if(W >= 1280){
    const lines = el => { const lh = parseFloat(getComputedStyle(el).lineHeight); return Math.round(el.getBoundingClientRect().height / lh); };
    const long = [...document.querySelectorAll('#pkGrid .rung .pn, #pkGrid .rung .req')].filter(el => lines(el) > 2).map(el => `"${el.textContent.trim()}" (${lines(el)} lines)`);
    if(long.length) fails.push(`package ladder text wraps past two lines: ${long.slice(0, 3).join('; ')}`);
    if(document.querySelector('#pkGrid .pk-head p')) fails.push('package cards repeat the base price under the heading');
  }
  // At any width, a package's "needs the ones above" note breaks only where it is written to (what it needs,
  // then what that costs), never leaving a word alone on a line.
  const ragged = [...document.querySelectorAll('#pkGrid .rung .req')].filter(el => {
    const lh = parseFloat(getComputedStyle(el).lineHeight), n = Math.round(el.getBoundingClientRect().height / lh);
    return el.getClientRects().length && n !== el.querySelectorAll('br').length + 1;
  }).map(el => `"${el.textContent.trim()}"`);
  if(ragged.length) fails.push(`package note wraps where it isn't written to break at ${W}px: ${ragged.slice(0, 2).join('; ')}`);

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
  //     its trim and price, and one prompt at body size saying what to do. The legend explains the cards'
  //     marks, so it appears with them once a priority is picked, between the chips and the cards. An
  //     unpicked chip's outline stands out from what's behind it (3:1, so it reads as a button).
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
  const prompt = [...document.querySelectorAll('.picker p')].filter(el => visible(el) && /pick|tap/i.test(say(el)));
  const bodyPx = parseFloat(getComputedStyle(document.body).fontSize);
  if(prompt.length !== 1 || parseFloat(getComputedStyle(prompt[0]).fontSize) < bodyPx) fails.push(`priority picker's empty prompt: ${prompt.length} found${prompt[0] ? `, ${getComputedStyle(prompt[0]).fontSize}` : ''}; expected one at body size (${bodyPx}px)`);
  const rgb = c => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number).map(v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  const lum = c => { const [r, g, b] = rgb(c); return .2126 * r + .7152 * g + .0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
  const c0 = pickChips[0];
  if(c0){
    const cs = getComputedStyle(c0), behind = getComputedStyle(c0.closest('.picker')).backgroundColor;
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
    c0.click();
  }
  wasPicked.forEach(c => c.click());


  // 13. Step-up items: one with a write-up further down is a link that looks like one (a visible "more"
  //     cue at its end); one without a write-up is plain text, never a link that jumps somewhere unrelated.
  const stepLinks = [...document.querySelectorAll('.steps .gain a')];
  const nowhere = stepLinks.filter(a => { const h = a.getAttribute('href') || ''; return !h.startsWith('#f-') || !document.querySelector(h); });
  if(nowhere.length) fails.push(`${nowhere.length} step-up item(s) link to no feature write-up (e.g. "${(nowhere[0].querySelector('b')?.textContent || '').trim()}" -> ${nowhere[0].getAttribute('href')})`);
  const noCue = stepLinks.filter(a => { const c = a.querySelector('.go'); return !c || !visible(c) || c.getBoundingClientRect().right < a.getBoundingClientRect().right - 40; });
  if(noCue.length) fails.push(`${noCue.length} step-up links show no "more" cue at their end, so they don't look tappable`);
  const lede = document.querySelector('#steps .lede, .steps')?.closest('section')?.querySelector('.lede');
  if(lede && /tap any item/i.test(lede.textContent)) fails.push('step-ups intro says "Tap any item" but only some items have more to read');

  return fails;
};
