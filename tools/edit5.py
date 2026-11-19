"""Edit pass 5 on rav4-site/index.html: section sub-nav, responsive sliders (4-up when they fit,
sliding on phones), slider fade fix, copy cleanup, and the "not listed" research results.
Each replacement must match exactly once, so a stale script fails loudly instead of half-applying."""
import sys
path = sys.argv[1]
s = open(path, encoding='utf-8').read()

def rep(old, new):
    global s
    n = s.count(old)
    assert n == 1, f'expected 1 match, found {n}: {old[:90]!r}'
    s = s.replace(old, new)

# ---------- CSS ----------
rep('html{scroll-behavior:smooth;scroll-padding-top:84px}', 'html{scroll-behavior:smooth;scroll-padding-top:72px}')
rep('.wrap{max-width:1160px;', '.wrap{max-width:1240px;')

rep('''/* ---------- top bar ---------- */
.topbar{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--paper) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--rule)}
.topbar .wrap{display:flex;align-items:center;gap:20px;height:64px}''',
'''/* ---------- top bar, then the section nav that sticks under it ---------- */
.topbar .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px;height:60px}''')
rep('''.nav{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;margin-left:auto}
.nav::-webkit-scrollbar{display:none}
.nav a{font-size:16px;text-decoration:none;padding:8px 14px;border-radius:999px;white-space:nowrap;color:var(--ink-2)}''',
'''.subnav{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--paper) 90%,transparent);backdrop-filter:blur(10px);border-block:1px solid var(--rule)}
.nav{position:relative;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;padding:8px 6px;margin:0 -6px}
.nav::-webkit-scrollbar{display:none}
/* When the links scroll sideways (phones), a fade marks each edge that has more links past it. */
.nav.more-r{mask-image:linear-gradient(90deg,#000 calc(100% - 48px),transparent)}
.nav.more-l{mask-image:linear-gradient(90deg,transparent,#000 48px)}
.nav.more-l.more-r{mask-image:linear-gradient(90deg,transparent,#000 48px,#000 calc(100% - 48px),transparent)}
.nav a{font-size:16px;text-decoration:none;padding:7px 14px;border-radius:999px;white-space:nowrap;color:var(--ink-2)}''')
rep('''@media (max-width:820px){.brand span{display:none}.topbar .wrap{gap:10px}}
''', '')

