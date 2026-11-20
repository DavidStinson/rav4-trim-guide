# Checks

`npm run check` (`tools/check.mjs`) serves the repo, opens headless Chromium windows for 2027 and 2026 at 390, 700, 1100, 1400 and 1500 px plus 1400 px in dark mode, and in each:

1. takes a full-page screenshot to `.check/shots/<year>@<width>[-dark].png` (transitions frozen, every photo loaded);
2. runs axe with the WCAG 2.2 A and AA rules;
3. injects and runs the in-page checks: `layoutCheck()`, `yearCheck(year)`, `await photoCheck()`, `await readingCheck()` (last, because it scrolls), and once `photoFilesCheck()`;
4. records every page error, `console.error` and failed file load.

Results land in `.check/results.json`; the exit code is 1 on any failure. Options: `--quick` (2027 at 390 and 1400 plus dark), `--no-shots`, `--root <dir>` (check a worktree with that worktree's own check files), `--page <path>`.

## The in-page check files

| File | Guards |
|---|---|
| `tools/layout-check.js` | the two page widths, sliders (card width, side arrows, trim tabs where one card fits), nav fit, overflow, the hero's first screen and blurbs, each feature panel's declared layout and who-has-it column, package ladders and the stacking callout, the priority picker (before a pick, check marks, best-match tabs, its row lining up with the package cards), the parking diagram's camera dots, step-up links: things that break at one width only |
| `tools/year-check.js` | the facts per year: prices, totals, mpg, charging math, paint codes, which trims have what, fine print that was removed on purpose |
| `tools/photo-check.js` | every photo opens larger, has 1x and 2x copies, alt text of its own (never a copy of its caption), fits the expanded view; every copy exists at the width `photos.js` lists |
| `tools/reading-check.js` | what an older reader notices: one type scale (like elements share a size, nothing under 15px), the section nav highlight, labels inside drawings, the pinned spec header, line length (80 characters at most), no single-word last lines |

Each exposes a function on `window` that returns a list of failure strings; an empty list passes. A failure string names the thing, what it is, and what was expected, so it reads as a bug report on its own.

## Adding a check

Add a numbered block to the matching file with a comment saying where the expected value comes from. Run it red against the current page before changing the page. Expected values are worked out from Toyota's sources, never read from `data.js`.

## Keeping checks honest through a redesign

Selectors in the checks follow the page: when a redesign moves or renames an element, update the selector in the same commit. The expected numbers and words stay. A check is removed only together with the thing it guards (say, a section that no longer exists), and the commit says so. When a redesign adds a new way to show a fact (a new comparison table, say), add a check that it shows the same numbers.

## When a check fails

Read the failure text first; it says what was expected. For layout failures, open the matching screenshot in `.check/shots/`. For flaky-looking failures, rerun once: photo loads can be slow, and a Google Fonts file can fail to load (`ERR_SOCKET_NOT_CONNECTED`). A 39 px difference at the "Only show differences" toggle at 1100 px is known screenshot jitter, so pass `--max 0.001` to `shot-diff.mjs` when proving a change is invisible.

## Writing a check that holds

- Judge what renders, not what the markup says. `visible()` in `layout-check.js` goes by computed `display` and boxes: a `hidden` element that a component's `display` rule still shows counts as visible (the base `[hidden]{display:none!important}` rule exists because one did).
- A check that opens a dialog, clicks or moves focus waits for the page to settle before it returns. The lightbox hands focus back to its photo button a task after closing, and that scroll once landed under the reading check's section-nav jump.
- Measure line length in characters per line, not `ch`: this body face's zero is wide, so `68ch` still runs about 90 characters. The site caps standalone prose at `--measure` (34em).
