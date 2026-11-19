import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
E = []
def r(old, new, count=1):
    E.append((old, new, count))

# ---------- tokens ----------
r('''  --xle-soft:#E6EEF6; --xse-soft:#F8E7E9; --ltd-soft:#F4ECDF;
''', '''  --xle-soft:#E6EEF6; --xse-soft:#F8E7E9; --ltd-soft:#F4ECDF;
  --phv:#5B4A9E; --phv-soft:#ECE8F7;
''')
r('''--xle:#7FB0E0; --xse:#F07A87; --ltd:#D9A85E; --xle-soft:#1D2A36; --xse-soft:#35202A; --ltd-soft:#2F2719;
''', '''--xle:#7FB0E0; --xse:#F07A87; --ltd:#D9A85E; --xle-soft:#1D2A36; --xse-soft:#35202A; --ltd-soft:#2F2719;
    --phv:#B3A3EE; --phv-soft:#28233A;
''', 2)

# ---------- hero road ----------
r('''.road{position:relative;margin-top:44px;background:var(--asphalt);color:#fff;border-radius:28px 28px 0 0;padding:40px 0 34px;overflow:hidden}
.road-grid::before{content:"";position:absolute;left:-100vw;right:-100vw;top:116px;height:6px;background:repeating-linear-gradient(90deg,var(--lane) 0 46px,transparent 46px 82px);opacity:.9}
.road-grid{position:relative;display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:start;gap:8px}
.car{text-align:center;text-decoration:none;color:#fff;display:block;padding:0 6px}
.car img{position:relative;width:100%;height:146px;object-fit:contain;object-position:center bottom;margin:0 auto -6px;filter:drop-shadow(0 18px 14px rgba(0,0,0,.45))}
.car .name{font:800 clamp(22px,2.6vw,30px) Overpass,sans-serif;margin-top:18px}
.car .price{font:700 20px Overpass,sans-serif;color:#E6E9EA}
.car .tag{font-size:16px;color:#BFC6CA;max-width:26ch;margin:6px auto 0}
.car .bar{height:5px;width:56px;border-radius:3px;margin:12px auto 0}
.jump{align-self:start;margin-top:91px;text-align:center;font:800 18px Overpass,sans-serif;color:var(--asphalt);background:var(--lane);padding:8px 12px;border-radius:10px;white-space:nowrap;position:relative}
.jump small{display:block;font:500 13px "Atkinson Hyperlegible",sans-serif}
@media (max-width:820px){
  .road-grid{grid-template-columns:1fr;gap:26px}
  .road-grid::before{display:none}
  .jump{margin:0 auto;justify-self:center}
  .car img{height:auto;max-width:320px}
}
''', '''.road{position:relative;margin-top:44px;background:var(--asphalt);color:#fff;border-radius:28px 28px 0 0;padding:40px 0 34px;overflow:hidden}
/* The lane line runs the full width of the road, behind the cars. */
.road::before{content:"";position:absolute;left:0;right:0;top:156px;height:6px;background:repeating-linear-gradient(90deg,var(--lane) 0 46px,transparent 46px 82px);opacity:.9}
.road .sl{--sl-bg:var(--asphalt);--sl-ink:#fff}
.car{text-align:center;text-decoration:none;color:#fff;display:block;padding:0 6px;position:relative}
.car img{position:relative;width:100%;height:146px;object-fit:contain;object-position:center bottom;margin:0 auto -6px;filter:drop-shadow(0 18px 14px rgba(0,0,0,.45))}
.car .name{font:800 clamp(22px,2.6vw,30px) Overpass,sans-serif;margin-top:18px}
.car .price{font:700 20px Overpass,sans-serif;color:#E6E9EA}
.car .jump{display:inline-block;margin-top:8px;font:800 15px Overpass,sans-serif;color:var(--asphalt);background:var(--lane);padding:3px 10px;border-radius:8px}
.car .jump.first{background:transparent;color:#BFC6CA;box-shadow:inset 0 0 0 1.5px #5A6166}
.car .tag{font-size:16px;color:#BFC6CA;max-width:26ch;margin:8px auto 0}
.car .bar{height:5px;width:56px;border-radius:3px;margin:12px auto 0}
@media (max-width:979px){
  .road::before{display:none}
  .car img{height:auto;max-width:320px}
}
''')

