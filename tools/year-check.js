// Model-year checks for rav4-site. Run in the page after it loads (the harness does this):
// `yearCheck(2026)` returns a list of failures for the page loaded with ?year=2026; empty means pass.
// The expected numbers below are copied from Toyota's comparison pages, not from the page's own data,
// so a typo in YEAR_FACTS fails here.
window.yearCheck = function yearCheck(year){
  const fails = [];
  const EXPECT = {
    2027:{prices:['$38,100','$41,900','$43,900','$47,800'], mpgLine:['41 mpg','40 mpg','39 mpg','50 miles'], diffPanel:false,
          specText:['$47,800','102','321 hp combined'], featText:['50 miles','102 MPGe','321 horsepower']},
    2026:{prices:['$37,500','$41,300','$43,300','$47,200'], mpgLine:['41 mpg','40 mpg','52 miles'], diffPanel:true,
          specText:['$47,200','96','324 hp combined','236 hp combined'], featText:['52 miles','96 MPGe','324 horsepower','CCS1']},
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

  // 3. The "what's different" panel shows only for 2026.
  const panel = document.querySelector('#yearDiff');
  const shown = !!panel && !panel.hidden && panel.getClientRects().length>0;
  if(shown !== EXPECT.diffPanel) fails.push(`year-difference panel ${shown?'shows':'is hidden'} for ${year}`);

  // 4. Package cards start from that year's base prices.
  const pkBase = [...document.querySelectorAll('.pk-head p')].map(el=>txt(el).replace('Starts at ','').trim());
  if(pkBase.join('|') !== EXPECT.prices.join('|')) fails.push(`package cards start at ${pkBase.join(', ')}`);

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
  const base = Object.fromEntries(['xle','xse','ltd','phv'].map((t,i)=>[t, +EXPECT.prices[i].replace(/\D/g,'')]));
  const usd = n=>'$'+n.toLocaleString('en-US');
  const cp = document.querySelector('#colors');
  if(!cp) fails.push('no #colors section');
  else {
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
    if(!sum().includes(usd(base.xle+475))) fails.push(`colors: red XLE total should be ${usd(base.xle+475)}: ${sum()}`);
    const also = txt(cp.querySelector('#cpAlso'));
    if(!/Limited/.test(also) || /XSE/.test(also)) fails.push(`colors: Ruby Flare Pearl should be "also" on the Limited only: ${also}`);
    // Switching to the XSE can't keep red or beige: it falls back to its included black and its one
    // interior, and says why.
    click('#cpModel [data-t="xse"]');
    if(pressed('#cpPaint').join() !== '0218' || pressed('#cpInt').join() !== 'EC20') fails.push(`colors: XSE after red/beige picked ${pressed('#cpPaint')} / ${pressed('#cpInt')}; expected 0218 / EC20`);
    if(!/Ruby Flare Pearl/.test(note()) || !/Beige/i.test(note())) fails.push(`colors: switching to the XSE should explain the red and beige changes: ${note()}`);
    if(!sum().includes(usd(base.xse))) fails.push(`colors: XSE in black should be ${usd(base.xse)}: ${sum()}`);
    // Storm Cloud carries over to the Plug-in as its two-tone version, at +$500.
    click('#cpModel [data-t="xle"]'); click('#cpPaint [data-code="01L6"]'); click('#cpModel [data-t="phv"]');
    if(pressed('#cpPaint').join() !== '0M22') fails.push(`colors: Storm Cloud on the Plug-in picked ${pressed('#cpPaint')}; expected 0M22`);
    if(!sum().includes(usd(base.phv+500))) fails.push(`colors: two-tone Plug-in total should be ${usd(base.phv+500)}: ${sum()}`);
    if(!/roof/.test(note())) fails.push(`colors: carrying Storm Cloud to the Plug-in should mention the black roof: ${note()}`);
    // Ice Cap is XLE-only; the Limited falls back to an included paint.
    click('#cpModel [data-t="xle"]'); click('#cpPaint [data-code="0040"]'); click('#cpModel [data-t="ltd"]');
    const lp = pressed('#cpPaint').join();
    if(COLORS.ltd.paint[lp] !== 0) fails.push(`colors: Ice Cap on the Limited fell back to ${lp}; expected an included paint`);
    if(!/Ice Cap/.test(note())) fails.push(`colors: switching Ice Cap to the Limited should say so: ${note()}`);
    // Picking a paint on the same model clears the note.
    click(`#cpPaint [data-code="0089"]`);
    if(note().trim()) fails.push(`colors: note should clear after picking a paint: ${note()}`);
    click('#cpModel [data-t="xle"]'); click('#cpPaint [data-code="04V8"]'); click('#cpInt [data-code="EE20"]');
  }

  return fails;
};

// Every photo the color picker can show exists on the server. Async, so the harness runs it once.
window.colorFilesCheck = async function colorFilesCheck(){
  const files = [
    ...['0040','04V8','01L6','08X8','0218','0089','03T3'].map(c=>`ext-4444-${c}`),
    ...['04V8','01L6','08X8','0218','0089','03T3'].map(c=>`ext-4534-${c}`),
    ...['4530','4550'].flatMap(m=>['0218','02SQ','0M22','02VP'].map(c=>`ext-${m}-${c}`)),
    ...['EE10','EE20','EE40'].map(c=>`int-4444-${c}`), ...['EA10','EA20','EA40'].map(c=>`int-4534-${c}`),
    'int-4530-EC20', 'int-4550-EC20',
  ];
  const fails = [];
  for(const f of files){
    const r = await fetch(new URL(`img/colors/${f}.webp`, location.href), {method:'HEAD'});
    if(!r.ok) fails.push(`missing img/colors/${f}.webp (${r.status})`);
  }
  return fails;
};
