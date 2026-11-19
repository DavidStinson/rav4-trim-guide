# RAV4 Trim Guide

A one-page guide comparing four Toyota RAV4s for a family car decision: the RAV4 Hybrid XLE Premium, XSE and Limited, and the RAV4 Plug-in Hybrid XSE, for model years 2026 and 2027. It explains each feature in plain language, shows which trims have it, and includes package ladders, a paint and interior color picker, a fuel-cost calculator, a charging-time comparison and a power-outage calculator.

Live site: https://davidstinson.github.io/rav4-trim-guide/ (marked `noindex`, so search engines are asked not to list it).

## Run it locally

The site is static HTML with no build step. Serve the project root so the test harness can reach both the site and the tools:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765/rav4-site/index.html. Add `?year=2026` for the 2026 model year.

## Checks

Open http://127.0.0.1:8765/tools/harness.html. It loads the site for both model years at 390, 700, 1100, 1400 and 1500 px wide, runs `tools/layout-check.js` and `tools/year-check.js` in each, and prints the failures. It also checks once that every color-picker photo exists (the `files` entry). An empty list for every entry means everything passed; the results are also on `window.RESULTS`.

The expected numbers in `year-check.js` come from Toyota's pages and hand calculations, not from the site's own data, so a typo in the site's figures fails the check.

## Where the numbers come from

- Year-dependent facts (prices, mpg, range, horsepower, charging port, trial lengths) live in `YEAR_FACTS` near the top of the script in `rav4-site/index.html`.
- `YEAR_FACTS` holds Toyota's MSRP. Every price the page shows adds the $1,595 destination fee (`DESTINATION`, giving `START` per trim), and the note under the hero prices is the only place that says so or mentions tax and registration. The spec list's "Base MSRP" line is replaced with this starting price.
- Package names, prices and buying order come from Toyota's online build tool, read in November 2026. The order was confirmed from the tool's "Requires Changes" prompts for both years.
- The spec lists (`rav4-site/specs.js` for 2027, `rav4-site/specs-2026.js` for 2026) are generated from Toyota's build-tool data:

  ```sh
  python3 tools/gen_specs.py rav4-site/specs.js rav4-dl/fsodata.json phev-dl/fsodata.json
  python3 tools/gen_specs.py --var RAV4_SPECS_2026 rav4-site/specs-2026.js rav4-2026/hyb_fsodata.json rav4-2026/phev_fsodata.json
  ```

  Each run prints an "unused aliases" warning. That's expected, because each year's wording uses a different set of aliases.
- Paint and seat colors (`PAINTS`, `SEATS` and `COLORS` in `rav4-site/index.html`) come from the build tool for both years; they're identical. On the XLE Premium and Limited, selecting each paint with each seat color raised no "Requires Changes" prompt in either year, and the XSE and Plug-in have one seat color, so the model is the only limit. The picker's photos are the build tool's 2027 renders. The hero and the styling-details photos reuse them, and the styling details add a back view of each trim in Wind Chill Pearl (white), taken from the build tool's 360° view. Their image ids are in `rav4-cfg/colors/renders.json`, and this downloads any that are missing and rebuilds the cropped WebP copies in `rav4-site/img/colors/` (needs `cwebp`):

  ```sh
  python3 tools/fetch_color_renders.py
  ```
- Gas and electricity defaults are for Montgomery County, Texas, as of November 2026. The sources are cited on the page.

## Folders

- `rav4-site/`: the published site (page, spec data, photos).
- `tools/`: the spec generator, the test harness and checks, and the one-off edit scripts used while building the page. The edit scripts have already been applied and are kept only as history.
- `rav4-dl/`, `phev-dl/`, `rav4-2026/`: pages and build-tool data saved from toyota.com for the 2027 Hybrid, 2027 Plug-in and 2026 models. `rav4-dl/gal/` holds the gallery images. An embedded Google Maps key from Toyota's pages has been replaced with `REDACTED-TOYOTA-MAPS-KEY`.
- `rav4-cfg/`, `sheet/`: photos and crops from Toyota's build tool, used to choose and cut the site's images. `rav4-cfg/colors/` holds the original color-picker renders.
- `pr/`: Toyota newsroom pages and image lists. `primg/` holds failed image downloads (storage error responses saved under image names), kept as found.

## Deploying

Every push to `main` runs `.github/workflows/pages.yml`, which publishes only `rav4-site/` to GitHub Pages.