rep('''/* ---------- side-arrow slider: three trims at a time on wide screens ----------
   Every slider shares one view (see VIEW in the script), so moving one moves them all.
   The fourth card peeks in at the edge under a fading arrow button named for it. */
.sl{--peek:84px;--gap:20px;--off:0;--sl-bg:var(--paper);--sl-ink:var(--ink);position:relative}
.sl-track{display:grid;grid-template-columns:minmax(0,1fr);gap:20px;align-items:start}
.sl-btn{display:none}
@media (min-width:980px){
  .sl-view{overflow:hidden;padding:10px 8px 28px;margin:-10px -8px -28px}
  .sl-track{grid-template-columns:none;grid-auto-flow:column;gap:var(--gap);
    grid-auto-columns:calc((100% - var(--peek) - 3 * var(--gap)) / 3);
    transform:translateX(calc(var(--off) * (var(--peek) - (100% - var(--peek) - 3 * var(--gap)) / 3)));
    transition:transform .45s cubic-bezier(.3,.7,.2,1)}
  .sl-track > .sl-out{opacity:.55;transition:opacity .45s}
  .sl-btn{all:unset;box-sizing:border-box;position:absolute;top:-10px;bottom:-28px;width:calc(var(--peek) + 8px);z-index:6;cursor:pointer;
    display:flex;flex-direction:column;align-items:center;padding:0 4px;
    color:var(--sl-ink);font:700 14px/1.15 Overpass,sans-serif;text-align:center}
  .sl-in{display:flex;flex-direction:column;align-items:center;gap:8px;margin:auto 0}
  /* In a slider taller than the screen (packages), the arrow stays near the middle of the screen while it scrolls past. */
  .sl.tall .sl-in{position:sticky;top:calc(50vh - 60px);bottom:calc(50vh - 60px)}
  .sl-btn[hidden]{display:none}
  .sl-next{right:-8px;background:linear-gradient(90deg,color-mix(in srgb,var(--sl-bg) 10%,transparent),var(--sl-bg) 62%)}
  .sl-prev{left:-8px;background:linear-gradient(270deg,color-mix(in srgb,var(--sl-bg) 10%,transparent),var(--sl-bg) 62%)}
  .sl-arrow{width:48px;height:48px;border-radius:50%;background:var(--lane);color:#222;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.22);transition:transform .15s}
  .sl-arrow svg{width:22px;height:22px}
  .sl-btn:hover .sl-arrow{transform:scale(1.08)}
  .sl-btn:focus-visible{outline:none}
  .sl-btn:focus-visible .sl-arrow{outline:3px solid var(--focus);outline-offset:3px}
  .sl-btn small{font:700 12px "Atkinson Hyperlegible",sans-serif;background:var(--lane);color:#222;border-radius:999px;padding:1px 7px}
}''',
'''/* ---------- side-arrow sliders ----------
   Each slider shows as many trims as fit side by side: all four on a wide screen, fewer on smaller ones.
   VIEW in the script sets --col and --gap from the slider's width, and every slider shares one offset,
   so the trim columns line up from section to section. A hidden trim peeks in at the edge under a
   fading arrow button named for it. */
.sl{--col:100%;--gap:20px;--sl-bg:var(--paper);--sl-ink:var(--ink);position:relative}
.sl-view{overflow:hidden;padding:10px 8px 28px;margin:-10px -8px -28px;touch-action:pan-y}
.sl-track{display:grid;grid-auto-flow:column;grid-auto-columns:var(--col);gap:var(--gap);align-items:start;transition:transform .45s cubic-bezier(.3,.7,.2,1)}
.sl-track > *{transition:opacity .45s}
.sl-track > .sl-out{opacity:.55}
/* The button spans only the slider's own box, so its fade never lies over the text around the slider. */
.sl-btn{all:unset;box-sizing:border-box;position:absolute;top:0;bottom:0;z-index:6;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;padding:0 4px;
  color:var(--sl-ink);font:700 14px/1.15 Overpass,sans-serif;text-align:center}
.sl-btn[hidden]{display:none}
.sl-in{display:flex;flex-direction:column;align-items:center;gap:8px;margin:auto 0}
/* In a slider taller than the screen (packages), the arrow stays near the middle of the screen while it scrolls past. */
.sl.tall .sl-in{position:sticky;top:calc(50vh - 60px);bottom:calc(50vh - 60px)}
.sl-next{right:-8px;background:linear-gradient(90deg,color-mix(in srgb,var(--sl-bg) 10%,transparent),var(--sl-bg) 62%)}
.sl-prev{left:-8px;background:linear-gradient(270deg,color-mix(in srgb,var(--sl-bg) 10%,transparent),var(--sl-bg) 62%)}
.sl-arrow{width:48px;height:48px;border-radius:50%;background:var(--lane);color:#222;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.22);transition:transform .15s}
.sl-arrow svg{width:22px;height:22px}
.sl-btn:hover .sl-arrow{transform:scale(1.08)}
.sl-btn:focus-visible{outline:none}
.sl-btn:focus-visible .sl-arrow{outline:3px solid var(--focus);outline-offset:3px}
.sl-btn small{font:700 12px "Atkinson Hyperlegible",sans-serif;background:var(--lane);color:#222;border-radius:999px;padding:1px 7px}
/* A thin sliver (a trim in the middle of the row on a phone) has room for the arrow only; its name stays in the label. */
.sl-btn.slim .sl-in > span:not(.sl-arrow),.sl-btn.slim small{display:none}
@media (max-width:640px){.sl-arrow{width:40px;height:40px}.sl-arrow svg{width:19px;height:19px}.sl-btn{font-size:13px}}''')

rep('position:sticky;top:72px;z-index:20}', 'position:sticky;top:64px;z-index:20}')
rep('  .topbar,.tools,.picker,', '  .topbar,.subnav,.tools,.picker,')

