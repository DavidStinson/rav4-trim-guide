// The page's facts: everything that differs by model year (YEAR_FACTS, read through F), the trims,
// features, packages and paints. app.js and visuals.js render these; change facts here.
/* ===================== MODEL YEAR =====================
   The page shows one model year at a time, chosen by ?year= in the address (2027 when it's missing
   or unknown). Everything that differs between the years lives here, and the data below reads it
   through F. Figures come from Toyota's comparison pages and build tool for each year, November 2026;
   package and paint prices are the same for both years. */
const DEFAULT_YEAR = 2027;
const YEAR_FACTS = {
  2027:{
    year:2027, specs:'RAV4_SPECS',
    base:{xle:38100, xse:41900, ltd:43900, phv:47800},
    mpg:{xle:41, xse:40, ltd:40, phv:39},                 // EPA combined
    hp:{hyb:229, phv:321},
    range:50, mpge:102,                                   // Plug-in electric range (miles) and MPGe
    port:'Tesla-style (NACS)',
    portWhy:'It can also use public fast chargers, and its charging port is the same type Tesla uses. Most automakers in North America have adopted it as the standard.',
    trials:{remote:'5 years', drive:'3 months'},
    xleAssist:'XLE Premium Driver Assist Package',
    notes:{
      seaPhv:'All three',
      material:'Toyota’s Plug-in page uses the vaguer name “Mixed Media”, but Toyota’s 2027 announcement and Toyota Canada both describe the same suede and SofTex mix.',
      consolePhv:'Snow, Normal and EV buttons',
      powertrainPhv:'321 hp combined; adds a Trail drive mode',
      batteryPhv:'22.7 kWh lithium-ion, much larger',
    },
    sources:'Features, prices and fuel economy come from Toyota\'s 2027 RAV4 comparison page for the XLE Premium AWD (4444), XSE AWD (4530) and Limited AWD (4534), and its 2027 RAV4 Plug-in Hybrid comparison page for the XSE (4550), as published in November 2026. Package and paint prices come from Toyota\'s online build tool in the same month. Items the Plug-in page leaves out were checked against Toyota\'s 2027 RAV4 press release (November 5, 2026) and Toyota Canada\'s 2026 RAV4 Plug-in Hybrid product summary, which is also the source of the Plug-in\'s battery size. Toyota\'s 2026 RAV4 launch press release lists the XSE\'s extra driver-assist features (Front Cross-Traffic Alert, Lane Change Assist and Traffic Jam Assist) for both the Hybrid and the Plug-in, so the Plug-in XSE is marked as having the whole bundle.',
    // The Plug-in XSE has the shift-linked door locks and the silver door handles (David); its Toyota page leaves both out.
    specFixes:[{cat:'Inside', label:'Power door locks with shift-linked', trim:3, cell:['std','']}, {cat:'Inside', label:'Silver-colored interior door handles', trim:3, cell:['std','']}],
  },
  2026:{
    year:2026, specs:'RAV4_SPECS_2026',
    base:{xle:37500, xse:41300, ltd:43300, phv:47200},
    mpg:{xle:41, xse:41, ltd:41, phv:40},
    hp:{hyb:236, phv:324},
    range:52, mpge:96,
    port:'CCS1',
    portWhy:'It can also use public fast chargers. Its charging port is the CCS1 type; the 2027 switched to the port Tesla uses, which most automakers in North America have now adopted as the standard.',
    trials:{remote:'1 year', drive:'1 year'},
    xleAssist:'XLE Driver Assist Package',
    notes:{
      seaPhv:'Blind Spot Monitor and Rear Cross-Traffic Alert',
      material:'Toyota’s Plug-in page uses the vaguer name “Mixed Media”, but Toyota Canada describes the same suede and SofTex mix.',
      consolePhv:'Same as XLE Premium',
      powertrainPhv:'324 hp combined',
      batteryPhv:'22.7 kWh lithium-ion, much larger',
    },
    sources:'Features, prices and fuel economy come from Toyota\'s 2026 RAV4 comparison page for the XLE Premium AWD (4444), XSE AWD (4530) and Limited AWD (4534), and its 2026 RAV4 Plug-in Hybrid comparison page for the XSE (4550), as published in November 2026. Package and paint prices come from Toyota\'s online build tool in the same month. Toyota\'s 2026 comparison page marks the JBL system as not offered on the Hybrid XSE, but the build tool sells the JBL Premium Audio Package for it, so this page follows the build tool. Items the Plug-in page leaves out were checked against Toyota Canada\'s 2026 RAV4 Plug-in Hybrid product summary, which is also the source of the Plug-in\'s battery size. Toyota\'s 2026 RAV4 launch press release lists the XSE\'s extra driver-assist features (Front Cross-Traffic Alert, Lane Change Assist and Traffic Jam Assist) for both the Hybrid and the Plug-in, so the Plug-in XSE is marked as having the whole bundle. The 2026 and 2027 are the same generation, so the photos fit both.',
    // Toyota's 2026 comparison page says the Hybrid XSE can't get JBL; the 2026 build tool sells the
    // $620 JBL Premium Audio Package for it, and the same page's package list agrees.
    // The Plug-in XSE has the shift-linked door locks and the silver door handles (David); its Toyota page leaves both out.
    specFixes:[{cat:'Screen & sound', label:'12.9-in. Toyota Audio Multimedia, 9-speaker JBL', trim:1, cell:['opt','']}, {cat:'Inside', label:'Power door locks with shift-linked', trim:3, cell:['std','']}, {cat:'Inside', label:'Silver-colored interior door handles', trim:3, cell:['std','']}],
  },
};
const F = (()=>{
  const y = new URLSearchParams(location.search).get('year');
  return y !== null && Object.hasOwn(YEAR_FACTS, y) ? YEAR_FACTS[y] : YEAR_FACTS[DEFAULT_YEAR];
})();
document.documentElement.dataset.year = F.year;
const TRIM_IDS = ['xle','xse','ltd','phv'];
// Toyota's destination fee, the same for every trim and both years. Every price the page shows
// includes it (the hero note says so once), so START is the price to show for each trim with no options.
const DESTINATION = 1595;
const START = Object.fromEntries(TRIM_IDS.map(id=>[id, F.base[id]+DESTINATION]));
const HYBRID_IDS = ['xle','xse','ltd'];
const HYBRID_NAMES = {xle:'XLE Premium', xse:'XSE', ltd:'Limited'};
// A chip's check mark (priority picker and outlet demo), drawn as a path centered in its 12px box so it sits in the middle of the chip's circle.
const TICK = '<svg viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.5 9.5 3.5"/></svg>';
const money = n=>'$'+n.toLocaleString('en-US');
// "41 mpg", or "40 to 41 mpg" when the Hybrids differ.
const hybridMpgRange = (f=F)=>{
  const v = HYBRID_IDS.map(id=>f.mpg[id]), lo = Math.min(...v), hi = Math.max(...v);
  return lo===hi ? `${hi} mpg` : `${lo} to ${hi} mpg`;
};
// "41 mpg on all three Hybrids", or "41 mpg (XLE Premium), 40 mpg (XSE and Limited)", grouped by rating.
const hybridMpgList = (f=F, tag=s=>s)=>{
  const groups = new Map();
  HYBRID_IDS.forEach(id=>groups.set(f.mpg[id], [...(groups.get(f.mpg[id])||[]), HYBRID_NAMES[id]]));
  if(groups.size===1) return `${tag(f.mpg.xle+' mpg')} on all three Hybrids`;
  return [...groups].map(([m,names])=>`${tag(m+' mpg')} (${names.join(' and ')})`).join(', ');
};

