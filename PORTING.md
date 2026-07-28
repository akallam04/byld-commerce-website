# Porting this build into Squarespace

Everything in `squarespace/` is generated. Never edit it by hand and never
edit the Squarespace side directly. Edit the local files, rebuild, paste
only what changed.

## The workflow

1. Edit `index.html`, `css/style.css`, or `js/main.js`.
2. From the repo root: `python3 scripts/build-squarespace.py`
3. Re-paste only the files it prints as UPDATED.

To preview locally: `python3 -m http.server 4870` from the repo root, then
open http://localhost:4870

## Where each file goes

| File | Destination in Squarespace |
| --- | --- |
| `squarespace/code-injection-header.html` | Settings > Developer Tools > Code Injection > HEADER |
| `squarespace/code-injection-footer.html` | same screen, FOOTER |
| `squarespace/custom-css.css` | Website > Website Tools > Custom CSS |
| `squarespace/sections/NN-*.html` | one Code Block inside its own Blank section, in order |

Each paste replaces the previous contents. Delete the old contents first.

## Section order on the page

Eleven Blank sections, each holding exactly one Code Block:

1. `01-hero.html` (also carries the chrome: header, mobile menu, grain,
   preloader, chapter rail, and the `#top` anchor)
2. `02-marquee.html`
3. `03-story.html`
4. `04-turn.html`
5. `05-services.html`
6. `06-channels.html`
7. `07-results.html`
8. `08-principles.html`
9. `08b-faq.html`  <- NEW section, insert between principles and contact
10. `09-contact.html`
11. `10-footer.html`

## Paste order that avoids a broken live page

Do the two code injections first, then the sections top to bottom. The CSS
and JS are null-guarded, so a partially pasted page still renders instead
of collapsing.

1. HEADER injection
2. FOOTER injection
3. Custom CSS
4. Sections 01 through 10-footer, in order

## Gotchas, all already handled, do not regress

- Squarespace's own header uses `.header`. Ours is renamed `.byld-header`
  by the build script in the markup, the CSS, and the JS.
- Squarespace theme CSS overrides inherited colors. The block at the end of
  `css/style.css` re-asserts every color at higher specificity. Any NEW
  component must set its colors explicitly and get a line in that block.
- Fixed overlays (header, menu, grain, preloader, chapter rail) are
  re-parented to `<body>` by JS on load because Squarespace wrappers trap
  and clip `position: fixed`. Z-indexes live in the 9000s.
- Anchor scrolling is script-driven; the editor swallows native hash nav.
- Every JS feature is null-guarded so partial pages still work.
- Reveal masks (`.line`) carry 0.16em descender padding so serif
  descenders do not get clipped.
- The editor shows raw unstyled code. Only judge the published preview.
- Custom JS requires the Business plan or higher.

## Live-site issues found during the last pass

These are on byldcommerce.com, not in this build, and need a decision:

1. Little Gripsters has no case study page. Its "Learn more" on the case
   studies index points at `#`. Our card links to `/casestudies` so it is
   not a dead link, but the page should be built.
2. On the case studies index, the Copper entry links to `/mood`. Our card
   uses the correct `/copper`.
3. Two phone numbers are live: 385.245.7178 on the homepage and individual
   case studies, 385.312.0605 on the case studies index. This build uses
   385.245.7178 throughout. Confirm which is current.

## Verified case study URLs used in this build

Loaded and confirmed directly: `/corks-popcorn`, `/bucket-golf`,
`/crae-home`.
Taken from the case studies index: `/andi`, `/luna`, `/tetontackle`,
`/qb54`, `/geo-project`, `/copper`.