# ---------- header and section nav ----------
rep('''<header class="topbar">
  <div class="wrap">
    <a class="brand" href="#top">RAV4 trim guide <span>2027</span></a>
    <nav class="nav" aria-label="Sections">
      <a href="#picker">What matters to you</a>
      <a href="#steps">What more money buys</a>
      <a href="#packages">Options and prices</a>
      <a href="#features">Features explained</a>
      <a href="#basics">On all four</a>
      <a href="#specs">Full spec list</a>
      <a href="#dealer">Dealer questions</a>
    </nav>
    <button class="theme-btn" id="themeBtn" type="button" aria-label="Switch light or dark mode">◐</button>
  </div>
</header>''',
'''<header class="topbar">
  <div class="wrap">
    <a class="brand" href="#top">RAV4 trim guide <span>2027</span></a>
    <button class="theme-btn" id="themeBtn" type="button" aria-label="Switch light or dark mode">◐</button>
  </div>
</header>
<nav class="subnav" aria-label="Sections">
  <div class="wrap"><div class="nav">
    <a href="#picker">Your priorities</a>
    <a href="#steps">Step-ups</a>
    <a href="#packages">Packages and prices</a>
    <a href="#features">Features</a>
    <a href="#basics">On all four</a>
    <a href="#specs">Spec list</a>
    <a href="#dealer">Dealer questions</a>
  </div></div>
</nav>''')

# ---------- copy ----------
rep('<h1>Which 2027 RAV4 fits you?</h1>', '<h1>Four 2027 RAV4s, side by side</h1>')
rep('''<p class="lede">Three are the RAV4 Hybrid with all-wheel drive, the same engine and the same size. The fourth is the Plug-in Hybrid XSE, which has a bigger battery you charge by plugging in, so short trips can run on electricity alone. Beyond that, the differences are comfort, cameras, convenience and looks.</p>''',
'''<p class="lede">Three are the RAV4 Hybrid. They share the engine, all-wheel drive and body, and differ in comfort, cameras and looks. The fourth, the Plug-in Hybrid XSE, has a bigger battery you charge from an outlet, so short trips can run on electricity alone.</p>''')
rep('<div class="tag">The smart value. Comfortable and well equipped, with fewer extras.</div>',
    '<div class="tag">Well equipped for the price, with fewer extras.</div>')
rep('<div class="tag">The sporty one. Adds the 360° camera, cooled seats and a bigger screen.</div>',
    '<div class="tag">Sporty look. Adds the 360° camera, cooled seats and a bigger screen.</div>')
rep('<div class="tag">The most comfortable. Nearly everything included, softer ride.</div>',
    '<div class="tag">Nearly everything included, on softer-riding 18-inch wheels.</div>')
rep('''      <h2>What matters to you?</h2>
      <p class="lede">Tap the things you care about to see which RAV4 covers the most of them.</p>''',
'''      <h2>Start with your priorities</h2>
      <p class="lede">Tap the things you care about. The cards below show which RAV4 covers the most of them.</p>''')
rep('''      <h2>What the extra money buys</h2>
      <p class="lede">Each step up adds a bundle of features. Tap any item to read more about it.</p>''',
'''      <h2>What each step up adds</h2>
      <p class="lede">Each step up in price adds a set of features. Tap any item to read more about it.</p>''')
rep('are listed with their prices under <a href="#packages">Options and prices</a>.', 'are listed with their prices under <a href="#packages">Packages and prices</a>.')

# ---------- "not listed" research: safety helpers ----------
rep('''   why:'Front Cross-Traffic Alert is the one most people end up appreciating: pulling out of a parking spot between two big trucks is much less of a guess. Traffic Jam Assist is a real relief on long commutes in heavy traffic.',
   trims:[['opt','XLE Premium Driver Assist Package: $650 ($2,875 with the packages it requires)'],['std'],['std'],['nl','Toyota’s Plug-in page doesn’t mention these. Ask the dealer.']]},''',
'''   why:'Front Cross-Traffic Alert is the one most people end up appreciating: pulling out of a parking spot between two big trucks is much less of a guess. Traffic Jam Assist is a real relief on long commutes in heavy traffic. It needs an active Drive Connect trial or subscription and 5G coverage.',
   trims:[['opt','XLE Premium Driver Assist Package: $650 ($2,875 with the packages it requires)'],['std'],['std'],['std','Toyota’s 2027 announcement confirms Lane Change Assist and Traffic Jam Assist. Ask the dealer to confirm the other two.']]},''')
