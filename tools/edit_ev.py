import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
def rep(old, new, count=1):
    global s
    assert s.count(old) == count, (s.count(old), old[:80]); s = s.replace(old, new)

# Tokens: a "too much" red for the outlet meter, in light and both dark blocks.
rep('--no:#7A8086; --no-soft:#EEF0F1;', '--no:#7A8086; --no-soft:#EEF0F1; --bad:#B3261E;')
rep('--no:#8B9298; --no-soft:#262B2E;', '--no:#8B9298; --no-soft:#262B2E; --bad:#FF8A80;', 2)

# CSS for the cost calculator and the outage calculator.
rep('.ev-key i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-1px}',
'''.ev-key i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.ev-block{display:grid;gap:14px;border-top:1px solid var(--rule);padding-top:20px;margin-top:6px}
.ev-block h5,.ap-q{font:800 21px Overpass,sans-serif;margin:0}
.ev-sliders{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px 24px}
.ev-sliders label{font-size:16px}
.cost-rows{display:grid;gap:8px}
.cost-row{display:grid;grid-template-columns:7.2em minmax(0,1fr) 5.4em;gap:12px;align-items:center;font:700 16px Overpass,sans-serif}
.cost-row .bar{height:20px;border-radius:6px;background:var(--rule);overflow:hidden}
.cost-row .bar span{display:block;height:100%;width:0;background:var(--c);transition:width .25s}
.cost-row b{text-align:right;font-variant-numeric:tabular-nums}
.ap-chips .chip{background:var(--card);font-size:16px;padding:8px 14px}
.ap-chips .chip small{font-size:14px;opacity:.75}
.ap-track{height:22px;border-radius:8px;background:var(--rule);overflow:hidden}
.ap-fill{display:block;height:100%;width:0;background:var(--phv);transition:width .25s,background-color .2s}
.ap-meter.over .ap-fill{background:var(--bad)}
.ap-scale{display:flex;justify-content:space-between;gap:12px;font-size:15px;color:var(--ink-2);margin-top:6px}
.ap-scale b{color:var(--ink)}
.ap-meter.over .ap-scale b{color:var(--bad)}''')

# The outlet card gets the outage calculator, so it becomes a full card with a wide demo.
rep("""  {id:'outlet', group:'Plug-in Hybrid', name:'Household-style power outlet', compact:true,""",
    """  {id:'outlet', group:'Plug-in Hybrid', name:'Household-style power outlet',""")
rep("""   what:'A regular three-prong outlet in the cargo area, like the ones in your house. It can run things up to 1,500 watts, such as a laptop, a work light, an electric cooler or a small coffee maker.',
   why:'Handy for camping, tailgating or a power outage. The Hybrids have only small 12-volt sockets, the kind phone chargers plug into.',
   trims:[['no','12-volt sockets only'],['no','12-volt sockets only'],['no','12-volt sockets only'],['std']]},""",
"""   what:'A regular three-prong outlet in the cargo area, like the ones in your house. It runs off the Plug-in’s big battery and can power up to 1,500 watts at once: a refrigerator, lamps, Wi-Fi and phone chargers, or one small space heater.',
   why:'Most useful in a power outage. A charged battery could keep a refrigerator, Wi-Fi and a few lamps going for a few days. It’s handy for camping and tailgating too. The Hybrids have only small 12-volt sockets, the kind phone chargers plug into.',
   trims:[['no','12-volt sockets only'],['no','12-volt sockets only'],['no','12-volt sockets only'],['std']], visual:'outageDemo', wide:true},""")

