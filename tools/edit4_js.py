import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
E = []
def r(old, new, count=1):
    E.append((old, new, count))

# ---------- trims ----------
r('''  {id:'ltd', name:'Limited', color:'var(--ltd)'},
];
// status per trim: ['std'|'opt'|'no', note?]''', '''  {id:'ltd', name:'Limited', color:'var(--ltd)'},
  {id:'phv', name:'Plug-in XSE', color:'var(--phv)'},
];
// Status per trim, in TRIMS order: ['std'|'opt'|'no'|'nl', note?]. 'nl' means Toyota's Plug-in page
// doesn't mention the item, which is not the same as the car lacking it.''')

# ---------- features: fourth trim and wording ----------
r('''   why:'This is the biggest everyday upgrade over the XLE Premium. It shows the things a backup camera can’t: a low post by the front bumper, a curb scraping the wheels, a bike or a child beside the car. Curb View is especially helpful on the XSE, whose large 20-inch wheels are easy to scrape.',
   trims:[['no','Backup camera only'],['std'],['std']], visual:'cameraDemo', wide:true},''',
  '''   why:'This is the biggest everyday upgrade over the XLE Premium. It shows the things a backup camera can’t: a low post by the front bumper, a curb scraping the wheels, a bike or a child beside the car. Curb View is especially helpful on the two XSEs, whose large 20-inch wheels are easy to scrape.',
   trims:[['no','Backup camera only'],['std'],['std'],['std']], visual:'cameraDemo', wide:true},''')
r('''   trims:[['opt','Panoramic Moonroof Package: $1,850 ($2,225 with the Weather Package it requires)'],['opt','Panoramic Moonroof Package: $700 ($1,695 with the packages it requires)'],['std']], visual:'mirrorDemo'},''',
  '''   trims:[['opt','Panoramic Moonroof Package: $1,850 ($2,225 with the Weather Package it requires)'],['opt','Panoramic Moonroof Package: $700 ($1,695 with the packages it requires)'],['std'],['opt','Panoramic Moonroof Package: $700 ($1,695 with the packages it requires)']], visual:'mirrorDemo'},''')
r('''   why:'One less gadget on the visor, and nothing for a thief to grab to open your garage. The XSE also gets an auto-dimming mirror that cuts glare from headlights behind you; the XLE Premium has a manual flip-tab mirror.',
   trims:[['opt','Comes with the camera mirror in the Panoramic Moonroof Package'],['std','With auto-dimming mirror'],['std','With camera mirror']]},''',
  '''   why:'One less gadget on the visor, and nothing for a thief to grab to open your garage. Both XSEs also get an auto-dimming mirror that cuts glare from headlights behind you; the XLE Premium has a manual flip-tab mirror.',
   trims:[['opt','Comes with the camera mirror in the Panoramic Moonroof Package'],['std','With auto-dimming mirror'],['std','With camera mirror'],['std','With auto-dimming mirror']]},''')
r('''   trims:[['no'],['opt','XSE Driver Assist Package'],['std']]},''',
  '''   trims:[['no'],['opt','XSE Driver Assist Package: $420 ($2,115 with the packages it requires)'],['std'],['opt','Driver Assist Package: $1,170 ($2,865 with the packages it requires)']]},''')
r('''   trims:[['opt','XLE Premium Driver Assist Package: $650 ($2,875 with the packages it requires)'],['std'],['std']]},''',
  '''   trims:[['opt','XLE Premium Driver Assist Package: $650 ($2,875 with the packages it requires)'],['std'],['std'],['nl','Toyota’s Plug-in page doesn’t mention these. Ask the dealer.']]},''')
r('''   trims:[['no'],['no'],['opt','Stand-alone option: $600']], visual:'hudDemo'},''',
  '''   trims:[['no'],['no'],['opt','Stand-alone option: $600'],['opt','Comes with the Driver Assist Package ($2,865 with the packages it requires)']], visual:'hudDemo'},''')
r('''   why:'One less thing to fiddle with in a sudden downpour, and a real help on icy winter mornings.',
   trims:[['opt','Weather Package: $375'],['opt','Weather Package: $375'],['std']]},''',
  '''   why:'One less thing to fiddle with in a sudden downpour, and a real help on icy winter mornings.',
   trims:[['opt','Weather Package: $375'],['opt','Weather Package: $375'],['std'],['opt','Weather Package: $375']]},''')
r('''   why:'If you live somewhere warm, people who have cooled seats tend to say they would never go without them again. All three have heated front seats; only the XSE and Limited also cool.',
   trims:[['no','Heated only (2 levels)'],['std'],['std']],''',
  '''   why:'If you live somewhere warm, people who have cooled seats tend to say they would never go without them again. All four have heated front seats; the XLE Premium is the only one that doesn’t also cool.',
   trims:[['no','Heated only (2 levels)'],['std'],['std'],['std']],''')
r('''   why:'A nice touch if you often have passengers in the back in cold weather.',
   trims:[['no'],['no'],['std']]},''',
  '''   why:'A nice touch if you often have passengers in the back in cold weather.',
   trims:[['no'],['no'],['std'],['no']]},''')
r('''   why:'On a cold morning, warm hands make a big difference before the heater gets going. People who have one tend to use it all winter.',
   trims:[['opt','Weather Package: $375'],['opt','Weather Package: $375'],['std']]},''',
  '''   why:'On a cold morning, warm hands make a big difference before the heater gets going. People who have one tend to use it all winter.',
   trims:[['opt','Weather Package: $375'],['opt','Weather Package: $375'],['std'],['opt','Weather Package: $375']]},''')
