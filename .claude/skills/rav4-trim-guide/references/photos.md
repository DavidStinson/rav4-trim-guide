# Photos

Every photo on the page is listed in `rav4-cfg/photos.json` and built by `python3 tools/build_photos.py` (needs `curl` and ImageMagick `magick`). Never edit `rav4-site/img/` or `rav4-site/photos.js` by hand.

## Sources

- `render`: a Toyota build-tool render, a path under the manifest's `scene7` host. Fetched at 4000 px, the largest the server sends. Car exteriors come as see-through PNGs (`alpha` kinds).
- `url`: a Toyota press photo. The press server sends the original (3600 px) when no width is asked for.
- `file`: a saved file in the repo (only the Edmunds backup-camera photo, credited in the footer).

Each photo's `kind` sets its crop (in the build tool's 900 px frame, scaled to the source) and its page width. Downloads are cached in `rav4-cfg/originals/` (not committed).

## Outputs

For each photo: `img/<name>.webp` (page width), `img/<name>@2x.webp` (twice that, capped at the source), `img/full/<name>.webp` (the whole crop, for the expanded view), and its three widths in `photos.js`.

## Using a photo on the page

- In a template: `<img ${photoAttrs('<name>', '<sizes>')} alt="..." loading="lazy">`. `sizes` starts with `auto, ` for lazy photos, then the real layout widths, so the browser picks the 1x or 2x copy.
- In static HTML: `<img data-photo="<name>" sizes="..." alt="...">`; `app.js` fills in `src`, `srcset` and `data-full`.
- Swapping a photo in place (pickers): `setPhoto(img, '<name>')`.

The photo zoom wraps every `main` and `header` photo in a button that opens the expanded view. `photo-check.js` fails any photo without alt text, a 2x copy or a full-size copy.

## Adding a photo

1. Add `{name, kind, render|url|file}` to `photos.json` (add a new `kind` only if no crop and width fits).
2. Add its source width to `SOURCE_WIDTH` in `tools/photo-check.js` if the name pattern is new; run the check red.
3. `python3 tools/build_photos.py`, use the name in the page, `npm run check`.
