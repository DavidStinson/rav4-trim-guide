// Model-year checks for rav4-site. Run in the page after it loads (the harness does this):
// `yearCheck(2026)` returns a list of failures for the page loaded with ?year=2026; empty means pass.
// The expected numbers below are copied from Toyota's comparison pages, not from the page's own data,
// so a typo in YEAR_FACTS fails here. Every price on the page includes Toyota's $1,595 destination fee,
// so the starting prices below are the MSRP plus $1,595 (2027 MSRP $38,100, $41,900, $43,900, $47,800;
// 2026 MSRP $37,500, $41,300, $43,300, $47,200).
window.yearCheck = function yearCheck(year){
  const fails = [];
  const EXPECT = {
    2027:{prices:['$39,695','$43,495','$45,495','$49,395'], mpgLine:['41 mpg','40 mpg','39 mpg','50 miles'], diffPanel:false,
          specText:['$49,395','102','321 hp combined'], featText:['50 miles','102 MPGe','321 horsepower']},
    2026:{prices:['$39,095','$42,895','$44,895','$48,795'], mpgLine:['41 mpg','40 mpg','52 miles'], diffPanel:true,
          specText:['$48,795','96','324 hp combined','236 hp combined'], featText:['52 miles','96 MPGe','324 horsepower','CCS1']},
  }[year];
  if(!EXPECT) return [`no expectations for ${year}`];
  const txt = el => el ? el.textContent.replace(/\s+/g,' ') : '';

  // 1. The page says which year it is showing, in the top bar, the heading and the switch.
  if(txt(document.querySelector('.brand span')).trim() !== String(year)) fails.push(`top bar shows "${txt(document.querySelector('.brand span'))}", expected ${year}`);
  if(!txt(document.querySelector('.hero h1')).includes(String(year))) fails.push(`heading "${txt(document.querySelector('.hero h1'))}" doesn't name ${year}`);
  const cur = document.querySelector('.year-switch [aria-current="page"]');
  if(!cur || txt(cur).trim() !== String(year)) fails.push(`year switch marks "${txt(cur)}" as current, expected ${year}`);

  // 2. Hero prices and the mileage line.
  const prices = [...document.querySelectorAll('.road .car .price')].map(el=>txt(el).trim());
  if(prices.join('|') !== EXPECT.prices.join('|')) fails.push(`hero prices ${prices.join(', ')}; expected ${EXPECT.prices.join(', ')}`);
  const foot = txt(document.querySelector('.road-foot'));
  EXPECT.mpgLine.forEach(s=>{ if(!foot.includes(s)) fails.push(`mileage line lacks "${s}": ${foot}`); });

  // 2b. The destination fee and the tax and registration caveat are said once, under the hero prices.
  const body = document.body.innerText.replace(document.querySelector('.road-foot')?.innerText||'', '');
  if(!/\$1,595 destination fee/.test(foot) || !/tax/.test(foot) || !/registration/.test(foot)) fails.push(`hero note should say prices include the $1,595 destination fee and not tax or registration: ${foot}`);
  [/1,595/, /destination fee,? (?!taxes)/i, /before tax/i, /tax (and|or) registration/i, /MSRP/].forEach(re=>{
    const m = body.match(new RegExp('.{0,60}'+re.source+'.{0,40}', re.flags));
    if(m) fails.push(`price caveat repeated outside the hero note: "${m[0]}"`);
  });

  // 2c. No "as of" dates in the page itself; the sources in the footer carry them.
  const mainText = document.querySelector('main').innerText;
  const dated = mainText.match(/.{0,50}\b(January|February|March|April|May|June|July|August|September|October|November|December)\b.{0,30}/);
  if(dated) fails.push(`dated fine print above the footer: "${dated[0]}"`);

  // 2d. Fine print trimmed from the sections: no package note, only the daylight tip under the
  //     colors, no build-tool or source notes in the captions and calculators, and the Edmunds
  //     photo credit lives in the footer.
  if(document.querySelector('#packages .pk-note')) fails.push('packages still has its small-print note');
  const cpNote = txt(document.querySelector('#colors .pk-note')).trim();
  if(cpNote !== 'Paint looks different in daylight, so see it in person before you decide.') fails.push(`colors note reads "${cpNote}"`);
  [/build[- ]tool/i, /Illustration:/, /Photo: Edmunds/, /AAA|EnergySage/].forEach(re=>{
    const m = mainText.match(new RegExp('.{0,50}'+re.source+'.{0,30}', re.flags));
    if(m) fails.push(`fine print still in the page: "${m[0]}"`);
  });
  const edmunds = (txt(document.querySelector('footer')).match(/Edmunds/g) || []).length;
  if(edmunds !== 1) fails.push(`footer should credit the Edmunds backup-camera photo once; it does ${edmunds} times`);

  // 3. The "what's different" panel shows only for 2026.
  const panel = document.querySelector('#yearDiff');
  const shown = !!panel && !panel.hidden && panel.getClientRects().length>0;
  if(shown !== EXPECT.diffPanel) fails.push(`year-difference panel ${shown?'shows':'is hidden'} for ${year}`);

  // 4. Package cards start from that year's base prices.
  const pkBase = [...document.querySelectorAll('.pk-head p')].map(el=>txt(el).replace('Starts at ','').trim());
  if(pkBase.join('|') !== EXPECT.prices.join('|')) fails.push(`package cards start at ${pkBase.join(', ')}`);

  // 4b. Package totals add each package to the starting price, and the cards no longer list paint prices.
  const pkCard = document.querySelector('.pk[data-t="xle"]');
  const pkTotal = ()=>txt(pkCard?.querySelector('.pk-total .big')).trim();
  const start = Object.fromEntries(['xle','xse','ltd','phv'].map((t,i)=>[t, +EXPECT.prices[i].replace(/\D/g,'')]));
  const usd = n=>'$'+n.toLocaleString('en-US');
  const pkLevel = i=>pkCard?.querySelector(`.rung[data-i="${i}"] button`)?.click();
  pkLevel(0);
  if(pkTotal() !== usd(start.xle)) fails.push(`XLE with no packages shows ${pkTotal()}; expected ${usd(start.xle)}`);
  pkLevel(2);
  if(pkTotal() !== usd(start.xle+375+1850)) fails.push(`XLE with two packages shows ${pkTotal()}; expected ${usd(start.xle+2225)}`);
  pkLevel(0);
  if(document.querySelector('.pk-paint')) fails.push('package cards still list paint prices');

  // 5. Spec list uses that year's data, and every merge written for that year found its lines.
  const diffBox = document.querySelector('#diffOnly');
  if(diffBox && diffBox.checked){ diffBox.checked = false; diffBox.dispatchEvent(new Event('change')); }
  const specs = txt(document.querySelector('#specList'));
  EXPECT.specText.forEach(s=>{ if(!specs.includes(s)) fails.push(`spec list lacks "${s}"`); });
  const merged = document.querySelectorAll('#specList details.tw').length;
  const wanted = SPEC_MERGES.filter(m=>!m.years || m.years.includes(year)).length;
  if(merged !== wanted) fails.push(`${merged} merged spec rows, expected ${wanted} (a merge didn't find Toyota's ${year} wording)`);

  // 6. Feature text reads that year's numbers.
  const plug = txt(document.querySelector('#f-plugin'));
  EXPECT.featText.forEach(s=>{ if(!plug.includes(s)) fails.push(`Plug-in feature lacks "${s}"`); });

  // 7. Charging times. Worked by hand: wall kWh for a full charge = range x 33.7 / MPGe, plus 10%,
  //    divided by 1.44 kW (120 V x 12 A), 3.84 kW (240 V x 16 A) and 7.68 kW (240 V x 32 A), rounded
  //    to the nearest half hour. 2027: 50 x 33.7 / 102 x 1.1 = 18.2 kWh. 2026: 52 x 33.7 / 96 x 1.1 = 20.1.
  const CHG = {
    2027:{full:['12½ hr','4½ hr','2½ hr'], at30:['7½ hours','3 hours','1½ hours'], night:'about 40 miles'},
    2026:{full:['14 hr','5 hr','2½ hr'], at30:['8 hours','3 hours','1½ hours'], night:'about 35 miles'},
  }[year];
  const miles = document.querySelector('#evMiles');
  const setMiles = v=>{ miles.value = v; miles.dispatchEvent(new Event('input')); };
  const rows = [...document.querySelectorAll('#chgRows b')].map(el=>txt(el).trim());
  if(rows.join('|') !== CHG.full.join('|')) fails.push(`full-charge times ${rows.join(', ')||'(none)'}; expected ${CHG.full.join(', ')}`);
  if(miles){
    setMiles(30);
    const sum = txt(document.querySelector('#chgSum'));
    CHG.at30.forEach(s=>{ if(!sum.includes(s)) fails.push(`charging summary at 30 miles lacks "${s}": ${sum}`); });
    setMiles(120);
    const sum120 = txt(document.querySelector('#chgSum'));
    if(!sum120.includes(CHG.full[0].replace(' hr',' hours'))) fails.push(`charging summary at 120 miles should use a full charge: ${sum120}`);
    if(!sum120.includes(CHG.night)) fails.push(`charging summary at 120 miles lacks the overnight figure "${CHG.night}": ${sum120}`);
    setMiles(30);
  } else fails.push('no #evMiles slider');

  // 8. Paint and interior picker. Codes and prices are Toyota's build tool (November 2026), the same
  //    for both years. Within a model every paint goes with every interior, so the model is the only limit.
  const COLORS = {
    xle:{paint:{'0040':0,'04V8':0,'01L6':0,'08X8':0,'0218':0,'0089':475,'03T3':475}, int:['EE10','EE20','EE40'], img:'4444'},
    ltd:{paint:{'04V8':0,'01L6':0,'08X8':0,'0218':0,'0089':475,'03T3':475}, int:['EA10','EA20','EA40'], img:'4534'},
    xse:{paint:{'0218':0,'02SQ':500,'0M22':500,'02VP':975}, int:['EC20'], img:'4530'},
    phv:{paint:{'0218':0,'02SQ':500,'0M22':500,'02VP':975}, int:['EC20'], img:'4550'},
  };
  const base = start;
  const cp = document.querySelector('#colors');
  if(!cp) fails.push('no #colors section');
  else {
    if(txt(cp.querySelector('h2')).trim() !== 'Paint and interior colors') fails.push(`colors heading is "${txt(cp.querySelector('h2'))}"`);
    if(cp.querySelector('#cpAlso')) fails.push('colors: the "also offered on" line should be gone');
    const q = s=>[...cp.querySelectorAll(s)];
    const click = (sel)=>{ const b = cp.querySelector(sel); if(!b){ fails.push(`colors: no ${sel}`); return false; } b.click(); return true; };
    const pressed = s=>q(s+' [aria-pressed="true"]').map(b=>b.dataset.code||b.dataset.t);
    const src = id=>(cp.querySelector(id)?.getAttribute('src')||'');
    for(const [t, c] of Object.entries(COLORS)){
      if(!click(`#cpModel [data-t="${t}"]`)) continue;
      const paints = Object.fromEntries(q('#cpPaint [data-code]').map(b=>[b.dataset.code, txt(b.querySelector('.cp-price')).trim()]));
      const want = Object.fromEntries(Object.entries(c.paint).map(([k,v])=>[k, v ? '+'+usd(v) : 'Included']));
      if(JSON.stringify(Object.entries(paints).sort()) !== JSON.stringify(Object.entries(want).sort()))
        fails.push(`colors: ${t} paints ${JSON.stringify(paints)}; expected ${JSON.stringify(want)}`);
      const ints = q('#cpInt [data-code]').map(b=>b.dataset.code).sort();
      if(ints.join() !== [...c.int].sort().join()) fails.push(`colors: ${t} interiors ${ints.join(', ')}; expected ${c.int.join(', ')}`);
      if(pressed('#cpModel').join() !== t) fails.push(`colors: model ${t} clicked but ${pressed('#cpModel').join()} is pressed`);
      // Every paint and interior on offer shows its own photo.
      for(const code of Object.keys(c.paint)){
        click(`#cpPaint [data-code="${code}"]`);
        if(!src('#cpExt').endsWith(`img/colors/ext-${c.img}-${code}.webp`)) fails.push(`colors: ${t} ${code} shows ${src('#cpExt')}`);
      }
      for(const code of c.int){
        click(`#cpInt [data-code="${code}"]`);
        if(!src('#cpIntImg').endsWith(`img/colors/int-${c.img}-${code}.webp`)) fails.push(`colors: ${t} ${code} interior shows ${src('#cpIntImg')}`);
      }
    }
    const sum = ()=>txt(cp.querySelector('#cpSum'));
    const note = ()=>txt(cp.querySelector('#cpNote'));
    // A red XLE Premium with beige seats: the paint adds $475 to that year's starting price,
    // and the same red is offered on the Limited but not on either XSE.
    click('#cpModel [data-t="xle"]'); click('#cpPaint [data-code="03T3"]'); click('#cpInt [data-code="EE40"]');
    const total = ()=>txt(cp.querySelector('#cpSum .big')).trim();
    if(total() !== usd(base.xle+475)) fails.push(`colors: red XLE total should be ${usd(base.xle+475)}: ${sum()}`);
    // The total includes the packages picked for that model above, and follows changes to them.
    pkLevel(2);
    if(total() !== usd(base.xle+2225+475)) fails.push(`colors: red XLE with two packages should total ${usd(base.xle+2225+475)}: ${sum()}`);
    if(!/Packages/.test(sum()) || !sum().includes(usd(2225))) fails.push(`colors: total should list the packages: ${sum()}`);
    pkLevel(0);
    if(total() !== usd(base.xle+475)) fails.push(`colors: total didn't follow the packages back to none: ${sum()}`);
    // Switching to the XSE can't keep red or beige: it falls back to its included black and its one
    // interior, and says why.
    click('#cpModel [data-t="xse"]');
    if(pressed('#cpPaint').join() !== '0218' || pressed('#cpInt').join() !== 'EC20') fails.push(`colors: XSE after red/beige picked ${pressed('#cpPaint')} / ${pressed('#cpInt')}; expected 0218 / EC20`);
    if(!/Ruby Flare Pearl/.test(note()) || !/Beige/i.test(note())) fails.push(`colors: switching to the XSE should explain the red and beige changes: ${note()}`);
    if(total() !== usd(base.xse)) fails.push(`colors: XSE in black should be ${usd(base.xse)}: ${sum()}`);
    // Storm Cloud carries over to the Plug-in as its two-tone version, at +$500.
    click('#cpModel [data-t="xle"]'); click('#cpPaint [data-code="01L6"]'); click('#cpModel [data-t="phv"]');
    if(pressed('#cpPaint').join() !== '0M22') fails.push(`colors: Storm Cloud on the Plug-in picked ${pressed('#cpPaint')}; expected 0M22`);
    if(total() !== usd(base.phv+500)) fails.push(`colors: two-tone Plug-in total should be ${usd(base.phv+500)}: ${sum()}`);
    if(!/roof/.test(note())) fails.push(`colors: carrying Storm Cloud to the Plug-in should mention the black roof: ${note()}`);
    // Ice Cap is XLE-only; the Limited falls back to an included paint.
    click('#cpModel [data-t="xle"]'); click('#cpPaint [data-code="0040"]'); click('#cpModel [data-t="ltd"]');
    const lp = pressed('#cpPaint').join();
    if(COLORS.ltd.paint[lp] !== 0) fails.push(`colors: Ice Cap on the Limited fell back to ${lp}; expected an included paint`);
    if(!/Ice Cap/.test(note())) fails.push(`colors: switching Ice Cap to the Limited should say so: ${note()}`);
    // Picking a paint on the same model hides the note but keeps its space, so nothing below moves.
    const noteEl = cp.querySelector('#cpNote'), noteH = noteEl.getBoundingClientRect().height;
    click(`#cpPaint [data-code="0089"]`);
    if(getComputedStyle(noteEl).visibility !== 'hidden') fails.push(`colors: note should hide after picking a paint: ${note()}`);
    if(Math.abs(noteEl.getBoundingClientRect().height - noteH) > 1) fails.push('colors: hiding the note changed its height');
    // Picking a paint keeps keyboard focus on that paint's button (the list is redrawn on each pick).
    click('#cpPaint [data-code="0218"]');
    if(document.activeElement?.dataset?.code !== '0218' || !document.activeElement.isConnected) fails.push(`colors: focus after picking a paint is on ${document.activeElement?.outerHTML?.slice(0,60)}`);
    click('#cpModel [data-t="xle"]'); click('#cpPaint [data-code="04V8"]'); click('#cpInt [data-code="EE20"]');
  }

  // 9. Features: only the bigger screen counts as the bigger screen, and only two pads count as
  //    charging for two.
  const pills = id=>[...document.querySelectorAll(`#f-${id} .avail > div`)].map(d=>(d.querySelector('.pill')?.className||'').replace('pill','').trim());
  if(pills('screen').join() !== 'no,std,std,std') fails.push(`bigger screen marks ${pills('screen').join()}; expected no,std,std,std`);
  if(pills('charge').join() !== 'no,no,std,no') fails.push(`charging for two marks ${pills('charge').join()}; expected no,no,std,no`);

  // 10. Photos: the hero shows each model in its own color; the styling details show all four in white,
  //     front and back.
  const heroSrc = [...document.querySelectorAll('.road .car img')].map(i=>i.getAttribute('src'));
  const heroWant = ['ext-4444-04V8','ext-4530-02VP','ext-4534-01L6','ext-4550-0M22'].map(f=>`img/colors/${f}.webp`);
  if(heroSrc.join() !== heroWant.join()) fails.push(`hero photos ${heroSrc.join(', ')}; expected ${heroWant.join(', ')}`);
  const white = ['4444-0089','4530-02VP','4534-0089','4550-02VP'];
  const styleSrc = [...document.querySelectorAll('#f-style .trio img')].map(i=>i.getAttribute('src'));
  const styleWant = white.flatMap(w=>[`img/colors/ext-${w}.webp`, `img/colors/rear-${w}.webp`]);
  if(styleSrc.join() !== styleWant.join()) fails.push(`styling photos ${styleSrc.join(', ')}; expected ${styleWant.join(', ')}`);

  // 11. Toyota's 2026 launch announcement lists the XSE's driver-assist features for the Plug-in too,
  //     so the bundle is included on the Plug-in in both years and "Not listed" is gone from
  //     everything above the spec list (which still uses it for gaps in Toyota's spec pages).
  if(pills('assist').join() !== 'opt,std,std,std') fails.push(`driver-assist bundle marks ${pills('assist').join()}; expected opt,std,std,std`);
  const notes = [...document.querySelectorAll('#f-assist .avail .note')].map(n=>txt(n));
  if(notes.length > 1) fails.push(`driver-assist bundle has notes beyond the XLE Premium's package: ${notes.join(' | ')}`);
  const above = [...document.querySelectorAll('main > section')].filter(s=>!['specs','dealer'].includes(s.id));
  above.forEach(s=>{ if(s.querySelector('.pill.nl')) fails.push(`"Not listed" pill in #${s.id}`); });
  const chipSafety = document.querySelector('#chips [data-id="safety"]');
  const wasOn = chipSafety?.getAttribute('aria-pressed')==='true';
  if(chipSafety && !wasOn) chipSafety.click();
  if(document.querySelector('#scores .pill.nl')) fails.push('priority cards show "Not listed" for the driver-assist bundle');
  if(chipSafety && !wasOn) chipSafety.click();
  if(/Driver Monitor|driver-assist bundle/.test(txt(document.querySelector('#checklist')))) fails.push('dealer checklist still asks about the Plug-in driver-assist bundle');

  return fails;
};