r('''   why:'Useful if two people share the car. A power passenger seat is also easier on the back and shoulders than reaching down to a manual lever. All three have a power driver’s seat with lumbar support.',
   trims:[['no','Manual passenger seat; no memory'],['std'],['std']]},''',
  '''   why:'Useful if two people share the car. A power passenger seat is also easier on the back and shoulders than reaching down to a manual lever. All four have a power driver’s seat with lumbar support.',
   trims:[['no','Manual passenger seat; no memory'],['std'],['std'],['std']]},''')
r('''   aka:'SofTex®-trimmed seats; SofTex®/synthetic suede on XSE',
   what:'SofTex is Toyota’s name for a high-quality synthetic leather. It looks and feels much like leather, wipes clean easily and doesn’t need conditioning. The XSE mixes it with a soft suede-like fabric in the middle of the seat, which feels grippy and doesn’t get as hot or cold.',
   why:'None of the three use real leather. SofTex is durable and easy to live with; the XSE’s suede inserts are a matter of taste and can show lint or pet hair more.',
   trims:[['std','SofTex'],['std','SofTex + synthetic suede'],['std','SofTex']]},''',
  '''   aka:'SofTex®-trimmed seats; SofTex®/synthetic suede on the XSE; Mixed Media/SofTex on the Plug-in XSE',
   what:'SofTex is Toyota’s name for a high-quality synthetic leather. It looks and feels much like leather, wipes clean easily and doesn’t need conditioning. The Hybrid XSE mixes it with a soft suede-like fabric in the middle of the seat, which feels grippy and doesn’t get as hot or cold. The Plug-in XSE mixes it with a cloth fabric instead.',
   why:'None of the four use real leather. SofTex is durable and easy to live with; the fabric inserts on the XSEs are a matter of taste and can show lint or pet hair more.',
   trims:[['std','SofTex'],['std','SofTex + synthetic suede'],['std','SofTex'],['std','SofTex + fabric']]},''')
r('''   trims:[['opt','Panoramic only: $1,850 ($2,225 with the Weather Package it requires)'],['std','Regular sunroof; panoramic is $700 ($1,695 with the packages it requires)'],['std','Panoramic']], visual:'roofPhotos', wide:true},''',
  '''   trims:[['opt','Panoramic only: $1,850 ($2,225 with the Weather Package it requires)'],['std','Regular sunroof; panoramic is $700 ($1,695 with the packages it requires)'],['std','Panoramic'],['std','Regular sunroof; panoramic is $700 ($1,695 with the packages it requires)']], visual:'roofPhotos', wide:true},''')
r('''   what:'The touchscreen in the middle of the dashboard is about a quarter larger on the XSE and Limited. All three connect wirelessly to your phone with Apple CarPlay or Android Auto, so your phone’s maps, music and calls appear on the screen.',
   why:'A bigger screen means larger map, bigger buttons and an easier-to-read 360° camera picture. The 10.5-inch screen is still a good size.',
   trims:[['std','10.5-inch'],['std','12.9-inch'],['std','12.9-inch']], visual:'screenPair', wide:true},''',
  '''   what:'The touchscreen in the middle of the dashboard is about a quarter larger on every trim except the XLE Premium. All four connect wirelessly to your phone with Apple CarPlay or Android Auto, so your phone’s maps, music and calls appear on the screen.',
   why:'A bigger screen means larger map, bigger buttons and an easier-to-read 360° camera picture. The 10.5-inch screen is still a good size.',
   trims:[['std','10.5-inch'],['std','12.9-inch'],['std','12.9-inch'],['std','12.9-inch']], visual:'screenPair', wide:true},''')
r('''   trims:[['no','6 speakers'],['opt','JBL Premium Audio Package: $620 ($995 with the Weather Package it requires)'],['std']], img:''',
  '''   trims:[['no','6 speakers'],['opt','JBL Premium Audio Package: $620 ($995 with the Weather Package it requires)'],['std'],['opt','JBL Premium Audio Package: $620 ($995 with the Weather Package it requires)']], img:''')
r('''   why:'All three have one pad. Two only matters if you regularly ride with someone whose phone also needs a charge.',
   trims:[['std','1 pad'],['std','1 pad'],['std','2 pads']],''',
  '''   why:'All four have one pad. Two only matters if you regularly ride with someone whose phone also needs a charge.',
   trims:[['std','1 pad'],['std','1 pad'],['std','2 pads'],['std','1 pad']],''')
r('''   what:'With the key in your pocket or purse, swing your foot under the middle of the back bumper and the tailgate opens by itself. All three have a power tailgate that opens with a button; only the XSE and Limited add the foot sensor.',
   why:'Wonderful when your arms are full of groceries. The XLE Premium’s power tailgate also lets you set how high it opens, which helps in a low garage.',
   trims:[['no','Power tailgate with button'],['std'],['std']],''',
  '''   what:'With the key in your pocket or purse, swing your foot under the middle of the back bumper and the tailgate opens by itself. All four have a power tailgate that opens with a button; every trim except the XLE Premium adds the foot sensor.',
   why:'Wonderful when your arms are full of groceries. The XLE Premium’s power tailgate also lets you set how high it opens, which helps in a low garage.',
   trims:[['no','Power tailgate with button'],['std'],['std'],['std']],''')
r('''   why:'Puddle lights help you see puddles, ice or a curb when getting in after dark. The cabin glow makes it easier to find things at night.',
   trims:[['no'],['std'],['std']]},''',
  '''   why:'Puddle lights help you see puddles, ice or a curb when getting in after dark. The cabin glow makes it easier to find things at night.',
   trims:[['no'],['std'],['std'],['std']]},''')
r('''   trims:[['no','Regular lever'],['opt','Comes with the self-parking package ($2,115 with the packages it requires)'],['std']]},''',
  '''   trims:[['no','Regular lever'],['opt','Comes with the self-parking package ($2,115 with the packages it requires)'],['std'],['opt','Comes with the Driver Assist Package ($2,865 with the packages it requires)']]},''')
