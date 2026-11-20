// Builds and runs the page from data.js and visuals.js: helpers, photos, theme, sliders, the trim picker,
// packages, color picker, year switch, feature list, spec table, checklist, photo zoom and section nav.
/* ===================== HELPERS ===================== */
const $ = (s,el=document)=>el.querySelector(s);
const ICON = {
  std:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  opt:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  no:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  nl:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.6 5.8a2.4 2.4 0 1 1 3.4 2.2c-.7.3-1 .8-1 1.5v.4M8 12.4v.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};
const WORD = {std:'Included', opt:'Optional', no:'Not offered', nl:'Not listed'};
const pill = (s,txt)=>`<span class="pill ${s}">${ICON[s]}${txt||WORD[s]}</span>`;
const esc = s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ===================== PHOTOS ===================== */
// Every photo has a page copy, a 2x copy for sharp screens and a full-size copy for the expanded view.
// tools/build_photos.py makes them and lists their widths in photos.js. `sizes` says how wide the photo
// shows, so the browser picks the copy it needs; "auto" lets lazy-loaded photos use their real width.
const photoSet = name=>{
  const p = PHOTOS[name];
  if(!p){ console.error(`photo "${name}" isn't in photos.js; run tools/build_photos.py`); return {}; }
  return {srcset:`img/${name}.webp ${p[0]}w, img/${name}@2x.webp ${p[1]}w`, src:`img/${name}.webp`, 'data-full':`img/full/${name}.webp`};
};
const photoAttrs = (name, sizes)=>Object.entries({...photoSet(name), sizes}).map(([k,v])=>`${k}="${v}"`).join(' ');
const setPhoto = (img, name)=>Object.entries(photoSet(name)).forEach(([k,v])=>img.setAttribute(k,v));
document.querySelectorAll('img[data-photo]').forEach(img=>setPhoto(img, img.dataset.photo));
const featById = Object.fromEntries(FEATURES.map(f=>[f.id,f]));
// Every per-trim list must have one entry per trim; say which one doesn't instead of failing mid-render.
[...FEATURES.map(f=>['feature '+f.id,f.trims]), ...Object.entries(SPECIAL).map(([k,v])=>['priority '+k,v.trims])]
  .forEach(([what,t])=>{
    if(t.length!==TRIMS.length) console.error(`${what} lists ${t.length} trims; expected ${TRIMS.length}.`);
    t.forEach(([st])=>{ if(!['std','opt','no'].includes(st)) console.error(`${what} has status "${st}"; use std, opt or no.`); });
  });
const store = {
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
};

/* ===================== THEME ===================== */
(function(){
  const saved = store.get('rav4-theme',null);
  if(saved) document.documentElement.dataset.theme = saved;
  $('#themeBtn').addEventListener('click',()=>{
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme==='dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark?'light':'dark';
    document.documentElement.dataset.theme = next; store.set('rav4-theme',next);
  });
})();

/* ===================== SIDE-ARROW SLIDERS =====================
   Each [data-sl] block shows as many trims as fit side by side, chosen from the slider's own width.
   data-sl-col sets a minimum card width for cards whose content needs more room (the package
   ladders and priority cards), so they show fewer at a time until four fit at that width.
   A hidden trim peeks in at the edge under an arrow button named for it. On a phone, where one
   card shows at a time, there is no peek: a row of four trim tabs above the cards picks the trim.
   All sliders share one offset, so the trim columns line up from section to section, and a trim
   picked in one slider shows in all of them. */
