> **HISTORICAL DOCUMENT — superseded.** Shipped reality is described by
> `MAILFACTORY-MASTER-FORENSIC-RESEARCH-FINAL-DECISION.md` (workspace root) and the
> production README. Where this matrix disagrees with code, code wins.

# MAIL FACTORY — Master Experience · Design Matrix

Built from zero. Source of truth: `app/mail-factory.html` (untouched), official logo, product copy found in the app.
Reference language studied: GetLayers templates / 3D scenes / sections / backgrounds / gradients (principles only, nothing copied).

## Brand system
- Palette: black `#050505`, charcoal `#141416`, graphite `#1d1d21`, bone `#f2efe9` (paper chapters), gray `#9a9aa0`,
  crimson `#ea0c20` (app red), bright `#ff2438`, deep `#7a0912`. Glass = white 4–8% + 1px hairline.
- Type roles (8 levels): L1 statement (Archivo wdth 110–125, wght 800), L2 section (Archivo 700), L3 sub (Instrument Serif italic),
  L4 body (Inter 400/450), L5 micro-label (JetBrains Mono 500, tracked), L6 annotation (Inter 500 13px),
  L7 chapter number (Archivo condensed wdth 62, 900, oversized), L8 status/meta (JetBrains Mono 400 11px).
- Motion: micro 120–220ms · button 100–200ms · reveal 300–700ms · cinematic 700–1600ms · eases: expo.out, power3.inOut, custom springs.

## Interaction systems (18)
Lenis+ScrollTrigger · custom cursor w/ labels · adaptive nav (theme per scene) · chapter rail · product index panel ·
App Stage (single live iframe travelling between slots, FLIP morph, two-way scroll sync, screen queue) · scene manager
(lazy mount / prefetch / dispose / quality tiers) · pointer gradients (raw WebGL) · drag carousels (ring / arc / deck / belt)
· horizontal pinned sequences · split-text reveals · hover/tap discoveries · Download (configurable) · Share (native/clipboard)
· rating (mouse/keys/touch) · toast · reduced-motion mode · keyboard/focus.

## 3D worlds (11 distinct techniques)
01 Signal (hero: logo plane + instanced data streaks, dolly) · 02 Wire Mark (extruded chevron wireframe, edge glow) ·
03 Aperture (ring tunnel, dashboard) · 04 Reactor (metallic orbit of 6 engine nodes, raycast) · 05 Production Line
(instanced glass slabs on a curve) · 06 Pulse (displaced luminous sphere, tap state) · 07 Lattice (instanced cube field, pointer wave) ·
08 Terrain (wireframe noise terrain flyover) · 09 Core (metallic extruded mark, converging particles) · 10 Emergence
(particles morph into logo sampled from the PNG alpha) · 11 Word Ring (CSS 3D typographic ring).

## Gradient shaders (10 pointer-reactive, ~1KB each)
ember-smoke · beam · ink · caustic · metal · electric · haze · paper-grain · glass-refract · spark.