# ---------- side-arrow slider ----------
r('''section{padding:88px 0 0}
''', '''section{padding:88px 0 0}

/* ---------- side-arrow slider: three trims at a time on wide screens ----------
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
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:0 4px;
    color:var(--sl-ink);font:700 14px/1.15 Overpass,sans-serif;text-align:center}
  .sl-btn[hidden]{display:none}
  .sl-next{right:-8px;background:linear-gradient(90deg,color-mix(in srgb,var(--sl-bg) 10%,transparent),var(--sl-bg) 62%)}
  .sl-prev{left:-8px;background:linear-gradient(270deg,color-mix(in srgb,var(--sl-bg) 10%,transparent),var(--sl-bg) 62%)}
  .sl-arrow{width:48px;height:48px;border-radius:50%;background:var(--lane);color:#222;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.22);transition:transform .15s}
  .sl-arrow svg{width:22px;height:22px}
  .sl-btn:hover .sl-arrow{transform:scale(1.08)}
  .sl-btn:focus-visible{outline:none}
  .sl-btn:focus-visible .sl-arrow{outline:3px solid var(--focus);outline-offset:3px}
  .sl-btn small{font:700 12px "Atkinson Hyperlegible",sans-serif;background:var(--lane);color:#222;border-radius:999px;padding:1px 7px}
}
''')

# ---------- status pills ----------
r('''.pill.no{background:var(--no-soft);color:var(--no);font-weight:400}
''', '''.pill.no{background:var(--no-soft);color:var(--no);font-weight:400}
.pill.nl{background:transparent;color:var(--ink-2);font-weight:400;box-shadow:inset 0 0 0 1.5px var(--no);border-radius:999px}
''')

# ---------- scores ----------
r('''.scores{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px}
@media (max-width:820px){.scores{grid-template-columns:1fr}}
''', '''.picker .sl{--sl-bg:var(--card);margin-top:26px}
''')

# ---------- steps ----------
r('''@media (max-width:900px){.steps{grid-template-columns:1fr}}
''', '''@media (max-width:900px){.steps{grid-template-columns:1fr}}
.step.wide{grid-column:1/-1}
.step.wide .step-body{display:grid;grid-template-columns:1fr 1fr;gap:0 40px}
@media (max-width:900px){.step.wide .step-body{grid-template-columns:1fr}.step.wide .step-body > div + div{margin-top:16px}}
''')

# ---------- feature availability strip: four across, two by two in narrow cards ----------
r('''.f-text{padding:28px 30px}
''', '''.f-text{padding:28px 30px;container-type:inline-size}
''')
r('''.avail{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:22px;padding-top:18px;border-top:1px solid var(--rule)}
''', '''.avail{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px 10px;margin-top:22px;padding-top:18px;border-top:1px solid var(--rule)}
@container (max-width:600px){.avail{grid-template-columns:repeat(2,minmax(0,1fr))}}
''')
r('''@media (max-width:480px){.avail{grid-template-columns:1fr}.avail div{grid-template-columns:120px 1fr;align-items:center}.avail .note{grid-column:2}}
''', '''@container (max-width:380px){.avail{grid-template-columns:1fr}.avail div{grid-template-columns:120px 1fr;align-items:center}.avail .note{grid-column:2}}
''')

# ---------- interactive demos: electric range ----------
r('''.scr-scale{display:block;width:100%;max-width:440px;height:auto;margin:0 auto}
''', '''.scr-scale{display:block;width:100%;max-width:440px;height:auto;margin:0 auto}
.ev-demo label{font:700 18px Overpass,sans-serif;display:block}
.ev-demo input[type=range]{width:100%;accent-color:var(--phv);margin:10px 0 2px}
.ev-bar{display:flex;height:22px;border-radius:8px;overflow:hidden;background:var(--rule)}
.ev-bar span{transition:flex-grow .2s}
.ev-bar .e{background:var(--phv)}
.ev-bar .g{background:var(--no)}
.ev-key{display:flex;gap:16px;flex-wrap:wrap;font-size:15px;color:var(--ink-2)}
.ev-key i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-1px}
''')

# ---------- trio photos: four across ----------
r('''.trio-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
''', '''.trio-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
''')
r('''@media (max-width:700px){.trio-grid{grid-template-columns:1fr}}
''', '''@media (max-width:820px){.trio-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
''')

# ---------- packages ----------
r('''.pk-callouts{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
@media (max-width:900px){.pk-callouts{grid-template-columns:1fr}}
''', '''.pk-callouts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:24px}
@media (max-width:1000px){.pk-callouts{grid-template-columns:1fr}}
''')
r('''.pk-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;align-items:start}
@media (max-width:980px){.pk-grid{grid-template-columns:1fr}}
''', '')

# ---------- spec table: four trim columns ----------
r('''.spec-table thead th.t{width:19%}
''', '''.spec-table thead th.t{width:16%}
''')
r('''  .spec-table tr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--rule)}
''', '''  .spec-table tr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid var(--rule)}
''')

# ---------- HTML ----------
r('''<meta name="description" content="A comparison of the 2027 Toyota RAV4 Hybrid XLE Premium, XSE and Limited.">''',
  '''<meta name="description" content="A comparison of the 2027 Toyota RAV4 Hybrid XLE Premium, XSE and Limited, and the RAV4 Plug-in Hybrid XSE.">''')
