// Photo checks for rav4-site. `npm run check` runs them in the page; they're async because they load images.
// photoCheck(): at this width, every photo opens larger when clicked and is sharp on a 2x screen.
// photoFilesCheck(): every copy of every photo exists at the width the page says, and each full-size
//   copy is as large as its source allows. `npm run check` runs it once.

// The width of each source photo after cropping, taken from the sources themselves, not from the page:
// Toyota's build-tool renders come at most 4000px wide (cropped to the car, the seats' screen or the
// roof), the press photos at most 3600px, and the Edmunds photo at 1200px.
const SOURCE_WIDTH = [
  [/^colors\/ext-/, 3022], [/^colors\/rear-/, 2222], [/^colors\/int-/, 4000],
  [/^roof-/, 4000], [/^scr-/, 1244], [/^shifter-/, 1200], [/^RHV_/, 3600], [/^backup-edmunds$/, 1200],
];
// Every photo the color picker and the roof switch can show, not only the ones on screen now.
const SWAPPED = [
  ...['0040','04V8','01L6','08X8','0218','0089','03T3'].map(c=>`colors/ext-4444-${c}`),
  ...['04V8','01L6','08X8','0218','0089','03T3'].map(c=>`colors/ext-4534-${c}`),
  ...['4530','4550'].flatMap(m=>['0218','02SQ','0M22','02VP'].map(c=>`colors/ext-${m}-${c}`)),
  ...['EE10','EE20','EE40'].map(c=>`colors/int-4444-${c}`), ...['EA10','EA20','EA40'].map(c=>`colors/int-4534-${c}`),
  'colors/int-4530-EC20', 'colors/int-4550-EC20',
  'roof-xle', 'roof-xse', 'roof-ltd',
];