rep('''  ['assist','Some safety helpers aren’t listed','Toyota’s Plug-in page doesn’t mention Front Cross-Traffic Alert, Lane Change Assist, Traffic Jam Assist, Driver Monitor or Safe Exit Alert. Ask the dealer.'],
''', '')
rep('''  ['On the Plug-in XSE, ask about the safety helpers Toyota’s page leaves out.','Toyota’s Plug-in page doesn’t mention Front Cross-Traffic Alert, Lane Change Assist, Traffic Jam Assist, Driver Monitor or Safe Exit Alert, which every Hybrid XSE has. Ask whether the Plug-in has them.'],''',
'''  ['On the Plug-in XSE, confirm Front Cross-Traffic Alert and Driver Monitor.','Toyota says every XSE has Lane Change Assist and Traffic Jam Assist, but its Plug-in page doesn’t mention the two helpers that come with them on the Hybrid XSE.'],''')

# ---------- seat fabric: same suede-like inserts on both XSEs ----------
rep('''   aka:'SofTex®-trimmed seats; SofTex®/synthetic suede on the XSE; Mixed Media/SofTex on the Plug-in XSE',
   what:'SofTex is Toyota’s name for a high-quality synthetic leather. It looks and feels much like leather, wipes clean easily and doesn’t need conditioning. The Hybrid XSE mixes it with a soft suede-like fabric in the middle of the seat, which feels grippy and doesn’t get as hot or cold. The Plug-in XSE mixes it with a cloth fabric instead.',
   why:'None of the four use real leather. SofTex is durable and easy to live with; the fabric inserts on the XSEs are a matter of taste and can show lint or pet hair more.',
   trims:[['std','SofTex'],['std','SofTex + synthetic suede'],['std','SofTex'],['std','SofTex + fabric']]},''',
'''   aka:'SofTex®-trimmed seats; SofTex® and synthetic suede on both XSEs (the Plug-in page calls it Mixed Media/SofTex)',
   what:'SofTex is Toyota’s name for a high-quality synthetic leather. It looks and feels much like leather, wipes clean easily and doesn’t need conditioning. Both XSEs mix it with a soft suede-like fabric in the middle of the seat, which feels grippy and doesn’t get as hot or cold. Toyota’s Plug-in page uses the vaguer name “Mixed Media”, but Toyota’s 2027 announcement and Toyota Canada both describe the same suede and SofTex mix.',
   why:'None of the four use real leather. SofTex is durable and easy to live with; the suede-like inserts on the XSEs are a matter of taste and can show lint or pet hair more.',
   trims:[['std','SofTex'],['std','SofTex + synthetic suede'],['std','SofTex'],['std','SofTex + synthetic suede']]},''')
rep('''  ['material','Different seat fabric','Cloth inserts instead of the suede-like ones.'],
''', '')
rep("          {t:'Same as XSE, with cloth inserts instead of suede-like ones'}]},",
    "          {t:'Same as XSE. Toyota’s Plug-in page calls the trim “Mixed Media”.'}]},")

# ---------- spec merges for the remaining "not listed" rows ----------
rep('''         'Color-keyed upper front bumper, piano black overfenders and lower front bumper'],''',
'''         'Color-keyed upper front bumper, piano black overfenders and lower front bumper',
         'Wide overfenders with black cladding and an ascending belt line with chiseled body panels'],''')