// Plug-in energy and charging. EPA's MPGe counts energy taken from the wall (33.7 kWh = 1 gallon),
// so range x 33.7 / MPGe is the wall energy for a full charge: 16.5 kWh for 2027, 18.3 for 2026.
// Charging times add 10% for the slower last stretch of a charge and cable losses. That margin
// reproduces Toyota's published times for the earlier RAV4 Prime (about 12 hours on 120 V, 2.5 on
// 6.6 kW). A charger may draw only 80% of a circuit's rating for hours at a time, so a 20-amp circuit
// charges at 16 A; a regular outlet's cable draws 12 A. The Plug-in XSE's onboard charger takes up to
// 11 kW (both years), which is 46 A at 240 V. The biggest option is the smallest circuit that reaches it
// (David): a 60-amp circuit with a 48 A charger, 11.5 kW, which the car limits to its 11 kW.
const CHARGE = (()=>{
  const kwhPerMile = 33.7/F.mpge;
  const SLOW_END = 1.1;
  return {
    kwhPerMile,
    wallKwh: F.range*kwhPerMile,
    ways: [
      {id:'l1',  name:'Regular outlet',   kw:120*12/1000},
      {id:'l20', name:'240 V, 20 amps',   kw:240*16/1000},
      {id:'l60', name:'240 V, 60 amps',   kw:Math.min(240*48/1000, 11)},
    ],
    // Hours to put back `miles` of electric range (capped at a full charge).
    hours: (way, miles)=>Math.min(miles,F.range)*kwhPerMile*SLOW_END/way.kw,
    // Electric miles a charge of `h` hours puts back, rounded to 5.
    milesIn: (way, h)=>Math.min(F.range, Math.round(way.kw*h/(kwhPerMile*SLOW_END)/5)*5),
  };
})();
// "15 minutes", "45 minutes", "1 hour", "7½ hours": quarter hours under an hour, half hours above.
const fmtHours = h=>{
  if(h<0.875) return `${Math.max(15,Math.round(h*4)*15)} minutes`;
  const r = Math.round(h*2)/2;
  return `${Math.floor(r)}${r%1?'½':''} hour${r>1?'s':''}`;
};