const VIEW = (function(){
  // Widest first: cards shown, how much of a hidden neighbor peeks in, and the gap between cards (px).
  const LAYOUTS = [
    {min:1060, shown:4, peek:0,  gap:20},
    {min:836,  shown:3, peek:48, gap:20},
    {min:568,  shown:2, peek:40, gap:16},
    {min:0,    shown:1, peek:28, gap:10},
  ];
  const ARROW = d=>`<span class="sl-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="${d<0?'M12.5 4 6.5 10l6 6':'M7.5 4l6 6-6 6'}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  let off = 0;
  const maxOf = new Map();
  const sliders = [...document.querySelectorAll('[data-sl]')];
  // A slider that can't scroll as far as the shared offset shows its last position; moving starts from there.
  const move = (sl,dir)=>{ const max=maxOf.get(sl)||0; off=Math.min(Math.max(Math.min(off,max)+dir,0),max); apply(); };
  sliders.forEach(sl=>{
    sl.insertAdjacentHTML('afterbegin', `<div class="sl-tabs" role="group" aria-label="Show one trim" hidden></div>`);
    sl.insertAdjacentHTML('beforeend',
      `<button type="button" class="sl-btn sl-prev" data-dir="-1"></button><button type="button" class="sl-btn sl-next" data-dir="1"></button>`);
    sl.querySelector('.sl-tabs').addEventListener('click',e=>{
      const b=e.target.closest('button'); if(!b) return;
      off=+b.dataset.i; apply();
    });
    sl.addEventListener('click',e=>{
      const b=e.target.closest('.sl-btn'); if(!b) return;
      move(sl, +b.dataset.dir);
      // The pressed button disappears at the end of the row; keep focus on this slider.
      const other = sl.querySelector(b.classList.contains('sl-next')?'.sl-prev':'.sl-next');
      if(b.hidden && other && !other.hidden) other.focus({preventScroll:true});
    });
    // Swipe sideways on touch screens. A mostly vertical drag stays a page scroll.
    let x0=null, y0=0;
    sl.addEventListener('touchstart',e=>{x0=e.touches[0].clientX; y0=e.touches[0].clientY},{passive:true});
    sl.addEventListener('touchend',e=>{
      if(x0==null) return;
      const dx=e.changedTouches[0].clientX-x0, dy=e.changedTouches[0].clientY-y0; x0=null;
      if(Math.abs(dx)>50 && Math.abs(dx)>1.5*Math.abs(dy)) move(sl, dx<0?1:-1);
    },{passive:true});
  });
  function label(btn, i, dir, width){
    const t = TRIMS[i], item = btn.parentElement.querySelector('.sl-track').children[i];
    const flag = item && item.dataset.flag ? `<small>${esc(item.dataset.flag)}</small>` : '';
    btn.hidden = false;
    btn.style.width = width+'px';
    btn.classList.toggle('slim', width<72);
    btn.innerHTML = `<span class="sl-in">${ARROW(dir)}<span>${esc(t.name)}</span>${flag}</span>`;
    btn.setAttribute('aria-label', `Show the ${t.name}${flag?' ('+item.dataset.flag+')':''}`);
  }
  function apply(){
    sliders.forEach(sl=>{
      const track=sl.querySelector('.sl-track'), items=[...track.children], n=items.length, w=sl.clientWidth;
      const prev=sl.querySelector('.sl-prev'), next=sl.querySelector('.sl-next');
      if(!n || !w){ prev.hidden=next.hidden=true; maxOf.set(sl,0); return; }
      const minCol=+sl.dataset.slCol||0;
      // The same card width the layout below gives: with every card shown there is no peek and no edge gap.
      const fits=l=>(l.shown>=n ? (w-(n-1)*l.gap)/n : (w-2*l.peek-(l.shown+1)*l.gap)/l.shown)>=minCol || l.shown===1;
      const L=LAYOUTS.find(l=>w>=l.min && fits(l)), shown=Math.min(L.shown,n), max=n-shown, o=Math.min(off,max);
      maxOf.set(sl,max);
      const tabs=sl.querySelector('.sl-tabs'), tabbed = shown===1 && n>1;
      sl.classList.toggle('tabbed', tabbed); tabs.hidden = !tabbed;
      if(tabbed){
        // One card at a time, full width, picked by name.
        if(tabs.children.length!==n) tabs.innerHTML = items.map((el,i)=>`<button type="button" data-i="${i}"><i style="background:${TRIMS[i].color}" aria-hidden="true"></i>${esc(TRIMS[i].name)}</button>`).join('');
        // A card's flag ("Best match") shows on its tab too, since only one card is on screen at a time.
        [...tabs.children].forEach((b,i)=>{
          b.setAttribute('aria-pressed', i===o);
          const f = items[i].dataset.flag || '', s = b.querySelector('.tab-flag');
          if(f && !s) b.insertAdjacentHTML('beforeend', `<small class="tab-flag">${esc(f)}</small>`);
          else if(s && !f) s.remove();
          else if(s) s.textContent = f;
        });
        sl.style.setProperty('--col', w+'px'); sl.style.setProperty('--gap', L.gap+'px');
        track.style.transform = o ? `translateX(${-o*(w+L.gap)}px)` : '';
        items.forEach((el,i)=>{ el.inert=i!==o; el.classList.toggle('sl-out', i!==o); });
        prev.hidden = next.hidden = true;
        return;
      }
      // When something is hidden, room is kept for a peek on both sides, so a middle card has a
      // neighbor showing at each edge. At either end, the one hidden side shows a wider slice.
      const col = max ? (w - 2*L.peek - (shown+1)*L.gap)/shown : (w - (n-1)*L.gap)/n;
      const step = col+L.gap, edge = 2*L.peek+L.gap;
      const x = o===0 ? 0 : o===max ? edge + L.gap - max*step : L.peek + L.gap - o*step;
      sl.style.setProperty('--col', col+'px'); sl.style.setProperty('--gap', L.gap+'px');
      track.style.transform = x ? `translateX(${x}px)` : '';
      items.forEach((el,i)=>{ const out = i<o || i>=o+shown; el.inert=out; el.classList.toggle('sl-out',out); });
      // Each arrow covers the slice of its hidden neighbor, plus the 8px the button hangs past the edge.
      if(o>0) label(prev, o-1, -1, (o===max?edge:L.peek)+8); else prev.hidden=true;
      if(o<max) label(next, o+shown, 1, (o===0?edge:L.peek)+8); else next.hidden=true;
    });
  }
  let raf=0;
  const ro = new ResizeObserver(()=>{ cancelAnimationFrame(raf); raf=requestAnimationFrame(apply); });
  sliders.forEach(sl=>ro.observe(sl));
  return {refresh:apply};
})();

/* ===================== PICKER ===================== */
(function(){
  const chips = $('#chips'), scores = $('#scores'), legend = $('#pickLegend');
  let picked = new Set(store.get('rav4-picks',[]));
  chips.innerHTML = PRIORITIES.map(p=>`<button type="button" class="chip" data-id="${p.id}" aria-pressed="${picked.has(p.id)}"><span class="tick" aria-hidden="true">${TICK}</span>${esc(p.label)}</button>`).join('');
  chips.addEventListener('click',e=>{
    const b=e.target.closest('.chip'); if(!b) return;
    const id=b.dataset.id; picked.has(id)?picked.delete(id):picked.add(id);
    b.setAttribute('aria-pressed',picked.has(id)); store.set('rav4-picks',[...picked]); render();
  });
  function rowsFor(p){
    if(p.special) return [{label:SPECIAL[p.special].label, trims:SPECIAL[p.special].trims}];
    return p.feats.map(id=>({label:featById[id].name, trims:featById[id].trims, id}));
  }
  function render(){
    const items = PRIORITIES.filter(p=>picked.has(p.id)).flatMap(rowsFor);
    // de-dupe features shared by two priorities
    const seen=new Set(); const rows=items.filter(r=>{const k=r.label; if(seen.has(k)) return false; seen.add(k); return true;});
    // Before a pick, the four cards show only each trim's name and price, so the picker never looks empty.
    legend.hidden = rows.length===0;
    const head = t=>`<h4><span style="color:${t.color}">${t.name}</span><span class="best-badge">Best match</span></h4><p class="score-price">${money(START[t.id])}</p>`;
    if(!rows.length){
      scores.innerHTML = TRIMS.map(t=>`<div class="score idle">${head(t)}</div>`).join('');
      VIEW.refresh(); return;
    }
    const pts = TRIMS.map((t,i)=>rows.reduce((a,r)=>a+(r.trims[i][0]==='std'?1:r.trims[i][0]==='opt'?.5:0),0));
    const max = Math.max(...pts);
    scores.innerHTML = TRIMS.map((t,i)=>{
      const std=rows.filter(r=>r.trims[i][0]==='std').length, opt=rows.filter(r=>r.trims[i][0]==='opt').length;
      const rank={std:0,opt:1,no:2};
      const sorted=[...rows].sort((a,b)=>rank[a.trims[i][0]]-rank[b.trims[i][0]]);
      const best=pts[i]===max&&max>0;
      return `<div class="score ${best?'best':''}" ${best?'data-flag="Best match"':''}>
        ${head(t)}
        <div class="meter" aria-hidden="true">${sorted.map(r=>`<i class="${r.trims[i][0]}"></i>`).join('')}</div>
        <p class="small" style="margin:0 0 10px"><b>${std} of ${rows.length}</b> included${opt?`, ${opt} more as an option`:''}</p>
        <ul>${sorted.map(r=>`<li>${pill(r.trims[i][0],{std:'Yes',opt:'Option',no:'No'}[r.trims[i][0]])}<span>${r.id?`<a href="#f-${r.id}">${esc(r.label)}</a>`:esc(r.label)}</span></li>`).join('')}</ul>
      </div>`;
    }).join('');
    VIEW.refresh();
  }
  render();
})();

/* ===================== PACKAGES ===================== */
// How far down each trim's package ladder you've picked (0 = no packages). The package cards set it
// and the color picker's total reads it, so both stay in step; it's saved between visits.
const PKG = (()=>{
  const saved = store.get('rav4-pk',{});
  const level = Object.fromEntries(TRIM_IDS.map(id=>{ const n = saved?.[id];
    return [id, Number.isInteger(n) ? Math.min(Math.max(n,0), PACKAGES[id].ladder.length) : 0]; }));
  const subs = [];
  return {
    level: id=>level[id],
    extra: id=>PACKAGES[id].ladder.slice(0,level[id]).reduce((a,k)=>a+k.price,0),
    set(id,n){ level[id] = n; store.set('rav4-pk',level); subs.forEach(f=>f(id)); },
    onChange: f=>subs.push(f),
  };
})();

// The three callouts above the package cards, worked out from the package prices.
(function(){
  const loaded = id=>PACKAGES[id].base + PACKAGES[id].ladder.reduce((a,k)=>a+k.price,0);
  const xse=loaded('xse'), ltd=PACKAGES.ltd.base, xle=loaded('xle'), xseBase=PACKAGES.xse.base, phv=loaded('phv'), top=PACKAGES.phv.ladder.at(-1);
  if(xse<=ltd || xle>=xseBase) console.error('The package callouts no longer match the prices; rewrite them.', {xse, ltd, xle, xseBase});
  $('#pkCallouts').innerHTML = `
      <p class="pk-callout"><b>A fully loaded XSE costs more than a Limited.</b> With every package, the XSE comes to ${money(xse)}, which is ${money(xse-ltd)} more than a Limited. The Limited has all the same features plus heated back seats, a second phone charger and a softer ride. At that point the XSE only makes sense if you prefer its sporty look.</p>
      <p class="pk-callout"><b>A fully loaded XLE Premium is still the cheapest.</b> With every package it comes to ${money(xle)}, which is ${money(xseBase-xle)} less than a base XSE. It gains the panoramic roof and the extra driver-assist features, but it can never get the 360° camera, cooled seats or the bigger screen.</p>
      <p class="pk-callout"><b>The Plug-in XSE’s top package costs more, and adds more.</b> Its ${money(top.price)} ${esc(top.name)} includes the head-up display and paddle shifters along with self-parking. Fully loaded, the Plug-in XSE comes to ${money(phv)}.</p>`;
})();
(function(){
  const grid = $('#pkGrid');
  grid.innerHTML = TRIMS.map(t=>{
    const p = PACKAGES[t.id];
    const rungs = p.ladder.map((k,i)=>{
      const before = p.ladder.slice(0,i);
      // What this package really costs: it can only be added with every package above it.
      const n = before.length, word = c => ['one','two','three','four','five'][c-1] || c;
      const req = n ? `<b>${money(before.reduce((a,b)=>a+b.price,0)+k.price)}</b> with the ${word(n)} above` : '';
      return `<li class="rung" data-i="${i+1}"><button type="button" aria-pressed="false">
        <span class="knob" aria-hidden="true"></span><span class="pn">${esc(k.name)}</span><span class="pp">+${money(k.price)}</span>
        <span class="pc">${k.gets.map(([,txt])=>esc(txt)).join(', ')}</span>
        ${req?`<span class="req"><span>${req}</span></span>`:''}</button></li>`;
    }).join('');
    return `<article class="pk" style="--c:${t.color}" data-t="${t.id}">
      <div class="pk-head"><h3>${t.name}</h3></div>
      <ol class="ladder" aria-label="${t.name} packages, in the order Toyota requires them">
        <li class="rung base on" data-i="0"><button type="button" aria-pressed="true"><span class="knob" aria-hidden="true"></span><span class="pn">No packages</span><span class="pp">${money(p.base)}</span><span class="pc">Everything listed as included for the ${t.name}.</span></button></li>
        ${rungs}
      </ol>
      <div class="pk-total" aria-live="polite"></div>
    </article>`;
  }).join('');
  function paint(tid){
    const card = grid.querySelector(`[data-t="${tid}"]`), p = PACKAGES[tid], n = PKG.level(tid);
    card.querySelectorAll('.rung').forEach(r=>{
      const on = +r.dataset.i <= n; r.classList.toggle('on',on);
      r.classList.toggle('next-on', +r.dataset.i < n);
      r.querySelector('button').setAttribute('aria-pressed', +r.dataset.i===n);
    });
    const what = n===0 ? 'with no packages' : n===p.ladder.length ? 'with every package' : `with ${n} package${n>1?'s':''}`;
    card.querySelector('.pk-total').innerHTML = `<span class="small">${TRIMS.find(t=>t.id===tid).name} ${what}</span>
      <span class="big">${money(p.base+PKG.extra(tid))}</span>`;
  }
  grid.addEventListener('click',e=>{
    const b =e.target.closest('.rung button'); if(!b) return;
    const tid = b.closest('.pk').dataset.t; const i = +b.closest('.rung').dataset.i;
    PKG.set(tid, (PKG.level(tid)===i && i>0) ? i-1 : i);
  });
  PKG.onChange(paint);
  TRIMS.forEach(t=>paint(t.id));
  VIEW.refresh();
})();

/* ===================== PAINT AND INTERIOR COLORS ===================== */
// Pick a model and only its paints and seat colors show. Switching models keeps the same color where
// the new model has it (or its two-tone version), otherwise falls back to the model's first included
// paint and says what changed. The total adds the packages picked for that model in the section above.
(function(){
  const box = $('#cpBox');
  const trimOf = id=>TRIMS.find(t=>t.id===id);
  const seatOf = (t,code)=>SEATS[COLORS[t].int[code][0]];
  const seatFam = (t,code)=>{ const k = COLORS[t].int[code][0]; return SEATS[k].fam || k; };
  const firstPaint = t=>Object.keys(COLORS[t].paint).find(c=>COLORS[t].paint[c]===0);
  const priceTxt = n=>n ? '+'+money(n) : 'Included';
  const swatch = hex=>hex.length>1 ? `linear-gradient(${hex[0]} 0 38%, ${hex[1]} 38%)` : hex[0];

  // Restore the last pick only if it still names a real combination.
  const saved = store.get('rav4-colors',{});
  const ok = s=>s && COLORS[s.t] && s.paint in COLORS[s.t].paint && s.int in COLORS[s.t].int;
  const st = ok(saved) ? {t:saved.t, paint:saved.paint, int:saved.int} : {t:'xle', paint:firstPaint('xle'), int:Object.keys(COLORS.xle.int)[0]};
  // The note explains a model switch. Picking a paint or seat afterwards hides it but keeps its
  // space, so the picker doesn't jump.
  let note = '', noteSeen = false;

  box.innerHTML = `
    <div class="cp-top">
      <div class="seg" role="group" aria-label="Model" id="cpModel">
        ${TRIMS.map(t=>`<button type="button" data-t="${t.id}" aria-pressed="false">${t.name}</button>`).join('')}
      </div>
      <p class="cp-note" id="cpNote" aria-live="polite"></p>
    </div>
    <div class="cp-grid">
      <figure class="cp-stage"><img id="cpExt" alt="" width="680" height="296" loading="lazy" sizes="auto, (min-width: 700px) 680px, 80vw"></figure>
      <div class="cp-pane">
        <h3 id="cpPaintT">Paint</h3>
        <div class="cp-opts" role="group" aria-labelledby="cpPaintT" id="cpPaint"></div>
      </div>
      <figure class="cp-stage cp-int"><img id="cpIntImg" alt="" width="900" height="507" loading="lazy" sizes="auto, (min-width: 700px) 820px, 90vw"></figure>
      <div class="cp-pane">
        <h3 id="cpIntT">Seats</h3>
        <p class="cp-sub" id="cpSeats"></p>
        <div class="cp-opts" role="group" aria-labelledby="cpIntT" id="cpInt"></div>
        <div class="cp-sum" id="cpSum" aria-live="polite"></div>
      </div>
    </div>`;

  const paintsHTML = (t, sel)=>Object.entries(COLORS[t].paint).map(([code,price])=>{ const q = PAINTS[code];
    return `<button type="button" class="cp-opt" data-code="${code}" aria-pressed="${code===sel}">
      <span class="cp-sw" style="background:${swatch(q.hex)}" aria-hidden="true"></span>
      <span class="cp-name">${esc(q.name)}${q.hint?`<small>${q.hint}</small>`:''}</span>
      <span class="cp-price${price?'':' inc'}">${priceTxt(price)}</span></button>`; }).join('');
  const seatsHTML = (t, sel)=>Object.entries(COLORS[t].int).map(([code,[k,hex]])=>
    `<button type="button" class="cp-opt" data-code="${code}" aria-pressed="${code===sel}">
      <span class="cp-sw${k==='blackblue'?' accent':''}" style="background:${hex}" aria-hidden="true"></span>
      <span class="cp-name">${esc(SEATS[k].name)}</span><span class="cp-price inc">Included</span></button>`).join('');
  const seatsLine = t=>`${COLORS[t].seats}. ${Object.keys(COLORS[t].int).length>1 ? 'Every seat color is included.' : 'One color, included.'}`;

  // Each list keeps the height of the longest one across the four models, so switching models
  // doesn't move anything either. Measured again when the width changes, since text wraps differently.
  const lists = [['#cpPaint', t=>paintsHTML(t)], ['#cpSeats', seatsLine], ['#cpInt', t=>seatsHTML(t)]];
  function reserve(){
    lists.forEach(([sel, html])=>{
      const el = $(sel); el.style.minHeight = '';
      const tallest = Math.max(...TRIM_IDS.map(t=>{ el.innerHTML = html(t); return el.getBoundingClientRect().height; }));
      el.style.minHeight = Math.ceil(tallest)+'px';
    });
    render();
  }

  // Load the rest of a model's photos in the background so switching paints doesn't flash.
  const warmed = new Set();
  const warm = t=>{ if(warmed.has(t)) return; warmed.add(t);
    // Same sizes as the photo it replaces, so the browser loads the same copy it will show.
    const like = (shown, name)=>{ const im = new Image(); im.sizes = shown.getAttribute('sizes'); setPhoto(im, name); };
    Object.keys(COLORS[t].paint).forEach(c=>like($('#cpExt'), `colors/ext-${COLORS[t].img}-${c}`));
    Object.keys(COLORS[t].int).forEach(c=>like($('#cpIntImg'), `colors/int-${COLORS[t].img}-${c}`)); };

  function render(){
    const c = COLORS[st.t], t = trimOf(st.t), p = PAINTS[st.paint], seat = seatOf(st.t, st.int);
    box.style.setProperty('--c', t.color);
    box.querySelectorAll('#cpModel button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.t===st.t));
    $('#cpPaint').innerHTML = paintsHTML(st.t, st.paint);
    $('#cpInt').innerHTML = seatsHTML(st.t, st.int);
    $('#cpSeats').textContent = seatsLine(st.t);
    const ext = $('#cpExt'), int = $('#cpIntImg');
    setPhoto(ext, `colors/ext-${c.img}-${st.paint}`); ext.alt = `${t.name} in ${p.name}`;
    setPhoto(int, `colors/int-${c.img}-${st.int}`); int.alt = `${t.name} front seats and dashboard, ${seat.say} seats`;
    [ext, int].forEach(img=>img.closest('.zoom')?.setAttribute('aria-label', 'Expand photo: '+img.alt));

    // The same rows every time, so the total never changes height.
    const paintCost = c.paint[st.paint], pk = PKG.extra(st.t), n = PKG.level(st.t);
    const start = PACKAGES[st.t].base;
    $('#cpSum').innerHTML = `<dl class="cp-lines">
        <div><dt>Starting price</dt><dd>${money(start)}</dd></div>
        <div><dt>Packages <a href="#packages">${n ? `${n} of ${PACKAGES[st.t].ladder.length}` : 'Add some'}</a></dt><dd>${n ? '+'+money(pk) : 'None'}</dd></div>
        <div><dt>Paint</dt><dd>${priceTxt(paintCost)}</dd></div>
        <div class="cp-total"><dt>Total</dt><dd class="big">${money(start+pk+paintCost)}</dd></div>
      </dl>`;
    const noteEl = $('#cpNote');
    noteEl.textContent = note; noteEl.classList.toggle('seen', noteSeen);
    store.set('rav4-colors', st);
  }

  // Moving to another model: keep the paint if it's offered, else the same color with or without the
  // black roof, else the first included paint. Seats work the same way. When either changes, one plain
  // message says which (the picker itself shows what it changed to).
  function switchModel(to){
    if(to===st.t) return;
    const from = st.t, c = COLORS[to];
    const old = PAINTS[st.paint];
    let paint = st.paint in c.paint ? st.paint : Object.keys(c.paint).find(k=>PAINTS[k].fam===old.fam);
    if(!paint) paint = firstPaint(to);
    const oldSeat = seatOf(from, st.int), fam = seatFam(from, st.int);
    let int = st.int in c.int ? st.int : Object.keys(c.int).find(k=>seatFam(to,k)===fam);
    if(!int) int = Object.keys(c.int)[0];
    const kind = [paint!==st.paint && 'paint', seatOf(to,int)!==oldSeat && 'interior'].filter(Boolean).join(' and ');
    // Trim names don't break across lines ("XLE / Premium").
    const nm = id=>trimOf(id).name.replace(/ /g,'\u00a0');
    const msgs = kind ? [`The ${nm(to)} doesn't have the same ${kind} options as the ${nm(from)} you had picked. This shows the closest match.`] : [];
    Object.assign(st, {t:to, paint, int}); note = msgs.join(' '); noteSeen = false;
    warm(to); render();
  }

  box.addEventListener('click',e=>{
    const m = e.target.closest('#cpModel button'); if(m) return switchModel(m.dataset.t);
    const o = e.target.closest('.cp-opt'); if(!o) return;
    // render() replaces the buttons, so note which list this was first, then focus its new copy.
    const list = o.parentElement.id;
    st[list==='cpPaint' ? 'paint' : 'int'] = o.dataset.code; noteSeen = true;
    render();
    box.querySelector(`#${list} [data-code="${o.dataset.code}"]`).focus({preventScroll:true});
  });
  PKG.onChange(id=>{ if(id===st.t) render(); });
  reserve();
  let lastW = 0;
  new ResizeObserver(()=>{ const w = Math.round(box.clientWidth); if(w!==lastW){ lastW = w; reserve(); } }).observe(box);
  document.fonts?.ready.then(reserve);
  // Warm the photos only once the section is close, so the page's first load stays light.
  new IntersectionObserver((es,io)=>{ if(es.some(x=>x.isIntersecting)){ warm(st.t); io.disconnect(); } }, {rootMargin:'400px'}).observe(box);
})();