rep('''  {cat:'Inside', label:'Gear selector',''',
'''  {cat:'Inside', label:'Interior lights', common:'A cargo area light on all four.',
   from:['LED front-seat reading lights, dome light and cargo area light','Cargo area light'],
   cells:[{t:'LED reading lights up front and a dome light'},{t:'Same as XLE Premium'},{t:'Same as XLE Premium'},
          {t:'Front map lights (listed with the overhead console). Toyota doesn’t mention a dome light.'}]},
  {cat:'Inside', label:'Center console', common:'Covered storage, a reversible armrest tray, two cupholders, a front storage tray, and parking brake and Brake Hold buttons on all four.',
   from:['Center console with covered storage compartment, reversible armrest/console tray, two cup holders, drive mode (Trail, Snow, Normal and EV Mode ), auto LSD/VSC, Electric Parking Brake (EPB) and automatic Brake Hold controls, and front storage tray',
         'Center console with covered storage compartment, reversible armrest/console tray, two cup holders, drive mode (snow, normal and EV mode), Electric Parking Brake (EPB) and automatic Brake Hold controls, and front storage tray'],
   cells:[{t:'Drive mode buttons include Trail, plus an auto LSD/VSC button'},{t:'Same as XLE Premium'},{t:'Same as XLE Premium'},
          {t:'Toyota lists Snow, Normal and EV buttons here, and the Trail mode under the engine'}]},
  {cat:'Inside', label:'Gear selector',''')
rep('''  {cat:'Safety & driver help', label:'Blind spot warning', common:'Blind Spot Monitor and Rear Cross-Traffic Alert on all four.',
   from:['Blind Spot Monitor (BSM) with Rear Cross-Traffic Alert (RCTA) and Safe Exit Alert (SEA)','Blind Spot Monitor (BSM) with Rear Cross-Traffic Alert (RCTA)'],
   cells:[{t:'Plus Safe Exit Alert'},{t:'Plus Safe Exit Alert'},{t:'Plus Safe Exit Alert'},{t:'Toyota doesn’t list Safe Exit Alert'}]},''',
'''  {cat:'Safety & driver help', label:'Blind spot warning', common:'Blind Spot Monitor, Rear Cross-Traffic Alert and Safe Exit Alert on all four.',
   from:['Blind Spot Monitor (BSM) with Rear Cross-Traffic Alert (RCTA) and Safe Exit Alert (SEA)','Blind Spot Monitor (BSM) with Rear Cross-Traffic Alert (RCTA)'],
   cells:[{t:'All three'},{t:'All three'},{t:'All three'},{t:'All three. Toyota’s Plug-in page leaves out Safe Exit Alert, but its 2027 announcement lists it on every RAV4.'}]},
  {cat:'Safety & driver help', label:'Extra driver-assist bundle', common:'Front Cross-Traffic Alert, Lane Change Assist, Traffic Jam Assist and Driver Monitor.',
   from:['Front Cross-Traffic Alert (FCTA), Lane Change Assist (LCA), Traffic Jam Assist (TJA) and Driver Monitor'],
   cells:[{t:'Not included', opt:'All four (XLE Premium Driver Assist Package)'},{t:'All four'},{t:'All four'},
          {t:'Lane Change Assist and Traffic Jam Assist, per Toyota’s 2027 announcement. Toyota doesn’t say about the other two.'}]},''')
rep('''   cells:[{t:'100/40 kW'},{t:'100/40 kW'},{t:'100/40 kW'},{t:'150/40 kW'}]},
];''',
'''   cells:[{t:'100/40 kW'},{t:'100/40 kW'},{t:'100/40 kW'},{t:'150/40 kW'}]},
  {cat:'Engine & drivetrain', label:'Hybrid battery',
   from:['Rated voltage: 248V (Li-ion)'],
   cells:[{t:'248-volt lithium-ion'},{t:'Same as XLE Premium'},{t:'Same as XLE Premium'},
          {t:'A much larger lithium-ion battery (22.7 kWh, per Toyota Canada). Toyota’s US page doesn’t give its voltage.'}]},
];''')
rep('''<p class="muted">The Plug-in XSE comes from a separate Toyota page that words some lines differently and leaves some out. “Not listed” means Toyota’s Plug-in page doesn’t mention it, so ask the dealer. It doesn’t mean the car lacks it.</p>''',
'''<p class="muted">The Plug-in XSE comes from a separate Toyota page that words some lines differently and leaves some out. Where Toyota’s 2027 RAV4 announcement or Toyota Canada fills a gap, the row says so. “Not listed” marks what’s left: Toyota doesn’t say either way, so ask the dealer.</p>''')
rep('''Package and paint prices come from Toyota's online build tool in the same month.''',
'''Package and paint prices come from Toyota's online build tool in the same month. Items the Plug-in page leaves out were checked against Toyota's 2027 RAV4 press release (November 5, 2026) and Toyota Canada's 2026 RAV4 Plug-in Hybrid product summary, which is also the source of the Plug-in's battery size.''')

