# RAV4 trim guide

A one-page guide that helps one reader, David's mom, choose between four RAV4s. She reads it on a laptop first and a phone second. Every choice serves her decision: plain language, large readable type, and facts she can trust.

## Philosophy

- **Facts are sacred.** Every price, rating and feature mark comes from Toyota's own pages, build tool or press releases. Change a fact only with a source, and cite the source in the footer.
- **Checks hold independent truth.** The expected numbers in `tools/year-check.js` are worked out from the sources by hand, never copied from the site's data, so a typo in the site fails the check. A check's numbers never change to make a page pass.
- **No build step, no runtime dependencies.** The site is plain HTML, CSS and JavaScript in `rav4-site/`, published as is. Node and Playwright run the checks only.
- **Verified means `npm run check` prints ALL PASS.** Run it before every commit. It covers both model years, five widths, dark mode, accessibility (WCAG 2.2 AA), photos, and any page error.
- **Look before calling a design done.** `node tools/shoot.mjs` writes section screenshots; read them.

## Decision heuristics

- When a change makes the page harder to scan for a first-time car buyer, it is wrong even if it looks better.
- Prefer one clear way to compare the trims over several partial ones.
- Name things the way a buyer would ("Speed shown on the windshield"), and keep Toyota's name as the secondary label.
- Write the check first, run it red, then change the page.

## Where things are

Implementation patterns (the checks, the photo pipeline, adding a feature, design reviews) live in the hub skill at `.claude/skills/rav4-trim-guide/SKILL.md`. Read it before editing the site or the tools.