/* ===================== MODEL YEAR: switch, hero and the year differences ===================== */
(function(){
  // The switch is two plain links, so each year has its own address. Switching remembers which
  // section you were reading and how far into it, and the block at the end of this script puts you
  // back there. (A raw pixel offset would drift, since the two years' pages differ in height.)
  const rememberScroll = ()=>{
    const secs = [...document.querySelectorAll('.nav a')].map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const cur = secs.filter(el=>el.getBoundingClientRect().top <= 120).at(-1);
    const spot = cur ? {id:cur.id, dy:Math.round(scrollY - cur.offsetTop)} : {id:null, dy:Math.round(scrollY)};
    try{ sessionStorage.setItem('rav4-scroll', JSON.stringify(spot)); }catch{}
  };
  const sw = $('#yearSwitch');
  sw.innerHTML = Object.keys(YEAR_FACTS).sort().map(y=>`<a href="?year=${y}"${+y===F.year?' aria-current="page"':''}>${y}</a>`).join('');
  sw.addEventListener('click',e=>{
    const a = e.target.closest('a'); if(!a) return;
    if(a.hasAttribute('aria-current')){ e.preventDefault(); return; }
    rememberScroll();
  });

  // Text that names a year-specific fact: <span data-f="key">.
  const TEXT = {year:String(F.year), range:String(F.range), specGaps:F.specGaps, sources:F.sources,
    ...Object.fromEntries(TRIM_IDS.map(id=>['price.'+id, money(START[id])])),
    // Each step up, as the hero chips and step-up headings name it: the Plug-in is the XSE with a plug,
    // so its step is from the Hybrid XSE, not from the Limited beside it.
    ...Object.fromEntries([['xse','xle'],['ltd','xse'],['phv','xse']].map(([to,from])=>['step.'+to, money(START[to]-START[from])]))};
  document.querySelectorAll('[data-f]').forEach(el=>{
    const k = el.dataset.f;
    if(Object.hasOwn(TEXT,k)) el.textContent = TEXT[k]; else console.error('No year fact named', k);
  });
  $('#mpgLine').innerHTML = `Gas mileage: ${hybridMpgList(F, s=>`<b>${s}</b>`)}, combined. The <b>Plug-in XSE</b> goes about <b>${F.range} miles</b> on a charge, then gets <b>${F.mpg.phv} mpg</b>.`;

  // For any year other than the default, list what Toyota's pages give differently from the default year.
  if(F.year === DEFAULT_YEAR) return;
  const O = YEAR_FACTS[DEFAULT_YEAR];
  const less = TRIM_IDS.map(id=>O.base[id]-F.base[id]);
  const priceNote = new Set(less).size===1 && less[0]>0 ? ` (${money(less[0])} less on every trim)` : '';
  const rows = [
    ['Starting prices', f=>`${money(f.base.xle+DESTINATION)} to ${money(f.base.phv+DESTINATION)}`, priceNote],
    ['Hybrid power', f=>`${f.hp.hyb} hp`],
    ['Hybrid gas mileage, combined', f=>hybridMpgList(f)],
    ['Plug-in power', f=>`${f.hp.phv} hp`],
    ['Plug-in range on electricity', f=>`${f.range} miles (${f.mpge} MPGe)`],
    ['Plug-in gas mileage, combined', f=>`${f.mpg.phv} mpg`],
    ['Plug-in charging port', f=>f.port],
    ['Free Remote Connect trial (lock, unlock and start the car from the Toyota app)', f=>f.trials.remote],
    ['Free Drive Connect trial on the XSE, Limited and Plug-in (Traffic Jam Assist needs it)', f=>f.trials.drive],
  ].filter(([,get])=>get(F)!==get(O));
  const panel = $('#yearDiff');
  panel.innerHTML = `
    <h2 id="yearDiffT">How the ${F.year} differs from the ${O.year}</h2>
    <p>The two years look the same and have nearly all the same features, and the option packages cost the same. These are the differences Toyota’s pages list.</p>
    <table class="yd-table">
      <thead><tr><td></td><th scope="col">${F.year}, shown on this page</th><th scope="col">${O.year}</th></tr></thead>
      <tbody>${rows.map(([label,get,note])=>`<tr><th scope="row">${esc(label)}</th><td class="now">${esc(get(F))}${note?`<span class="note">${esc(note)}</span>`:''}</td><td>${esc(get(O))}</td></tr>`).join('')}</tbody>
    </table>
    <p>If a dealer still has a new ${F.year}, ask about a discount, since leftover cars are often marked down. <a href="?year=${O.year}">See the ${O.year} instead</a>.</p>`;
  panel.hidden = false;
  panel.querySelector(`a[href="?year=${O.year}"]`).addEventListener('click',rememberScroll);
})();