/* ===================== DATA ===================== */
const TRIMS = [
  {id:'xle', name:'XLE Premium', color:'var(--xle)', soft:'var(--xle-soft)', ink:'var(--xle-on-ink)'},
  {id:'xse', name:'XSE', color:'var(--xse)', soft:'var(--xse-soft)', ink:'var(--xse-on-ink)'},
  {id:'ltd', name:'Limited', color:'var(--ltd)', soft:'var(--ltd-soft)', ink:'var(--ltd-on-ink)'},
  {id:'phv', name:'Plug-in XSE', color:'var(--phv)', soft:'var(--phv-soft)', ink:'var(--phv-on-ink)'},
];
// Status per trim, in TRIMS order: ['std'|'opt'|'no', note?]. Toyota's spec data for the Plug-in leaves out the
// driver-assist bundle, but its 2026 launch announcement lists those features for every XSE, Hybrid
// and Plug-in alike, so the bundle is marked included.
// layout says where a feature's picture goes (REVIEW-DECISIONS.md, "feature panel layout"):
//   'text'   no picture, copy alone;
//   'below'  a drawing or interactive demo (visual:), a pair of photos side by side (imgs:), or a single
//            photo (img:), under the copy and the who-has-it column, across the whole panel.
// references/add-a-feature.md has the details.
const FEATURES = [
  /* ---------- Parking & cameras ---------- */
  {id:'cam360', group:'Parking and cameras', name:'360° camera (bird’s-eye view)',
   aka:'Panoramic View Monitor (PVM) with 3D 360-degree Overhead View and Curb View',
   what:'Four cameras (front, back, and under each side mirror) are stitched together into a single picture that looks like a drone is hovering right above the car. You can see every side of the car at once while parking, not just what is behind you. “3D” lets you spin the view around the car on the screen, and “Curb View” shows a close-up of the front wheel next to the curb.',
   why:'This is the biggest everyday upgrade over the XLE Premium. In a parking lot, one look at the screen shows whether you’re straight and between the lines, so you don’t have to open the door to check. It also shows what a backup camera can’t: a parking block or low post by the front bumper, a curb near the wheels, or a cart or child beside the car. Curb View is especially helpful on the two XSEs, whose large 20-inch wheels are easy to scrape.',
   trims:[['no','Backup camera only'],['std'],['std'],['std']], visual:'cameraDemo', layout:'below'},
  {id:'mirror', group:'Parking and cameras', name:'Camera rearview mirror',
   aka:'Digital rearview mirror with HomeLink®',
   what:'The inside rearview mirror has a hidden screen. Flip a small tab and the mirror switches from a normal reflection to a live video feed from a camera on the back of the car. You see the road behind you without passengers’ heads, headrests or a packed cargo area in the way.',
   why:'Handy when the back seat has passengers or the cargo area is full to the roof. It also gives a wider view. Some people find it takes a few days to get used to focusing on a screen instead of a reflection, and you can always flip it back to a plain mirror. Like most screens, it can look dark through polarized sunglasses at some angles, so check it with yours.',
   trims:[['opt','Panoramic Moonroof Package: $1,850 ($2,225 with the Weather Package it requires)'],['opt','Panoramic Moonroof Package: $700 ($1,695 with the packages it requires)'],['std'],['opt','Panoramic Moonroof Package: $700 ($1,695 with the packages it requires)']], visual:'mirrorDemo', layout:'below'},
  {id:'homelink', group:'Parking and cameras', name:'Built-in garage door opener',
   aka:'HomeLink® universal transceiver',
   what:'Three buttons on the rearview mirror can be programmed to open your garage door or a gate, so you don’t need a separate clip-on remote.',
   why:'One less gadget on the visor, and nothing for a thief to grab to open your garage. Both XSEs also get an auto-dimming mirror that cuts glare from headlights behind you; the XLE Premium has a manual flip-tab mirror.',
   trims:[['opt','Comes with the camera mirror in the Panoramic Moonroof Package'],['std','With auto-dimming mirror'],['std','With camera mirror'],['std','With auto-dimming mirror']], layout:'text'},
  {id:'park', group:'Parking and cameras', name:'Self-parking', compact:true,
   aka:'Advanced Park',
   what:'Press a button next to an open space and the RAV4 steers, brakes and shifts into it by itself, for parallel or regular spaces. Pressing the brake stops it at any time.',
   why:'A nice extra rather than a need. Most people who have the 360° camera park just as well on their own.',
   trims:[['no'],['opt','XSE Driver Assist Package: $420 ($2,115 with the packages it requires)'],['std'],['opt','Driver Assist Package: $1,170 ($2,865 with the packages it requires)']], layout:'text'},

  /* ---------- Safety helpers ---------- */
  {id:'assist', group:'Safety and driver help', name:'Extra driver-assist bundle',
   aka:'Front Cross-Traffic Alert (FCTA), Lane Change Assist (LCA), Traffic Jam Assist (TJA) and Driver Monitor',
   what:'Four helpers that come together. <b>Front Cross-Traffic Alert</b> warns you about cars coming from the side when you nose out of a spot or into an intersection where your view is blocked. <b>Lane Change Assist</b> can steer into the next lane for you on the highway when you tap the turn signal and it’s clear. <b>Traffic Jam Assist</b> lets the car steer, brake and go by itself in slow, stop-and-go highway traffic on certain highways. <b>Driver Monitor</b> is a small camera that watches for drowsiness or eyes off the road and alerts you.',
   why:'Front Cross-Traffic Alert is the one most people end up appreciating: pulling out of a parking spot between two big trucks is much less of a guess. Traffic Jam Assist is a real relief on long commutes in heavy traffic. It needs an active Drive Connect trial or subscription and 5G coverage.',
   trims:[['opt',`${F.xleAssist}: $650 ($2,875 with the packages it requires)`],['std'],['std'],['std']], layout:'text'},
  {id:'hud', group:'Safety and driver help', name:'Speed shown on the windshield',
   aka:'10-in. Color Head-Up Display (HUD) with Road Sign Assist',
   what:'Your speed, the speed limit and navigation arrows are projected onto the windshield, so they appear to float just above the hood. You don’t have to look down at the dashboard.',
   why:`Keeps your eyes on the road. One catch: the display is a reflection on the windshield, and polarized sunglasses can dim it or make it vanish when you tilt your head. Owners of earlier Toyotas report this, and Toyota hasn’t said how the ${F.year} version behaves. Wear your usual sunglasses on the test drive. If it fades, turning up the brightness or moving the display higher in the settings often helps.`,
   trims:[['no'],['no'],['opt','Stand-alone option: $600'],['opt','Comes with the Driver Assist Package ($2,865 with the packages it requires)']], visual:'hudDemo', layout:'below'},
  {id:'wipers', group:'Safety and driver help', name:'Automatic wipers and wiper de-icer',
   aka:'Rain-sensing variable intermittent windshield wipers with de-icer function',
   what:'A sensor on the windshield detects rain and turns the wipers on, speeding them up or slowing them down on their own. The de-icer heats the bottom of the windshield where the wiper blades rest, so they don’t freeze to the glass.',
   why:'One less thing to fiddle with in a sudden downpour, and a real help on icy winter mornings.',
   trims:[['opt','Weather Package: $375'],['opt','Weather Package: $375'],['std'],['opt','Weather Package: $375']], layout:'text'},

  /* ---------- Comfort ---------- */
  {id:'vent', group:'Comfort', name:'Cooled (ventilated) front seats',
   aka:'Heated and ventilated front seats (high-mid-low)',
   what:'Small fans inside the front seats pull air through tiny holes in the seat covering. In summer it stops your back and legs from getting hot and sticky. The seats are also heated, with three levels instead of two.',
   why:'If you live somewhere warm, people who have cooled seats tend to say they would never go without them again. All four have heated front seats; the XLE Premium is the only one that doesn’t also cool.',
   trims:[['no','Heated only (2 levels)'],['std'],['std'],['std']], layout:'below', img:'RHV_MY26_0039', alt:'Close-up of a RAV4 front seat back, its leather covering dotted with tiny ventilation holes'},
  {id:'rearheat', group:'Comfort', name:'Heated back seats',
   aka:'Heated rear seats (on-off)',
   what:'The two outer back seats have their own heaters, with a switch for back-seat passengers.',
   why:'A nice touch if you often have passengers in the back in cold weather.',
   trims:[['no'],['no'],['std'],['no']], layout:'text'},
  {id:'wheelheat', group:'Comfort', name:'Heated steering wheel',
   aka:'Heated leather-trimmed steering wheel',
   what:'The steering wheel rim warms up at the press of a button.',
   why:'On a cold morning, warm hands make a big difference before the heater gets going. People who have one tend to use it all winter.',
   trims:[['opt','Weather Package: $375'],['opt','Weather Package: $375'],['std'],['opt','Weather Package: $375']], layout:'text'},
  {id:'seats', group:'Comfort', name:'Power passenger seat and seat memory',
   aka:'8-way power front passenger seat; driver’s seat with memory function',
   what:'The passenger seat moves with buttons instead of levers. The driver’s seat remembers positions for two people, so one button puts the seat back where you like it after someone else has driven.',
   why:'Useful if two people share the car. A power passenger seat is also easier on the back and shoulders than reaching down to a manual lever. All four have a power driver’s seat with lumbar support.',
   trims:[['no','Manual passenger seat; no memory'],['std'],['std'],['std']], layout:'text'},
  {id:'material', group:'Comfort', name:'Seat material',
   aka:'SofTex®-trimmed seats; SofTex® and synthetic suede on both XSEs (the Plug-in page calls it Mixed Media/SofTex)',
   what:'SofTex is Toyota’s name for a high-quality synthetic leather. It looks and feels much like leather, wipes clean easily and doesn’t need conditioning. Both XSEs mix it with a soft suede-like fabric in the middle of the seat, which feels grippy and doesn’t get as hot or cold. ' + F.notes.material,
   why:'None of the four use real leather. SofTex is durable and easy to live with; the suede-like inserts on the XSEs are a matter of taste and can show lint or pet hair more.',
   trims:[['std','SofTex'],['std','SofTex + synthetic suede'],['std','SofTex'],['std','SofTex + synthetic suede']], layout:'text'},
  {id:'roof', group:'Comfort', name:'Sunroof or panoramic glass roof',
   aka:'Power tilt/slide moonroof; Panoramic glass roof with front power tilt/slide moonroof',
   what:'A regular sunroof (“moonroof”) is one glass panel above the front seats that tilts up or slides open. A panoramic roof is a large glass roof stretching over both front and back seats; the front part opens, and a power shade slides across underneath at the press of a button when you want to block the sun.',
   why:'The panoramic roof makes the inside feel brighter and roomier, and back-seat passengers get a view of the sky. The XLE Premium has a solid roof unless you add the panoramic roof; it doesn’t offer the smaller sunroof.',
   trims:[['opt','Panoramic only: $1,850 ($2,225 with the Weather Package it requires)'],['std','Regular sunroof; panoramic is $700 ($1,695 with the packages it requires)'],['std','Panoramic'],['std','Regular sunroof; panoramic is $700 ($1,695 with the packages it requires)']], visual:'roofPhotos', layout:'below'},

  /* ---------- Tech & sound ---------- */
  {id:'screen', group:'Screen and sound', name:'Bigger center screen',
   aka:'12.9-in. Toyota Audio Multimedia (vs 10.5-in.)',
   what:'The touchscreen in the middle of the dashboard is about a quarter larger on every trim except the XLE Premium. All four connect wirelessly to your phone with Apple CarPlay or Android Auto, so your phone’s maps, music and calls appear on the screen.',
   why:'A bigger screen means larger map, bigger buttons and an easier-to-read 360° camera picture. The 10.5-inch screen is still a good size.',
   trims:[['no','10.5-inch'],['std','12.9-inch'],['std','12.9-inch'],['std','12.9-inch']], visual:'screenPair', layout:'below'},
  {id:'jbl', group:'Screen and sound', name:'Premium JBL sound system',
   aka:'9-speaker JBL® Premium Audio with subwoofer and amplifier',
   what:'Nine speakers instead of six, including a subwoofer for deeper bass and a separate amplifier for more power.',
   why:'If music, audiobooks or talk radio are a big part of your drives, voices and instruments sound clearer and fuller. If the radio is mostly background, you may not notice much difference.',
   trims:[['no','6 speakers'],['opt','JBL Premium Audio Package: $620 ($995 with the Weather Package it requires)'],['std'],['opt','JBL Premium Audio Package: $620 ($995 with the Weather Package it requires)']], layout:'below', img:'RHV_MY26_0049', alt:'A round JBL speaker grille set into the trim at the base of the windshield pillar', cap:'One of the JBL speakers, by the windshield pillar.'},
  {id:'charge', group:'Screen and sound', name:'Wireless phone charging for two',
   aka:'Dual Qi-compatible wireless charging',
   what:'Set your phone on a pad in the console and it charges with no cable. The Limited has two pads, so the driver and passenger can both charge at once.',
   why:'All four have one pad. Two only matters if you regularly ride with someone whose phone also needs a charge.',
   trims:[['no','1 pad'],['no','1 pad'],['std','2 pads'],['no','1 pad']], layout:'below', img:'RHV_MY27_0010', alt:'Wireless phone charging tray in the RAV4 center console, under the climate control buttons', cap:'The charging tray sits below the climate controls.'},

  /* ---------- Convenience ---------- */
  {id:'liftgate', group:'Convenience', name:'Hands-free tailgate',
   aka:'Hands-free power liftgate with jam protection',
   what:'With the key in your pocket or purse, swing your foot under the middle of the back bumper and the tailgate opens by itself. All four have a power tailgate that opens with a button; every trim except the XLE Premium adds the foot sensor.',
   why:'Wonderful when your arms are full of groceries. The XLE Premium’s power tailgate also lets you set how high it opens, which helps in a low garage.',
   trims:[['no','Power tailgate with button'],['std'],['std'],['std']], layout:'below', img:'RHV_MY26_0045', alt:'A person with full hands swinging a foot under the RAV4 rear bumper as the tailgate lifts', cap:'Swing a foot under the bumper and the tailgate opens.'},
  {id:'lights', group:'Convenience', name:'Puddle lights and soft cabin lighting',
   aka:'Puddle lights in outside mirrors; white ambient illuminated foot wells',
   what:'Puddle lights are small lights under the side mirrors that light up the ground by the front doors when you unlock the car. Ambient lighting is a soft glow in the footwells and cupholders at night.',
   why:'Puddle lights help you see puddles, ice or a curb when getting in after dark. The cabin glow makes it easier to find things at night.',
   trims:[['no'],['std'],['std'],['std']], layout:'text'},
  {id:'shifter', group:'Convenience', name:'Toggle-switch gear selector',
   aka:'Toggle shift-by-wire shifter',
   what:'Instead of a traditional gear lever, you push or pull a small switch to choose Drive or Reverse.',
   why:'It frees up a little console space, but it’s a matter of taste. Some people prefer the familiar lever, so try both.',
   trims:[['no','Regular lever'],['opt','Comes with the self-parking package ($2,115 with the packages it requires)'],['std'],['opt','Comes with the Driver Assist Package ($2,865 with the packages it requires)']], layout:'below',
   imgs:[{img:'shifter-xle', alt:'RAV4 center console with a tall gear lever in a stitched boot, beside the cupholders', cap:'XLE Premium, and the XSEs without the option: a regular gear lever.'},
         {img:'shifter-ltd', alt:'RAV4 center console with a small silver-topped switch where a gear lever would be, beside the cupholders', cap:'Limited, and an option on the XSEs: a small toggle switch instead of a lever.'}]},

  /* ---------- Looks ---------- */
  {id:'wheels', group:'Looks and ride', name:'Wheel size and ride comfort',
   aka:'18-in. wheels (XLE Premium, Limited) vs 20-in. wheels (both XSEs)',
   what:'Both XSEs have larger 20-inch black wheels. Bigger wheels use thinner tires, which look sporty and make steering feel sharper, but there’s less cushion between you and the road.',
   why:'Expect the XSEs to feel a bit firmer over potholes and bumpy roads, and their tires usually cost more to replace. The XLE Premium and Limited ride a bit more softly on 18-inch wheels. The Limited can add 20-inch wheels as an option.',
   trims:[['std','18-inch'],['std','20-inch'],['std','18-inch; 20-inch package is $1,240 ($1,840 with the head-up display it requires)'],['std','20-inch']], visual:'wheelDemo', layout:'below'},
  {id:'style', group:'Looks and ride', name:'Styling details',
   aka:'Two-tone paint, LED accent lights, fog lights, trim colors',
   what:'The <b>XSE</b> is the sporty-looking one: glossy black trim, vertical LED accent lights in the front bumper, blue stitching inside, and an optional black roof (two-tone paint). The <b>Plug-in XSE</b> looks almost the same. The <b>Limited</b> looks more upscale with silver accents, a satin-chrome grille and LED fog lights. The <b>XLE Premium</b> has a simpler, rugged look with matte black lower trim.',
   why:'Purely a matter of taste. Look at them in person, ideally in the color you want.',
   trims:[['std','Simple, rugged'],['std','Sporty, two-tone option'],['std','Upscale, fog lights'],['std','Sporty, two-tone option']], layout:'text',
   shots:{title:'All four in white, front and back', views:[['ext','front'],['rear','back']],
     imgs:['4444-0089','4530-02VP','4534-0089','4550-02VP'],
     caps:['Matte black lower trim and dark wheels.','Black roof, black wheels, LED accent lights in the bumper.','Silver accents and fog lights.','Same sporty look as the Hybrid XSE.']}},

  /* ---------- Plug-in Hybrid ---------- */
  {id:'plugin', group:'Plug-in Hybrid', name:'Driving on electricity',
   aka:`Plug-in Hybrid: EPA-estimated ${F.range}-mile all-electric range, ${F.mpge} MPGe`,
   what:`The Plug-in has a much bigger battery that you charge by plugging the car in, at home or at a public charger. On a full charge it can drive about ${F.range} miles on electricity alone (Toyota’s EPA estimate). After that it drives like a regular hybrid, at ${F.mpg.phv} mpg combined. It also has more power: ${F.hp.phv} horsepower, against ${F.hp.hyb} for the Hybrids.`,
   why:`If most of your days are under ${F.range} miles, charging at home means you could go weeks between gas fill-ups. Toyota includes a cable that works with a regular household outlet (slow) or a 240-volt outlet (much faster); the charging times are in the calculator here. ${F.portWhy}`,
   trims:[['no'],['no'],['no'],['std',`About ${F.range} miles per charge`]], visual:'evDemo', layout:'below'},
  {id:'outlet', group:'Plug-in Hybrid', name:'Household-style power outlet',
   aka:'One 120V/1500W AC power outlet in cargo area',
   what:'A regular three-prong outlet in the cargo area, like the ones in your house. It runs off the Plug-in’s big battery and can power up to 1,500 watts at once: a refrigerator, lamps, Wi-Fi and phone chargers, or one small space heater.',
   why:'Most useful in a power outage. A charged battery could keep a refrigerator, Wi-Fi and a few lamps going for about 2 days, and over a week with a full tank. It’s handy for camping and tailgating too. The Hybrids have 12-volt cigarette lighter sockets (120 W each, one up front and one in the cargo area) and USB-C ports (45 W up front, 15 W in back). Those can charge a few devices in a pinch, but nothing substantial.',
   trims:[['no','12-volt sockets only'],['no','12-volt sockets only'],['no','12-volt sockets only'],['std']], visual:'outageDemo', layout:'below'},
];