r('''   aka:'18-in. wheels (XLE Premium, Limited) vs 20-in. wheels (XSE)',
   what:'The XSE has larger 20-inch black wheels. Bigger wheels use thinner tires, which look sporty and make steering feel sharper, but there’s less cushion between you and the road.',
   why:'Expect the XSE to feel a bit firmer over potholes and bumpy roads, and its tires usually cost more to replace. The XLE Premium and Limited ride a bit more softly on 18-inch wheels. The Limited can add 20-inch wheels as an option.',
   trims:[['std','18-inch'],['std','20-inch'],['std','18-inch; 20-inch package is $1,240 ($1,840 with the head-up display it requires)']], visual:'wheelDemo'},''',
  '''   aka:'18-in. wheels (XLE Premium, Limited) vs 20-in. wheels (both XSEs)',
   what:'Both XSEs have larger 20-inch black wheels. Bigger wheels use thinner tires, which look sporty and make steering feel sharper, but there’s less cushion between you and the road.',
   why:'Expect the XSEs to feel a bit firmer over potholes and bumpy roads, and their tires usually cost more to replace. The XLE Premium and Limited ride a bit more softly on 18-inch wheels. The Limited can add 20-inch wheels as an option.',
   trims:[['std','18-inch'],['std','20-inch'],['std','18-inch; 20-inch package is $1,240 ($1,840 with the head-up display it requires)'],['std','20-inch']], visual:'wheelDemo'},''')
r('''   what:'The <b>XSE</b> is the sporty-looking one: glossy black trim, vertical LED accent lights in the front bumper, blue stitching inside, and an optional black roof (two-tone paint). The <b>Limited</b> looks more upscale with silver accents, a satin-chrome grille and LED fog lights. The <b>XLE Premium</b> has a simpler, rugged look with matte black lower trim.',
   why:'Purely a matter of taste. Look at all three in person, ideally in the color you want.',
   trims:[['std','Simple, rugged'],['std','Sporty, two-tone option'],['std','Upscale, fog lights']], img:'img/RHV_MY26_0016_V001.jpg', cap:'The Limited, shown in Storm Cloud, with its silver lower bumper.',
   shots:{title:'All three from the same angle, in Toyota’s default colors', kind:'ext', ar:'11/5',
     caps:['Matte black lower trim and dark wheels.','Black roof, black wheels, LED accent lights in the bumper.','Silver accents and fog lights.']}},''',
  '''   what:'The <b>XSE</b> is the sporty-looking one: glossy black trim, vertical LED accent lights in the front bumper, blue stitching inside, and an optional black roof (two-tone paint). The <b>Plug-in XSE</b> looks almost the same. The <b>Limited</b> looks more upscale with silver accents, a satin-chrome grille and LED fog lights. The <b>XLE Premium</b> has a simpler, rugged look with matte black lower trim.',
   why:'Purely a matter of taste. Look at them in person, ideally in the color you want.',
   trims:[['std','Simple, rugged'],['std','Sporty, two-tone option'],['std','Upscale, fog lights'],['std','Sporty, two-tone option']], img:'img/RHV_MY26_0016_V001.jpg', cap:'The Limited, shown in Storm Cloud, with its silver lower bumper.',
   shots:{title:'All four from the same angle, as Toyota shows them', kind:'ext', ar:'11/5',
     caps:['Matte black lower trim and dark wheels.','Black roof, black wheels, LED accent lights in the bumper.','Silver accents and fog lights.','Same sporty look as the Hybrid XSE, shown in gray with a black roof.']}},

  /* ---------- Plug-in Hybrid ---------- */
  {id:'plugin', group:'Plug-in Hybrid', name:'Driving on electricity',
   aka:'Plug-in Hybrid: EPA-estimated 50-mile all-electric range, 102 MPGe',
   what:'The Plug-in has a much bigger battery that you charge by plugging the car in, at home or at a public charger. On a full charge it can drive about 50 miles on electricity alone (Toyota’s EPA estimate). After that it drives like a regular hybrid, at 39 mpg combined. It also has more power: 321 horsepower, against 229 for the Hybrids.',
   why:'If most of your days are under 50 miles and you can plug in at home, you could go weeks between gas fill-ups. If you can’t charge at home, you’re paying extra for a battery you won’t use much. Toyota includes a cable that works with a regular household outlet (slow) or a 240-volt outlet like a dryer’s (much faster). It can also use public fast chargers, and its charging port is the same type Tesla uses.',
   trims:[['no'],['no'],['no'],['std','About 50 miles per charge']], visual:'evDemo', wide:true},
  {id:'outlet', group:'Plug-in Hybrid', name:'Household-style power outlet', compact:true,
   aka:'One 120V/1500W AC power outlet in cargo area',
   what:'A regular three-prong outlet in the cargo area, like the ones in your house. It can run things up to 1,500 watts, such as a laptop, a work light, an electric cooler or a small coffee maker.',
   why:'Handy for camping, tailgating or a power outage. The Hybrids have only small 12-volt sockets, the kind phone chargers plug into.',
   trims:[['no','12-volt sockets only'],['no','12-volt sockets only'],['no','12-volt sockets only'],['std']]},''')

# ---------- basics ----------
r('''  ['All-wheel drive','Better grip in rain and snow, standard on all three.'],
  ['Hybrid engine, 229 horsepower','Same engine and same feel to drive; 40 to 41 mpg combined.'],''',
  '''  ['All-wheel drive','Better grip in rain and snow, standard on all four.'],
  ['Hybrid power','A 2.5-liter gas engine working with electric motors. 229 horsepower and 40 to 41 mpg on the Hybrids; 321 horsepower and 39 mpg on the Plug-in.'],''')
