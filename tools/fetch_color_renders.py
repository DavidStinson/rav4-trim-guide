"""Download the build tool's car renders for the color picker and make WebP copies for the site.

Render ids were read from Toyota's online build tool (2027 models, November 2026) by selecting each
paint and interior and noting the image path it loaded. They are stored in rav4-cfg/colors/renders.json.

    python3 tools/fetch_color_renders.py

Originals land in rav4-cfg/colors/, site copies in rav4-site/img/colors/. Needs cwebp. Re-running skips downloads that are already saved and only rebuilds the WebP copies.
"""
import json, pathlib, subprocess, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'rav4-cfg' / 'colors'
OUT = ROOT / 'rav4-site' / 'img' / 'colors'
HOST = 'https://tmnaassetscs.scene7.com'

def fetch(url, dest):
    if dest.exists():
        return
    with urllib.request.urlopen(url, timeout=30) as r:
        if r.status != 200 or not r.headers.get('Content-Type', '').startswith('image/'):
            raise SystemExit(f'unexpected response for {dest.name}: {r.status} {r.headers.get("Content-Type")}')
        dest.write_bytes(r.read())

def main():
    renders = json.loads((SRC / 'renders.json').read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    for model, r in renders.items():
        for kind, fmt, ext in (('ext', 'png-alpha', 'png'), ('int', 'jpg', 'jpg')):
            for code, rid in r[kind].items():
                name = f'{kind}-{model}-{code}'
                raw = SRC / f'{name}.{ext}'
                fetch(f'{HOST}{r["base"]}/{rid}.png?wid=900&fmt={fmt}', raw)
                # Every exterior render puts the car in the same 646 x 270 box at (106, 86); crop to it
                # with a small margin so the car fills the frame and doesn't shift between paints.
                crop = ['-crop', '90', '74', '680', '296'] if kind == 'ext' else []
                subprocess.run(['cwebp', '-quiet', '-q', '78', '-alpha_q', '90', *crop, str(raw), '-o', str(OUT / f'{name}.webp')], check=True)
                print(name)

if __name__ == '__main__':
    main()