const BASICS = [
  ['All-wheel drive','Better grip in rain and snow, standard on all four.'],
  ['Hybrid power',`A 2.5-liter gas engine working with electric motors. ${F.hp.hyb} horsepower and ${hybridMpgRange()} on the Hybrids; ${F.hp.phv} horsepower and ${F.mpg.phv} mpg on the Plug-in.`],
  ['Automatic emergency braking','Brakes for cars and pedestrians if you don’t react in time (Toyota Safety Sense 4.0).'],
  ['Adaptive cruise control','Keeps a set distance from the car ahead, down to a stop.'],
  ['Lane centering','Gently steers to keep you in the middle of your lane.'],
  ['Blind spot warning','A light in the side mirror when a car is in your blind spot.'],
  ['Rear cross-traffic alert','Beeps if a car is coming while you back out of a spot.'],
  ['Backup camera','With guide lines that bend as you turn the wheel.'],
  ['Built-in dash cam','Records video from the car’s cameras, useful after an accident.'],
  ['Heated front seats','Power driver’s seat with lumbar support.'],
  ['Dual-zone automatic climate','Driver and passenger each set their own temperature.'],
  ['12.3-inch digital gauges','A clear, customizable screen behind the steering wheel.'],
  ['Wireless Apple CarPlay and Android Auto','Use your phone’s maps, music and calls on the car screen.'],
  ['Keyless entry and push-button start','Keep the key in your pocket or purse.'],
  ['Power tailgate','Opens and closes with a button.'],
  ['Five USB-C charging ports','Two up front, two in back, one in the console.'],
  ['8 airbags','Including a knee airbag for the driver.'],
  ['3,500-lb towing','Enough for a small trailer or boat.'],
  ['Free scheduled maintenance','ToyotaCare covers scheduled service for 1 year or 10,000 miles, whichever comes first, plus 2 years of roadside assistance.'],
];

