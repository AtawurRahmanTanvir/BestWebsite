# Mail Factory — cinematic product experience

A single continuous, scroll-driven presentation of the Mail Factory Android application.
The real app (`mail-factory.html`) runs **untouched** inside the page and is driven through its own
public `window.showScreen(name)` API; everything around it — 3D worlds, gradients, typography,
horizontal sequences, carousels — exists to explain that app.

## Run

```bash
cd mailfactory
node server.js            # serves ./site on http://0.0.0.0:8080
```

Any static host works too — `site/` is plain HTML/CSS/ES-modules with no build step.
Quality tiers can be forced for testing with `?q=0|1|2` (0 = reduced / no WebGL, 1 = mobile, 2 = desktop).

## Configuration (site/index.html → `window.MF_CONFIG`)

| key | meaning |
| --- | --- |
| `downloadUrl` | The real build link. **Empty by default** — every Download control explains that it is not configured yet instead of inventing a URL. Set it and every Download button (hero, early "Get the build", nav, final payoff) becomes a real link. |
| `shareUrl` / `shareTitle` / `shareText` | Used by Share → `navigator.share`, falling back to clipboard + toast. |
| `feedbackEndpoint` | Optional POST endpoint for the 5-star rating form. Ratings are always kept in `localStorage` (`mf.site.rating`). |
| `appUrl` | Where the untouched app is served (`app/mail-factory.html`). |
| `github` / `issues` / `website` | The only external links used — the repository the app itself references. |

## Structure

```
site/
  index.html              the whole experience (61 sections, 15 chapters)
  app/mail-factory.html   byte-identical copy of the application (sha256 verified)
  css/                    base design system, intro, chapters a/b/c
  js/core/                env (tiers), scroll (Lenis+GSAP), ui (nav/menu/rail/cursor/toasts/download/share),
                          reveal (typographic reveals, marquees, counters), pins (pinned + horizontal sequences),
                          scenes (lazy 3D/gradient lifecycle), stage (single live-app iframe, slots, morphing, sync)
  js/scenes/              10 Three.js worlds + grad.js (10 pointer-interactive WebGL gradients)
  js/sections/            per-chapter interaction systems
  assets/, fonts/, vendor/ logo derivatives (from the official PNG), self-hosted fonts, three/gsap/lenis
qa/                       Playwright scripts + screenshots (shoot.js, spots.js, interact.js, bridge.js, wheel.js)
DESIGN-MATRIX.md          pre-code design matrix for every section
```

## Live-app integration

* One iframe, mounted once (`#app-frame`), presented in seven different frames: phone, glass panel, spotlight,
  paper mount, tilting 3D frame, wide panel, sticky story frame. The frame **morphs** between slots.
* Two-way sync: scrolling into a chapter calls the app's `showScreen(...)`; the product index and the
  menu jump + switch screen; in-app navigation (the app's own buttons) is observed and reflected back
  into the page (story label, index highlight).
* Wheel handoff: when the app cannot scroll further, the wheel is handed back to the page.
* Nothing inside the app is modified, restyled, screenshotted or faked.

## Honesty rules applied

* No download counts, testimonials, ratings, benchmarks or partnerships. Every figure on the page is read
  from the application (6 engines, 3 utility pages, 22 demo servers, 14 settings sub-pages, v1.0.0 …).
* Demo/simulated states are labelled exactly as the app labels them ("DEMO SERVERS", "Saved only — no
  automation backend connected yet", "System optimization is not implemented in this build yet").
* Community links the app marks "coming soon" are shown as coming soon, not linked.

## QA that was actually run (headless Chromium, SwiftShader WebGL)

* `qa/shoot.js` — desktop 1440×900 and mobile 390×844 (touch, dpr 2): 68 screenshots each, top → bottom,
  console/pageerror/request-failure capture, slot ↔ app-screen sync check at every step. Final runs: **0 errors,
  0 sync mismatches** on both.
* `qa/interact.js` — menu (open / Esc), Share → clipboard fallback, rail jump, comparison drag, colonnade,
  reactor legend, route preview + console, generator mode toggle driving the app's own tab, arc carousel
  (button + keyboard), parameter board, one-tap copy (real clipboard), archive flip, FLIP sorting, pulse tap
  (disconnected → connecting → connected), 3D ring drag, theme strip drag, topology hover, FAQ, rating
  (keyboard, click, submit, persistence across reload), final Download toast, in-app click propagation,
  reduced-motion context.
* `qa/bridge.js` — random jumps between all seven live slots (forward, backward, direct) → app follows every time.
* `qa/wheel.js` — wheel handoff from the app back to the page.
* Performance: initial HTML+CSS+core JS is small; three.js, scenes and the app load lazily; far scenes are
  disposed (max 4 live 3D scenes / 5 gradients on desktop, fewer on mobile; none with reduced motion).

Software-rendered WebGL in the QA container runs at 5–15 fps; on a GPU the same scenes are lightweight
(instanced meshes, ≤ 14k points, half-resolution gradients, no post-processing).
