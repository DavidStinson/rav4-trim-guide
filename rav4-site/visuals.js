// The interactive demos beside some features (camera, mirror, head-up display, screens, wheels, roof,
// plug-in, outage). Each VIS entry returns {html, below?, init?}; app.js places them in the feature list.
// Loaded before app.js; the functions run later, so they can use app.js helpers such as esc and photoAttrs.
/* ===================== VISUALS ===================== */
const VIS = {};

// --- Backup camera vs 360 camera: pulled nose-first into a parking-lot space, sitting a little
//     close to the right-hand line. Only the 360 camera can show the lines, the parking block and
//     the cart beside you; the backup camera only sees the aisle behind, and only in reverse. ---
VIS.cameraDemo = ()=>{
  // Our car: x 258-358, y 46-282, front up. The stall around it runs x 225-375, so the car sits
  // 33px from the left line and 17px from the right one.
  const objs = [
    {n:1,label:'Painted line on your left',            x:225,y:150, back:false, c:'#3F6E8F'},
    {n:2,label:'Painted line on your right',           x:375,y:150, back:false, c:'#5B4FA0'},
    {n:3,label:'Parking block in front of your bumper', x:364,y:28,  back:false, c:'#7A5C3B'},
    {n:4,label:'Shopping cart in the next space',      x:458,y:150, back:false, c:'#2F7D5B'},
    {n:5,label:'Person walking behind you',            x:396,y:402, back:true,  c:'#B0303F'},
    {n:6,label:'Cars parked across the aisle',         x:310,y:442, back:true,  c:'#D08A12'},
  ];
  const car = (x,y,fill)=>`<rect x="${x}" y="${y}" width="100" height="236" rx="24" fill="${fill}"/><rect x="${x+12}" y="${y+38}" width="76" height="44" rx="10" fill="#2B3238" opacity=".55"/><rect x="${x+12}" y="${y+170}" width="76" height="38" rx="10" fill="#2B3238" opacity=".55"/>`;
  const svg = `
  <svg class="scene" viewBox="0 0 600 460" role="img" aria-labelledby="camT camD">
    <title id="camT">Top-down view of a RAV4 pulled into a parking-lot space</title>
    <desc id="camD">The RAV4 sits a little closer to the right-hand line than the left. The shaded area shows what the camera system can see. Numbered markers show the lines and objects around the car.</desc>
    <defs>
      <mask id="mBack"><rect width="600" height="460" fill="white"/><path d="M308 282 L128 460 L488 460 Z" fill="black"/></mask>
      <mask id="m360"><rect width="600" height="460" fill="white"/><rect x="150" y="6" width="340" height="446" rx="70" fill="black"/></mask>
      <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#202427"/><rect width="4" height="10" fill="#2E3438"/></pattern>
    </defs>
    <!-- asphalt, the curb at the head of the row, and the painted stalls -->
    <rect width="600" height="460" fill="#7C837F"/>
    <rect width="600" height="12" fill="#C9CBC2"/><rect y="12" width="600" height="4" fill="#E9E8DF"/>
    <g stroke="#F4F4EE" stroke-width="5">${[75,225,375,525].map(x=>`<line x1="${x}" y1="16" x2="${x}" y2="296"/>`).join('')}</g>
    <g fill="#B9B6AC">${[118,268,418].map(x=>`<rect x="${x}" y="22" width="80" height="12" rx="4"/>`).join('')}</g>
    <!-- parked cars: one beside you, one two spaces over, two across the aisle -->
    ${car(100,48,'#5B6168')}${car(550,48,'#3F6E8F')}
    <rect x="160" y="430" width="100" height="120" rx="24" fill="#5B6168"/><rect x="360" y="430" width="100" height="120" rx="24" fill="#8A6F4E"/>
    <!-- our RAV4 -->
    <g>
      <rect x="258" y="46" width="100" height="236" rx="26" fill="#ECEEEC" stroke="#202427" stroke-width="3"/>
      <rect x="270" y="84" width="76" height="46" rx="10" fill="#5A7486"/>
      <rect x="270" y="214" width="76" height="40" rx="10" fill="#5A7486"/>
      <rect x="274" y="136" width="68" height="72" rx="8" fill="#D6DAD7"/>
      <rect x="248" y="82" width="12" height="16" rx="3" fill="#202427"/><rect x="356" y="82" width="12" height="16" rx="3" fill="#202427"/>
      <text x="308" y="178" text-anchor="middle" font-family="Overpass" font-weight="800" font-size="17" fill="#202427">YOU</text>
    </g>
    <!-- shopping cart and a person walking behind -->
    <g><rect x="406" y="176" width="48" height="56" rx="6" fill="none" stroke="#2F7D5B" stroke-width="5"/><path d="M412 192h36M412 206h36M412 220h36" stroke="#2F7D5B" stroke-width="3"/></g>
    <g><ellipse cx="362" cy="388" rx="17" ry="10" fill="#B0303F"/><circle cx="362" cy="388" r="8" fill="#E2B48C"/></g>
    <text x="16" y="322" font-size="18" fill="#E9E8DF">parking aisle</text>
    <!-- coverage overlays -->
    <g id="ovBack" class="ov" style="transition:opacity .35s">
      <rect width="600" height="460" fill="url(#hatch)" opacity=".62" mask="url(#mBack)"/>
      <path class="view-zone" d="M308 282 L128 460 L488 460 Z" fill="#F2B705" opacity=".22"/>
      <path d="M308 282 L128 460 M308 282 L488 460" stroke="#F2B705" stroke-width="3" stroke-dasharray="8 6"/>
      <circle class="cam-dot" cx="308" cy="282" r="7" fill="#202427" stroke="#FFFFFF" stroke-width="2.5"/>
    </g>
    <g id="ov360" class="ov" style="transition:opacity .35s;opacity:0">
      <rect width="600" height="460" fill="url(#hatch)" opacity=".62" mask="url(#m360)"/>
      <rect class="view-zone" x="150" y="6" width="340" height="446" rx="70" fill="#F2B705" opacity=".16" stroke="#F2B705" stroke-width="3" stroke-dasharray="8 6"/>
      ${[[308,46],[308,282],[254,90],[362,90]].map(([x,y])=>`<circle class="cam-dot" cx="${x}" cy="${y}" r="7" fill="#202427" stroke="#FFFFFF" stroke-width="2.5"/>`).join('')}
    </g>
    <!-- markers -->
    ${objs.map(o=>`<g class="mk" data-n="${o.n}"><circle cx="${o.x}" cy="${o.y}" r="16" fill="${o.c}" stroke="#fff" stroke-width="3"/><text x="${o.x}" y="${o.y+6}" text-anchor="middle" font-family="Overpass" font-weight="800" font-size="17" fill="#fff">${o.n}</text></g>`).join('')}
  </svg>`;
  const html = `
  <div class="demo">
    <div class="demo-cols">
      <div>
        <div class="seg cam-seg" role="group" aria-label="Camera type">
          <button type="button" data-mode="back" aria-pressed="true">Backup camera</button>
          <button type="button" data-mode="360" aria-pressed="false">360° camera</button>
        </div>
        ${svg}<p class="cap" style="margin-top:8px">Black dots are cameras. The yellow area is what the screen shows.</p></div>
      <div style="display:grid;gap:16px;align-content:start">
        <p class="demo-text" id="camSummary" aria-live="polite"></p>
        <ul class="seelist" id="camList">${objs.map(o=>`<li data-n="${o.n}"><span class="dot" style="background:${o.c}">${o.n}</span>${esc(o.label)}<span class="st"></span></li>`).join('')}</ul>
      </div>
    </div>
    <div class="photo-pair">
      <figure><img ${photoAttrs('backup-edmunds', 'auto, (min-width: 700px) 660px, 90vw')} alt="RAV4 center screen in reverse, showing the street behind the car with yellow, red and green guide lines" loading="lazy"><figcaption>XLE Premium: the backup camera on the 10.5-inch screen. Guide lines bend as you turn the wheel.</figcaption></figure>
      <figure><img ${photoAttrs('RHV_MY27_0015', 'auto, (min-width: 700px) 660px, 90vw')} alt="RAV4 dashboard screen showing an overhead view of the car on the left and a 3D view of the car on the right" loading="lazy"><figcaption>The other three: an overhead view (left) and a 3D view you can rotate (right).</figcaption></figure>
    </div>
  </div>`;
  return {html, init(root){
    const objsBy = Object.fromEntries(objs.map(o=>[o.n,o]));
    const set = mode=>{
      root.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===mode));
      root.querySelector('#ovBack').style.opacity = mode==='back'?1:0;
      root.querySelector('#ov360').style.opacity = mode==='360'?1:0;
      let seen=0;
      root.querySelectorAll('#camList li').forEach(li=>{
        const o=objsBy[li.dataset.n]; const vis = mode==='360' || o.back; if(vis) seen++;
        li.classList.toggle('hidden',!vis);
        li.querySelector('.st').innerHTML = vis?pill('std','Visible'):pill('no','Hidden');
      });
      root.querySelector('#camSummary').innerHTML = mode==='back'
        ? `<b>Backup camera:</b> you see ${seen} of 6. To check the lines, you open the door and look.`
        : `<b>360° camera:</b> you see all 6 from above, pulling in or backing out, without opening a door.`;
    };
    root.querySelector('.seg').addEventListener('click',e=>{const b=e.target.closest('button'); if(b) set(b.dataset.mode);});
    set('back');
  }};
};