const PRIORITIES = [
  {id:'park', label:'Easier parking', feats:['cam360']},
  {id:'summer', label:'Staying cool in summer', feats:['vent']},
  {id:'winter', label:'Staying warm in winter', feats:['wheelheat','wipers','rearheat']},
  {id:'safety', label:'Extra safety helpers', feats:['assist','cam360']},
  {id:'sound', label:'Great sound', feats:['jbl']},
  {id:'bright', label:'Bright, airy cabin', feats:['roof']},
  {id:'hands', label:'Easy loading with full hands', feats:['liftgate']},
  {id:'sharing', label:'Sharing the car with someone', feats:['seats']},
  {id:'outlet', label:'Power for camping or outages', feats:['outlet']},
  {id:'smooth', label:'Smoothest ride', special:'smooth'},
  {id:'sporty', label:'Sporty look', special:'sporty'},
  {id:'price', label:'Lowest price', special:'price'},
  {id:'mpg', label:'Using the least gas', special:'mpg'},
];
const SPECIAL = {
  smooth:{label:'Smoothest ride (smaller wheels)', trims:[['std'],['no','20-inch wheels ride firmer'],['std'],['no','20-inch wheels ride firmer']]},
  sporty:{label:'Sporty look', trims:[['no'],['std'],['no'],['std']]},
  price:{label:'Lowest price', trims:TRIM_IDS.map(id=>[id==='xle'?'std':'no', money(START[id])])},
  mpg:{label:'Uses the least gas', trims:[...HYBRID_IDS.map(id=>['no',`${F.mpg[id]} mpg`]),['std',`About ${F.range} miles on electricity, then ${F.mpg.phv} mpg`]]},
};

