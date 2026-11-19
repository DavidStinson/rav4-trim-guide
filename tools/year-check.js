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

  return fails;
};