const loadWidth = src => new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth); i.onerror = () => res(0); i.src = src; });
const fullName = img => (img.dataset.full || '').replace(/^img\/full\//, '').replace(/\.webp$/, '');
const photos = () => [...document.querySelectorAll('header img, main img')]
  .filter(el => getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0);

window.photoCheck = async function photoCheck(){
  const fails = [];
  const W = innerWidth;
  for(const img of photos()){
    const name = img.getAttribute('src');
    // A description for screen readers, and only real attributes (a broken template leaks words in as attributes).
    if(!img.alt.trim()) fails.push(`photo ${name} has no alt text`);
    const odd = [...img.attributes].map(a => a.name).filter(n => !/^(src|srcset|sizes|alt|loading|decoding|class|id|width|height|style|data-[\w-]+|aria-[\w-]+)$/.test(n));
    if(odd.length) fails.push(`photo ${name} has stray attributes: ${odd.join(' ')}`);
    if(!img.closest('button.zoom') || !img.dataset.full){ fails.push(`photo ${name} can't be opened larger at ${W}px`); continue; }
    // The hero's four cars open larger but show no expand icon (David); every other photo shows one.
    const icon = !!img.closest('button.zoom').querySelector('.zi'), hero = !!img.closest('.car');
    if(icon === hero) fails.push(`photo ${name} ${hero ? 'is a hero car and shows' : 'shows no'} an expand icon at ${W}px`);
    const copies = (img.getAttribute('srcset') || '').split(',').map(s => parseInt(s.trim().split(/\s+/)[1])).filter(Boolean);
    if(copies.length < 2){ fails.push(`photo ${name} has no 1x and 2x copies (srcset "${img.getAttribute('srcset') || ''}")`); continue; }
    const shown = Math.round(img.getBoundingClientRect().width), biggest = Math.max(...copies);
    const full = await loadWidth(img.dataset.full);
    // Sharp on a 2x screen, unless the source itself is smaller than that.
    if(biggest < Math.min(2 * shown, full) - 2) fails.push(`photo ${name} shows ${shown}px wide at ${W}px; its largest page copy is ${biggest}px, under 2x (full size ${full}px)`);
  }

  // Opening the color picker's car photo shows the full-size copy of the paint that's picked.
  const ext = document.querySelector('#cpExt'), dlg = document.querySelector('#lightbox'), big = document.querySelector('#lbImg');
  const paints = [...document.querySelectorAll('#cpPaint [data-code]')];
  if(ext && dlg && big && paints.length > 1){
    const was = document.querySelector('#cpPaint [aria-pressed="true"]')?.dataset.code;
    const other = paints.find(b => b.dataset.code !== was);
    other.click();
    const pick = document.querySelector('#cpExt');
    pick.closest('button.zoom')?.click();
    const want = pick.dataset.full || '';
    for(let i = 0; i < 40 && !big.getAttribute('src')?.endsWith(want); i++) await new Promise(r => setTimeout(r, 100));
    if(!dlg.open) fails.push(`clicking the color picker photo doesn't open the expanded view at ${W}px`);
    else if(!want.includes(other.dataset.code) || !big.getAttribute('src')?.endsWith(want)) fails.push(`expanded color picker photo is ${big.getAttribute('src')}; expected the full-size ${other.dataset.code} copy ${want}`);
    if(dlg.open) dlg.close();
    document.querySelector(`#cpPaint [data-code="${was}"]`)?.click();
  }

  // Every photo's expanded view shows its full-size copy, fits the screen without scrolling, and puts the
  // see-through car renders on a light backdrop.
  const first = document.querySelector('button.zoom'), stage = document.querySelector('#lbStage');
  if(first && dlg && big && stage){
    first.click();
    const total = parseInt(document.querySelector('#lbCount')?.textContent.split(' of ')[1]) || 0;
    for(let i = 0; i < total; i++){
      const want = document.querySelector('#lbCount').textContent;
      let ok = false;
      for(let t = 0; t < 60 && !ok; t++){
        const src = big.getAttribute('src') || '';
        ok = src.startsWith('img/full/') && big.complete && big.naturalWidth > 0;
        if(!ok) await new Promise(r => setTimeout(r, 100));
      }
      if(!ok){ fails.push(`${want} at ${W}px: the expanded view shows ${big.getAttribute('src')}, not a full-size copy`); }
      else {
        const b = big.getBoundingClientRect(), s = stage.getBoundingClientRect();
        if(b.height > s.height + 1 || b.width > s.width + 1 || stage.scrollHeight > stage.clientHeight + 1)
          fails.push(`${want} at ${W}px: the expanded photo is ${Math.round(b.width)}x${Math.round(b.height)}, larger than its ${Math.round(s.width)}x${Math.round(s.height)} space`);
        if(getComputedStyle(big).backgroundImage === 'none') fails.push(`${want} at ${W}px: the expanded photo has no backdrop`);
      }
      document.querySelector('#lbNext').click();
    }
    dlg.close();
    // Closing hands focus back to the photo that opened it a task later, which can scroll the page;
    // let that land so the checks after this one start from a page that stays put.
    await new Promise(r => setTimeout(r, 100));
  }
  return fails;
};

window.photoFilesCheck = async function photoFilesCheck(){
  const fails = [];
  const names = [...new Set([...photos().map(fullName).filter(Boolean), ...SWAPPED])];
  if(typeof PHOTOS !== 'object') return ['PHOTOS (photos.js) is missing'];
  for(const name of names){
    const p = PHOTOS[name];
    if(!p){ fails.push(`photo ${name} isn't in photos.js`); continue; }
    const [w1, w2, wf] = p;
    const got = await Promise.all([`img/${name}.webp`, `img/${name}@2x.webp`, `img/full/${name}.webp`].map(loadWidth));
    if(got.join() !== [w1, w2, wf].join()) fails.push(`photo ${name} copies are ${got.join(', ')}px wide; photos.js says ${w1}, ${w2}, ${wf}`);
    if(w2 !== Math.min(2 * w1, wf)) fails.push(`photo ${name}'s 2x copy is ${w2}px; expected ${Math.min(2 * w1, wf)}`);
    const src = SOURCE_WIDTH.find(([re]) => re.test(name));
    if(!src) fails.push(`photo ${name} has no known source size`);
    else if(wf < src[1]) fails.push(`photo ${name} full size is ${wf}px; its source allows ${src[1]}px`);
  }
  // A photo's alt text is its own description, not a copy of the caption under it: a screen reader would
  // read the same words twice, and a photo whose caption goes away would be left with no alt at all.
  const norm = t => (t || '').replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim().toLowerCase();
  document.querySelectorAll('main figure').forEach(fig => {
    const img = fig.querySelector('img'), cap = fig.querySelector('figcaption');
    if(img && cap && norm(cap.textContent) && norm(img.alt) === norm(cap.textContent)) fails.push(`photo ${img.getAttribute('src')} uses its caption as its alt text`);
  });
  return fails;
};