const STEP1_GAIN = [
  ['cam360','360° camera','See all around the car when parking, not just behind.'],
  ['vent','Cooled front seats','Fans keep your back from getting sweaty in summer.'],
  ['seats','Power passenger seat and seat memory','Easier adjustments; remembers two drivers.'],
  ['screen','Bigger 12.9-inch screen','Larger map, buttons and camera picture.'],
  ['liftgate','Hands-free tailgate','Opens with a foot swipe when your hands are full.'],
  ['roof','Sunroof','The XLE Premium has none unless you pay $2,225 for the panoramic roof.'],
  ['assist','Extra driver-assist bundle','Optional on the XLE Premium, included here.'],
  ['homelink','Garage door opener and auto-dimming mirror','No more clip-on remote; less headlight glare.'],
  ['lights','Puddle lights and soft cabin lighting','See the ground by the doors at night.'],
];
const STEP1_LOSE = [
  ['wheels','Firmer ride','20-inch wheels feel bumpier than the XLE Premium’s 18-inch wheels.'],
  ['style','Sporty styling','Black wheels, gloss-black trim and suede-like seat inserts. Love it or not.'],
  // Only when the XSE really is thirstier (2027); the 2026 Hybrids all rate the same.
  ...(F.mpg.xse < F.mpg.xle ? [[null, `${F.mpg.xle-F.mpg.xse} mpg less`, `${F.mpg.xse} mpg combined instead of ${F.mpg.xle}, a few dollars a month.`]] : []),
];
const STEP2_GAIN = [
  ['jbl','JBL premium sound','Nine speakers with a subwoofer instead of six.'],
  ['roof','Panoramic glass roof','Glass over both rows instead of a regular sunroof.'],
  ['mirror','Camera rearview mirror','See behind you even with a full back seat or cargo area.'],
  ['wheelheat','Heated steering wheel','Optional on XSE, included on Limited.'],
  ['wipers','Automatic wipers with de-icer','Turn on by themselves when it rains.'],
  ['rearheat','Heated back seats','For back-seat passengers.'],
  ['charge','Second wireless phone charger','Driver and passenger can charge at once.'],
  ['wheels','Softer ride','18-inch wheels with more tire cushion.'],
  ['hud','Head-up display available','Speed on the windshield. The Hybrid XSE can’t get it.'],
  ['park','Self-parking','Optional on XSE, included on Limited.'],
];
const STEP2_LOSE = [
  ['style','Sporty styling','No two-tone roof, black wheels or LED accent lights.'],
  ['material','Suede-like seat inserts','All SofTex instead.'],
  ['shifter','Traditional gear lever','The Limited uses a toggle switch.'],
  ['roof','A little cargo space','36.6 cubic feet behind the back seat vs 37.8. Hard to notice.'],
];