r('''  ['Safe exit alert','Warns you before opening a door into a passing car or bike.'],
''', '')

# ---------- priorities ----------
r('''  {id:'sharing', label:'Sharing the car with someone', feats:['seats']},''',
  '''  {id:'sharing', label:'Sharing the car with someone', feats:['seats']},
  {id:'outlet', label:'Power for camping or outages', feats:['outlet']},''')
r('''  {id:'mpg', label:'Best gas mileage', special:'mpg'},''', '''  {id:'mpg', label:'Using the least gas', special:'mpg'},''')
r('''  smooth:{label:'Smoothest ride (smaller wheels)', trims:[['std'],['no','20-inch wheels ride firmer'],['std']]},
  sporty:{label:'Sporty look', trims:[['no'],['std'],['no']]},
  price:{label:'Lowest price', trims:[['std','$38,100'],['no','$41,900'],['no','$43,900']]},
  mpg:{label:'Best gas mileage', trims:[['std','41 mpg'],['no','40 mpg'],['no','40 mpg']]},''',
  '''  smooth:{label:'Smoothest ride (smaller wheels)', trims:[['std'],['no','20-inch wheels ride firmer'],['std'],['no','20-inch wheels ride firmer']]},
  sporty:{label:'Sporty look', trims:[['no'],['std'],['no'],['std']]},
  price:{label:'Lowest price', trims:[['std','$38,100'],['no','$41,900'],['no','$43,900'],['no','$47,800']]},
  mpg:{label:'Uses the least gas (if you can charge at home)', trims:[['no','41 mpg'],['no','40 mpg'],['no','40 mpg'],['std','About 50 miles on electricity, then 39 mpg']]},''')

# ---------- step ups ----------
r('''  ['hud','Head-up display available','Speed on the windshield, a Limited-only option.'],''',
  '''  ['hud','Head-up display available','Speed on the windshield. The Hybrid XSE can’t get it.'],''')
r('''// Option packages, in the order Toyota requires them''', '''const STEP3_GAIN = [
  ['plugin','Driving on electricity','About 50 miles per charge before the gas engine is needed (EPA estimate).'],
  ['plugin','More power','321 horsepower instead of 229, for quicker merging and passing.'],
  ['outlet','Household-style power outlet','A 1,500-watt outlet in the cargo area for camping or a power outage.'],
  ['hud','Head-up display available','Comes in the Driver Assist Package, along with paddle shifters.'],
];
const STEP3_LOSE = [
  ['plugin','You need somewhere to plug in','The savings depend on charging at home or work. Without that, it’s a heavier hybrid at 39 mpg.'],
  ['assist','Some safety helpers aren’t listed','Toyota’s Plug-in page doesn’t mention Front Cross-Traffic Alert, Lane Change Assist, Traffic Jam Assist, Driver Monitor or Safe Exit Alert. Ask the dealer.'],
  [null,'Less cargo space','33.6 cubic feet behind the back seat instead of 37.8.'],
  ['material','Different seat fabric','Cloth inserts instead of the suede-like ones.'],
  ['park','Self-parking costs more','$1,170 for the Driver Assist Package instead of $420, though it adds more.'],
];

// Option packages, in the order Toyota requires them''')
r('''fillGain('#gain2',STEP2_GAIN,'plus'); fillGain('#lose2',STEP2_LOSE,'minus');''',
  '''fillGain('#gain2',STEP2_GAIN,'plus'); fillGain('#lose2',STEP2_LOSE,'minus');
fillGain('#gain3',STEP3_GAIN,'plus'); fillGain('#lose3',STEP3_LOSE,'minus');''')

# ---------- packages ----------
r('''  ], paint:'<b>Paint:</b> Wind Chill Pearl (white) or Ruby Flare Pearl (red) add $475. Other colors are included.'},
};''', '''  ], paint:'<b>Paint:</b> Wind Chill Pearl (white) or Ruby Flare Pearl (red) add $475. Other colors are included.'},
  phv:{base:47800, ladder:[
    {name:'Weather Package', price:375, gets:[['wheelheat','Heated steering wheel'],['wipers','automatic wipers with de-icer']]},
    {name:'JBL Premium Audio Package', price:620, gets:[['jbl','9-speaker JBL sound system']]},
    {name:'Panoramic Moonroof Package', price:700, gets:[['roof','Panoramic glass roof (replaces the regular sunroof)'],['mirror','camera rearview mirror']]},
    {name:'Driver Assist Package', price:1170, gets:[['park','Self-parking'],['hud','head-up display'],['shifter','toggle-switch gear selector'],[null,'paddle shifters']]},
  ], paint:'<b>Paint:</b> only Midnight Black is included. Meteor Shower or Storm Cloud with a black roof add $500, or $975 for Wind Chill Pearl (white) with a black roof.'},
};''')

# ---------- checklist ----------
r('''  ['What does service cost after ToyotaCare ends?',''',
  '''  ['On the Plug-in XSE, ask about the safety helpers Toyota’s page leaves out.','Toyota’s Plug-in page doesn’t mention Front Cross-Traffic Alert, Lane Change Assist, Traffic Jam Assist, Driver Monitor or Safe Exit Alert, which every Hybrid XSE has. Ask whether the Plug-in has them.'],
  ['Where would you charge the Plug-in?','Ask how long a full charge takes from a regular outlet and from a 240-volt outlet, and what adding a home charger would cost.'],
  ['Ask about tax credits and rebates for the Plug-in.','Some states and power companies offer money back on plug-in cars. The dealer or your electric company can tell you what applies.'],
  ['What does service cost after ToyotaCare ends?',''')