// --- Digital rearview mirror ---
VIS.mirrorDemo = ()=>{
  const road = `
    <rect x="0" y="0" width="520" height="120" fill="#BFD7EA"/>
    <rect x="0" y="70" width="520" height="70" fill="#7F9A6E"/>
    <path d="M200 70 L320 70 L520 140 L0 140 Z" fill="#5E6468"/>
    <path d="M258 72 L262 72 L270 140 L250 140 Z" fill="#F2B705"/>
    <rect x="292" y="80" width="64" height="40" rx="9" fill="#B0303F"/><rect x="300" y="86" width="48" height="14" rx="4" fill="#3B4A57"/>
    <circle cx="300" cy="112" r="4" fill="#FFE9A8"/><circle cx="348" cy="112" r="4" fill="#FFE9A8"/>
    <rect x="150" y="76" width="40" height="26" rx="6" fill="#3F6E8F"/>`;
  const html = `
  <div class="demo" style="height:100%;align-content:center">
    <div class="seg" role="group" aria-label="Mirror mode">
      <button type="button" data-mode="glass" aria-pressed="true">Regular mirror</button>
      <button type="button" data-mode="cam" aria-pressed="false">Camera mode</button>
    </div>
    <div class="mirror-wrap">
      <svg class="mirror-svg" viewBox="0 0 560 156" role="img" aria-labelledby="mirT"><title id="mirT">View in the rearview mirror</title>
        <defs><clipPath id="mclip"><rect x="20" y="20" width="520" height="120" rx="40"/></clipPath></defs>
        <rect x="270" y="0" width="20" height="24" fill="#3A3F43"/>
        <rect x="10" y="12" width="540" height="136" rx="48" fill="#2A2F33"/>
        <g clip-path="url(#mclip)"><g transform="translate(20,20)">${road}</g>
          <g id="mirGlass" style="transition:opacity .35s">
            <path d="M20 20 H540 V140 H20 Z M110 46 Q280 30 450 46 L470 122 Q280 132 90 122 Z" fill="#3E4448" fill-rule="evenodd"/>
            <rect x="140" y="88" width="80" height="60" rx="20" fill="#2B3034"/><rect x="340" y="88" width="80" height="60" rx="20" fill="#2B3034"/>
            <circle cx="250" cy="96" r="30" fill="#6B5446"/><rect x="214" y="118" width="72" height="40" rx="18" fill="#5B6E8A"/>
            <rect x="300" y="64" width="70" height="80" fill="#B88A54" stroke="#8C6224" stroke-width="3"/><rect x="368" y="80" width="56" height="64" fill="#C79A63" stroke="#8C6224" stroke-width="3"/>
          </g>
        </g>
      </svg>
      <p class="demo-cap" id="mirCap" aria-live="polite"></p>
    </div>
  </div>`;
  return {html, init(root){
    const set=m=>{
      root.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===m));
      root.querySelector('#mirGlass').style.opacity = m==='glass'?1:0;
      root.querySelector('#mirCap').textContent = m==='glass'?'Headrests, a passenger and boxes block most of the view':'Camera mode: the road behind, with nothing in the way';
    };
    root.querySelector('.seg').addEventListener('click',e=>{const b=e.target.closest('button'); if(b) set(b.dataset.mode);});
    set('glass');
  }};
};

