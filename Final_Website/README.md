# MAIL FACTORY — Master Experience (production)

The definitive Mail Factory product site: a cinematic, black-dominant, single-page
experience built on the **Best Animation** runtime, curated per
`MAILFACTORY-MASTER-FORENSIC-RESEARCH-FINAL-DECISION.md` (workspace root; the binding
blueprint). The embedded application is the **real, untouched** `ORIGINAL_APP` build.

## Run

```bash
npm install          # gsap, lenis, three, playwright (QA)
node server.js       # serves ./site on 0.0.0.0:8080
```

Then open `http://localhost:8080/`. QA overrides: `?q=0|1|2` forces the quality tier.

## What ships (verified counts — do not quote other numbers)

| Object | Count |
|---|---|
| Sections | **57** (curated from 61: 8 redundant compositions removed/absorbed, footer absorbed into `s-brand`, 4 new/merged compositions added) |
| Chapters (rail + menu) | **14** |
| Pinned sequences | **12** (Σ 26.2 viewport-lengths) |
| Horizontal scroll sequences | **3** (workflow, engines, backup) |
| Live-app slots / frames | **7** (phone, glass, spot, paper, tilt, wide, story) |
| Three.js worlds | **9** (signal, wiremark, aperture, reactor, prodline, pulse, terrain, core, emergence) |
| Pointer-reactive gradient shaders | **11** (ember, beam, ink, caustic, metal, paper, spark, haze, water, smoke, heat) |
| Settings destinations mapped | **14** · demo servers **22** · engines **6** · screens **6** |
| Application | `site/app/mail-factory.html` = `ORIGINAL_APP/mail-factory.html` byte-exact, md5 `f696fb917ddd9cff851b9335b05e261c` (553,575 B) — **never edit** |

Product truth: version **v1.0.0** everywhere (no other version string exists in the
shipped site); download link stays unconfigured (`MF_CONFIG.downloadUrl:''`) and the
buttons explain themselves honestly until the owner sets a URL.

## Architecture highlights

- **Lenis ⇄ GSAP/ScrollTrigger bridge**, pin/scrub vocabulary, split-type reveals,
  FLIP sorts, split-flap, marquees — one `gsap.ticker`.
- **App Stage:** one real iframe travelling through 7 presentation slots (1.25 s cubic
  morph, screen queue, two-way sync via MutationObserver, wheel handoff, tilt).
- **Focused App Viewport (mobile ≤ 900 px, owner brief §13/14):** the same iframe is
  presented cropped to the region each chapter discusses (`data-focus-region`,
  `data-focus-zoom` ≤ 2.2); `EXPAND` / `CLOSE · RETURN` toggles the full frame.
  No fake phone frames, no screenshots, no rebuilt app UI anywhere.
- **Scene manager:** lazy mount / prefetch / dispose, hard caps (maxScenes 2/3/4,
  maxGradients 2/3/5), single render loop, per-scene error isolation,
  `forceContextLoss()` on dispose. Quality tiers + `?q=` override.
- **Cursor:** the custom ring cursor is removed (owner brief §10); native pointer with
  magnetic buttons, hover and focus-visible states.
- **Interactive system map:** every settings-tree node opens the real destination in
  the live app (`showScreen` + `openSettingsSubpage` / `openBackupScreen`).
- **Honesty layer:** all caveats ("saved only — no automation backend connected yet",
  "demo only — no automation backend connected", "UI demo", "22 DEMO SERVERS",
  "nothing is uploaded to a server") are site copy and survive the app swap.
- **`site/cdn-cgi/…email-decode.min.js` is load-bearing** (the app injects that path and
  ships 11 obfuscated addresses). Frozen.

## Frozen (verified-correct; changing voids the QA baseline)

`core/scroll.js`, `core/pins.js`, `core/scenes.js`, `core/env.js`, `core/app.js` boot
order, stage frame CSS, existing grad shaders, `fonts.css` + 5 woff2, `vendor/*`,
`cdn-cgi/*`, `server.js`, MF_CONFIG keys, telemetry dial scrub, story beats API,
generator tab-click bridge, wheel handoff, reverse sync, QA harness scripts, toasts,
Download/Share wiring, rating storage (`mf.site.rating`), logo assets.
Bounded additions made during the production pass: FAV crop math inside
`core/stage.js apply()/activate()` (additive rect + clip-path; all frozen mechanics
untouched), cursor removal in `core/ui.js`, `heat` shader in `scenes/grad.js`,
official-logo silhouette geometry in `scenes/util.js` + `scenes/wiremark.js`.