# ---------- helpers ----------
r('''  no:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
};
const WORD = {std:'Included', opt:'Optional', no:'Not offered'};''',
  '''  no:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  nl:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.6 5.8a2.4 2.4 0 1 1 3.4 2.2c-.7.3-1 .8-1 1.5v.4M8 12.4v.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};
const WORD = {std:'Included', opt:'Optional', no:'Not offered', nl:'Not listed'};''')
r('''const featById = Object.fromEntries(FEATURES.map(f=>[f.id,f]));''',
  '''const featById = Object.fromEntries(FEATURES.map(f=>[f.id,f]));
// Every per-trim list must have one entry per trim; say which one doesn't instead of failing mid-render.
[...FEATURES.map(f=>['feature '+f.id,f.trims]), ...Object.entries(SPECIAL).map(([k,v])=>['priority '+k,v.trims])]
  .forEach(([what,t])=>{ if(t.length!==TRIMS.length) console.error(`${what} lists ${t.length} trims; expected ${TRIMS.length}.`); });''')

# ---------- shared slider view ----------
r('''/* ===================== PICKER ===================== */''', '''/* ===================== SIDE-ARROW SLIDERS =====================
   On wide screens, each [data-sl] block shows three trims with the fourth peeking in at the edge.
   All sliders share one offset, so the trim columns line up from section to section. */
const VIEW = (function(){
  const SHOWN = 3, MAX = TRIMS.length - SHOWN;
  const wide = matchMedia('(min-width:980px)');
  const ARROW = d=>`<span class="sl-arrow" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="${d<0?'M12.5 4 6.5 10l6 6':'M7.5 4l6 6-6 6'}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  let off = 0;
  const sliders = [...document.querySelectorAll('[data-sl]')];
  sliders.forEach(sl=>{
    sl.insertAdjacentHTML('beforeend',
      `<button type="button" class="sl-btn sl-prev" data-dir="-1"></button><button type="button" class="sl-btn sl-next" data-dir="1"></button>`);
    sl.addEventListener('click',e=>{
      const b=e.target.closest('.sl-btn'); if(!b) return;
      set(off + +b.dataset.dir);
      // The pressed button disappears at the end of the row; keep focus on this slider.
      const other = sl.querySelector(b.classList.contains('sl-next')?'.sl-prev':'.sl-next');
      if(b.hidden && other && !other.hidden) other.focus();
    });
    // Swipe on touch screens wide enough to show the arrows.
    let x0=null;
    sl.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});
    sl.addEventListener('touchend',e=>{
      if(x0==null||!wide.matches) return; const dx=e.changedTouches[0].clientX-x0; x0=null;
      if(Math.abs(dx)>50) set(off + (dx<0?1:-1));
    },{passive:true});
  });
  function label(btn, i, dir){
    const t = TRIMS[i]; if(!t){btn.hidden=true; return;}
    const item = btn.parentElement.querySelector('.sl-track').children[i];
    const flag = item && item.dataset.flag ? `<small>${esc(item.dataset.flag)}</small>` : '';
    btn.hidden = false;
    btn.innerHTML = (dir<0 ? ARROW(-1)+`<span>${esc(t.name)}</span>` : ARROW(1)+`<span>${esc(t.name)}</span>`) + flag;
    btn.setAttribute('aria-label', `Show the ${t.name}${item&&item.dataset.flag?' ('+item.dataset.flag+')':''}`);
  }
  function apply(){
    sliders.forEach(sl=>{
      sl.style.setProperty('--off', wide.matches ? off : 0);
      const items=[...sl.querySelector('.sl-track').children];
      items.forEach((el,i)=>{
        const out = wide.matches && (i<off || i>=off+SHOWN);
        el.inert = out; el.classList.toggle('sl-out',out);
      });
      const [prev,next] = [sl.querySelector('.sl-prev'), sl.querySelector('.sl-next')];
      if(!wide.matches || !items.length){prev.hidden=next.hidden=true; return;}
      label(prev, off-1, -1); label(next, off+SHOWN, 1);
    });
  }
  function set(n){ off=Math.min(Math.max(n,0),MAX); apply(); }
  wide.addEventListener('change',apply);
  return {refresh:apply};
})();

/* ===================== PICKER ===================== */''')

# ---------- picker: four trims, 'nl', hide the whole slider when empty ----------
r('''  const chips = $('#chips'), scores = $('#scores'), note = $('#emptyNote');''',
  '''  const chips = $('#chips'), scores = $('#scores'), wrap = $('#scoresSl'), note = $('#emptyNote');''')
r('''    note.hidden = rows.length>0; scores.hidden = rows.length===0;
    if(!rows.length){scores.innerHTML='';return;}''',
  '''    note.hidden = rows.length>0; wrap.hidden = rows.length===0;
    if(!rows.length){scores.innerHTML=''; VIEW.refresh(); return;}''')
r('''      const sorted=[...rows].sort((a,b)=>({std:0,opt:1,no:2}[a.trims[i][0]]-{std:0,opt:1,no:2}[b.trims[i][0]]));
      return `<div class="score ${pts[i]===max&&max>0?'best':''}">''',
  '''      const rank={std:0,opt:1,nl:2,no:3};
      const sorted=[...rows].sort((a,b)=>rank[a.trims[i][0]]-rank[b.trims[i][0]]);
      const best=pts[i]===max&&max>0;
      return `<div class="score ${best?'best':''}" ${best?'data-flag="Best match"':''}>''')
r('''        <ul>${sorted.map(r=>`<li>${pill(r.trims[i][0],r.trims[i][0]==='std'?'Yes':r.trims[i][0]==='opt'?'Option':'No')}''',
  '''        <ul>${sorted.map(r=>`<li>${pill(r.trims[i][0],{std:'Yes',opt:'Option',nl:'Not listed',no:'No'}[r.trims[i][0]])}''')