// --- Head-up display ---
VIS.hudDemo = ()=>({html:`
  <div class="mini-demo">
    <svg viewBox="110 90 300 210" role="img" aria-labelledby="hudT"><title id="hudT">Speed and speed limit projected on the windshield above the hood</title>
      <rect width="520" height="300" fill="#BFD7EA"/>
      <rect y="150" width="520" height="150" fill="#7F9A6E"/>
      <path d="M210 150 L310 150 L520 300 L0 300 Z" fill="#5E6468"/>
      <path d="M250 220 L270 220 L276 280 L244 280 Z" fill="#F2B705"/>
      <path d="M0 250 Q260 210 520 250 L520 300 L0 300 Z" fill="#2B3034"/>
      <path d="M0 0 H520 V30 Q260 10 0 30 Z" fill="#2B3034"/>
      <g opacity=".92">
        <rect x="170" y="150" width="180" height="60" rx="10" fill="#0E2A3A" opacity=".35"/>
        <text x="236" y="194" text-anchor="middle" font-family="Overpass" font-weight="800" font-size="38" fill="#7FF2D2">45</text>
        <text x="236" y="208" text-anchor="middle" font-size="12" fill="#7FF2D2">mph</text>
        <rect x="280" y="158" width="44" height="48" rx="5" fill="#fff" opacity=".9"/><text x="302" y="174" text-anchor="middle" font-size="11" fill="#222">LIMIT</text><text x="302" y="197" text-anchor="middle" font-size="20" font-weight="800" font-family="Overpass" fill="#222">45</text>
      </g>
    </svg>
  </div>`});

