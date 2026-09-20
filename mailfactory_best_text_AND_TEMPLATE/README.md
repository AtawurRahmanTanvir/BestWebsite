# Mail Factory — Interactive Product Site

A cinematic, multi-chapter interactive website that presents the **real** Mail Factory
application. Not a landing page: 60 template-grade sections, 34 composition families,
10 WebGL environments, 8 interactive gradient fields and 8 carousel/showcase systems,
with the actual application embedded live and synchronized to scroll.

---

## Run it

Serve the folder over HTTP (same-origin is **required** — the site drives the app
through `iframe.contentWindow`, which a `file://` origin blocks):

```sh
cd mailfactory
python3 -m http.server 3000
# open http://localhost:3000
```

Rebuild `index.html` after editing any part file:

```sh
./BUILD.sh
```

---

## Configure before publishing

`js/app.js` → `CONFIG` (near the bottom):

```js
export const CONFIG = {
  downloadUrl: 'https://github.com/MailFactoryLabs/MailFactoryLabs.github.io/releases/latest',
  repoUrl:     'https://github.com/MailFactoryLabs/MailFactoryLabs.github.io',
  issuesUrl:   'https://github.com/MailFactoryLabs/MailFactoryLabs.github.io/issues',
  version:     '1.7.9'
};
```

`downloadUrl` is a **placeholder pointing at the project's own releases page**. No
download URL was invented. Replace it with the real APK/release link when you have one.

---

## Architecture

```
index.html            generated — do not edit by hand
BUILD.sh              concatenates parts/ → index.html
parts/*.html          12 source fragments (the real source of the markup)
css/base.css          tokens, reset, 8 text roles (.l1–.l8), nav, buttons, cursor, a11y
css/sections.css      per-family section CSS (34 families)
css/fonts.css         16 self-hosted @font-face
js/main.js            boot: preloader → hero ignition → scene registration → interactions
js/app.js             runtime core: SceneManager, LiveApp dock, toast, share/download
js/scenes.js          10 Three.js environments
js/gradients.js       raw-WebGL gradient engine + 8 shaders
js/interactions.js    19 interaction systems
app/mail-factory.html the real application — byte-identical copy, never modified
assets/               logo derivatives + 16 woff2
vendor/               three r160, gsap, ScrollTrigger, lenis (all vendored, no CDN)
```

### The live-app dock — the important bit

The application is loaded **once** into a single `<iframe>` that lives in a
`position:fixed` dock (`#appDock`). The dock is flown over whichever chapter slot is
active; the iframe is **never re-parented**, because moving an iframe in the DOM forces
the browser to reload it and would reset the app to its first screen on every chapter.

Screen changes go through the app's own public API:

```js
iframe.contentWindow.showScreen('dashboard'|'engine'|'generator'|'library'|'onetouch'|'settings')
```

Sync is driven by ordered "app intent" anchors: every chapter opener (`data-prep`) and
every live stage (`data-app-chapter`), in document order. The active screen is the last
anchor whose top has crossed 45% of the viewport — so the app is correct scrolling
forward, scrolling backward, and after a direct jump from the product index, including
in the gaps between sections.

### Scene lifecycle

Scenes build when within 120% of the viewport, run only while visible, and are
**disposed** once they drift beyond 3.2 viewports. A periodic sweep catches scenes that
were merely paused, because an IntersectionObserver only fires on transitions. Peak
simultaneous WebGL contexts measured: **2–5** (browsers cap around 16).

---

## Verification

Three harnesses live in `../qa/`:

| Harness | What it proves |
|---|---|
| `shoot.py <out> <w> <h> <n>` | Full-page sweep, N checkpoint PNGs, console/pageerror/failed-request log |
| `appsync.py` | App sync forward, backward, and 6 random direct jumps + app integrity |
| `interact.py` | Rating (mouse + keyboard + persistence across reload), share fallback, download, nav, rail, reduced-motion |

Last full run:

```
desktop 1600x950  sections=60 hOverflow=0px errors=0 failedReq=0
tablet   820x1180 sections=60 hOverflow=0px errors=0 failedReq=0
phone    390x844  sections=60 hOverflow=0px errors=0 failedReq=0

appsync.py  → ALL PASS   (forward · backward · direct jumps · 6 screens · integrity)
interact.py → ALL PASS
```

Scale: 60 sections · 15 chapters · 6 live-app chapters · 10 3D scenes · 8 gradients ·
34 composition families · 8 carousels/showcases · ~5,270 words · 55,699px (≈58.6 screens).

---

## Content policy

Every factual line is drawn from the application itself — screen copy, control values,
engine names, Help Centre text, FAQ answers, the backup caveat, the translation note and
version 1.7.9. There are **no invented** customer counts, download counts, testimonials,
reviews, benchmarks, partnerships or features. The only numbers on the page are counts of
things visible inside the product (6 screens, 6 engines, 13 Settings entries, max batch
100), and the page says so explicitly.

`app/mail-factory.html` is byte-identical to the supplied file (verified by md5). No
Dashboard, Engine, Generator, Library, One Touch or Settings UI is faked anywhere; every
appearance of those screens is the live application.

---

## Accessibility & performance

- Semantic landmarks, one `h1`, 104 keyboard-focusable controls, **0** controls without
  an accessible name, visible focus rings, `prefers-reduced-motion` honoured
  (autoplay, drift and cinematic motion disabled; content rendered static).
- Initial load requests ~15 files; the 544 KB application iframe is **not** fetched until
  the first app chapter is approached.
- Adaptive quality: lower DPR, fewer particles and simpler shaders on touch / low-memory
  / low-core / narrow devices via `ENV.low`.
