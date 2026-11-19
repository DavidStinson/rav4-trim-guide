import sys, re
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
def rep(old, new):
    global s
    assert s.count(old) == 1, old[:80]; s = s.replace(old, new)

start = s.index('// --- Backup camera vs 360 camera, top-down parking scene ---')
end = s.index('  const html = `\n  <div class="demo">\n    <div class="seg" role="group" aria-label="Camera type">')
s = s[:start] + r'''// --- Backup camera vs 360 camera: pulled nose-first into a parking-lot space, sitting a little
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
    <text x="16" y="322" font-family="Atkinson Hyperlegible" font-size="15" fill="#E9E8DF">parking aisle</text>
    <!-- coverage overlays -->
    <g id="ovBack" class="ov" style="transition:opacity .35s">
      <rect width="600" height="460" fill="url(#hatch)" opacity=".62" mask="url(#mBack)"/>
      <path d="M308 282 L128 460 L488 460 Z" fill="#F2B705" opacity=".22"/>
      <path d="M308 282 L128 460 M308 282 L488 460" stroke="#F2B705" stroke-width="3" stroke-dasharray="8 6"/>
      <circle cx="308" cy="282" r="7" fill="#F2B705" stroke="#202427" stroke-width="2"/>
    </g>
    <g id="ov360" class="ov" style="transition:opacity .35s;opacity:0">
      <rect width="600" height="460" fill="url(#hatch)" opacity=".62" mask="url(#m360)"/>
      <rect x="150" y="6" width="340" height="446" rx="70" fill="#F2B705" opacity=".16" stroke="#F2B705" stroke-width="3" stroke-dasharray="8 6"/>
      ${[[308,46],[308,282],[254,90],[362,90]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#F2B705" stroke="#202427" stroke-width="2"/>`).join('')}
    </g>
    <!-- markers -->
    ${objs.map(o=>`<g class="mk" data-n="${o.n}"><circle cx="${o.x}" cy="${o.y}" r="16" fill="${o.c}" stroke="#fff" stroke-width="3"/><text x="${o.x}" y="${o.y+6}" text-anchor="middle" font-family="Overpass" font-weight="800" font-size="17" fill="#fff">${o.n}</text></g>`).join('')}
  </svg>`;
''' + s[end:]

rep("`<b>Backup camera:</b> you see ${seen} of 6 things, and only while in reverse. Everything along the sides and in front depends on your mirrors and turning your head.`",
    "`<b>Backup camera:</b> you see ${seen} of 6, and only once you shift into reverse. To check that you’re between the lines, or how close the parking block is, you have to open the door and look.`")
rep("`<b>360° camera:</b> you see all 6, from above, in reverse <i>and</i> while creeping forward. The curb, the bike and the car in front all show up on the screen.`",
    "`<b>360° camera:</b> you see all 6 from above, pulling in <i>and</i> backing out. One look at the screen shows you’re a bit close to the right-hand line and just short of the parking block, without opening a door.`")
rep("It shows the things a backup camera can’t: a low post by the front bumper, a curb scraping the wheels, a bike or a child beside the car.",
    "In a parking lot, one look at the screen shows whether you’re straight and between the lines, so you don’t have to open the door to check. It also shows what a backup camera can’t: a parking block or low post by the front bumper, a curb near the wheels, or a cart or child beside the car.")
open(p, 'w', encoding='utf-8').write(s); print('ok')