/* ===================== STEP UPS ===================== */
// An item with a feature write-up further down links to it and ends in an arrow; one without is plain text.
function fillGain(sel,list,kind){
  $(sel).innerHTML = list.map(([id,t,w])=>{
    const body = `<span class="mk" aria-hidden="true">${kind==='plus'?'+':'–'}</span><span><b>${esc(t)}</b><span class="why">${esc(w)}</span></span>`;
    return `<li class="${kind}">${id ? `<a class="row" href="#f-${id}">${body}<span class="go" aria-hidden="true">›</span></a>` : `<div class="row">${body}</div>`}</li>`;
  }).join('');
}
fillGain('#gain1',STEP1_GAIN,'plus'); fillGain('#lose1',STEP1_LOSE,'minus');
fillGain('#gain2',STEP2_GAIN,'plus'); fillGain('#lose2',STEP2_LOSE,'minus');
fillGain('#gain3',STEP3_GAIN,'plus'); fillGain('#lose3',STEP3_LOSE,'minus');

/* ===================== FEATURE LIST ===================== */
// Side-by-side photos of the same view in each trim, from Toyota's build tool.
// One figure per trim with a photo for each view, from the color picker's renders (img/colors/).
const trio = s=>`<div class="trio"><h5>${esc(s.title)}</h5><div class="trio-grid">${TRIMS.map((t,i)=>`
  <figure style="--c:${t.color}"><div class="trio-views">${s.views.map(([kind,side])=>{ 
    return `<img class="v-${kind}" ${photoAttrs(`colors/${kind}-${s.imgs[i]}`, 'auto, (min-width: 1100px) 325px, 42vw')} alt="${esc(`${t.name} from the ${side}`)}" loading="lazy">`; }).join('')}</div>
  <figcaption><b>${t.name}</b>${esc(s.caps[i])}</figcaption></figure>`).join('')}</div></div>`;
