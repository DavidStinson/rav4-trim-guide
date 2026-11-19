import json,sys
d=json.loads(open(sys.argv[1]).read().split('=',1)[1].rstrip().rstrip(';'))
for c in d:
  print('=====',c['cat'])
  for r in c['rows']:
    if r['header']: continue
    cs=r['cells']; h=[x for x in cs[:3]]; p=cs[3]
    honly = all(x[0]=='no' and not x[1] for x in [p]) and any(x[0]!='no' for x in h)
    ponly = all(x[0]=='no' and not x[1] for x in h) and p[0]!='no'
    if honly: print('  H:',r['label'][:150], [x[0] for x in h])
    if ponly: print('  P:',r['label'][:150], p)
