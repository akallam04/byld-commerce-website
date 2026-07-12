#!/usr/bin/env python3
"""Regenerate the squarespace/ paste files from the local source of truth.

Run from the repo root after any edit to index.html, css/style.css, or
js/main.js:

    python3 scripts/build-squarespace.py

Then re-paste whichever outputs changed:
  - code-injection-header.html -> Settings > Developer Tools > Code Injection > HEADER
  - code-injection-footer.html -> same screen, FOOTER
  - custom-css.css             -> Website > Website Tools > Custom CSS
  - sections/NN-*.html         -> the matching Code Block on the page
"""

import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text()
css = (root / 'css/style.css').read_text()
js = (root / 'js/main.js').read_text()


def between(s, a, b):
    i = s.index(a)
    j = s.index(b, i)
    return s[i:j].rstrip()


# slices of index.html, one per Squarespace section
chrome = between(html, '<div class="grain"', '  <main>')
hero = between(html, '<!-- ============ HERO', '<!-- ============ MARQUEE')
marquee = between(html, '<!-- ============ MARQUEE', '<!-- ============ STORY')
story = between(html, '<!-- ============ STORY', '<!-- ============ THE TURN')
turn = between(html, '<!-- ============ THE TURN', '<!-- ============ SERVICES')
services = between(html, '<!-- ============ SERVICES', '<!-- ============ CHANNELS')
channels = between(html, '<!-- ============ CHANNELS', '<!-- ============ RESULTS')
results = between(html, '<!-- ============ RESULTS', '<!-- ============ PRINCIPLES')
principles = between(html, '<!-- ============ PRINCIPLES', '<!-- ============ CONTACT')
contact = between(html, '<!-- ============ CONTACT', '</main>')
footer = between(html, '<footer class="footer">', '</footer>') + '</footer>'

# Squarespace's native header uses class "header"; ours becomes byld-header
chrome = chrome.replace('<header class="header">', '<header class="byld-header">')
css_port = (css
    .replace('.header {', '.byld-header {')
    .replace('.header.is-scrolled', '.byld-header.is-scrolled'))
js_port = js.replace("document.querySelector('.header')", "document.querySelector('.byld-header')")

out = root / 'squarespace'
(out / 'sections').mkdir(parents=True, exist_ok=True)

fonts = '''<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500&display=swap" rel="stylesheet">'''

header_inj = f'''<!-- PASTE INTO: Settings > Developer Tools > Code Injection > HEADER
     (replaces the previous version - delete the old contents first)
     Loads the fonts and the entire design system. -->
{fonts}
<style>
{css_port}
</style>
'''

footer_inj = f'''<!-- PASTE INTO: Settings > Developer Tools > Code Injection > FOOTER
     (replaces the previous version - delete the old contents first)
     All the interactions. Overlays are re-parented to <body> on load so
     Squarespace's section wrappers cannot trap or clip them. -->
<script>
{js_port}
</script>
'''

custom_css = '''/* PASTE INTO: Website > Website Tools > Custom CSS
   (replaces the previous version - delete the old contents first)
   Hides Squarespace's own chrome and flattens its section wrappers
   so the code blocks control the whole page. */

/* hide Squarespace's native header, mobile menu overlay, and footer */
#header { display: none !important; }
.header-menu, .header-burger { display: none !important; }
#footer-sections, footer.sections { display: none !important; }

/* flatten Squarespace section wrappers: no padding, no max-width, no white bg */
#page .page-section {
  padding: 0 !important;
  min-height: 0 !important;
  background: transparent !important;
}
#page .page-section > .content-wrapper {
  padding: 0 !important;
  max-width: none !important;
}
#page .page-section .content { width: 100% !important; }

/* fluid engine: stack blocks normally, full width, no grid gutters */
.fluid-engine { display: block !important; padding: 0 !important; }
.fe-block { position: static !important; width: 100% !important; margin: 0 !important; }
.sqs-block-code { padding: 0 !important; }

/* keep sticky scrollytelling working inside Squarespace wrappers */
#page .page-section,
#page .content-wrapper,
.fluid-engine,
.fe-block,
.sqs-block,
.sqs-block-code { overflow: visible !important; }
'''

note = '<!-- PASTE INTO: a Code Block inside a Blank section (see PORTING.md) -->\n'

files = {
    'code-injection-header.html': header_inj,
    'code-injection-footer.html': footer_inj,
    'custom-css.css': custom_css,
    'sections/01-hero.html': note + '<div id="top"></div>\n' + chrome + '\n\n' + hero + '\n',
    'sections/02-marquee.html': note + marquee + '\n',
    'sections/03-story.html': note + story + '\n',
    'sections/04-turn.html': note + turn + '\n',
    'sections/05-services.html': note + services + '\n',
    'sections/06-channels.html': note + channels + '\n',
    'sections/07-results.html': note + results + '\n',
    'sections/08-principles.html': note + principles + '\n',
    'sections/09-contact.html': note + contact + '\n',
    'sections/10-footer.html': note + footer + '\n',
}

for name, content in files.items():
    path = out / name
    changed = (not path.exists()) or path.read_text() != content
    path.write_text(content)
    print(f"{'UPDATED ' if changed else 'same    '}{name}: {len(content):,} chars")

assert '.byld-header {' in css_port
assert "querySelector('.byld-header')" in js_port
print("\nDone. Re-paste the files marked UPDATED.")