## Section matrix (66)
| # | Chapter | Section | Family | Visual | Interaction / scroll | App | Transition out |
|---|---|---|---|---|---|---|---|
| 01 | INTRO | Signal hero | cinematic hero | 3D Signal, logo, huge type | entrance timeline, pointer parallax, Download/Share/Explore | – | type shrinks into nav label |
| 02 | INTRO | Label strip | kinetic marquee | condensed Archivo, real dashboard labels | velocity-linked marquee | – | – |
| 03 | INTRO | Manifesto | editorial | serif italic + grotesk, ember-smoke gradient | line reveal on scroll | – | fade to black |
| 04 | INTRO | Get the build | asymmetric split | metadata ledger + polished Download | hover metadata, press feedback | – | – |
| 05 | DISCOVERY | Product index | interactive index | six modules, giant numerals | hover preview, click → scroll + prepare screen | prepares | – |
| 06 | DISCOVERY | Three verbs | giant typography | GENERATE / STORE / CONTROL with beam gradient mask | pointer beam | – | – |
| 07 | DISCOVERY | Wire mark | 3D centerpiece | wireframe chevron, annotations | scrub rotation, annotation reveals | – | lines draw into next |
| 08 | DISCOVERY | 100% native | feature spread | oversized numeral, annotation lines | reveal | – | – |
| 09 | DISCOVERY | Spec ledger | data ledger | dense technical rows, count-ups | hover expands note | – | – |
| 10 | PRODUCT | On-device statement | gradient statement | white ink gradient | pointer stir | – | – |
| 11 | PRODUCT | Workflow | pinned horizontal | INPUT→PROCESS→GENERATE→STORE→CONTROL, SVG line | scrub horizontal, node lighting | – | line continues |
| 12 | PRODUCT | Single vs Batch | comparison | draggable divider | drag/keys | – | – |
| 13 | PRODUCT | Quiet interlude | minimal | mono text + breathing dot | – | – | – |
| 14 | DASHBOARD | Status board statement | editorial | large type | reveal | – | – |
| 15 | DASHBOARD | Aperture | 3D tunnel | ring tunnel fly-through | scrub camera | – | rings frame the app |
| 16 | DASHBOARD | Live Dashboard | annotated live app (pinned) | phone frame, caustic gradient, SVG annotations | scrub annotations | dashboard | stage morphs |
| 17 | DASHBOARD | Four tiles | column accordion | 100% NATIVE / ROOT POWERED / NETWORK READY / SMART ENGINE | hover/tap expands | – | – |
| 18 | DASHBOARD | Open Factory | typographic transition | giant "OPEN FACTORY →" | scrub letter-spacing | – | becomes ENGINE label |
| 19 | ENGINE | Engine opener | full-bleed crimson | expanded ENGINE, scanline | – | – | – |
| 20 | ENGINE | Reactor | 3D orbit (pinned) | six nodes + core, metallic | scrub orbit, tap node → panel | – | – |
| 21 | ENGINE | Six engines | horizontal panels | distinct SVG glyphs, ON/OFF defaults | scrub horizontal | – | – |
| 22 | ENGINE | Utility pages | technical diagram | route check viz + console typewriter | reveal, hover | – | – |
| 23 | ENGINE | Live Engine | asymmetric glass live app | glass wide panel, left copy | enter/leave sync | engine | – |
| 24 | ENGINE | Switchboard | technical table | metal gradient, toggles list | hover rows | – | – |
| 25 | ENGINE | Path handoff | SVG transition | line from reactor to conveyor | scrub draw | – | – |
| 26 | GENERATOR | Single. Batch. | interactive typography | two giant words, toggle | tap toggles layout | – | – |
| 27 | GENERATOR | Production line | 3D tunnel (pinned) | instanced slabs, captions | scrub speed | – | – |
| 28 | GENERATOR | Four steps | arc carousel | concave arc, synced title | drag/swipe/keys/snap | – | – |
| 29 | GENERATOR | Parameter board | data viz | preset chips, mono readout | tap chips compose readout | – | – |
| 30 | GENERATOR | Live Generator | spotlight live app | large centered, soft spotlight | sync | generator | – |
| 31 | GENERATOR | One-tap copy | feature spread + SVG demo | animated copy affordance | hover/tap demo | – | – |
| 32 | GENERATOR | Tips ticker | quiet ticker | three real tips | marquee | – | – |
| 33 | LIBRARY | Paper opener | inverted editorial | bone paper, black type, paper-grain | reveal | – | – |
| 34 | LIBRARY | Archive grid | archive | index cards (SINGLE/BATCH records) | hover lifts, tap flips | – | – |
| 35 | LIBRARY | Sort index | FLIP list | six sort modes | click re-sorts with FLIP | – | – |
| 36 | LIBRARY | Actions deck | scroll deck | Copy/Star/Verify/Rename/Delete/Search cards | scrub fan → cascade | – | – |
| 37 | LIBRARY | Live Library | paper live app | light stage, dark app contrast | sync | library | – |
| 38 | LIBRARY | Paper wipe | clip-path transition | paper → black | scrub | – | – |
| 39 | ONE TOUCH | Pulse | radial 3D | luminous sphere, thin type | tap pulses / state color | – | – |
| 40 | ONE TOUCH | Telemetry dial | radial SVG | PING/DOWN/UP/SESSION | reveal, hover | – | – |
| 41 | ONE TOUCH | Server ring | 3D ring carousel | 22 demo countries | drag inertia, keys | – | – |
| 42 | ONE TOUCH | Live One Touch | 3D-framed live app | perspective tilt | pointer tilt, sync | onetouch | – |
| 43 | ONE TOUCH | Controls | typographic spread | CONNECT / AUTO-LAUNCH / START AUTOMATION / EMERGENCY STOP | hover | – | – |
| 44 | SETTINGS | Settings tree | tree diagram | real menu tree, SVG lines | draw on scroll, hover | – | – |
| 45 | SETTINGS | Themes | swatch strip | six themes (1 active, 5 locked) | drag strip, tap | – | – |
| 46 | SETTINGS | Backup destinations | connector sequence | six providers, UI-demo honesty | horizontal scrub | – | – |
| 47 | SETTINGS | Live Settings | full-width live app HUD | wide, HUD corners | sync | settings | – |
| 48 | SETTINGS | Support | link ledger | GitHub issues / repo / website | hover | – | – |
| 49 | WORKFLOW | Topology | technical visualization | HTML nodes + SVG links of real app structure | hover highlights paths | – | – |
| 50 | WORKFLOW | Story sync | pinned storytelling | beats drive live screens | scrub → screen switches | story | – |
| 51 | WORKFLOW | Lattice | 3D field (pinned) | instanced cubes, pointer wave | scrub pan | – | – |
| 52 | SYSTEM | Terrain | 3D flyover (pinned) | wireframe terrain | scrub | – | – |
| 53 | SYSTEM | Privacy & Terms | sticky ledger | two-column dense text | sticky headings | – | – |
| 54 | SYSTEM | FAQ | giant-Q accordion | four real questions | expand | – | – |
| 55 | SYSTEM | Maker | word ring | six exploration areas in CSS 3D ring | drag/auto-rotate | – | – |
| 56 | SYSTEM | Version | split-flap + stated roadmap | v1.0.0 flaps, real "future update" statements | reveal | – | – |
| 57 | DOWNLOAD | Spark approach | gradient | rising embers | pointer | – | – |
| 58 | DOWNLOAD | Core payoff | 3D + immersive CTA | metallic mark, converging particles, big Download | press, share | – | – |
| 59 | DOWNLOAD | Install notes | technical notes | platform facts | – | – | – |
| 60 | FEEDBACK | Rating | interactive rating | five stars, optional feedback | mouse/keys/touch, persist | – | – |
| 61 | BRAND | Emergence | 3D particles (pinned) | particles assemble into the logo | scrub | – | – |
| 62 | BRAND | Final card | brand scene | real logo, credit roll | – | – | – |
| 63 | BRAND | Footer | quiet footer | links, version | – | – | – |
| 64 | GLOBAL | Nav / rail / index / cursor / toasts | systems | – | – | – | – |
| 65 | GLOBAL | App Stage | live app engine | phone / glass / spot / paper / tilt / wide / story | FLIP morph + sync | all | – |
| 66 | GLOBAL | Scene manager | loading | lazy, prefetch, dispose, adaptive quality | – | – | – |

Pacing: CALM → EDITORIAL → INTERACTIVE → 3D → LIVE APP → QUIET → CAROUSEL → HIGH ENERGY → TYPOGRAPHY → 3D → LIVE APP → PAPER → RADIAL → TECHNICAL → STORY → DEEP → PAYOFF → RATING → BRAND.
Rule: never the same family twice in a row; red is an accent — chapters alternate black/white, black/crimson, glass, metal, paper.