// --- Screen sizes: a to-scale drawing beside the copy, then (as a full-width row under the card)
//     the same crop from two dashboards shot from the same spot. A VIS may return `below` for such a row. ---
VIS.screenPair = ()=>{
  const W=v=>v*26, H=v=>v*26*0.42*1.45;
  return {html:`
  <div class="demo">
    <svg class="scr-scale" viewBox="0 0 400 260" role="img" aria-labelledby="scrT"><title id="scrT">The 10.5-inch and 12.9-inch screens drawn to scale</title>
      <g transform="translate(32,40)">
        <rect width="${W(12.9)}" height="${H(12.9)}" rx="12" fill="var(--xse)" fill-opacity=".18" stroke="var(--xse)" stroke-width="3"/>
        <rect x="0" y="${H(12.9)-H(10.5)}" width="${W(10.5)}" height="${H(10.5)}" rx="10" fill="var(--xle)" fill-opacity=".28" stroke="var(--xle)" stroke-width="3"/>
        <text x="${W(12.9)-10}" y="26" text-anchor="end" font-family="Overpass" font-weight="800" font-size="20" fill="var(--xse)">12.9″ the other three</text>
        <text x="12" y="${H(12.9)-14}" font-family="Overpass" font-weight="800" font-size="20" fill="var(--xle)">10.5″ XLE Premium</text>
      </g>
    </svg>
    <p class="cap" style="margin:0">Drawn to scale. The larger screen has about 50% more viewing area.</p>
  </div>`, below:`
  <div class="f-below">
    <div class="photo-pair keep2">
      <figure><img ${photoAttrs('scr-xle', 'auto, (min-width: 1100px) 660px, 45vw')} alt="The 10.5-inch center screen in the XLE Premium dashboard" loading="lazy"><figcaption>10.5-inch screen (XLE Premium)</figcaption></figure>
      <figure><img ${photoAttrs('scr-ltd', 'auto, (min-width: 1100px) 660px, 45vw')} alt="The 12.9-inch center screen in the Limited dashboard" loading="lazy"><figcaption>12.9-inch screen (XSE, Limited and Plug-in XSE)</figcaption></figure>
    </div>
  </div>`};
};