(function(){
  const groups=[...new Set(FEATURES.map(f=>f.group))];
  const slug=g=>'g-'+g.toLowerCase().replace(/[^a-z]+/g,'-');
  $('#groupNav').innerHTML = groups.map(g=>`<a href="#${slug(g)}">${esc(g)}</a>`).join('');
  const inits=[];
  $('#featureList').innerHTML = groups.map(g=>`
    <div class="fgroup" id="${slug(g)}"><h3>${esc(g)}</h3>
    ${FEATURES.filter(f=>f.group===g).map(f=>{
      let vis='', below='';
      if(f.visual){const v=VIS[f.visual](); vis=`<div class="f-vis" data-vis="${f.id}">${v.html}</div>`; if(v.init) inits.push([f.id,v.init]); below=v.below||'';}
      else if(f.img){vis=`<div class="f-vis"><figure><img ${photoAttrs(f.img, 'auto, (min-width: 700px) 705px, 90vw')} alt="${esc(f.alt)}" loading="lazy">${f.cap?`<figcaption>${esc(f.cap)}</figcaption>`:''}</figure></div>`;}
      if(!['text','beside','below'].includes(f.layout) || (f.layout==='text')!==!vis) console.error(`feature ${f.id}: layout "${f.layout}" ${vis?'has':'lacks'} a picture; use text for none, beside or below for one.`);
      return `<article class="feature l-${f.layout}${f.compact?' compact':''}" data-layout="${f.layout}" id="f-${f.id}">
        <div class="f-text">
          <h4>${esc(f.name)}</h4>
          <p class="aka">Toyota calls it <i>${esc(f.aka)}</i></p>
          <p>${f.what}</p>
          <p class="why"><b>Why it matters</b>${f.why}</p>
        </div>${vis}
        <div class="avail">${TRIMS.map((t,i)=>{const [s,n]=f.trims[i]; return `<div style="--c:${t.color}"><span class="tn">${t.name}</span>${pill(s)}${n?`<span class="note">${esc(n)}</span>`:''}</div>`}).join('')}</div>${below}${f.shots?trio(f.shots):''}
      </article>`;}).join('')}
    </div>`).join('');
  inits.forEach(([id,fn])=>fn($(`[data-vis="${id}"]`)));
})();