const STEP3_GAIN = [
  ['plugin','Driving on electricity',`About ${F.range} miles per charge before the gas engine is needed (EPA estimate).`],
  ['plugin','More power',`${F.hp.phv} horsepower instead of ${F.hp.hyb}, for quicker merging and passing.`],
  ['outlet','Household-style power outlet','A 1,500-watt outlet in the cargo area for camping or a power outage.'],
  ['hud','Head-up display available','Comes in the Driver Assist Package, along with paddle shifters.'],
];
const STEP3_LOSE = [
  [null,'Less cargo space','33.6 cubic feet behind the back seat instead of 37.8.'],
  ['park','Self-parking costs more','$1,170 for the Driver Assist Package instead of $420, though it adds more.'],
];

// Option packages, in the order Toyota requires them: each one needs every package above it.
// Package prices are MSRP from Toyota's build tool, November 2026. `base` is the trim's starting
// price with the destination fee.
const PACKAGES = {
  xle:{base:START.xle, ladder:[
    {name:'Weather Package', price:375, gets:[['wheelheat','Heated steering wheel'],['wipers','automatic wipers with de-icer']]},
    {name:'Panoramic Moonroof Package', price:1850, gets:[['roof','Panoramic glass roof'],['mirror','camera rearview mirror'],['homelink','garage door opener']]},
    {name:F.xleAssist, price:650, gets:[['assist','Front Cross-Traffic Alert, Lane Change Assist, Traffic Jam Assist and Driver Monitor']]},
  ]},
  xse:{base:START.xse, ladder:[
    {name:'Weather Package', price:375, gets:[['wheelheat','Heated steering wheel'],['wipers','automatic wipers with de-icer']]},
    {name:'JBL Premium Audio Package', price:620, gets:[['jbl','9-speaker JBL sound system']]},
    {name:'Panoramic Moonroof Package', price:700, gets:[['roof','Panoramic glass roof (replaces the regular sunroof)'],['mirror','camera rearview mirror']]},
    {name:'XSE Driver Assist Package', price:420, gets:[['park','Self-parking'],['shifter','toggle-switch gear selector']]},
  ]},
  ltd:{base:START.ltd, ladder:[
    {name:'10-in. Color Head-Up Display', price:600, gets:[['hud','Speed shown on the windshield']]},
    {name:'20-In. Wheel Package', price:1240, gets:[['wheels','20-inch wheels (firmer ride) and a larger spare tire']]},
  ]},
  phv:{base:START.phv, ladder:[
    {name:'Weather Package', price:375, gets:[['wheelheat','Heated steering wheel'],['wipers','automatic wipers with de-icer']]},
    {name:'JBL Premium Audio Package', price:620, gets:[['jbl','9-speaker JBL sound system']]},
    {name:'Panoramic Moonroof Package', price:700, gets:[['roof','Panoramic glass roof (replaces the regular sunroof)'],['mirror','camera rearview mirror']]},
    {name:'Driver Assist Package', price:1170, gets:[['park','Self-parking'],['hud','head-up display'],['shifter','toggle-switch gear selector'],[null,'paddle shifters']]},
  ]},
};