// --- Wheels: sidewall comparison ---
// One list feeds the drawing, its accessible title and the labels under it, so they can't disagree.
// [center x, name, what it means, rim radius, color]
VIS.wheelDemo = ()=>{
  const WHEELS = [[110,'18-inch wheel','Taller sidewall, softer ride',62,'var(--xle)'],[330,'20-inch wheel','Shorter sidewall, firmer ride',74,'var(--xse)']];
  return {html:`
  <div class="mini-demo">
    <svg viewBox="0 0 440 196" role="img" aria-labelledby="whT"><title id="whT">${WHEELS.map(([,t,s])=>`${t}: ${s.toLowerCase()}`).join('. ')}.</title>
      ${WHEELS.map(([cx,,,r])=>`
        <circle cx="${cx}" cy="100" r="92" fill="#2B3034"/>
        <circle cx="${cx}" cy="100" r="${r}" fill="#A9B0B4" stroke="#fff" stroke-width="3"/>
        ${[0,72,144,216,288].map(a=>`<rect x="${cx-5}" y="${100-r+6}" width="10" height="${r-12}" rx="4" fill="#7C8488" transform="rotate(${a} ${cx} 100)"/>`).join('')}
        <circle cx="${cx}" cy="100" r="14" fill="#5B6168"/>
        <path d="M${cx+r} 100 H${cx+92}" stroke="var(--lane)" stroke-width="5"/>`).join('')}
    </svg>
    <div class="wheel-caps" aria-hidden="true">${WHEELS.map(([,t,s,,c])=>`<p style="--c:${c}"><b>${t}</b>${s}</p>`).join('')}</div>
    <p class="cap" style="margin:0">Same overall tire height. The yellow line marks the sidewall, the rubber that cushions bumps.</p>
  </div>`};
};

// --- Roof options: the same interior photo from Toyota's build tool for each trim ---
VIS.roofPhotos = ()=>{
  const MODES = {
    solid:{label:'Solid roof', img:'roof-xle', alt:'XLE Premium interior with a solid roof',
      text:'<b>XLE Premium, as standard:</b> a solid roof. The panoramic roof is available as a package.'},
    sun:{label:'Regular sunroof', img:'roof-xse', alt:'XSE interior with a regular sunroof over the front seats',
      text:'<b>Both XSEs, as standard:</b> a glass panel over the front seats that tilts up or slides back. The back seat stays under a solid roof.'},
    pano:{label:'Panoramic roof', img:'roof-ltd', alt:'Limited interior with a panoramic glass roof over both rows',
      text:'<b>Limited, or as a package on the others:</b> glass over both rows. The front section opens and the back stays fixed. A power shade closes underneath to block the sun.'},
  };
  const html = `
  <div class="demo">
    <div class="seg" role="group" aria-label="Roof type">
      ${Object.entries(MODES).map(([k,m],i)=>`<button type="button" data-mode="${k}" aria-pressed="${i===0}">${m.label}</button>`).join('')}
    </div>
    <figure class="roof-photo"><img id="roofImg" ${photoAttrs(MODES.solid.img, 'auto, (min-width: 1100px) 1330px, 90vw')} alt="${MODES.solid.alt}" loading="lazy"></figure>
    <p class="demo-text" id="roofSummary" aria-live="polite"></p>
  </div>`;
  return {html, init(root){
    // Warm the cache so switching is instant.
    Object.values(MODES).forEach(m=>{ const im=new Image(); im.sizes=root.querySelector('#roofImg').getAttribute('sizes'); setPhoto(im, m.img); });
    const set=k=>{
      const m=MODES[k], img=root.querySelector('#roofImg');
      root.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===k));
      setPhoto(img, m.img); img.alt=m.alt;
      const zb=img.closest('.zoom'); if(zb) zb.setAttribute('aria-label','Expand photo: '+m.alt);
      root.querySelector('#roofSummary').innerHTML = m.text;
    };
    root.querySelector('.seg').addEventListener('click',e=>{const b=e.target.closest('button'); if(b) set(b.dataset.mode);});
    set('solid');
  }};
};