/* ===================== BASICS ===================== */
$('#basicsList').innerHTML = BASICS.map(([b,s])=>`<div class="basic"><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join('');

/* ===================== SPEC TABLE ===================== */
// Toyota repeats some long lines once per trim with small changes. Each merge below replaces those
// lines (matched by Toyota's exact wording in `from`) with one row. Cells chain off the trim before
// them only when that trim purely adds things; anything a trim loses is said outright. The table
// always shows all four columns, so "Same as XSE" stays readable.
// `opt` is an upgrade you can add to that trim. If Toyota's wording ever changes and a line in
// `from` is missing, that merge is skipped and the original lines show instead.
// A `from` entry can be a list of wordings: the first one found is used (Toyota's 2026 and 2027 pages
// word some lines differently). A null at the end of the list means the line may be missing.
// `years` limits a merge to the model years whose pages need it.
const SPEC_MERGES = [
  // Toyota's MSRP line becomes the page's starting price, which includes the destination fee.
  {cat:'Price & fuel economy', label:'Starting price', from:['Base MSRP'],
   cells:TRIM_IDS.map(id=>({t:money(START[id])}))},
  {cat:'Outside', label:'Windshield wipers', common:'Intermittent rear wiper on all four.',
   from:['Variable intermittent windshield wipers and intermittent rear window wiper',
         'Rain-sensing variable intermittent windshield wipers with de-icer function and intermittent rear window wiper'],
   cells:[{t:'Variable intermittent wipers', opt:'Rain-sensing, with de-icer (Weather Package)'},
          {t:'Same as XLE Premium', opt:'Rain-sensing, with de-icer (Weather Package)'},
          {t:'Rain-sensing, with de-icer'},
          {t:'Variable intermittent wipers', opt:'Rain-sensing, with de-icer (Weather Package)'}]},
  {cat:'Outside', label:'Bumper and fender trim', common:'Upper front bumper in the body color on all four.',
   from:['Color-keyed upper front bumper, and satin-black lower front bumper, overfenders and rear bumper',
         'Color-keyed upper front bumper, silver-painted rear bumper, piano-black overfenders and lower front bumper',
         'Color-keyed upper front bumper, satin black overfenders, silver-painted lower front bumper and rear bumper',
         'Color-keyed upper front bumper, piano black overfenders and lower front bumper',
         'Wide overfenders with black cladding and an ascending belt line with chiseled body panels'],
   cells:[{t:'Satin black lower front bumper, fender flares and rear bumper'},
          {t:'Glossy black lower front bumper and fender flares; silver rear bumper'},
          {t:'Satin black fender flares; silver lower front bumper and rear bumper'},
          {t:'Glossy black lower front bumper and fender flares. Toyota doesn’t describe the rear bumper.'}]},
  {cat:'Outside', label:'Power liftgate', common:'Power liftgate with jam protection on all four.',
   from:['Height-adjustable power liftgate with jam protection','Hands-free power liftgate with jam protection'],
   cells:[{t:'Opening height can be set'},
          {t:'Opens hands-free with a foot swipe. Toyota doesn’t list the height setting.'},
          {t:'Same as XSE'},
          {t:'Same as XSE'}]},
  {cat:'Outside', label:'Wheels',
   from:['18-in. dark gray metallic wheels','20-in. multi-spoke black sport alloy wheels with black lug nuts',
         '18-in. machined 5-spoke dark gray metallic wheels','20-in. multi-spoke machined black wheels'],
   cells:[{t:'18-in. dark gray'},
          {t:'20-in. black, with black lug nuts'},
          {t:'18-in. machined 5-spoke dark gray', opt:'20-in. machined black (20-In. Wheel Package)'},
          {t:'20-in. black, with black lug nuts'}]},
  {cat:'Outside', label:'Sunroof',
   from:['Power tilt/slide moonroof with one-touch open/close','Panoramic tilt/slide panoramic moonroof'],
   cells:[{t:'Solid roof', opt:'Panoramic glass roof (Panoramic Moonroof Package)'},
          {t:'Sunroof over the front seats; tilts and slides, one-touch open and close', opt:'Panoramic glass roof instead (Panoramic Moonroof Package)'},
          {t:'Panoramic glass roof; the front section tilts and slides'},
          {t:'Sunroof over the front seats; tilts and slides, one-touch open and close', opt:'Panoramic glass roof instead (Panoramic Moonroof Package)'}]},
  {cat:'Outside', label:'Grille', common:'Body-colored grille on all four.',
   from:['Body-colored grille','Body-colored grille with dark chrome accents','Body-colored grille with satin chrome accents'],
   cells:[{t:'No accents'},{t:'Dark chrome accents'},{t:'Satin chrome accents'},{t:'Dark chrome accents'}]},
  {cat:'Outside', label:'Outside mirrors', common:'Glossy black, heated and power-adjusted, with turn signals and blind spot warning lights on all four.',
   from:['Piano-black heated power outside mirrors with turn signal and blind spot warning indicators',
         'Piano-black heated power outside mirrors with turn signal and blind spot warning indicators, and puddle lights'],
   cells:[{t:'No puddle lights'},{t:'XLE Premium plus puddle lights'},{t:'Same as XSE'},{t:'Same as XSE'}]},
  {cat:'Inside', label:'Wireless phone charging', common:'Qi-compatible, with a charge indicator light.',
   from:['Single Qi-compatible wireless charging with charge indicator light','Dual Qi-compatible wireless charging with charge indicator light'],
   cells:[{t:'1 charging pad'},{t:'1 charging pad'},{t:'2 charging pads'},{t:'1 charging pad'}]},
  {cat:'Inside', label:'Interior lights', common:'A cargo area light on all four.',
   from:['LED front-seat reading lights, dome light and cargo area light','Cargo area light'],
   cells:[{t:'LED reading lights up front and a dome light'},{t:'Same as XLE Premium'},{t:'Same as XLE Premium'},
          {t:'Front map lights (listed with the overhead console). Toyota doesn’t mention a dome light.'}]},
  {cat:'Inside', label:'Center console', common:'Covered storage, a reversible armrest tray, two cupholders, a front storage tray, and parking brake and Brake Hold buttons on all four.',
   from:['Center console with covered storage compartment, reversible armrest/console tray, two cup holders, drive mode (Trail, Snow, Normal and EV Mode ), auto LSD/VSC, Electric Parking Brake (EPB) and automatic Brake Hold controls, and front storage tray',
         ['Center console with covered storage compartment, reversible armrest/console tray, two cup holders, drive mode (snow, normal and EV mode), Electric Parking Brake (EPB) and automatic Brake Hold controls, and front storage tray',
          'Center console with covered storage compartment, reversible armrest/console tray, two cup holders, drive mode (trail, snow, normal and EV mode), auto LSD/VSC, Electric Parking Brake (EPB) and automatic Brake Hold controls, and front storage tray']],
   cells:[{t:'Drive mode buttons include Trail, plus an auto LSD/VSC button'},{t:'Same as XLE Premium'},{t:'Same as XLE Premium'},
          {t:F.notes.consolePhv}]},
  {cat:'Inside', label:'Gear selector',
   from:['Leather-trimmed shift lever with sequential mode','Toggle shift-by-wire shifter lever','Sport paddle shifters'],
   cells:[{t:'Leather-trimmed lever'},
          {t:'Same as XLE Premium', opt:'Toggle switch instead (XSE Driver Assist Package)'},
          {t:'Toggle switch; no lever'},
          {t:'Same as XLE Premium', opt:'Toggle switch and paddle shifters (Driver Assist Package)'}]},
  {cat:'Inside', label:'Seats', common:'SofTex synthetic leather, 8-way power driver’s seat with lumbar support, and a seatback pocket on all four.',
   from:['SofTex®-trimmed seats, heated front seats (high-low); 8-way power-adjustable driver\'s seat with lumbar support; 6-way manual front passenger seat with seatback pocket',
         'SofTex®/synthetic suede-trimmed seats, heated and ventilated front seats (high-mid-low); 8-way power-adjustable driver\'s seat with memory function and lumbar support; 8-way power front passenger seat with seatback pocket',
         'SofTex®-trimmed seats, heated and ventilated front seats (high-mid-low), heated rear seats (on-off); 8-way power-adjustable driver\'s seat with memory function and lumbar support; 8-way power front passenger seat with seatback pocket',
         ['Mixed Media/SofTex-trimmed seats, heated and ventilated front seats (high-mid-low); 8-way power-adjustable driver\'s seat with memory function and lumbar support; 8-way power front passenger seat with seatback pocket',
          'Mixed Media/SofTex®-trimmed seats, heated and ventilated front seats (high-mid-low); 8-way power-adjustable driver\'s seat with memory function and lumbar support; 8-way power front passenger seat with seatback pocket']],
   cells:[{t:'Heated front seats (2 levels); 6-way manual passenger seat'},
          {t:'XLE Premium plus suede-like inserts, cooled front seats with 3 heat levels, driver’s seat memory, and an 8-way power passenger seat'},
          {t:'Same as XSE without the suede-like inserts, plus heated back seats'},
          {t:'Same as XSE. Toyota’s Plug-in page calls the trim “Mixed Media”.'}]},
  {cat:'Inside', label:'Power outlets',
   from:['One 12V/120W auxiliary power outlet in front instrument panel storage tray and one 12V/120W auxiliary power outlet in cargo area',
         'One 12V/120W auxiliary power outlet in front instrument panel storage tray',
         'One 120V/1500W AC power outlet in cargo area'],
   cells:[{t:'12-volt sockets up front and in the cargo area'},{t:'Same as XLE Premium'},{t:'Same as XLE Premium'},
          {t:'12-volt socket up front; household-style 120-volt, 1,500-watt outlet in the cargo area'}]},
  {cat:'Inside', label:'Inside rearview mirror',
   from:['Day/night rearview mirror','Auto-dimming rearview mirror with HomeLink® universal transceiver','Digital rearview mirror with HomeLink® universal transceiver'],
   cells:[{t:'Manual day/night flip tab', opt:'Camera mirror with garage door opener (Panoramic Moonroof Package)'},
          {t:'Auto-dimming, with garage door opener', opt:'Camera mirror (Panoramic Moonroof Package)'},
          {t:'Camera mirror, with garage door opener'},
          {t:'Auto-dimming, with garage door opener', opt:'Camera mirror (Panoramic Moonroof Package)'}]},
  {cat:'Inside', label:'Steering wheel', common:'Leather-trimmed, tilts and telescopes, with buttons for audio, phone, voice, cruise control and lane assist on all four.',
   from:['Leather-trimmed tilt/telescopic 3-spoke steering wheel with silver accent and controls for audio, Multi-Information Display (MID), Bluetooth® hands-free phone, voice-command, Dynamic Radar Cruise Control (DRCC), Lane Departure Alert (LDA), and Lane Trace Assist (LTA)',
         'Heated leather-trimmed tilt/telescopic 3-spoke steering wheel with silver accent and controls for audio, Multi-Information Display (MID), Bluetooth® hands-free phone, voice-command, Dynamic Radar Cruise Control (DRCC), Lane Departure Alert (LDA), and Lane Trace Assist (LTA)'],
   cells:[{t:'Not heated', opt:'Heated (Weather Package)'},
          {t:'Not heated', opt:'Heated (Weather Package)'},
          {t:'Heated'},
          {t:'Not heated', opt:'Heated (Weather Package)'}]},
  {cat:'Screen & sound', label:'Touchscreen and speakers', common:'Wireless Apple CarPlay and Android Auto, and a 3-month SiriusXM trial on all four.',
   from:['10.5-in. Toyota Audio Multimedia, six speakers, with wireless Apple CarPlay® & Android Auto™ compatibility, SiriusXM® with 360L 3-month trial subscription. See toyota.com/connected-services for details.',
         '12.9-in. Toyota Audio Multimedia, six speakers, with wireless Apple CarPlay® & Android Auto™ compatibility, SiriusXM® with 360L 3-month trial subscription. See toyota.com/connected-services for details.',
         '12.9-in. Toyota Audio Multimedia, 9-speaker JBL® Premium Audio including subwoofer and amplifier, with wireless Apple CarPlay® & Android Auto™ compatibility, SiriusXM® with 360L 3-month trial subscription. See toyota.com/connected-services for details.',
         '9-speaker JBL® Premium Audio including subwoofer and amplifier'],
   cells:[{t:'10.5-in. screen, 6 speakers'},
          {t:'12.9-in. screen, 6 speakers', opt:'9-speaker JBL with subwoofer (JBL Premium Audio Package)'},
          {t:'12.9-in. screen, 9-speaker JBL with subwoofer'},
          {t:'12.9-in. screen, 6 speakers', opt:'9-speaker JBL with subwoofer (JBL Premium Audio Package)'}]},
  {cat:'Safety & driver help', label:'Blind spot warning', common:'Blind Spot Monitor, Rear Cross-Traffic Alert and Safe Exit Alert on all four.',
   from:['Blind Spot Monitor (BSM) with Rear Cross-Traffic Alert (RCTA) and Safe Exit Alert (SEA)','Blind Spot Monitor (BSM) with Rear Cross-Traffic Alert (RCTA)'],
   cells:[{t:'All three'},{t:'All three'},{t:'All three'},{t:F.notes.seaPhv}]},
  {cat:'Safety & driver help', label:'Extra driver-assist bundle', common:'Front Cross-Traffic Alert, Lane Change Assist, Traffic Jam Assist and Driver Monitor.',
   from:['Front Cross-Traffic Alert (FCTA), Lane Change Assist (LCA), Traffic Jam Assist (TJA) and Driver Monitor'],
   cells:[{t:'Not included', opt:`All four (${F.xleAssist})`},{t:'All four'},{t:'All four'},{t:'All four'}]},
  {cat:'Engine & drivetrain', label:'Powertrain', common:'A 2.5-liter 4-cylinder gas engine working with electric motors on all four.',
   from:[['Hybrid powertrain: 2.5-Liter Dynamic Force 4-Cylinder with SPORT, Eco, NORMAL, EV, , SNOW drive modes; 229 net combined hp',
          'Hybrid powertrain: 2.5-Liter Dynamic Force 4-Cylinder with SPORT, Eco, NORMAL, EV, TRAIL, SNOW drive modes; 236 net combined hp'],
         ['2.5-Liter Dynamic Force 4-Cylinder with SPORT, Eco, NORMAL, EV, TRAIL, SNOW drive modes; 321 combined net hp',
          '2.5-Liter Dynamic Force 4-Cylinder with SPORT, Eco, NORMAL, EV, TRAIL, SNOW drive modes; 324 combined net hp']],
   cells:[{t:`${F.hp.hyb} hp combined`},{t:`${F.hp.hyb} hp combined`},{t:`${F.hp.hyb} hp combined`},{t:F.notes.powertrainPhv}]},
  // The 2026 pages give one torque figure for all four, so there is nothing to combine.
  {cat:'Engine & drivetrain', label:'Max. torque', years:[2027],
   from:['Max. Torque: 163 lb.-ft. (231 N•m)','Max. torque: 172 lb.-ft. (231 N•m)'],
   cells:[{t:'163 lb.-ft.'},{t:'163 lb.-ft.'},{t:'163 lb.-ft.'},{t:'172 lb.-ft.'}]},
  {cat:'Engine & drivetrain', label:'Electric motor output (front/rear)',
   from:[['Max output (front/rear): 100/40 kW','Power output (front/rear): 100/40 kW'],'Power output (front/rear): 150/40 kW'],
   cells:[{t:'100/40 kW'},{t:'100/40 kW'},{t:'100/40 kW'},{t:'150/40 kW'}]},
  {cat:'Engine & drivetrain', label:'Hybrid battery',
   from:['Rated voltage: 248V (Li-ion)',['Rated voltage: 391 (Li-ion)',null]],
   cells:[{t:'248-volt lithium-ion'},{t:'Same as XLE Premium'},{t:'Same as XLE Premium'},
          {t:F.notes.batteryPhv}]},
];
// Packages and single options have their own section with prices.
const SPEC_SKIP_CATS = new Set(['Option packages','Single options']);

// Corrections to Toyota's comparison data, listed per year in YEAR_FACTS with the reason.
function fixSpecs(raw, fixes){
  fixes.forEach(f=>{
    const row = raw.find(c=>c.cat===f.cat)?.rows.find(r=>r.label.startsWith(f.label));
    if(!row){ console.warn('Spec fix not applied; no line starts with:', f.label); return; }
    row.cells[f.trim] = f.cell;
  });
  return raw;
}
function mergeSpecs(raw){
  return raw.filter(c=>!SPEC_SKIP_CATS.has(c.cat)).map(cat=>{
    let rows = cat.rows;
    SPEC_MERGES.filter(m=>m.cat===cat.cat && (!m.years || m.years.includes(F.year))).forEach(m=>{
      // undefined: a required line is missing. null: an optional line is missing.
      const pick = e=>{ for(const l of [].concat(e)){ if(l===null) return null; const r=rows.find(r=>!r.header && r.label===l); if(r) return r; } };
      const found = m.from.map(pick);
      if(found.includes(undefined)){ console.warn('Spec merge skipped; Toyota’s wording changed for:', m.label, m.from.filter((l,i)=>found[i]===undefined)); return; }
      const src = found.filter(Boolean);
      const merged = {label:m.label, merged:m, sources:src};
      rows = rows.map(r=>r===src[0]?merged:r).filter(r=>!src.includes(r));
    });
    return {...cat, rows};
  });
}

(function(){
  const data = mergeSpecs(fixSpecs(window[F.specs]||[], F.specFixes||[]));
  const list=$('#specList'), q=$('#specSearch'), diff=$('#diffOnly'), count=$('#specCount');
  const openState = store.get('rav4-open',{});
  const cell=([s,v])=> s==='nl'? pill('nl') : s==='val'? `<span class="val">${esc(v||'–')}</span>` : (v && s!=='std'? pill(s, s==='opt'?'Optional':undefined)+`<div class="note" style="margin-top:4px">${esc(v)}</div>` : pill(s));
  const mcell=c=> `<span>${esc(c.t)}</span>${c.opt?`<span class="mo">${pill('opt','Optional')}${esc(c.opt)}</span>`:''}`;
  const isDiff=r=> r.merged ? new Set(r.merged.cells.map(c=>c.t+'|'+(c.opt||''))).size>1
                            : r.cells && new Set(r.cells.map(c=>c.join('|'))).size>1;
  const haystack=r=> r.merged ? [r.label, r.merged.common||'', ...r.merged.cells.flatMap(c=>[c.t,c.opt||'']), ...r.merged.from].join(' ') : r.label;
  const hi=(t,term)=>{ const e=esc(t); if(!term) return e; const i=e.toLowerCase().indexOf(term.toLowerCase()); return i<0?e:e.slice(0,i)+'<mark>'+e.slice(i,i+term.length)+'</mark>'+e.slice(i+term.length); };
  const whoHas=src=> TRIMS.map((t,i)=>{const s=src.cells[i][0]; return s==='std'?t.name : s==='opt'?t.name+' (optional)' : null;}).filter(Boolean).join(', ');
  const labelCell=(r,term)=> !r.merged ? hi(r.label,term) :
    `${hi(r.label,term)}${r.merged.common?`<span class="common">${esc(r.merged.common)}</span>`:''}
     <details class="tw"><summary>Toyota’s wording</summary><ul>${r.sources.map(src=>`<li>${esc(src.label)}<span>${esc(whoHas(src))}</span></li>`).join('')}</ul></details>`;
  function render(){
    const term=q.value.trim(); let shown=0;
    list.innerHTML = data.map((cat,ci)=>{
      let sub=null, rows=[];
      cat.rows.forEach(r=>{
        if(r.header){sub=r.label;return;}
        if(diff.checked && !isDiff(r)) return;
        if(term && !(haystack(r)+' '+(sub||'')).toLowerCase().includes(term.toLowerCase())) return;
        if(sub){rows.push(`<tr class="sub"><td colspan="${TRIMS.length+1}">${esc(sub)}</td></tr>`); sub=null;}
        const cells = r.merged ? r.merged.cells.map(mcell) : r.cells.map(cell);
        rows.push(`<tr class="${isDiff(r)?'diff':''}"><td class="lab">${labelCell(r,term)}</td>${cells.map((c,i)=>`<td class="c" data-t="${TRIMS[i].name}">${c}</td>`).join('')}</tr>`);
        shown++;
      });
      if(!rows.length) return '';
      const open = term || openState[cat.cat]!==false;
      return `<details class="spec-cat" data-cat="${esc(cat.cat)}" ${open?'open':''}><summary>${esc(cat.cat)} <span class="n">${(n=>n+(n===1?' row':' rows'))(rows.filter(r=>!r.startsWith('<tr class="sub"')).length)}</span></summary>
        <table class="spec-table"><thead><tr><th scope="col">Feature</th>${TRIMS.map(t=>`<th class="t" scope="col" style="--c:${t.color}"><span class="tn">${t.name}</span><span class="tp">from ${money(START[t.id])}</span></th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></details>`;
    }).join('') || `<p class="lede">No rows match “${esc(term)}”. Try a shorter word, or turn off “Only show differences”.</p>`;
    count.textContent = `${shown} row${shown===1?'':'s'}`;
  }
  list.addEventListener('toggle',e=>{const d=e.target; if(d.matches&&d.matches('details.spec-cat')){openState[d.dataset.cat]=d.open; store.set('rav4-open',openState);}},true);
  q.addEventListener('input',render); diff.addEventListener('change',render);
  render();
})();

