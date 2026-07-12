# Porting the BYLD site to Squarespace

Everything you need is in the `squarespace/` folder, already split into
ready-to-paste files. You will not be arranging Squarespace blocks, images,
or text by hand - the whole design travels over as code pasted into three
places. First working version: about 30 to 45 minutes.

`index.html` in this folder stays the design reference: open it in a browser
and treat it as the target.

## How this works (read this first)

Squarespace pages are stacks of "sections". We use one **Blank section** per
design section, each holding a single **Code Block** with that section's
HTML. Styling loads once through **Code Injection**, the animations load the
same way, and a few lines in the **Custom CSS** panel hide Squarespace's own
header and footer so the custom design owns the page.

```
Code Injection HEADER  -> fonts + all styling      (paste once)
Code Injection FOOTER  -> all animations and JS    (paste once)
Custom CSS panel       -> hides Squarespace chrome (paste once)
10 Blank sections      -> one Code Block each      (paste 10 times)
```

## Phase 0 - before you start

1. Log in through support@byldcommerce.com as usual.
2. Check the plan under **Settings > Billing**. JavaScript in code blocks
   and injection needs the **Business plan or higher**. Agency sites almost
   always have it, but check before you spend an hour pasting.
3. Build on a **new page**, not the live homepage, so nothing public breaks.

## Phase 1 - create the working page

1. Open **Pages** in the left panel.
2. Click **+**, choose **Blank Page**, name it "Home v2".
3. Leave it in the "Not linked" group - invisible to visitors until you
   choose to launch it.

## Phase 2 - paste the three global pieces

1. **Fonts and styling**: **Settings > Developer Tools > Code Injection**
   (older UI: Settings > Advanced > Code Injection). Paste all of
   `squarespace/code-injection-header.html` into the **HEADER** field.
2. **Animations**: paste all of `squarespace/code-injection-footer.html`
   into the **FOOTER** field on the same screen. Save.
3. **Hide Squarespace chrome**: **Website > Website Tools > Custom CSS**
   (older UI: Design > Custom CSS). Paste `squarespace/custom-css.css`.
   Save.

After this step the site looks broken (no header, empty page). Expected -
content comes next.

## Phase 3 - build the ten sections

For each file in `squarespace/sections/`, in order:

1. Open the new page, click **Edit**.
2. **Add Section > Blank**.
3. Inside it, **Add Block > Code**.
4. Delete the placeholder, paste the file contents, **Apply**.
5. Drag the code block's edges to span the full section width.
6. Save.

| # | File | What it is |
|---|------|-----------|
| 01 | `01-hero.html` | Preloader, custom header + mobile menu, hero, floating chips |
| 02 | `02-marquee.html` | Scrolling channel ticker |
| 03 | `03-story.html` | Four-chapter scroll story with the animated stage |
| 04 | `04-turn.html` | Dark "That's the moment most brands find us" quote |
| 05 | `05-services.html` | Flywheel + six service cards |
| 06 | `06-channels.html` | Channels accordion (Amazon open by default) |
| 07 | `07-results.html` | Draggable results card strip |
| 08 | `08-principles.html` | How we work, three principles |
| 09 | `09-contact.html` | Dark contact section with the form |
| 10 | `10-footer.html` | Giant wordmark footer + back to top |

**Important:** in the editor these sections look like plain unstyled text or
raw code. Normal - Squarespace does not run scripts or injected CSS inside
the editor. Judge the result only in preview.

## Phase 4 - preview and launch

1. Exit edit mode and view the page, or open the page URL in a private
   window (site password, if any, is under **Settings > Site Availability**).
2. Walk the whole page top to bottom, then again on your phone.
3. To launch: **Pages > hover the page > gear icon > Set as Homepage**.

## Known gotchas

- **Editor looks broken, preview looks perfect.** Normal, see above.
- **JavaScript does nothing at all.** Personal plan. Business or higher is
  required.
- **Squarespace header still visible.** Template selectors differ slightly.
  Right-click it, Inspect, note its `id`, add
  `#thatId { display: none !important; }` to Custom CSS.
- **Sticky scroll story does not stick.** Some templates put
  `overflow: hidden` on a wrapper. `custom-css.css` already forces
  `overflow: visible` on the usual suspects; if it still fails, inspect
  which parent has `overflow: hidden` and extend that rule. Worst case
  fallback that still carries the narrative: four full-width alternating
  chapters with the same copy and reveal animations, no sticky stage.
- **A section shows a white background.** Extend the transparent-background
  rule in `custom-css.css` to the wrapper you find in the inspector.
- **Do not rename classes** in the section HTML - styling and scripts find
  everything by class name. One rename is intentional: our header is
  `byld-header` because Squarespace's own header also uses `header`.

## Optional upgrades once it works

- **Real form submissions:** the reference form composes an email in the
  visitor's mail app. Squarespace's native Form Block can store submissions
  and email support@byldcommerce.com instead: replace the `<form>` markup in
  section 09 with a Form Block placed in the same section, then restyle it
  in Custom CSS to match. Do this only after the straight port works.
- **Results cards** could later link to byldcommerce.com/casestudies detail
  pages.

## Editing content later

All copy lives in the section files. To change a headline, edit the text in
the matching code block. Mirror every change back into this folder so the
local files stay the source of truth.

## Things to keep no matter what

- The narrative order: founder's story first, "That's the moment most brands
  find us" as the pivot, services and channels after, results as evidence,
  never as the opener.
- Real case-study numbers only (every stat here comes from
  byldcommerce.com/casestudies).
- The italic serif accent words in each headline, in the accent color. That
  one trick carries most of the editorial look.
- The generous whitespace rhythm: tight at section tops (~60-96px, so anchor
  landings hug the header), generous at section bottoms (~96-180px).

## For the weekly sync

The supervisor's two tests, and where this build answers them: the scroll
story (section 03) is the "someone sees themselves in it" moment - problem
first, BYLD as the turn, not a feature list. The editorial paper-and-ink
design plus real case numbers as evidence (section 07) is the "design a
serious brand would be proud of" half.