// --- Plug-in: how much of a day's driving runs on electricity ---
// --- Plug-in: how one day splits between electricity and gas, then gas and electricity cost over
//     5 years against the Hybrid XSE. Starting prices are for Montgomery County, Texas (sources in
//     the footer). ---
VIS.evDemo = ()=>{
  const RANGE=F.range, MPG_PHEV=F.mpg.phv, MPG_XSE=F.mpg.xse, YEARS=5;
  const KWH_PER_MILE = CHARGE.kwhPerMile;
  const NIGHT = 10;
  const fullHrs = CHARGE.ways.map(w=>CHARGE.hours(w,RANGE)), slowest = Math.max(...fullHrs);
  const PREMIUM = PACKAGES.phv.base - PACKAGES.xse.base;
  const money = n=>'$'+(Math.round(n/10)*10).toLocaleString('en-US');
  const slider = (id,label,min,max,step,val)=>`<div><label for="${id}">${label}: <span id="${id}Out"></span></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" aria-describedby="evSave"></div>`;
  return {html:`
  <div class="demo ev-demo">
    <label for="evMiles">A typical day of driving: <span id="evOut"></span> miles</label>
    <input type="range" id="evMiles" min="5" max="120" step="5" value="30" aria-describedby="evSum">
    <div class="ev-bar" aria-hidden="true"><span class="e"></span><span class="g"></span></div>
    <div class="ev-key" aria-hidden="true"><span><i style="background:var(--phv)"></i>On electricity</span><span><i style="background:var(--no)"></i>On gas, as a regular hybrid</span></div>
    <div id="evSum" aria-live="polite"></div>
    <p class="note" style="margin:0">Assumes a full charge each morning and Toyota’s EPA estimates: ${RANGE} miles on electricity, then ${MPG_PHEV} mpg. Cold weather, highway speeds and the heater shorten the electric range.</p>
    <section class="ev-block" aria-labelledby="chgT">
      <h5 id="chgT">How long charging takes, from empty to full</h5>
      <div class="cost-rows chg-rows" id="chgRows">
        ${CHARGE.ways.map((w,i)=>`<div class="cost-row" style="--c:var(--phv)"><span>${w.name}</span><span class="bar" aria-hidden="true"><span style="width:${fullHrs[i]/slowest*100}%"></span></span><b>${fmtHours(fullHrs[i]).replace(/ hours?$/,' hr')}</b></div>`).join('')}
      </div>
      <div id="chgSum" aria-live="polite"></div>
      <ul class="chg-need">
        <li><b>Regular outlet.</b> Plug the cable that comes with the car into any household outlet. Nothing to install.</li>
        <li><b>240 V, 20 amps.</b> An electrician adds a 240-volt circuit and a wall charger. The smaller circuit costs less and can fit when the electrical panel is nearly full.</li>
        <li><b>240 V, 40 amps.</b> A bigger circuit, the size an electric stove uses. The car’s cable also works on a 240-volt outlet, or use a wall charger.</li>
      </ul>
      <p class="note" style="margin:0">From Toyota’s EPA figures: about ${Math.round(CHARGE.wallKwh*10)/10} kWh from the wall for a full charge, plus 10% for the slower last stretch. A charger can draw only 80% of a circuit’s rating for hours at a time, so a 20-amp circuit charges at 16 amps and a 40-amp circuit at 32. The car can take more than any of these, so the outlet sets the speed. Cold weather slows charging.</p>
    </section>
    <section class="ev-block" aria-labelledby="evCostT">
      <h5 id="evCostT">Fuel cost over ${YEARS} years, against a Hybrid XSE</h5>
      <div class="ev-sliders">
        ${slider('evDays','Days you drive a year',100,365,5,300)}
        ${slider('evGas','Gas, per gallon',2.5,5.5,0.01,3.37)}
        ${slider('evKwh','Home electricity, per kWh',8,40,1,15)}
      </div>
      <div class="cost-rows" aria-hidden="true">
        <div class="cost-row" style="--c:var(--xse)"><span>Hybrid XSE</span><span class="bar"><span id="evBarH"></span></span><b id="evCostH"></b></div>
        <div class="cost-row" style="--c:var(--phv)"><span>Plug-in XSE</span><span class="bar"><span id="evBarP"></span></span><b id="evCostP"></b></div>
      </div>
      <div id="evSave" aria-live="polite"></div>
      <p class="note" style="margin:0">Uses the miles per day above and assumes you charge at home every night. Counts only gas and electricity, not insurance, upkeep or rebates.</p>
    </section>
  </div>`, init(root){
    const $in = id=>root.querySelector('#'+id);
    const inp=$in('evMiles'), days=$in('evDays'), gas=$in('evGas'), kwh=$in('evKwh');
    const gal=n=>n<0.05?'no':n.toFixed(1);
    const set=()=>{
      const m=+inp.value, e=Math.min(m,RANGE), g=m-e;
      $in('evOut').textContent=m;
      root.querySelector('.ev-bar .e').style.flexGrow=e; root.querySelector('.ev-bar .g').style.flexGrow=g;
      const [tag, text] = g===0
        ? [`All ${m} miles electric`, `The Plug-in uses no gas. A Hybrid XSE would use about ${gal(m/MPG_XSE)} gallons.`]
        : [`${RANGE} miles electric, ${g} on gas`, `The Plug-in uses about ${gal(g/MPG_PHEV)} gallons. A Hybrid XSE would use about ${gal(m/MPG_XSE)}.`];
      $in('evSum').innerHTML = `<span class="note-tag">${tag}</span><p class="demo-text">${text}</p>`;
      const [h1,h20,h40] = CHARGE.ways.map(w=>CHARGE.hours(w,e));
      const what = g===0 ? `That puts back all ${m} miles.` : `That refills the battery after the first ${RANGE} miles.`;
      const night = h1<=NIGHT
        ? 'A regular outlet handles that overnight.'
        : `A regular outlet can’t do that overnight: ${NIGHT} hours puts back ${CHARGE.milesIn(CHARGE.ways[0],NIGHT)===RANGE?'a full charge':`about ${CHARGE.milesIn(CHARGE.ways[0],NIGHT)} miles`}. Either 240-volt option can.`;
      $in('chgSum').innerHTML = `<span class="note-tag">${fmtHours(h1)} for your typical day of driving, on a regular outlet</span>`
        + `<p class="demo-text">${what} It takes ${fmtHours(h20)} at 20 amps, or ${fmtHours(h40)} at 40 amps. ${night}</p>`;

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
      // Why more miles can mean less savings: electric miles cost more than the Hybrid's gas miles, or
      // (past the electric range) both cars burn gas and the Plug-in gets 1 mpg less (both years).
      const saves = save >= 5;
      const why = KWH_PER_MILE*ep > gp/MPG_XSE
        ? ` At this electricity price, a mile on electricity costs more than a mile on gas in the Hybrid, so ${saves?'driving more cuts into the savings':'the gap grows the more you drive'}.`
        : g>0 ? ` Past ${RANGE} miles both cars run on gas, and the Plug-in gets ${MPG_XSE-MPG_PHEV} mpg less, so longer days ${saves?'shave a little off the savings':'add a little to its cost'}.` : '';
      if(!saves){
        $in('evSave').innerHTML = `<span class="note-tag">No savings with these figures</span><p class="demo-text">The Plug-in would cost about ${money(-save)} more to fuel over ${YEARS} years, and it costs ${money(PREMIUM)} more to buy.${why}</p>`;
      } else {
        const yrs = Math.round(PREMIUM/(save/YEARS));
        const back = yrs>20 ? 'more than 20 years' : `about ${Math.max(yrs,1)} year${yrs>1?'s':''}`;
        $in('evSave').innerHTML = `<span class="note-tag">Saves about ${money(save)} over ${YEARS} years</span><p class="demo-text">That’s about ${money(save/YEARS)} a year. The Plug-in costs ${money(PREMIUM)} more to buy, so the fuel savings take ${back} to make that back.${why}</p>`;
      }
    };
    [inp,days,gas,kwh].forEach(i=>i.addEventListener('input',set)); set();
  }};
};