/* ===================== CHECKLIST ===================== */
(function(){
  const done = new Set(store.get('rav4-check',[]));
  $('#checklist').innerHTML = CHECKLIST.map(([t,s],i)=>`<li><label><input type="checkbox" data-i="${i}" ${done.has(i)?'checked':''}><span>${esc(t)}<small>${esc(s)}</small></span></label></li>`).join('');
  $('#checklist').addEventListener('change',e=>{const i=+e.target.dataset.i; e.target.checked?done.add(i):done.delete(i); store.set('rav4-check',[...done]);});
})();

/* ===================== PHOTO ZOOM ===================== */
(function(){
  const ZOOM_ICON = '<span class="zi" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M12 3h5v5M8 17H3v-5M17 3l-6 6M3 17l6-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  const imgs = [...document.querySelectorAll('img[data-full]')];
  const btns = imgs.map((img,i)=>{
    const b = document.createElement('button');
    b.type='button'; b.className='zoom'; b.dataset.i=i;
    b.setAttribute('aria-label','Expand photo: '+img.alt);
    img.replaceWith(b); b.append(img); b.insertAdjacentHTML('beforeend',ZOOM_ICON);
    return b;
  });
  const dlg=$('#lightbox'), big=$('#lbImg'), stage=$('#lbStage'), cap=$('#lbCap'), count=$('#lbCount');
  const touch = matchMedia('(hover:none)').matches;
  let cur=0;
  const unzoom=()=>{stage.classList.remove('zoomed'); big.style.width='';};
  function show(i){
    cur=(i+imgs.length)%imgs.length; unzoom();
    const img=imgs[cur], fc=img.closest('figure')?.querySelector('figcaption');
    // Show the copy already on the page at once, then swap in the full size when it has loaded.
    big.src=img.currentSrc||img.src; big.alt=img.alt;
    const full=img.dataset.full, pre=new Image();
    pre.onload=()=>{ if(imgs[cur]===img) big.src=full; }; pre.src=full;
    // Trio captions start with a bold trim name; join it to the rest with a colon.
    const capText = !fc ? img.alt : [...fc.childNodes].map(n=>n.nodeName==='B'?n.textContent+': ':n.textContent).join('').trim();
    cap.innerHTML = esc(capText)
      + `<small>${touch?'Tap the photo to zoom in. Pinch also works.':'Click the photo to zoom in. Use the arrow keys to move between photos.'}</small>`;
    count.textContent=`Photo ${cur+1} of ${imgs.length}`;
  }
  btns.forEach(b=>b.addEventListener('click',()=>{show(+b.dataset.i); dlg.showModal(); $('#lbClose').focus();}));
  $('#lbPrev').addEventListener('click',()=>show(cur-1));
  $('#lbNext').addEventListener('click',()=>show(cur+1));
  $('#lbClose').addEventListener('click',()=>dlg.close());
  // Return focus to the photo the viewer ended on, after the browser's own focus restore.
  dlg.addEventListener('close',()=>{unzoom(); setTimeout(()=>btns[cur].focus({preventScroll:false}),0);});
  dlg.addEventListener('keydown',e=>{ if(e.key==='ArrowLeft') show(cur-1); if(e.key==='ArrowRight') show(cur+1); });
  stage.addEventListener('click',e=>{
    if(e.target!==big){ if(!stage.classList.contains('zoomed')) dlg.close(); return; }
    if(stage.classList.contains('zoomed')){unzoom(); return;}
    const r=big.getBoundingClientRect(), fx=(e.clientX-r.left)/r.width, fy=(e.clientY-r.top)/r.height;
    big.style.width=Math.max(big.naturalWidth/devicePixelRatio, r.width*2.2)+'px'; stage.classList.add('zoomed');
    stage.scrollLeft = fx*big.offsetWidth - stage.clientWidth/2;
    stage.scrollTop = fy*big.offsetHeight - stage.clientHeight/2;
  });
})();