# Driving on electricity: keep the one-day slider, add the 5-year fuel cost against the Hybrid XSE.
start = s.index('VIS.evDemo = ()=>{')
end = s.index('/* ===================== FEATURE LIST ===================== */')
s = s[:start] + r'''// --- Plug-in: how one day splits between electricity and gas, then gas and electricity cost over
//     5 years against the Hybrid XSE. Starting prices are for Montgomery County, Texas (sources in
//     the footer). ---
VIS.evDemo = ()=>{
  const RANGE=50, MPG_PHEV=39, MPG_XSE=40, MPGE=102, KWH_PER_GALLON=33.7, YEARS=5;
  // EPA's MPGe counts energy taken from the wall, so charging losses are already in this figure.
  const KWH_PER_MILE = KWH_PER_GALLON/MPGE;
  const PREMIUM = PACKAGES.phv.base - PACKAGES.xse.base;
  const money = n=>'$'+(Math.round(n/10)*10).toLocaleString('en-US');
  const slider = (id,label,min,max,step,val)=>`<div><label for="${id}">${label}: <span id="${id}Out"></span></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" aria-describedby="evSave"></div>`;
  return {html:`
  <div class="demo ev-demo">
    <label for="evMiles">A typical day of driving: <span id="evOut"></span> miles</label>
    <input type="range" id="evMiles" min="5" max="120" step="5" value="30" aria-describedby="evSum">
    <div class="ev-bar" aria-hidden="true"><span class="e"></span><span class="g"></span></div>
    <div class="ev-key" aria-hidden="true"><span><i style="background:var(--phv)"></i>On electricity</span><span><i style="background:var(--no)"></i>On gas, as a regular hybrid</span></div>
    <p class="demo-summary" id="evSum" aria-live="polite"></p>
    <p class="small muted" style="margin:0">Starting each day with a full charge, using Toyota’s EPA estimates: 50 miles on electricity, then 39 mpg. Cold weather, highway speeds and running the heater shorten the electric range.</p>
    <section class="ev-block" aria-labelledby="evCostT">
      <h5 id="evCostT">Fuel cost over ${YEARS} years, against a Hybrid XSE</h5>
      <div class="ev-sliders">
        ${slider('evDays','Days you drive a year',100,365,5,300)}
        ${slider('evGas','Gas, per gallon',2.5,5.5,0.05,3.37)}
        ${slider('evKwh','Home electricity, per kWh',8,40,1,15)}
      </div>
      <div class="cost-rows" aria-hidden="true">
        <div class="cost-row" style="--c:var(--xse)"><span>Hybrid XSE</span><span class="bar"><span id="evBarH"></span></span><b id="evCostH"></b></div>
        <div class="cost-row" style="--c:var(--phv)"><span>Plug-in XSE</span><span class="bar"><span id="evBarP"></span></span><b id="evCostP"></b></div>
      </div>
      <p class="demo-summary" id="evSave" aria-live="polite"></p>
      <p class="small muted" style="margin:0">Uses the miles per day above and assumes you charge at home every night. Prices start at $3.37 a gallon (AAA’s Montgomery County average, November 16, 2026) and 15¢ per kWh (about what Montgomery County homes pay, delivery included, per EnergySage in October 2026). Only gas and electricity are counted, not insurance, upkeep or rebates.</p>
    </section>
  </div>`, init(root){
    const $in = id=>root.querySelector('#'+id);
    const inp=$in('evMiles'), days=$in('evDays'), gas=$in('evGas'), kwh=$in('evKwh');
    const gal=n=>n<0.05?'no':n.toFixed(1);
    const set=()=>{
      const m=+inp.value, e=Math.min(m,RANGE), g=m-e;
      $in('evOut').textContent=m;
      root.querySelector('.ev-bar .e').style.flexGrow=e; root.querySelector('.ev-bar .g').style.flexGrow=g;
      $in('evSum').innerHTML = g===0
        ? `<b>All ${m} miles on electricity.</b> The Plug-in uses no gas. A Hybrid XSE would use about ${gal(m/MPG_XSE)} gallons.`
        : `<b>The first ${RANGE} miles on electricity, the last ${g} on gas.</b> The Plug-in uses about ${gal(g/MPG_PHEV)} gallons. A Hybrid XSE would use about ${gal(m/MPG_XSE)}.`;

      const d=+days.value, gp=+gas.value, ep=+kwh.value/100;
      $in('evDaysOut').textContent=d;
      $in('evGasOut').textContent='$'+gp.toFixed(2);
      $in('evKwhOut').textContent=kwh.value+'¢';
      const hyb = YEARS*d*(m/MPG_XSE*gp);
      const phv = YEARS*d*(e*KWH_PER_MILE*ep + g/MPG_PHEV*gp);
      const top = Math.max(hyb,phv,1);
      $in('evBarH').style.width = hyb/top*100+'%'; $in('evBarP').style.width = phv/top*100+'%';
      $in('evCostH').textContent = money(hyb); $in('evCostP').textContent = money(phv);
      const save = hyb-phv;
      if(save < 5){
        $in('evSave').innerHTML = `<b>No fuel savings at these numbers.</b> The Plug-in would cost about ${money(-save)} more to fuel over ${YEARS} years, and it costs ${money(PREMIUM)} more to buy.`;
      } else {
        const yrs = Math.round(PREMIUM/(save/YEARS));
        const back = yrs>20 ? 'more than 20 years' : `about ${Math.max(yrs,1)} year${yrs>1?'s':''}`;
        $in('evSave').innerHTML = `<b>The Plug-in saves about ${money(save)} over ${YEARS} years</b> (${money(save/YEARS)} a year). It costs ${money(PREMIUM)} more to buy, so the fuel savings take ${back} to make that back.`;
      }
    };
    [inp,days,gas,kwh].forEach(i=>i.addEventListener('input',set)); set();
  }};
};

// --- Plug-in outlet in a power outage: pick appliances, see the load against the outlet's limit and
//     a rough run time on the battery alone. ---
VIS.outageDemo = ()=>{
  const LIMIT=1500;
  // Toyota doesn't publish how much of the 22.7 kWh battery is usable. A full charge takes about
  // 50 miles x 33.7/102 = 16.5 kWh from the wall. Less charging losses, that's about 15 kWh in the
  // battery, and about 13.5 kWh at the outlet after its power converter (assumed 90% efficient).
  const OUTLET_KWH=13.5;
  // Typical draws. The refrigerator and freezer are averages, since their compressors cycle.
  const APPS=[
    {id:'fridge', name:'Refrigerator', w:70, on:true},
    {id:'wifi', name:'Wi-Fi router and modem', w:20, on:true},
    {id:'phones', name:'Phones charging', w:20, on:true},
    {id:'lamps', name:'Three LED lamps', w:30, on:true},
    {id:'freezer', name:'Chest freezer', w:40},
    {id:'cpap', name:'CPAP machine', w:60},
    {id:'laptop', name:'Laptop', w:60},
    {id:'fan', name:'Box fan', w:75},
    {id:'tv', name:'TV', w:100},
    {id:'ac', name:'Small window air conditioner', w:500},
    {id:'heater', name:'Space heater on high', w:1500},
  ];
  const fmtW = n=>n.toLocaleString('en-US')+' W';
  return {html:`
  <div class="demo outage-demo">
    <p class="ap-q" id="apQ">What would you plug in during an outage?</p>
    <div class="chips ap-chips" role="group" aria-labelledby="apQ">${APPS.map(a=>`<button type="button" class="chip" data-id="${a.id}" aria-pressed="${!!a.on}"><span class="tick" aria-hidden="true">✓</span>${esc(a.name)} <small>${fmtW(a.w)}</small></button>`).join('')}</div>
    <div class="ap-meter" aria-hidden="true">
      <div class="ap-track"><span class="ap-fill"></span></div>
      <div class="ap-scale"><span>Plugged in: <b id="apW"></b></span><span>Outlet limit: ${fmtW(LIMIT)}</span></div>
    </div>
    <p class="demo-summary" id="apSum" aria-live="polite"></p>
    <p class="small muted" style="margin:0">A rough estimate. Toyota doesn’t say how much of the 22.7 kWh battery the outlet can use, so this assumes about ${OUTLET_KWH} kWh, worked out from Toyota’s 50-mile range and 102 MPGe. Wattages are typical; the label on your own appliance gives the real number. The car has to be switched on for the outlet to work. On the earlier RAV4 Prime, Toyota’s manual says to let the engine run in Park to recharge a low battery, which would stretch this a long way on a tank of gas. If you ever do that, keep the car outdoors, never in a garage: engine exhaust is deadly indoors.</p>
  </div>`, init(root){
    const chips=[...root.querySelectorAll('.ap-chips .chip')];
    const byId=Object.fromEntries(APPS.map(a=>[a.id,a]));
    const span = h=>{
      if(h<1) return 'less than an hour';
      if(h<36) return `about ${Math.round(h)} hour${Math.round(h)>1?'s':''}`;
      const d=Math.round(h/24*2)/2;
      return `about ${Math.floor(d)}${d%1?'½':''} days`;
    };
    const set=()=>{
      const on=chips.filter(c=>c.getAttribute('aria-pressed')==='true').map(c=>byId[c.dataset.id]);
      const W=on.reduce((t,a)=>t+a.w,0), over=W>LIMIT;
      root.querySelector('.ap-meter').classList.toggle('over',over);
      root.querySelector('.ap-fill').style.width=Math.min(W/LIMIT,1)*100+'%';
      root.querySelector('#apW').textContent=fmtW(W);
      root.querySelector('#apSum').innerHTML =
        !W ? 'Tap a few things above to see how long the battery could run them.'
        : over ? `<b>${fmtW(W)} is more than the outlet’s ${fmtW(LIMIT)}.</b> It would shut off. Unplug something, or run the big items one at a time.`
        : `<b>${span(OUTLET_KWH*1000/W)[0].toUpperCase()+span(OUTLET_KWH*1000/W).slice(1)} on the battery alone</b> for ${fmtW(W)} of appliances, running nonstop.`;
    };
    root.querySelector('.ap-chips').addEventListener('click',e=>{const b=e.target.closest('.chip'); if(!b) return; b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true'); set();});
    set();
  }};
};

''' + s[end:]

# Dealer checklist: the outage behaviour is the part Toyota's US pages don't spell out.
rep("""  ['Ask about tax credits and rebates for the Plug-in.',""",
"""  ['Ask how the Plug-in’s power outlet works in an outage.','Does the car have to stay on, will the engine start by itself to recharge the battery, and does the outlet work in cold weather?'],
  ['Ask about tax credits and rebates for the Plug-in.',""")

# Footer sources.
rep("which is also the source of the Plug-in's battery size.",
    "which is also the source of the Plug-in's battery size. The fuel-cost calculator starts from AAA's Montgomery County, Texas gas average (November 16, 2026, as reported by KPRC Click2Houston) and EnergySage's Montgomery County electricity rate (October 2026). Appliance wattages in the outage calculator are typical figures, not measurements.")
open(p, 'w', encoding='utf-8').write(s); print('ok')
