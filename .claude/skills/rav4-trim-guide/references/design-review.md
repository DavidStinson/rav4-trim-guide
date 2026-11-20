# Design review

## Seeing the page

- `node tools/shoot.mjs [--root <dir>] [--out <dir>] [--widths 1400,390] [--year 2027] [--scheme light|dark]` writes `<out>/<width>/00-fold.png` (the first screen) and one image per top-level block in page order, blocks over 1600 px cut into parts. Default out is `.check/sections/`. Read these, not the full-page shots, when judging design: each is a readable size.
- `npm run check` also leaves full-page shots in `.check/shots/`, useful for spotting layout breaks across all widths at a glance.

## Comparing two versions

`node tools/shot-diff.mjs <before-dir> <after-dir> [--out <dir>] [--max <percent>]` reports the share of changed pixels per screenshot and writes red-on-white diff images. Exit 0 means no screenshot changed more than `--max`. Use `--max 0.001` to prove a refactor is invisible (the 1100 px toggle jitters by a few pixels between runs).

## Hill climbing the design

The overnight run of 2026-11-19 keeps its plan, rubric, references and log in `.claude/hill-climb/` (not committed). Each round lives on a `climb/rNN` branch in a git worktree, checked with `node tools/check.mjs --root <worktree>` and shot with `node tools/shoot.mjs --root <worktree> --out <dir>`. A separate judge compares the round with the current best from screenshots alone, blind to which is which; facts and checks are hard gates before any judging.

## What the climb settled

David reviewed every climb change one by one (`.claude/hill-climb/REVIEW-DECISIONS.md`) and the rework built the result. Each rule below is held by a check, so a redesign that breaks one fails `npm run check`:

- Two page widths. Text sits in one centered reading column (`--read`, 1060px); rows of cards and big demos break out to the wide width (`--wide`, 1420px: four 340px cards and three 20px gaps) with `.bleed` (layout 8).
- Each feature panel declares `layout:'text'|'beside'|'below'` in `FEATURES`, and the panel follows it. Who has the feature sits in a column at the right from 901px and ends where the copy ends (layout 9 and 15; see `add-a-feature.md`).
- Spacing comes from tokens at the top of `styles.css`, and each value is David's pick. `--sec-gap` sets the space between sections: 120px on a laptop, 96 on a tablet, 80 on a phone, measured from the last visible content to the next heading. Inside a header, the heading sits 8px above the lead and the content 36px below it; the grid gap is the only space there, so header children carry no margin of their own. Features steps down: 72px before a group, 32px between panels, 24px from a group heading to its panel. Spec tables sit 20px apart. The footer keeps its own 96px (layout 22 to 25).
- No rounded box gets a thick stripe down one side; David found it AI-looking. A trim card tints its header with the trim's soft color (`--c-soft`, from `soft` in `TRIMS`). A standalone note goes in `.tagged` with a yellow `.note-tag` ("Good to know") above its text. Notes that already open with a heading or bold words (the year comparison, demo summaries, the colors switch message) take the soft yellow fill `--opt-soft` (layout 26).
- Cards are at least 340px wide. Sliders show four side by side where four fit (from a 1,468px window) and arrows otherwise; where one card fits, one full-width card with trim tabs and no peeking sliver (layout 3, 4, 4b and 6).
- On a laptop the hero heading is one line, each car's blurb at most two lines, and all four cars, prices and the fee note fit the first 900px (layout 11 and 14).
- One type scale: like elements share one size at each width, captions sit below notes and notes below body text, and nothing a reader needs is under 15px (reading 2). Running text averages at most 80 characters a line (reading 6) and never ends on a single word (reading 7). Section leads share one wider measure (`--lede`, 41em) so the priorities lead is one line on a laptop; they may run to 90 characters (reading 6 and 8).
- The priority picker shows each trim's name and price before a pick and nothing else; a picked chip's check mark is a drawn path centered in its circle; on a phone the best match shows on its tab (layout 12, 17 and 19).
- The packages-stack rule is said once, in a callout right above the package cards, and each rung after the first shows its total with the packages above it (layout 16, year 13).
- Only step-up items with a write-up are links (layout 13).

Open complaints from the last judges, not yet acted on: the step-up arrow sits far from its label; "Worth knowing" and "You give up" name the same kind of item; on a phone the 13 priority chips take 11 rows.