r('''      </div>`;
    }).join('');
  }
  render();
})();''', '''      </div>`;
    }).join('');
    VIEW.refresh();
  }
  render();
})();''')
r('''  TRIMS.forEach(t=>paint(t.id));
})();''', '''  TRIMS.forEach(t=>paint(t.id));
  VIEW.refresh();
})();''')

# ---------- visuals ----------
r('''      <button type="button" data-mode="360" aria-pressed="false">360° camera (XSE and Limited)</button>''',
  '''      <button type="button" data-mode="360" aria-pressed="false">360° camera (the other three)</button>''')
r('''<figcaption>What the XSE and Limited’s 360° camera shows on the screen: the overhead view on the left and a 3D view you can rotate on the right.</figcaption>''',
  '''<figcaption>What the 360° camera on the other three shows on the screen: the overhead view on the left and a 3D view you can rotate on the right.</figcaption>''')
r('''font-size="20" fill="var(--xse)">12.9″ XSE, Limited</text>''', '''font-size="20" fill="var(--xse)">12.9″ the other three</text>''')
r('''<figcaption>12.9-inch screen (XSE and Limited)</figcaption>''', '''<figcaption>12.9-inch screen (XSE, Limited and Plug-in XSE)</figcaption>''')
r('''      text:'<b>XSE, as standard:</b> a glass panel over the front seats that tilts up or slides back. The back seat stays under a solid roof.'},''',
  '''      text:'<b>Both XSEs, as standard:</b> a glass panel over the front seats that tilts up or slides back. The back seat stays under a solid roof.'},''')
r('''      text:'<b>Limited, or as a package on the other two:</b> glass over both rows.''',
  '''      text:'<b>Limited, or as a package on the others:</b> glass over both rows.''')
r('''/* ===================== FEATURE LIST ===================== */''', '''// --- Plug-in: how much of a day's driving runs on electricity ---
VIS.evDemo = ()=>{
  const RANGE=50, MPG_PHEV=39, MPG_XSE=40;
  return {html:`
  <div class="demo ev-demo">
    <label for="evMiles">A typical day of driving: <span id="evOut"></span> miles</label>
    <input type="range" id="evMiles" min="5" max="120" step="5" value="30" aria-describedby="evSum">
    <div class="ev-bar" aria-hidden="true"><span class="e"></span><span class="g"></span></div>
    <div class="ev-key" aria-hidden="true"><span><i style="background:var(--phv)"></i>On electricity</span><span><i style="background:var(--no)"></i>On gas, as a regular hybrid</span></div>
    <p class="demo-summary" id="evSum" aria-live="polite"></p>
    <p class="small muted" style="margin:0">Starting each day with a full charge, using Toyota’s EPA estimates: 50 miles on electricity, then 39 mpg. Cold weather, highway speeds and running the heater shorten the electric range.</p>
  </div>`, init(root){
    const inp=root.querySelector('#evMiles');
    const gal=n=>n<0.05?'no':n.toFixed(1);
    const set=()=>{
      const m=+inp.value, e=Math.min(m,RANGE), g=m-e;
      root.querySelector('#evOut').textContent=m;
      root.querySelector('.ev-bar .e').style.flexGrow=e; root.querySelector('.ev-bar .g').style.flexGrow=g;
      root.querySelector('#evSum').innerHTML = g===0
        ? `<b>All ${m} miles on electricity.</b> The Plug-in uses no gas. A Hybrid XSE would use about ${gal(m/MPG_XSE)} gallons.`
        : `<b>The first ${RANGE} miles on electricity, the last ${g} on gas.</b> The Plug-in uses about ${gal(g/MPG_PHEV)} gallons. A Hybrid XSE would use about ${gal(m/MPG_XSE)}.`;
    };
    inp.addEventListener('input',set); set();
  }};
};

/* ===================== FEATURE LIST ===================== */''')

# ---------- spec table ----------
r('''// Toyota repeats some long lines once per trim with small changes. Each merge below replaces those
// lines (matched by Toyota's exact wording in `from`) with one row. Cells chain off the trim before
// them only when that trim purely adds things; anything a trim loses is said outright.''',
  '''// Toyota repeats some long lines once per trim with small changes. Each merge below replaces those
// lines (matched by Toyota's exact wording in `from`) with one row. Cells chain off the trim before
// them only when that trim purely adds things; anything a trim loses is said outright. The table
// always shows all four columns, so "Same as XSE" stays readable.''')
r('''  {cat:'Outside', label:'Windshield wipers', common:'Intermittent rear wiper on all three.',''',
  '''  {cat:'Outside', label:'Windshield wipers', common:'Intermittent rear wiper on all four.',''')
r('''          {t:'Rain-sensing, with de-icer'}]},
  {cat:'Outside', label:'Bumper and fender trim', common:'Upper front bumper in the body color on all three.',
   from:['Color-keyed upper front bumper, and satin-black lower front bumper, overfenders and rear bumper',
         'Color-keyed upper front bumper, silver-painted rear bumper, piano-black overfenders and lower front bumper',
         'Color-keyed upper front bumper, satin black overfenders, silver-painted lower front bumper and rear bumper'],
   cells:[{t:'Satin black lower front bumper, fender flares and rear bumper'},
          {t:'Glossy black lower front bumper and fender flares; silver rear bumper'},
          {t:'Satin black fender flares; silver lower front bumper and rear bumper'}]},''',
  '''          {t:'Rain-sensing, with de-icer'},
          {t:'Variable intermittent wipers', opt:'Rain-sensing, with de-icer (Weather Package)'}]},
  {cat:'Outside', label:'Bumper and fender trim', common:'Upper front bumper in the body color on all four.',
   from:['Color-keyed upper front bumper, and satin-black lower front bumper, overfenders and rear bumper',
         'Color-keyed upper front bumper, silver-painted rear bumper, piano-black overfenders and lower front bumper',
         'Color-keyed upper front bumper, satin black overfenders, silver-painted lower front bumper and rear bumper',
         'Color-keyed upper front bumper, piano black overfenders and lower front bumper'],
   cells:[{t:'Satin black lower front bumper, fender flares and rear bumper'},
          {t:'Glossy black lower front bumper and fender flares; silver rear bumper'},
          {t:'Satin black fender flares; silver lower front bumper and rear bumper'},
          {t:'Glossy black lower front bumper and fender flares. Toyota doesn’t describe the rear bumper.'}]},''')