r('''<a class="brand" href="#top">RAV4 trim guide <span>2027 Hybrid</span></a>''', '''<a class="brand" href="#top">RAV4 trim guide <span>2027</span></a>''')
r('''<a href="#basics">On all three</a>''', '''<a href="#basics">On all four</a>''')
r('''  <h1>XLE Premium, XSE or Limited?</h1>
  <p class="lede">All three are the 2027 RAV4 Hybrid with all-wheel drive, the same engine, the same safety basics and the same size. The differences are comfort, cameras, convenience and looks.</p>
''', '''  <h1>Which 2027 RAV4 fits you?</h1>
  <p class="lede">Three are the RAV4 Hybrid with all-wheel drive, the same engine and the same size. The fourth is the Plug-in Hybrid XSE, which has a bigger battery you charge by plugging in, so short trips can run on electricity alone. Beyond that, the differences are comfort, cameras, convenience and looks.</p>
''')
r('''  <div class="road" role="group" aria-label="The three trims, lowest to highest price">
    <div class="road-grid wrap">
      <div class="car">
        <img src="img/trim-4444.png" alt="RAV4 XLE Premium in silver" width="900" height="402">
        <div class="name">XLE Premium</div>
        <div class="price">$38,100</div>
        <div class="tag">The smart value. Comfortable and well equipped, with fewer extras.</div>
        <div class="bar" style="background:var(--xle)"></div>
      </div>
      <div class="jump" aria-label="3,800 dollars more">+$3,800<small>to step up</small></div>
      <div class="car">
        <img src="img/trim-4530.png" alt="RAV4 XSE in silver with a black roof and black wheels" width="900" height="402">
        <div class="name">XSE</div>
        <div class="price">$41,900</div>
        <div class="tag">The sporty one. Adds the 360° camera, cooled seats and a bigger screen.</div>
        <div class="bar" style="background:var(--xse)"></div>
      </div>
      <div class="jump" aria-label="2,000 dollars more">+$2,000<small>to step up</small></div>
      <div class="car">
        <img src="img/trim-4534.png" alt="RAV4 Limited in blue" width="900" height="402">
        <div class="name">Limited</div>
        <div class="price">$43,900</div>
        <div class="tag">The most comfortable. Nearly everything included, softer ride.</div>
        <div class="bar" style="background:var(--ltd)"></div>
      </div>
    </div>
  </div>
  <div class="road-foot">
    <span>Prices are Toyota's starting MSRP. Add a destination fee of <b>$1,595</b>, plus tax, registration and any <a href="#packages">options</a>.</span>
    <span>Gas mileage: <b>41 mpg</b> (XLE Premium), <b>40 mpg</b> (XSE and Limited), combined.</span>
  </div>
''', '''  <div class="road" role="group" aria-label="The four trims, lowest to highest price">
    <div class="wrap"><div class="sl" data-sl>
      <div class="sl-view"><div class="sl-track">
      <div class="car">
        <img src="img/trim-4444.png" alt="RAV4 XLE Premium in silver" width="900" height="402">
        <div class="name">XLE Premium</div>
        <div class="price">$38,100</div>
        <span class="jump first">Lowest price</span>
        <div class="tag">The smart value. Comfortable and well equipped, with fewer extras.</div>
        <div class="bar" style="background:var(--xle)"></div>
      </div>
      <div class="car">
        <img src="img/trim-4530.png" alt="RAV4 XSE in silver with a black roof and black wheels" width="900" height="402">
        <div class="name">XSE</div>
        <div class="price">$41,900</div>
        <span class="jump">+$3,800 over the XLE Premium</span>
        <div class="tag">The sporty one. Adds the 360° camera, cooled seats and a bigger screen.</div>
        <div class="bar" style="background:var(--xse)"></div>
      </div>
      <div class="car">
        <img src="img/trim-4534.png" alt="RAV4 Limited in blue" width="900" height="402">
        <div class="name">Limited</div>
        <div class="price">$43,900</div>
        <span class="jump">+$2,000 over the XSE</span>
        <div class="tag">The most comfortable. Nearly everything included, softer ride.</div>
        <div class="bar" style="background:var(--ltd)"></div>
      </div>
      <div class="car">
        <img src="img/trim-4550.png" alt="RAV4 Plug-in Hybrid XSE in gray with a black roof and black wheels" width="900" height="402">
        <div class="name">Plug-in XSE</div>
        <div class="price">$47,800</div>
        <span class="jump">+$3,900 over the Limited</span>
        <div class="tag">The XSE with a plug. About 50 miles on electricity per charge, then a regular hybrid.</div>
        <div class="bar" style="background:var(--phv)"></div>
      </div>
      </div></div>
    </div></div>
  </div>
  <div class="road-foot">
    <span>Prices are Toyota's starting MSRP. Add a destination fee of <b>$1,595</b>, plus tax, registration and any <a href="#packages">options</a>.</span>
    <span>Gas mileage: <b>41 mpg</b> (XLE Premium), <b>40 mpg</b> (XSE and Limited), combined. The <b>Plug-in XSE</b> goes about <b>50 miles</b> on a charge, then gets <b>39 mpg</b>.</span>
  </div>
''')
r('''        <span class="pill no">Not offered</span>
      </div>
      <div class="scores" id="scores" aria-live="polite"></div>
      <p class="empty-note" id="emptyNote">Pick a few priorities above to see how the three compare.</p>''',
  '''        <span class="pill no">Not offered</span>
        <span class="pill nl">Not listed by Toyota</span>
      </div>
      <div class="sl" data-sl id="scoresSl"><div class="sl-view"><div class="sl-track scores" id="scores" aria-live="polite"></div></div></div>
      <p class="empty-note" id="emptyNote">Pick a few priorities above to see how the four compare.</p>''')
