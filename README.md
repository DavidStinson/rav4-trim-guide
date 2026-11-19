# RAV4 Trim Guide

A one-page guide comparing four Toyota RAV4s for a family car decision: the RAV4 Hybrid XLE Premium, XSE and Limited, and the RAV4 Plug-in Hybrid XSE, for model years 2026 and 2027. It explains each feature in plain language, shows which trims have it, and includes package ladders, a paint and interior color picker, a fuel-cost calculator, a charging-time comparison and a power-outage calculator.

Live site: https://davidstinson.github.io/rav4-trim-guide/ (marked `noindex`, so search engines are asked not to list it).

## Run it locally

The site is static HTML, CSS and JavaScript with no build step. Serve the project root:

```sh
npm run serve
```

Then open http://127.0.0.1:8765/rav4-site/index.html. Add `?year=2026` for the 2026 model year.

The page is split by job: `index.html` (markup), `styles.css`, `data.js` (the facts), `visuals.js` (the interactive demos) and `app.js` (everything that renders and runs the page). `specs.js`, `specs-2026.js` and `photos.js` are generated.

## Checks

The checks need Node (24 or later) and a one-time `npm install` and `npx playwright install chromium`. Then:

```sh
npm run check
```

It opens a headless browser for both model years at 390, 700, 1100, 1400 and 1500 px wide, plus 1400 px in dark mode, and in each runs the WCAG 2.2 AA accessibility rules (axe), `tools/layout-check.js`, `tools/year-check.js`, `tools/photo-check.js` and `tools/reading-check.js`. Errors the page throws or logs and files that fail to load count as failures. It prints ALL PASS or each failure, writes `.check/results.json`, saves a full-page screenshot of each run in `.check/shots/`, and exits 1 on any failure. `-- --quick` checks 2027 at two widths in about 20 seconds.

The photo check confirms that every photo has alt text, opens larger when clicked, has a copy sharp enough for a 2x screen, and shows its full-size copy in the expanded view without overflowing the screen. Once per run it also confirms that every photo's three copies exist at the widths `photos.js` lists and that each full-size copy is as large as its source allows.

The expected numbers in `year-check.js` come from Toyota's pages and hand calculations, not from the site's own data, so a typo in the site's figures fails the check.

For design reviews, `node tools/shoot.mjs` saves the page section by section in `.check/sections/`, and `node tools/shot-diff.mjs <before> <after>` reports how much two sets of screenshots differ.

## Where the numbers come from

- Year-dependent facts (prices, mpg, range, horsepower, charging port, trial lengths) live in `YEAR_FACTS` at the top of `rav4-site/data.js`.
- `YEAR_FACTS` holds Toyota's MSRP. Every price the page shows adds the $1,595 destination fee (`DESTINATION`, giving `START` per trim), and the note under the hero prices is the only place that says so or mentions tax and registration. The spec list's "Base MSRP" line is replaced with this starting price.
- Package names, prices and buying order come from Toyota's online build tool, read in November 2026. The order was confirmed from the tool's "Requires Changes" prompts for both years.
- The spec lists (`rav4-site/specs.js` for 2027, `rav4-site/specs-2026.js` for 2026) are generated from Toyota's build-tool data:

  ```sh
  python3 tools/gen_specs.py rav4-site/specs.js rav4-dl/fsodata.json phev-dl/fsodata.json
  python3 tools/gen_specs.py --var RAV4_SPECS_2026 rav4-site/specs-2026.js rav4-2026/hyb_fsodata.json rav4-2026/phev_fsodata.json
  ```

  Each run prints an "unused aliases" warning. That's expected, because each year's wording uses a different set of aliases.
- Paint and seat colors (`PAINTS`, `SEATS` and `COLORS` in `rav4-site/data.js`) come from the build tool for both years; they're identical. On the XLE Premium and Limited, selecting each paint with each seat color raised no "Requires Changes" prompt in either year, and the XSE and Plug-in have one seat color, so the model is the only limit. The picker's photos are the build tool's 2027 renders. The hero and the styling-details photos reuse them, and the styling details add a back view of each trim in Wind Chill Pearl (white), taken from the build tool's 360° view.
- Every photo on the page is listed in `rav4-cfg/photos.json`: a build-tool render, a Toyota press photo or a saved file (the Edmunds backup-camera photo, `rav4-cfg/edmunds-backup.jpg`). This script downloads each at full size (build-tool renders at 4000 px, press photos at their original 3600 px), crops it, and writes three WebP copies to `rav4-site/img/`: the page copy, a 2x copy and `full/` for the expanded view. It also writes their widths to `rav4-site/photos.js`, which the page uses to build each photo's `srcset`. Downloads are cached in `rav4-cfg/originals/`, which isn't committed. It needs `curl` and ImageMagick (`magick`):

  ```sh
  python3 tools/build_photos.py
  ```

  To add a photo, add an entry to `photos.json`, run the script, and use its name with `photoAttrs()` or `data-photo` in the page.
- Gas and electricity defaults are for Montgomery County, Texas, as of November 2026. The sources are cited on the page.

## Folders

- `rav4-site/`: the published site (page, styles, scripts, spec data, photos).
- `tools/`: the spec generator, the photo builder, the checks and screenshot tools, and the one-off edit scripts used while building the page. The edit scripts have already been applied and are kept only as history.
- `rav4-dl/`, `phev-dl/`, `rav4-2026/`: pages and build-tool data saved from toyota.com for the 2027 Hybrid, 2027 Plug-in and 2026 models. `rav4-dl/gal/` holds the gallery images. An embedded Google Maps key from Toyota's pages has been replaced with `REDACTED-TOYOTA-MAPS-KEY`.
- `rav4-cfg/`, `sheet/`: photos and crops from Toyota's build tool, used to choose and cut the site's images. `rav4-cfg/photos.json` is the list `tools/build_photos.py` builds from.
- `pr/`: Toyota newsroom pages and image lists. `primg/` holds failed image downloads (storage error responses saved under image names), kept as found.

## Deploying

Every push to `main` runs `.github/workflows/pages.yml`, which publishes only `rav4-site/` to GitHub Pages.