// --- Plug-in outlet in a power outage: pick appliances, see the load against the outlet's limit and
//     a rough run time on the battery alone. ---
VIS.outageDemo = ()=>{
  const LIMIT=1500;
  // Toyota doesn't publish how much of the 22.7 kWh battery is usable, so work it out from the EPA
  // figures. For 2027, a full charge takes about 50 miles x 33.7/102 = 16.5 kWh from the wall. Less
  // charging losses (about 10%), that's about 15 kWh in the battery, and about 13.5 kWh at the outlet
  // after its power converter (assumed 90% efficient). Rounded to the nearest half kWh.
  const OUTLET_KWH = Math.round(CHARGE.wallKwh*0.9*0.9*2)/2;
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
    <div class="chips ap-chips" role="group" aria-labelledby="apQ">${APPS.map(a=>`<button type="button" class="chip" data-id="${a.id}" aria-pressed="${!!a.on}"><span class="tick" aria-hidden="true">${TICK}</span>${esc(a.name)} <small>${fmtW(a.w)}</small></button>`).join('')}</div>
    <div class="ap-meter" aria-hidden="true">
      <div class="ap-track"><span class="ap-fill"></span></div>
      <div class="ap-scale"><span>Plugged in: <b id="apW"></b></span><span>Outlet limit: ${fmtW(LIMIT)}</span></div>
    </div>
    <p class="demo-summary" id="apSum" aria-live="polite"></p>
    <p class="note" style="margin:0">A rough estimate. Toyota doesn’t say how much of the 22.7 kWh battery the outlet can use, so this assumes about ${OUTLET_KWH} kWh, worked out from the ${F.range}-mile range and ${F.mpge} MPGe. Your appliance’s label gives its real wattage. The car has to be on for the outlet to work.</p>
    <p class="note" style="margin:0">The engine can run in Park to recharge a low battery. If you do, keep the car outdoors. Engine exhaust is deadly in a garage.</p>
  </div>`, init(root){
    const chips=[...root.querySelectorAll('.ap-chips .chip')];
    const byId=Object.fromEntries(APPS.map(a=>[a.id,a]));
    // Run time as the start of a sentence: "Less than an hour", "About 9 hours", "About 4½ days".
    const runTime = h=>{
      if(h<1) return 'Less than an hour';
      if(h<36) return `About ${Math.round(h)} hour${Math.round(h)>1?'s':''}`;
      const d=Math.round(h/24*2)/2;
      return `About ${Math.floor(d)}${d%1?'½':''} days`;
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
        : `<b>${runTime(OUTLET_KWH*1000/W)} on the battery alone</b> for ${fmtW(W)} of appliances, running nonstop.`;
    };
    root.querySelector('.ap-chips').addEventListener('click',e=>{const b=e.target.closest('.chip'); if(!b) return; b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true'); set();});
    set();
  }};
};