r('''          {t:'Same as XSE'}]},
  {cat:'Outside', label:'Wheels',''', '''          {t:'Same as XSE'},
          {t:'Same as XSE'}]},
  {cat:'Outside', label:'Wheels',''')
r('''          {t:'18-in. machined 5-spoke dark gray', opt:'20-in. machined black (20-In. Wheel Package)'}]},''',
  '''          {t:'18-in. machined 5-spoke dark gray', opt:'20-in. machined black (20-In. Wheel Package)'},
          {t:'20-in. black, with black lug nuts'}]},''')
r('''          {t:'Panoramic glass roof; the front section tilts and slides'}]},
  {cat:'Outside', label:'Grille', common:'Body-colored grille on all three.',
   from:['Body-colored grille','Body-colored grille with dark chrome accents','Body-colored grille with satin chrome accents'],
   cells:[{t:'No accents'},{t:'Dark chrome accents'},{t:'Satin chrome accents'}]},
  {cat:'Outside', label:'Outside mirrors', common:'Glossy black, heated and power-adjusted, with turn signals and blind spot warning lights on all three.',
   from:['Piano-black heated power outside mirrors with turn signal and blind spot warning indicators',
         'Piano-black heated power outside mirrors with turn signal and blind spot warning indicators, and puddle lights'],
   cells:[{t:'No puddle lights'},{t:'XLE Premium plus puddle lights'},{t:'Same as XSE'}]},
  {cat:'Inside', label:'Wireless phone charging', common:'Qi-compatible, with a charge indicator light.',
   from:['Single Qi-compatible wireless charging with charge indicator light','Dual Qi-compatible wireless charging with charge indicator light'],
   cells:[{t:'1 charging pad'},{t:'1 charging pad'},{t:'2 charging pads'}]},
  {cat:'Inside', label:'Gear selector',
   from:['Leather-trimmed shift lever with sequential mode','Toggle shift-by-wire shifter lever'],
   cells:[{t:'Leather-trimmed lever'},
          {t:'Same as XLE Premium', opt:'Toggle switch instead (XSE Driver Assist Package)'},
          {t:'Toggle switch; no lever'}]},
  {cat:'Inside', label:'Seats', common:'SofTex synthetic leather, 8-way power driver’s seat with lumbar support, and a seatback pocket on all three.',
   from:['SofTex®-trimmed seats, heated front seats (high-low); 8-way power-adjustable driver\\'s seat with lumbar support; 6-way manual front passenger seat with seatback pocket',
         'SofTex®/synthetic suede-trimmed seats, heated and ventilated front seats (high-mid-low); 8-way power-adjustable driver\\'s seat with memory function and lumbar support; 8-way power front passenger seat with seatback pocket',
         'SofTex®-trimmed seats, heated and ventilated front seats (high-mid-low), heated rear seats (on-off); 8-way power-adjustable driver\\'s seat with memory function and lumbar support; 8-way power front passenger seat with seatback pocket'],
   cells:[{t:'Heated front seats (2 levels); 6-way manual passenger seat'},
          {t:'XLE Premium plus suede-like inserts, cooled front seats with 3 heat levels, driver’s seat memory, and an 8-way power passenger seat'},
          {t:'Same as XSE without the suede-like inserts, plus heated back seats'}]},''',
  '''          {t:'Panoramic glass roof; the front section tilts and slides'},
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
  {cat:'Inside', label:'Gear selector',
   from:['Leather-trimmed shift lever with sequential mode','Toggle shift-by-wire shifter lever','Sport paddle shifters'],
   cells:[{t:'Leather-trimmed lever'},
          {t:'Same as XLE Premium', opt:'Toggle switch instead (XSE Driver Assist Package)'},
          {t:'Toggle switch; no lever'},
          {t:'Same as XLE Premium', opt:'Toggle switch and paddle shifters (Driver Assist Package)'}]},
  {cat:'Inside', label:'Seats', common:'SofTex synthetic leather, 8-way power driver’s seat with lumbar support, and a seatback pocket on all four.',
   from:['SofTex®-trimmed seats, heated front seats (high-low); 8-way power-adjustable driver\\'s seat with lumbar support; 6-way manual front passenger seat with seatback pocket',
         'SofTex®/synthetic suede-trimmed seats, heated and ventilated front seats (high-mid-low); 8-way power-adjustable driver\\'s seat with memory function and lumbar support; 8-way power front passenger seat with seatback pocket',
         'SofTex®-trimmed seats, heated and ventilated front seats (high-mid-low), heated rear seats (on-off); 8-way power-adjustable driver\\'s seat with memory function and lumbar support; 8-way power front passenger seat with seatback pocket',
         'Mixed Media/SofTex-trimmed seats, heated and ventilated front seats (high-mid-low); 8-way power-adjustable driver\\'s seat with memory function and lumbar support; 8-way power front passenger seat with seatback pocket'],
   cells:[{t:'Heated front seats (2 levels); 6-way manual passenger seat'},
          {t:'XLE Premium plus suede-like inserts, cooled front seats with 3 heat levels, driver’s seat memory, and an 8-way power passenger seat'},
          {t:'Same as XSE without the suede-like inserts, plus heated back seats'},
          {t:'Same as XSE, with cloth inserts instead of suede-like ones'}]},
  {cat:'Inside', label:'Power outlets',
   from:['One 12V/120W auxiliary power outlet in front instrument panel storage tray and one 12V/120W auxiliary power outlet in cargo area',
         'One 12V/120W auxiliary power outlet in front instrument panel storage tray',
         'One 120V/1500W AC power outlet in cargo area'],
   cells:[{t:'12-volt sockets up front and in the cargo area'},{t:'Same as XLE Premium'},{t:'Same as XLE Premium'},
          {t:'12-volt socket up front; household-style 120-volt, 1,500-watt outlet in the cargo area'}]},''')
