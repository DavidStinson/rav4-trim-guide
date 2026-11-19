import sys,json,re,html
# usage: gen_specs.py [--var NAME] out.js hybrid_fso.json phev_fso.json [trims...]
# The first three trims come from the Hybrid page, the last from the Plug-in Hybrid page.
# --var names the global the file assigns (default RAV4_SPECS), so each model year gets its own.
args=sys.argv[1:]
VAR='RAV4_SPECS'
if args[:1]==['--var']: VAR=args[1]; args=args[2:]
out_path, hyb, phev = args[:3]
T = args[3:] or ['4444','4530','4534','4550']
CAT={'mpg/other/price':'Price & fuel economy','exterior':'Outside','interior':'Inside','audio_multimedia':'Screen & sound','connected_services':'Connected services (apps & subscriptions)','safety/convenience':'Safety & driver help','mechanical/performance':'Engine & drivetrain','dimensions':'Size','weights/capacities':'Weight, cargo & towing','tires':'Tires','packages':'Option packages','options':'Single options'}
# Plug-in wording -> Hybrid wording for the same item. Matched as a prefix on the Plug-in label;
# the Hybrid target is an exact label, or a unique prefix. The row lands wherever the Hybrid row is,
# even in another category.
ALIAS=[
  ('Est. mpg rating (city/highway/combined)','Est. mpg rating'),
  ('Base msrp','Base MSRP'),
  ('Rain-sensing variable intermittent windshield wipers with de-icer function and intermittent rear window wipe','Rain-sensing variable intermittent windshield wipers with de-icer function and intermittent rear window wiper'),
  ('Panoramic glass roof with front power tilt/slide moonroof','Panoramic tilt/slide panoramic moonroof'),
  ('LED tailights','LED taillights'),
  ('Piano black roof-mounted shark-fin antenna','Black roof-mounted shark-fin antenna'),
  ('Remote keyless entry system with lock, unlock, panic functions, and remote','Remote keyless entry system with lock, unlock, panic functions and remote'),
  ('Smart Key System on front doors and liftgate with Push Button Start, remote keyless entry system with lock, unlock, and panic','Smart Key System on front doors and liftgate'),
  ('Toggle-type shift-by-wire system','Toggle shift-by-wire shifter lever'),
  ('White ambient illuminated footwells','White ambient illuminated foot wells'),
  ('Heated leather-trimmed 3-spoke steering wheel','Heated leather-trimmed tilt/telescopic'),
  ('Leather-trimmed 3-spoke steering wheel','Leather-trimmed tilt/telescopic'),
  ('Leather-trimmed tilt/telescopic 3-spoke steering wheel with silver accent and controls for audio, Multi-Information Display (MID, Bluetooth','Leather-trimmed tilt/telescopic'),
  ('Digital rearview mirror with HomeLink® garage door opener','Digital rearview mirror with HomeLink®'),
  ('Auto-dimming rearview mirror with HomeLink® garage door opener','Auto-dimming rearview mirror with HomeLink®'),
  ('Two 45W Front USB-C','Two 45W front USB-C'),
  ('Removeable front cup holder divider','Removeable front cupholder divider'),
  ('12.9-in. Toyota Audio Multimedia, six speakers','12.9-in. Toyota Audio Multimedia, six speakers'),
  ('Safety Connect®','Safety Connect®'),('Service Connect','Service Connect'),('Remote Connect','Remote Connect'),('Drive Connect','Drive Connect'),('Wi-Fi Connect','Wi-Fi Connect'),
  ('Electric Parking Brake (EPB)','Electric Parking Brake (EPB) with Brake Hold'),
  ('Brake Hold','Electric Parking Brake (EPB) with Brake Hold'),
  ('Digital Key capability','Digital Key capability'),
  ('Toyota Safety Sense™ 4.0 (TSS 4.0) — Pre-Collision System with Pedestrian','Toyota Safety Sense™ 4.0'),
  ('Minimum turning radius (ft.)','Minimum Turning Radius (ft.)'),
  ('Electronic On-Demand All-Wheel Drive (AWD)','All-Wheel Drive (AWD)'),
  ('Compression ratio: 14.0:1','Compression ratio: 14:1'),
  ('Drive mode button with SPORT, Snow, Eco, and NORMAL modes','Drive mode button with SPORT, Snow, Eco and NORMAL modes'),
  # 2026 wording (the 2026 pages have no Snow mode on the Hybrid button, and both pages list engine torque).
  ('Drive mode button with SPORT, Eco, and NORMAL modes','Drive mode button with SPORT, Eco and NORMAL modes'),
  ('Max. torque: 170 lb.-ft.','Max. Torque: 170 lb.-ft.'),
  ('Overall wheelbase','Wheelbase'),
  ('Head room with moonroof','Head room with moonroof (max)'),
  ('Seating','Seating capacity'),
  ('EPA passenger volume w/moonroof','EPA passenger volume'),
  # The Plug-in page names the brand of its (Woodland-only) fog lights; it's the same item.
  ('Integrated Rigid Industries® LED fog lights','Integrated LED fog lights'),
]
# Hybrid labels kept under a clearer name.
RENAME={'est. mpg rating':'Est. mpg rating (city / highway / combined)'}
# Items the Plug-in page lists only in another category; filled in on the Hybrid's duplicate row.
FILL={'Rain-sensing variable intermittent windshield wipers with de-icer function':['opt','']}
def clean(x):
  x=re.sub(r'<sup[^>]*>.*?</sup>','',x or '',flags=re.S); x=re.sub(r'<br\s*/?>',' ',x); x=re.sub(r'<[^>]+>','',x); x=html.unescape(x); return re.sub(r'\s+',' ',x).strip()