r('''          <h4>You give up</h4>
          <ul class="gain" id="lose2"></ul>
        </div>
      </article>
''', '''          <h4>You give up</h4>
          <ul class="gain" id="lose2"></ul>
        </div>
      </article>
      <article class="step wide">
        <div class="step-top"><span class="from" style="color:var(--xse)">Hybrid XSE</span><span class="arrow" aria-hidden="true"></span><span class="cost">+$5,900</span><span class="arrow" aria-hidden="true"></span><span class="to" style="color:var(--phv)">Plug-in XSE</span></div>
        <div class="step-body">
          <div><h4>You gain</h4>
          <ul class="gain" id="gain3"></ul></div>
          <div><h4>Worth knowing</h4>
          <ul class="gain" id="lose3"></ul></div>
        </div>
      </article>
''')
r('''<p class="pk-callout"><b>A fully loaded XLE Premium is still the cheapest.</b> With every package it comes to $40,975, which is $925 less than a base XSE. It gains the panoramic roof and the extra driver-assist features, but it can never get the 360° camera, cooled seats or the bigger screen.</p>
''', '''<p class="pk-callout"><b>A fully loaded XLE Premium is still the cheapest.</b> With every package it comes to $40,975, which is $925 less than a base XSE. It gains the panoramic roof and the extra driver-assist features, but it can never get the 360° camera, cooled seats or the bigger screen.</p>
      <p class="pk-callout"><b>The Plug-in XSE’s top package costs more, and adds more.</b> Its $1,170 Driver Assist Package includes the head-up display and paddle shifters along with self-parking. Fully loaded, the Plug-in XSE comes to $50,665.</p>
''')
r('''    <div class="pk-grid" id="pkGrid"></div>''', '''    <div class="sl" data-sl><div class="sl-view"><div class="sl-track pk-grid" id="pkGrid"></div></div></div>''')
r('''      <h2>What all three have</h2>''', '''      <h2>What all four have</h2>''')
r('''<p class="lede">Every line from Toyota's comparison page for these three trims. Where Toyota repeats a long line with small changes for each trim, it’s combined into one row that shows only what changes; open “Toyota’s wording” to see the original lines. Rows that differ are marked with a yellow edge.</p>''',
  '''<p class="lede">Every line from Toyota's comparison pages for these four trims. Where Toyota repeats a long line with small changes for each trim, it’s combined into one row that shows only what changes; open “Toyota’s wording” to see the original lines. Rows that differ are marked with a yellow edge.</p>
      <p class="muted">The Plug-in XSE comes from a separate Toyota page that words some lines differently and leaves some out. “Not listed” means Toyota’s Plug-in page doesn’t mention it, so ask the dealer. It doesn’t mean the car lacks it.</p>''')
r('''<p>Features, prices and fuel economy come from Toyota's 2027 RAV4 comparison page for the XLE Premium AWD (4444), XSE AWD (4530) and Limited AWD (4534), as published in November 2026.''',
  '''<p>Features, prices and fuel economy come from Toyota's 2027 RAV4 comparison page for the XLE Premium AWD (4444), XSE AWD (4530) and Limited AWD (4534), and its 2027 RAV4 Plug-in Hybrid comparison page for the XSE (4550), as published in November 2026.''')

for old, new, n in E:
    c = s.count(old)
    if c != n:
        sys.exit(f'expected {n} match(es), found {c}:\n{old[:200]}')
    s = s.replace(old, new)
open(p, 'w', encoding='utf-8').write(s)
print('applied', len(E), 'edits')
