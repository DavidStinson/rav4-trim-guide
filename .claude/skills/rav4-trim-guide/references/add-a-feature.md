# Adding a feature: worked example

The head-up display row, end to end. Every feature row follows this shape.

## 1. Find the facts

Toyota's comparison page for each model and year says, per trim, whether the feature is standard, optional (and in which package, at what price), or missing. The build tool's "Requires Changes" prompts say which packages a package drags in. For the HUD in 2027 the comparison pages show it missing on the XLE Premium and XSE, a $600 option on the Limited, and part of the Driver Assist Package on the Plug-in XSE. Write down the source for the footer.

## 2. Write the check, run it red

In `tools/year-check.js`, add the next numbered block at the end (the number below is illustrative). The `pills(id)` helper, defined in block 9, returns the pill states of `#f-<id>` in trim order (XLE Premium, XSE, Limited, Plug-in XSE):

```js
// 12. Head-up display: optional on the Limited ($600 alone) and the Plug-in XSE (Driver Assist
//     Package, $2,865 with what it requires), per Toyota's 2027 comparison pages.
if(pills('hud').join() !== 'no,no,opt,opt') fails.push(`head-up display marks ${pills('hud').join()}; expected no,no,opt,opt`);
```

`npm run check -- --quick --no-shots` fails, because the row doesn't exist yet.

## 3. Add the row to `FEATURES` in `rav4-site/data.js`

```js
{id:'hud', group:'Safety and driver help', name:'Speed shown on the windshield',
 aka:'10-in. Color Head-Up Display (HUD) with Road Sign Assist',
 what:'Your speed, the speed limit and navigation arrows are projected onto the windshield...',
 why:`Keeps your eyes on the road. One catch: ...`,
 trims:[['no'],['no'],['opt','Stand-alone option: $600'],['opt','Comes with the Driver Assist Package ($2,865 with the packages it requires)']],
 visual:'hudDemo', layout:'beside'},
```

- `name` is the buyer's words; `aka` is Toyota's name.
- `trims` is in trim order. Each entry is `[state, note?]` with state `std`, `opt` or `no`; the note says how to get it or what the trim has instead.
- Text that differs by year reads `F` (`${F.year}`), never a hard-coded year.
- `group` must match an existing group name; the feature list and group nav are built from it.
- `layout` is `text`, `beside` or `below`; step 4 says which.

## 4. Optional: a visual, and the layout

Either `img:'<photo name>', cap:'<caption>'` for a photo (see `photos.md`), or `visual:'<name>'` with a `VIS.<name> = ()=>({html, below?, init?})` entry in `rav4-site/visuals.js`. `html` is the picture, `below` is an extra full-width row under the panel (the screen photos), and `init(root)` runs after the row is in the page.

For two photos side by side and nothing else, use `imgs:[{img, alt, cap}, {img, alt, cap}]` instead of a `VIS` entry. `app.js` builds the same `.photo-pair` as the camera demo, and the layout must be `below`. The gear selector row shows the lever and the toggle switch this way:

```js
imgs:[{img:'shifter-xle', alt:'RAV4 center console with a tall gear lever in a stitched boot, beside the cupholders', cap:'XLE Premium, and the XSEs without the option: a regular gear lever.'},
      {img:'shifter-ltd', alt:'RAV4 center console with a small silver-topped switch where a gear lever would be, beside the cupholders', cap:'Limited, and an option on the XSEs: a small toggle switch instead of a lever.'}]
```

Each caption leads with who has it. The alt text describes the photo and never repeats the caption (`photo-check.js` fails a copy).

Then pick the layout. The who-has-it column always sits on the panel's right, beside the copy only.

| layout | use for | where the picture goes |
| --- | --- | --- |
| `text` | no picture | nowhere: copy and the column |
| `beside` | one static drawing (HUD, wheels, screen sizes) | beside the copy when the copy keeps 520px; otherwise under the copy, at the copy's width (drawings stop at 520px) |
| `below` | every photo: a lone `img` (ventilated seats, JBL, charging, liftgate) and every `imgs` pair (gear selector); and anything with controls or several photos (camera, mirror, roof, plug-in, outage demos) | under the copy and the column, across the whole panel |

The HUD is `beside` because it's one static drawing. At today's 1,060px reading width a `beside` picture always lands under the copy; the 1356px container query in `styles.css` puts it beside the copy if the features section ever gets wider. Layout check 15 fails a missing or wrong layout, and `app.js` logs an error for an `img` or `imgs` with any layout but `below`. A lone photo spans the card's content width at its own shape, uncropped (layout 37), so its `sizes` in `app.js` lists the card's content widths.

## 5. Green, look, commit

`npm run check` to ALL PASS, `node tools/shoot.mjs` and read the section image that holds the row, then commit the check (`test:`) and the row (`feat:`) separately.

## The shape

check block in `year-check.js` (red) -> `FEATURES` entry in `data.js` -> optional `VIS` entry or photo -> source in the footer if new -> check green -> screenshot -> two commits.