/* Paint and interior colors, from Toyota's build tool (November 2026). They're the same for 2026 and
   2027, and within a model every paint goes with every interior, so the model is the only limit.
   `fam` ties the same color together across models (Storm Cloud on the XLE Premium is the two-tone
   Storm Cloud on the XSE), so switching models keeps the closest match. Swatch colors are Toyota's own
   hex values. The photos in img/colors/ are the build tool's 2027 renders; tools/build_photos.py
   rebuilds them. */
const PAINTS = {
  '04V8':{name:'Meteor Shower', fam:'Meteor Shower', hex:['#A1A1A1']},
  '01L6':{name:'Storm Cloud', fam:'Storm Cloud', hex:['#3D4A59']},
  '08X8':{name:'Blueprint', fam:'Blueprint', hex:['#1E2548']},
  '0218':{name:'Midnight Black Metallic', fam:'Midnight Black Metallic', hex:['#00031E']},
  '0040':{name:'Ice Cap', fam:'Ice Cap', hex:['#FFFFFF']},
  '0089':{name:'Wind Chill Pearl', fam:'Wind Chill Pearl', hex:['#E3E9E9']},
  '03T3':{name:'Ruby Flare Pearl', fam:'Ruby Flare Pearl', hex:['#740000']},
  '02SQ':{name:'Meteor Shower with black roof', fam:'Meteor Shower', roof:true, hex:['#00031E','#A1A1A1']},
  '0M22':{name:'Storm Cloud with black roof', fam:'Storm Cloud', roof:true, hex:['#00031E','#3D4A59']},
  '02VP':{name:'Wind Chill Pearl with black roof', fam:'Wind Chill Pearl', roof:true, hex:['#00031E','#E3E9E9']},
};
const SEATS = {
  // `name` labels the button; `say` is how a sentence names the seats ("Harvest Beige seats").
  gray:{name:'Light Gray', say:'light gray'}, black:{name:'Black', say:'black'}, beige:{name:'Harvest Beige', say:'Harvest Beige'},
  blackblue:{name:'Black with blue accents', say:'black-and-blue', fam:'black'},
};
// Per model, in display order: paint code -> extra cost, interior code -> [seat color, swatch hex].
const COLORS = {
  xle:{img:'4444', seats:'SofTex synthetic leather',
       paint:{'04V8':0,'01L6':0,'08X8':0,'0218':0,'0040':0,'0089':475,'03T3':475},
       int:{EE10:['gray','#808080'], EE20:['black','#000000'], EE40:['beige','#E2DDAB']}},
  xse:{img:'4530', seats:'SofTex synthetic leather and fabric',
       paint:{'0218':0,'02SQ':500,'0M22':500,'02VP':975}, int:{EC20:['blackblue','#000000']}},
  ltd:{img:'4534', seats:'SofTex synthetic leather',
       paint:{'04V8':0,'01L6':0,'08X8':0,'0218':0,'0089':475,'03T3':475},
       int:{EA10:['gray','#808080'], EA20:['black','#000000'], EA40:['beige','#BBA270']}},
  phv:{img:'4550', seats:'SofTex synthetic leather and fabric',
       paint:{'0218':0,'02SQ':500,'0M22':500,'02VP':975}, int:{EC20:['blackblue','#000000']}},
};