srcs=[json.load(open(hyb)), json.load(open(phev))]
PHEV_T=T[3:]
def walk(o,cat):
  v=o.get(cat)
  if not v: return
  for g,gv in v['grades'].items():
    for t,feats in gv['trims'].items():
      if t not in T: continue
      for k,f in feats.items():
        lab=clean(f['label'])
        if not lab or 'Emissions' in lab: continue
        icon=f.get('icon'); val=clean(f.get('value'))
        # The two Toyota pages format numbers differently (41.0 vs 41, 4540 vs 4,540).
        val=re.sub(r'(?<![\d.,])(\d)(\d{3})(?![\d,.])',r'\1,\2',re.sub(r'(\d)\.0(?!\d)',r'\1',val))
        yield t,lab,{'s':{'standard':'std','available':'opt','not-available':'no'}.get(icon,'val'),'v':val}
# Hybrid labels per category, to resolve aliases.
hyb_where={}
for cat in CAT:
  for t,lab,_ in walk(srcs[0],cat): hyb_where.setdefault(lab,cat)
def resolve(lab):
  for p,target in sorted(ALIAS,key=lambda a:-len(a[0])):
    if lab.lower().startswith(p.lower()):
      if target in hyb_where: return target
      # Toyota's capitalization drifts between years ("MPG" in 2026, "mpg" in 2027), so match without case.
      hits=[h for h in hyb_where if h.lower()==target.lower()] or [h for h in hyb_where if h.lower().startswith(target.lower())]
      if len(hits)!=1: sys.exit(f'alias target not unique for {lab!r}: {hits}')
      return hits[0]
  return None
used=set()
rows={c:{} for c in CAT}; order={c:[] for c in CAT}
for si,o in enumerate(srcs):
  for cat in CAT:
    prev=None
    for t,lab,cell in walk(o,cat):
      dest=cat
      if si==1:
        r=resolve(lab)
        if r: used.add(r); lab=r; dest=hyb_where[r]
      if lab not in rows[dest]:
        rows[dest][lab]={}
        if prev in order[dest]: order[dest].insert(order[dest].index(prev)+1, lab)
        else: order[dest].append(lab)
      if dest==cat: prev=lab
      old=rows[dest][lab].get(t)
      # Two Plug-in lines folded into one row (EPB and Brake Hold): keep the stronger status.
      if old and {'std':0,'opt':1,'val':0,'no':2}[old['s']]<={'std':0,'opt':1,'val':0,'no':2}[cell['s']]: continue
      rows[dest][lab][t]=cell
out=[]
for cat in CAT:
  if not order[cat]: continue
  items=[]
  for lab in order[cat]:
    r=rows[cat][lab]
    present=[r[t] for t in T if t in r]
    hdr=bool(present) and all(c['s']=='val' and not c['v'] for c in present)
    def miss(t):
      if t in PHEV_T and lab in FILL: return {'s':FILL[lab][0],'v':FILL[lab][1]}
      # A Hybrid row the Plug-in page never mentions is "not listed", not "not offered".
      if t in PHEV_T: return {'s':'nl','v':''}
      # A measurement only one page gives (payload, MPGe) shows as a dash, not "not offered".
      return {'s':'val','v':''} if any(c['s']=='val' for c in present) else {'s':'no','v':''}
    cells=[r.get(t) or miss(t) for t in T]
    if not hdr and all(c['s'] in ('no','nl') or (c['s']=='val' and not c['v']) for c in cells): continue
    items.append({'label':RENAME.get(lab.lower(),lab),'header':hdr,'cells':None if hdr else [[c['s'],c['v']] for c in cells]})
  cleaned=[it for i,it in enumerate(items) if not (it['header'] and (i+1==len(items) or items[i+1]['header']))]
  out.append({'cat':CAT[cat],'rows':cleaned})
unused=[a for a in ALIAS if not any(u.lower().startswith(a[1].lower()) for u in used)]
if unused: print('unused aliases:',unused,file=sys.stderr)
open(out_path,'w').write('// Generated by tools/gen_specs.py from Toyota\'s comparison data. Status: std, opt, no, nl (not listed by Toyota), val.\nwindow.'+VAR+' = '+json.dumps(out,ensure_ascii=False,indent=0)+';\n')
print(sum(len(c['rows']) for c in out), [(c['cat'],len(c['rows'])) for c in out])