## QA (executed 2026-09-23, headless Chromium 131 via Playwright, SwiftShader GL)

| Gate | Result |
|---|---|
| G1 sync (expected vs live app screen) | desktop 63/63, mobile 81/81, **0 mismatches** (`qa/shots-prod*/report.json`) |
| G2 console/page/network errors | **0 desktop, 0 mobile** |
| G3 app swap integrity | 553,575 B, no `pwrSub`, 11+ e-mail addresses decoded in-frame, `showScreen('help')` → settings + `#page-helpcenter.open` |
| G4 FAV crop geometry + expand/return | all 7 slots: crop ratios 0.95–1.01 of declared region, `LIVE · <screen>` tag visible at every checkpoint, expand = full frame, return = crop |
| G5 keyboard walk | nav Download, index rows, capability columns, compare slider, **14/14 tree nodes** (targeted tab-walk), rating radiogroup, carousel/fav controls; 2 px red-2 focus rings |
| G6 performance | load 702 ms desktop / 578 ms mobile; **2,070 KB** transfer (≤2.2 MB); heap 9.5–10.1 MB steady (≤14); CLS 0; gz critical path 70 KB (≤260); WebGL peaks: scenes 3 (cap 4), gradients 3 (cap 5); fps 12/18 on SwiftShader (not GPU-representative); hero logo `fetchpriority="high"` |
| G7 reduced motion | tier-0 run: static scene hosts (8), pins unextended, no carousel auto-advance |
| G8 honesty | no "1.7.9", no cursor hooks, 14-destination settings copy, 7 `LIVE · <screen>` slot tags |
| G9 owner map | **46/46** DOCX notes verified by automated walk (`qa/owner-map.js` → `qa/owner-map.json`: section presence/merges/markers + screenshot per note) |
| G10 real browser | NOT VERIFIED on physical hardware; exercised via headless Chromium + mobile emulation (390×844 dpr2, touch) only |

Definition-of-Done census (§31/§35): `qa/census.js` → `qa/census.json` — **26/26** binding counts
(57 sections · 14 chapters · 12 pins Σ26.2 · 3 hscroll · 7 slots · 13 focus regions · 9 scene hosts ·
11 grad hosts · 14 tree destinations · 6 engines · 22 ring servers · v1.0.0-only · no footer/cursor/1.7.9 ·
header 64 px · menu 14+6+credits · carousel 4 cards auto+pause).

Additional executed evidence: `qa/contract-spots.json` (reverse sync, iframe title, adaptive nav, verbatim caveats, lazy three + idle mount, MF_CONFIG keys), `qa/axe-audit.json` (axe-core 4.13 full-document sweep, **0 violations**),
`qa/lighthouse.json` (accessibility/best-practices/SEO **100**, performance 32 = software-GL + gzip-less
local server), `qa/perf-run.json` (G6 gate), `qa/reduced-run.json` (reduced-motion full pass).

Reproduce: `URL='http://127.0.0.1:8080/?q=2' OUT=qa/shots-prod node qa/shoot.js`,
`MOBILE=1 OUT=qa/shots-prod-m node qa/shoot.js`, `node qa/production.js`
(writes `qa/production-gates.json`).

## Repository notes

- `docs/OWNER-REQUIREMENTS.txt` — the owner's written brief (restored; it had been
  deleted at HEAD `a948307`).
- `DESIGN-MATRIX.md` — historical pre-code document, banner added; code outranks it.
- `mailfactory_best_text_AND_TEMPLATE/` — retained as the verbatim content bank only;
  its runtime (dead GSAP vendors, r160 three, 62 B e-mail stub, preloader, dock
  teleport, "1.7.9") is not shipped.

## QA add-on tooling (non-shipping)

`package.json` is FROZEN per MAILFACTORY-MASTER-FORENSIC-RESEARCH-FINAL-DECISION.md §25.
The optional audit tools are therefore installed without touching it:

    npm i --no-save lighthouse axe-core

* `node qa/axe-audit.js` — full-document axe-core sweep (evidence: `qa/axe-audit.json`).
* `npx lighthouse http://127.0.0.1:8080/ --output=json --output-path=qa/lighthouse.json` — Lighthouse (evidence: `qa/lighthouse.json`).