# ---------- sliders: script ----------
start = s.index('/* ===================== SIDE-ARROW SLIDERS =====================')
end = s.index('/* ===================== PICKER ===================== */')
s = s[:start] + r'''/* ===================== SIDE-ARROW SLIDERS =====================
   Each [data-sl] block shows as many trims as fit side by side, chosen from the slider's own width.
   A hidden trim peeks in at the edge under an arrow button named for it. All sliders share one
   offset, so the trim columns line up from section to section. */
const VIEW = (function(){
  // Widest first: cards shown, how much of a hidden neighbor peeks in, and the gap between cards (px).
  const LAYOUTS = [
    {min:1060, shown:4, peek:0,  gap:20},
    {min:836,  shown:3, peek:48, gap:20},
    {min:568,  shown:2, peek:40, gap:16},
    {min:0,    shown:1, peek:36, gap:12},
  ];
  const ARROW = d=>`<span class="sl-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="${d<0?'M12.5 4 6.5 10l6 6':'M7.5 4l6 6-6 6'}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  let off = 0;
  const maxOf = new Map();
  const sliders = [...document.querySelectorAll('[data-sl]')];
  // A slider that can't scroll as far as the shared offset shows its last position; moving starts from there.
  const move = (sl,dir)=>{ const max=maxOf.get(sl)||0; off=Math.min(Math.max(Math.min(off,max)+dir,0),max); apply(); };
  sliders.forEach(sl=>{
    sl.insertAdjacentHTML('beforeend',
      `<button type="button" class="sl-btn sl-prev" data-dir="-1"></button><button type="button" class="sl-btn sl-next" data-dir="1"></button>`);
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
      const L=LAYOUTS.find(l=>w>=l.min), shown=Math.min(L.shown,n), max=n-shown, o=Math.min(off,max);
      maxOf.set(sl,max);
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

''' + s[end:]

# ---------- section nav: current section, edge fades ----------
rep('''/* ===================== NAV HIGHLIGHT ===================== */
(function(){
  const links=[...document.querySelectorAll('.nav a')];
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)); }}),{rootMargin:'-40% 0px -55% 0px'});
  links.forEach(a=>{const s=document.querySelector(a.getAttribute('href')); if(s) io.observe(s);});
})();''',
'''/* ===================== SECTION NAV ===================== */
(function(){
  const nav=$('.nav'), links=[...nav.querySelectorAll('a')];
  const still=matchMedia('(prefers-reduced-motion: reduce)');
  const edges=()=>{
    nav.classList.toggle('more-l', nav.scrollLeft>2);
    nav.classList.toggle('more-r', nav.scrollLeft+nav.clientWidth < nav.scrollWidth-2);
  };
  nav.addEventListener('scroll',edges,{passive:true});
  new ResizeObserver(edges).observe(nav);
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return;
    links.forEach(a=>{
      const on=a.getAttribute('href')==='#'+e.target.id;
      a.classList.toggle('on',on);
      on ? a.setAttribute('aria-current','location') : a.removeAttribute('aria-current');
      // When the links scroll sideways, bring the current one to the middle.
      if(on && nav.scrollWidth>nav.clientWidth)
        nav.scrollTo({left:a.offsetLeft-(nav.clientWidth-a.offsetWidth)/2, behavior:still.matches?'auto':'smooth'});
    });
  }),{rootMargin:'-40% 0px -55% 0px'});
  links.forEach(a=>{const s=document.querySelector(a.getAttribute('href')); if(s) io.observe(s);});
})();''')

open(path, 'w', encoding='utf-8').write(s)
print('ok')
