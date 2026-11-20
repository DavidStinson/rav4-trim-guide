# Photos

Every photo on the page is listed in `rav4-cfg/photos.json` and built by `python3 tools/build_photos.py` (needs `curl` and ImageMagick `magick`). Never edit `rav4-site/img/` or `rav4-site/photos.js` by hand.

## Sources

- `render`: a Toyota build-tool render, a path under the manifest's `scene7` host. Fetched at 4000 px, the largest the server sends. Car exteriors come as see-through PNGs (`alpha` kinds).
- `url`: a Toyota press photo. The press server sends the original (3600 px) when no width is asked for.
- `file`: a saved file in the repo (only the Edmunds backup-camera photo, credited in the footer).

Each photo's `kind` sets its crop (in the build tool's 900 px frame, scaled to the source) and its page width. The page width is a little over the widest the photo shows, so the page copy covers 1x screens and the 2x copy covers sharp ones: 1000 px for a card's lone photo (980 px wide at most), 540 px for a photo in a pair (524 px at most), 500 px for the screen pair. Downloads are cached in `rav4-cfg/originals/` (not committed).

## Outputs

For each photo: `img/<name>.webp` (page width), `img/<name>@2x.webp` (twice that, capped at the source), `img/full/<name>.webp` (the whole crop, for the expanded view only, never in a srcset), and the widths and heights of all three in `photos.js`.

## Using a photo on the page

- In a template: `<img ${photoAttrs('<name>', '<sizes>')} alt="..." loading="lazy">`. `sizes` starts with `auto, ` for lazy photos, then the real layout widths, so the browser picks the 1x or 2x copy.
- In static HTML: `<img data-photo="<name>" sizes="..." alt="...">`; `app.js` fills in `src`, `srcset`, `width`, `height` and `data-full`.
- Swapping a photo in place (pickers): `setPhoto(img, '<name>')`.

Each way sets `width` and `height` from the page copy, so the photo holds its own shape before it loads. Size it in CSS with a width and `height:auto` (the base `img` rule has it). A box of another shape (a set `aspect-ratio` or height) needs `object-fit: cover` or `contain`, or the photo stretches.

The photo zoom wraps every `main` and `header` photo in a button that opens the expanded view. `photo-check.js` fails any photo without alt text, width and height in its own shape, page copies that cover it at 1x and 2x, or a full-size copy.

## Adding a photo

1. Add `{name, kind, render|url|file}` to `photos.json` (add a new `kind` only if no crop and width fits).
2. Add its source width to `SOURCE_WIDTH` in `tools/photo-check.js` if the name pattern is new; run the check red.
3. `python3 tools/build_photos.py`, use the name in the page, `npm run check`.

## A source with a bad edge

Crops live only on kinds, never on a photo entry. When one source has a flaw at an edge (the seat close-up `RHV_MY26_0039` has an 18 px white band down its left), give it a kind of its own with the trimmed crop (`press-left-trim`) rather than changing a shared kind. Its full-size width then differs from its pattern's, so add an exact `SOURCE_WIDTH` entry for it above the general one: the first match wins.