/* ===================== SECTION NAV ===================== */
(function(){
  const nav=$('.nav'), links=[...nav.querySelectorAll('a')];
  // Sticky things below the section nav (the spec table's trim header) pin at its height, which changes as it wraps.
  const bar=$('.subnav'); new ResizeObserver(()=>document.documentElement.style.setProperty('--stick',bar.offsetHeight+'px')).observe(bar);
  const still=matchMedia('(prefers-reduced-motion: reduce)');
  const edges=()=>{
    nav.classList.toggle('more-l', nav.scrollLeft>2);
    nav.classList.toggle('more-r', nav.scrollLeft+nav.clientWidth < nav.scrollWidth-2);
  };
  nav.addEventListener('scroll',edges,{passive:true});
  new ResizeObserver(edges).observe(nav);
  // The current section is the last one whose top has passed 40% of the way down the screen, or the
  // last section once the page can scroll no further (it may be too short to reach that line).
  // Above the first section (the hero) nothing is current, so no highlight is left behind.
  const secs=links.map(a=>document.querySelector(a.getAttribute('href')));
  let current=null, queued=false;
  const mark=()=>{
    queued=false;
    const line=innerHeight*.4;
    let i=-1; secs.forEach((s,k)=>{ if(s && s.offsetParent!==null && s.getBoundingClientRect().top<=line) i=k; });
    if(i>=0 && scrollY+innerHeight>=document.documentElement.scrollHeight-2) i=secs.findLastIndex(s=>s && s.offsetParent!==null);
    const a=links[i]||null;
    if(a===current) return;
    current=a;
    links.forEach(l=>{ const on=l===a; l.classList.toggle('on',on); on ? l.setAttribute('aria-current','location') : l.removeAttribute('aria-current'); });
    // When the links scroll sideways, bring the current one to the middle.
    if(a && nav.scrollWidth>nav.clientWidth)
      nav.scrollTo({left:a.offsetLeft-(nav.clientWidth-a.offsetWidth)/2, behavior:still.matches?'auto':'smooth'});
  };
  const queue=()=>{ if(!queued){ queued=true; requestAnimationFrame(mark); } };
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',queue);
  mark();
})();

/* ===================== YEAR SWITCH: keep your place ===================== */
// Switching years loads the other year's address; this scrolls back to where you were.
(function(){
  let spot = null;
  try{ spot = JSON.parse(sessionStorage.getItem('rav4-scroll')); sessionStorage.removeItem('rav4-scroll'); }catch{}
  if(!spot || typeof spot !== 'object' || !Number.isFinite(spot.dy)) return;
  const sec = typeof spot.id === 'string' ? document.getElementById(spot.id) : null;
  const y = (sec ? sec.offsetTop : 0) + spot.dy;
  if(y > 0) requestAnimationFrame(()=>scrollTo({top:y, behavior:'instant'}));
})();

/* ===================== NO LONE LAST WORDS =====================
   Running text never ends with one word alone on its last line (reading check 7). text-wrap: pretty in
   the CSS catches most, but Chrome skips some paragraphs, so the last two words of each block of running
   text are also joined with a no-break space. Text that a demo rewrites later gets the same treatment.
   Atkinson Hyperlegible draws the non-breaking hyphen (U+2011) the same as a hyphen. */
(function(){
  const SEL = 'p, li, figcaption, dd, .tag, .note, .cap, .why, .aka';
  const join = el=>{
    if(el.closest('svg')) return;
    const nodes = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for(let n = w.nextNode(); n; n = w.nextNode()) nodes.push(n);
    // Walk back past the last word to the space before it.
    let seenWord = false;
    for(let i = nodes.length - 1; i >= 0; i--){
      const t = nodes[i].textContent;
      for(let j = t.length - 1; j >= 0; j--){
        const space = /\s/.test(t[j]);
        if(!space){ seenWord = true; continue; }
        if(!seenWord) continue;
        if(t[j] !== ' ') return;
        // Hyphens in the last word become non-breaking too, so "(high-mid-low)" can't leave "mid-low)" alone.
        const nb = x=>x.replace(/-/g, '\u2011');
        nodes[i].textContent = t.slice(0, j) + '\u00A0' + nb(t.slice(j + 1));
        nodes.slice(i + 1).forEach(n=>{ if(n.textContent.includes('-')) n.textContent = nb(n.textContent); });
        return;
      }
    }
  };
  const all = root=>{ if(root.matches?.(SEL)) join(root); root.querySelectorAll?.(SEL).forEach(join); };
  all(document.body);
  new MutationObserver(list=>{
    const seen = new Set();
    for(const m of list){
      const el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      const block = el?.closest(SEL) || el;
      if(block && !seen.has(block)){ seen.add(block); all(block); }
    }
  }).observe(document.body, {subtree:true, childList:true, characterData:true});
})();