r('''          {t:'Camera mirror, with garage door opener'}]},
  {cat:'Inside', label:'Steering wheel', common:'Leather-trimmed, tilts and telescopes, with buttons for audio, phone, voice, cruise control and lane assist on all three.',''',
  '''          {t:'Camera mirror, with garage door opener'},
          {t:'Auto-dimming, with garage door opener', opt:'Camera mirror (Panoramic Moonroof Package)'}]},
  {cat:'Inside', label:'Steering wheel', common:'Leather-trimmed, tilts and telescopes, with buttons for audio, phone, voice, cruise control and lane assist on all four.',''')
r('''          {t:'Heated'}]},
  {cat:'Screen & sound', label:'Touchscreen and speakers', common:'Wireless Apple CarPlay and Android Auto, and a 3-month SiriusXM trial on all three.',''',
  '''          {t:'Heated'},
          {t:'Not heated', opt:'Heated (Weather Package)'}]},
  {cat:'Screen & sound', label:'Touchscreen and speakers', common:'Wireless Apple CarPlay and Android Auto, and a 3-month SiriusXM trial on all four.',''')
r('''         '12.9-in. Toyota Audio Multimedia, 9-speaker JBL® Premium Audio including subwoofer and amplifier, with wireless Apple CarPlay® & Android Auto™ compatibility, SiriusXM® with 360L 3-month trial subscription. See toyota.com/connected-services for details.'],
   cells:[{t:'10.5-in. screen, 6 speakers'},
          {t:'12.9-in. screen, 6 speakers', opt:'9-speaker JBL with subwoofer (JBL Premium Audio Package)'},
          {t:'12.9-in. screen, 9-speaker JBL with subwoofer'}]},
];''', '''         '12.9-in. Toyota Audio Multimedia, 9-speaker JBL® Premium Audio including subwoofer and amplifier, with wireless Apple CarPlay® & Android Auto™ compatibility, SiriusXM® with 360L 3-month trial subscription. See toyota.com/connected-services for details.',
         '9-speaker JBL® Premium Audio including subwoofer and amplifier'],
   cells:[{t:'10.5-in. screen, 6 speakers'},
          {t:'12.9-in. screen, 6 speakers', opt:'9-speaker JBL with subwoofer (JBL Premium Audio Package)'},
          {t:'12.9-in. screen, 9-speaker JBL with subwoofer'},
          {t:'12.9-in. screen, 6 speakers', opt:'9-speaker JBL with subwoofer (JBL Premium Audio Package)'}]},
  {cat:'Safety & driver help', label:'Blind spot warning', common:'Blind Spot Monitor and Rear Cross-Traffic Alert on all four.',
   from:['Blind Spot Monitor (BSM) with Rear Cross-Traffic Alert (RCTA) and Safe Exit Alert (SEA)','Blind Spot Monitor (BSM) with Rear Cross-Traffic Alert (RCTA)'],
   cells:[{t:'Plus Safe Exit Alert'},{t:'Plus Safe Exit Alert'},{t:'Plus Safe Exit Alert'},{t:'Toyota doesn’t list Safe Exit Alert'}]},
  {cat:'Engine & drivetrain', label:'Powertrain', common:'A 2.5-liter 4-cylinder gas engine working with electric motors on all four.',
   from:['Hybrid powertrain: 2.5-Liter Dynamic Force 4-Cylinder with SPORT, Eco, NORMAL, EV, , SNOW drive modes; 229 net combined hp',
         '2.5-Liter Dynamic Force 4-Cylinder with SPORT, Eco, NORMAL, EV, TRAIL, SNOW drive modes; 321 combined net hp'],
   cells:[{t:'229 hp combined'},{t:'229 hp combined'},{t:'229 hp combined'},{t:'321 hp combined; adds a Trail drive mode'}]},
  {cat:'Engine & drivetrain', label:'Max. torque',
   from:['Max. Torque: 163 lb.-ft. (231 N•m)','Max. torque: 172 lb.-ft. (231 N•m)'],
   cells:[{t:'163 lb.-ft.'},{t:'163 lb.-ft.'},{t:'163 lb.-ft.'},{t:'172 lb.-ft.'}]},
  {cat:'Engine & drivetrain', label:'Electric motor output (front/rear)',
   from:['Max output (front/rear): 100/40 kW','Power output (front/rear): 150/40 kW'],
   cells:[{t:'100/40 kW'},{t:'100/40 kW'},{t:'100/40 kW'},{t:'150/40 kW'}]},
];''')
r('''  const cell=([s,v])=> s==='val'?''', '''  const cell=([s,v])=> s==='nl'? pill('nl') : s==='val'?''')
r('''<p class="spec-more">Option packages, and the Limited’s head-up display option, are listed''',
  '''<p class="spec-more">Option packages, and the Limited’s head-up display option, are listed''')

for old, new, n in E:
    c = s.count(old)
    if c != n:
        sys.exit(f'expected {n} match(es), found {c}:\n{old[:300]}')
    s = s.replace(old, new)
open(p, 'w', encoding='utf-8').write(s)
print('applied', len(E), 'edits')
