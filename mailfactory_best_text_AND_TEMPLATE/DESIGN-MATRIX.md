# MAIL FACTORY — MASTER EXPERIENCE / PRE-CODE DESIGN MATRIX

Authoritative sources: `app/mail-factory.html` (untouched), `assets/logo-*.png`, GetLayers layer
system research (Templates / 3D Scenes / Sections / Backgrounds / Gradients).

## VERIFIED PRODUCT FACTS (only these may be stated as fact)

| Area | Verified from app source |
|---|---|
| Identity | "MAIL FACTORY", native Android app, version **1.7.9** |
| Dashboard | SYSTEM STATUS ONLINE · OPEN FACTORY · OPEN LIBRARY · 100% NATIVE (Android App) · ROOT POWERED (Max Performance) · NETWORK READY (HTTP/HTTPS • SOCKS5) · SMART ENGINE (High Success Rate) |
| Engine | "Powerful automation engines": IDENTITY SHIFT, NETWORK CYCLE, SYSTEM REPO, CORE BOOST, MEMORY PURGE, DNS TUNNEL. Tools: CHECK ROUTE (Route Status/Latency/Route/Last Checked), LOG ENGINE (LIVE console), SYSTEM SETTINGS (per-engine ON/OFF; disabled engines skipped by Optimize System). Actions: OPTIMIZE SYSTEM, CREATE ACCOUNT |
| Generator | SINGLE + BATCH. Name Pattern (0/20), Email Length 8/10/12/16/20, Password Length 8/12/16/20/24, Quantity 5/10/20/50/100, GENERATE, Generated Output, COPY / COPY ALL |
| Library | All Generated Accounts · LIVE · TOTAL · SINGLE/BATCH records with date+time · expand batch · Sort (Newest, Oldest, Singles, Batches, Starred, Verified first) · Search Library · Add to Starred / Verify / Rename / Delete · "That's all for now" |
| One Touch | SecureVPN surface: DISCONNECTED → CONNECT VPN, telemetry PING/DOWN/UP/SESSION, country select (22 demo servers), AUTO-LAUNCH (saved only), START AUTOMATION (demo only — no automation backend), EMERGENCY STOP |
| Settings | App: Notification, Appearance (Dark Red active; Cyber Blue / Neon Purple / Matrix Green / Arctic White / Stealth Gray locked), Language (selection only), Backup (Google Drive, Google Docs, GitHub, Dropbox, OneDrive, Phone Storage — UI demo). Support: Help & Support, Send Feedback, Report a Problem, Contact Us. About: Rate the App, Share the App, Privacy, Terms, About, Version |
| Privacy | Generated accounts stored **locally**; nothing uploaded to a server |
| Community | GitHub `MailFactoryLabs/MailFactoryLabs.github.io`, Telegram group, Facebook group |
| Navigation API | `iframe.contentWindow.showScreen('dashboard'\|'engine'\|'generator'\|'library'\|'onetouch'\|'settings')` |

**Forbidden:** invented counts, testimonials, benchmarks, partners, prices, fake UI recreations.

## TYPOGRAPHY ROLE SYSTEM (8 levels)
L01 statement `clamp(56px,11vw,190px)` Archivo 800 wdth-expanded, tracking −0.045em ·
L02 section heading `clamp(34px,5.2vw,76px)` · L03 subheading `clamp(19px,2vw,28px)` ·
L04 body `16–19px` Inter 400 · L05 technical micro-label `11px` mono 600 uppercase 0.22em ·
L06 annotation `12.5px` italic-ish dim · L07 chapter number `clamp(80px,16vw,260px)` outline ·
L08 status/metadata `10.5px` mono, dot indicator.

## COLOR PACING (red is an accent, not a wash)
`ink` #050506 · `carbon` #0b0c0f · `steel` #16181d · `paper` #f4f4f6 · `crimson` #e8112d ·
`ember` #ff2438. Section tones cycle: BLACK+WHITE → BLACK+GLASS → MONO-METAL → BLACK+CRIMSON →
PAPER (light inversion) → NEAR-MONOCHROME → HIGH-ENERGY RED. No two adjacent sections share a tone.

## COMPOSITION FAMILIES (34 distinct — no family repeated back-to-back)
01 Ignition/preloader · 02 Cinematic 3D hero · 03 Ticker rail · 04 Editorial manifesto ·
05 Control-panel product index · 06 Kinetic type statement · 07 Pointer-reactive gradient field ·
08 Asymmetrical split · 09 Numbered fact spread · 10 Horizontal scroll rail · 11 Interactive SVG
architecture map · 12 Workflow topology · 13 3D centerpiece · 14 Live-app floating panel ·
15 Live-app embedded-in-scene · 16 Live-app wide interface · 17 Live-app archive column ·
18 Live-app radial/minimal · 19 Live-app technical grid · 20 Spotlight carousel · 21 Layered-depth
carousel · 22 Drag ribbon carousel · 23 Process timeline · 24 Roadmap ascent · 25 Feature story
spread · 26 Data visualisation · 27 Archive index/ledger · 28 Editorial grid · 29 Comparison
split · 30 Quiet minimal statement · 31 Light/paper inversion · 32 Immersive CTA · 33 Rating
instrument · 34 Final brand sequence + footer.

## CHAPTER MAP (15 chapters → 60+ sections)
INTRO · DISCOVERY · PRODUCT · DASHBOARD · ENGINE · GENERATOR · LIBRARY · ONE TOUCH · SETTINGS ·
WORKFLOW · SYSTEM · DEEP DIVE · DOWNLOAD · FEEDBACK · BRAND

## 3D ENVIRONMENTS (10 — each a different visual family, lazy-loaded + disposed)
1 `lattice` hero volumetric grid-tunnel (wireframe/luminous) · 2 `core` faceted glass monolith ·
3 `engines` six orbiting metallic nodes · 4 `stream` GPU particle river (generator) ·
5 `vault` instanced data-slab archive (library) · 6 `pulse` radial shader corona (one touch) ·
7 `mesh` technical wire-terrain (system) · 8 `fluid` soft organic metaball drift ·
9 `shards` dark metallic debris field (download) · 10 `brand` final logo-resolve scene.

## GRADIENT / SHADER MOMENTS (8, lightweight — pointer reactive)
g1 discovery spotlight · g2 aurora drift · g3 caustic sheet · g4 heat bloom · g5 ink diffusion ·
g6 chrome sweep · g7 signal noise · g8 final ember.

## INTERACTION SYSTEMS (15)
Smooth scroll · magnetic pointer · product index sync · live-app scroll sync (2-way) ·
3 carousel engines (snap / layered / drag-ribbon) · horizontal scroll rails · SVG node reveal ·
hover+tap annotation reveal · expandable ledger rows · engine toggle board · rating instrument ·
share/clipboard · download affordance · chapter rail navigation · reduced-motion + touch parity.

## LIVE-APP CHAPTER RULES
Each app chapter = distinct frame presentation (panel / scene-embed / wide / column / radial /
grid). Scroll into chapter → `showScreen(x)`; scroll back → previous screen; index click →
scroll + screen. Never faked, never redesigned, never screenshotted. One shared iframe instance
is moved between mounts so app state is preserved.

## PERFORMANCE CONTRACT
Hero interactive < 1s (no 3D blocking) · Three.js dynamic-imported on idle · scenes built on
approach (rootMargin prefetch), paused off-screen, disposed when far · DPR clamped (mobile 1.4) ·
particle/geometry budgets halved on coarse pointers · iframe `loading=lazy` until chapter 4.
