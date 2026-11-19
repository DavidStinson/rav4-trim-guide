# Design review

## Seeing the page

- `node tools/shoot.mjs [--root <dir>] [--out <dir>] [--widths 1400,390] [--year 2027] [--scheme light|dark]` writes `<out>/<width>/00-fold.png` (the first screen) and one image per top-level block in page order, blocks over 1600 px cut into parts. Default out is `.check/sections/`. Read these, not the full-page shots, when judging design: each is a readable size.
- `npm run check` also leaves full-page shots in `.check/shots/`, useful for spotting layout breaks across all widths at a glance.

## Comparing two versions

`node tools/shot-diff.mjs <before-dir> <after-dir> [--out <dir>] [--max <percent>]` reports the share of changed pixels per screenshot and writes red-on-white diff images. Exit 0 means no screenshot changed more than `--max`. Use `--max 0.001` to prove a refactor is invisible (the 1100 px toggle jitters by a few pixels between runs).

## Hill climbing the design

The overnight run of 2026-11-19 keeps its plan, rubric, references and log in `.claude/hill-climb/` (not committed). Each round lives on a `climb/rNN` branch in a git worktree, checked with `node tools/check.mjs --root <worktree>` and shot with `node tools/shoot.mjs --root <worktree> --out <dir>`. A separate judge compares the round with the current best from screenshots alone, blind to which is which; facts and checks are hard gates before any judging.

## What the climb settled

Each rule below came out of a judged round and is now held by a check, so a redesign that breaks one fails `npm run check`:

- On a laptop the hero heading is one line and all four cars, their prices and the fee note fit the first 900px (layout 11).
- Sentences are at least 17px on a laptop; short labels may be 16px (reading 2). Notes in wide panels keep about 80 characters a line (reading 6).
- Where one card fits, sliders show one full-width trim picked from four trim tabs, never a faded sliver of the next card (layout 4b).
- The priority picker shows the four trims before a pick; idle chips show an empty circle, picked ones a check (layout 12).
- Only step-up items with a write-up are links, and they end in an arrow (layout 13).

Open complaints from the last judges, not yet acted on: the step-up arrow sits far from its label; "Worth knowing" and "You give up" name the same kind of item; the picker's empty meters read as unfinished; the phone stacks 13 chips one per line.
