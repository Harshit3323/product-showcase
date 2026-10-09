# Project Plan: 3D / AR Product Showcase (Web)

> This file is the single source of truth for an AI coding agent building this project.
> Read it fully before writing code. Follow the requirements, constraints, and file structure exactly.
> If something here conflicts with your assumptions, this file wins. If something is ambiguous, pick the simplest option that satisfies the requirements and note it in `README.md`.

---

## 1. Goal

Build a mobile-first web page that showcases a single product in 3D, with two modes:

1. **3D Mode (default):** the user rotates, zooms, and pans the product to see it from every angle.
2. **AR Mode:** the user places the product on a real surface (floor or table), the product stays fixed there, and the user walks around it to view it from every angle, with touch gestures to move, rotate, and scale it.

The project will be demoed at a live event. Attendees scan a QR code, the page opens in their phone browser, and they try it. No app install.

## 2. Hard Constraints

| Constraint | Detail |
|---|---|
| **Zero cost** | No paid services, accounts, or licenses. Free hosting and open-source libraries only. |
| **No app install** | Runs entirely in the mobile browser. |
| **Target devices** | Android phones (Chrome) and iPhones (Safari and Chrome). Desktop is NOT a target, but the page must not break there. |
| **Single codebase** | One static site serves every device. No separate Android/iOS projects. |
| **HTTPS required** | AR and camera access only work over HTTPS. Hosting must provide it. |
| **Event conditions** | Assume weak venue Wi-Fi. The model must be small and assets cached. |
| **No backend** | Static files only. No server, database, or API. |

### 2.1 Model Asset Handling (IMPORTANT)

The real product model **does not exist yet**. The project owner will add the final model file(s) manually after the build is finished.

- **Do not wait for, ask for, or block on the real model.** Build everything against a free placeholder GLB and complete all phases.
- Use a placeholder from a free, permissively licensed source (for example the `model-viewer` shared sample assets) saved as `assets/models/product.glb`, and note its source in `README.md`.
- **Swapping must require zero code changes.** The owner replaces `assets/models/product.glb` (and optionally `product.usdz` and `poster.webp`) and edits only `config/product.json` if needed. No hard-coded model paths, names, or dimensions anywhere in JS, HTML, or CSS.
- Do not hard-code anything specific to the placeholder: camera distance, hotspot positions, variant material names, and AR scale must all come from `config/product.json` and be easy to retune.
- Variants and hotspots must degrade gracefully if the real model has different or fewer materials than the placeholder (hide the swatches or hotspots rather than throwing errors).
- Add a **"Replacing the model"** section to `README.md` with step-by-step instructions: export requirements (GLB, metres, under about 5 MB), running `scripts/optimize-model.sh`, where to drop the files, what to change in `config/product.json`, how to bump the service worker cache version so devices pick up the new model, and how to retest AR on a real phone.
- Add the new model's file names to the service worker precache list through a single constant at the top of `sw.js`, so updating it is a one-line change.

## 3. Key Technical Reality (read this before designing anything)

- **iOS Safari and all iOS browsers (Chrome, Firefox, Edge) use WebKit and do NOT support WebXR.** On iPhone, browser AR is only possible through **AR Quick Look**, a native iOS viewer that the browser hands the model to. Our code does not run inside it, and its UI and gestures cannot be customized.
- **Android Chrome** supports WebXR (via ARCore) and falls back to **Scene Viewer** (a Google native component).
- Therefore the AR feature is delivered through each platform's native AR viewer, selected automatically by `<model-viewer>`. **Do not attempt to build a custom WebXR AR experience, and do not integrate third-party web AR engines (8th Wall, Zappar, etc.).** Both are out of scope.
- "Hand gestures" in this project means **touch gestures** (drag, twist, pinch). Camera-based hand tracking is out of scope: native AR sessions own the camera.

## 4. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| 3D + AR | **Google `<model-viewer>` (v4.x)** | Handles orbit controls, WebXR, Scene Viewer, and iOS Quick Look from one tag |
| Language | **Vanilla HTML, CSS, JavaScript (ES modules)** | No build step, easy to deploy, easy to debug on a phone |
| Model format | **GLB** (glTF 2.0 binary). Optional hand-made USDZ for iOS | GLB is the source of truth; `model-viewer` can generate the iOS file on the fly |
| Model optimization | **`gltf-transform`** (CLI, free) | Compress to roughly 5 MB or less, using Draco/Meshopt and WebP textures |
| Offline/caching | **Service worker** (hand-written, no library) | Survives bad venue Wi-Fi |
| QR code | **Static PNG** generated once with any free tool, plus a small `qrcodejs` fallback if needed | No runtime dependency required |
| Hosting | **GitHub Pages** (primary). Netlify or Cloudflare Pages as alternatives | Free, automatic HTTPS |
| CI (optional) | GitHub Actions deploy workflow | Auto-publish on push |

**Dependency rule:** vendor `model-viewer.min.js` into `/vendor` and load it locally rather than from a CDN, so the page works even if the venue network blocks or throttles third-party hosts. Pin the version in a comment at the top of the file.

## 5. Functional Requirements

### 5.1 3D Mode (default on load)
- FR-1: Render the product centered, on a neutral gradient background, with soft ground shadow and image-based lighting (neutral environment, or a bundled HDR/EXR file in `assets/env/`).
- FR-2: One-finger drag rotates; pinch zooms; two-finger drag pans. Mouse equivalents must also work.
- FR-3: Gentle auto-rotate on load that stops permanently once the user interacts.
- FR-4: Constrain camera limits (min/max zoom distance, polar angle) so the user cannot lose the model or look from underneath unnaturally.
- FR-5: Show a poster image and a progress bar while the GLB loads. Show a clear error state if loading fails, with a retry button.
- FR-6: Double-tap (or a "Reset view" button) returns the camera to its default orbit.

### 5.2 AR Mode
- FR-7: A prominent **"View in your space"** button launches AR. It is visible on all devices, including unsupported ones.
- FR-8: On supported devices, call `modelViewer.activateAR()`. The platform's native viewer handles surface detection, placement, anchoring, and gestures (move, rotate, scale, walk around).
- FR-9: Placement is **floor/table** (`ar-placement="floor"`). Provide a configurable option for wall placement in `config/product.json`.
- FR-10: Scale is configurable: `ar-scale="auto"` (user can resize) or `fixed` (real-world size). Default `auto`. Model units must be metres.
- FR-11: Before launching AR, show a short one-time tip overlay: "Move your phone slowly to find a flat surface, then tap to place". It is dismissible and remembered for the session.
- FR-12: If AR is not supported (`canActivateAR === false`), show a friendly message explaining the device can't do AR and keep the 3D mode fully usable. (A QR modal for desktop is optional, since desktop is not a target.)
- FR-13: Listen to the `ar-status` event for state changes (`session-started`, `object-placed`, `failed`) and handle `failed` gracefully with a message.

### 5.3 Mode switching UI
- FR-14: A top-bar segmented control toggles **3D View** and **AR View**. In AR View the main call-to-action is the AR launch button, and auto-rotate is off.
- FR-15: Mode state is simple UI state in `js/mode.js`. No router or framework.

### 5.4 Product options (nice to have, build after the core works)
- FR-16: Color/material variant swatches that change the base color factor of named materials.
- FR-17: Up to ~4 hotspot annotations (`slot="hotspot-*"`) that label product features, and hide when occluded or facing away.
- FR-18: Variant and hotspot data are read from `config/product.json`, never hard-coded in JS.

### 5.5 Event/kiosk behavior
- FR-19: After 60 seconds of inactivity, reset to the default 3D view, default variant, and auto-rotate on (useful for a booth tablet or a shared display).
- FR-20: Work offline after first load (service worker caches HTML, CSS, JS, vendor lib, model, poster).

## 6. Non-Functional Requirements

- **Performance:** first meaningful render under about 3 seconds on 4G. Total transfer (excluding the model) under about 300 KB. GLB under about 5 MB (hard cap 8 MB). Textures max 2048 px, WebP or KTX2.
- **Touch UX:** all buttons at least 44x44 px, no hover-only interactions, `touch-action` set so page scroll doesn't fight the 3D canvas, and use `100dvh` and `viewport-fit=cover` so mobile browser chrome and notches are handled.
- **Accessibility:** meaningful `alt` on the viewer, visible focus states, sufficient contrast, tip text readable at arm's length.
- **Compatibility:** Android 8+ with ARCore, iOS 12+ with ARKit. Latest Chrome on Android, and Safari and Chrome on iOS.
- **Resilience:** no uncaught errors if the model fails, camera permission is denied, or AR is unsupported.
- **Privacy:** no analytics, trackers, or cookies. Camera is used only by the native AR viewer.

## 7. File Structure

```
3d-ar-showcase/
├── plan.md                      # this file
├── README.md                    # how to run, deploy, swap the model, test on devices
├── index.html                   # single page; loads css, vendor lib, js modules
├── manifest.webmanifest         # name, icons, theme color (PWA basics for offline/installable feel)
├── sw.js                        # service worker: precache + cache-first for assets
│
├── config/
│   └── product.json             # product name, model paths, variants, hotspots, AR options
│
├── css/
│   ├── tokens.css               # CSS variables: colors, spacing, radii, z-index
│   └── styles.css               # layout, top bar, buttons, overlays, loading + error states
│
├── js/
│   ├── main.js                  # entry point: loads config, wires modules, registers service worker
│   ├── mode.js                  # 3D/AR mode state and UI toggling
│   ├── ar.js                    # AR launch, support detection, ar-status handling, tip overlay
│   ├── viewer.js                # model-viewer setup: camera limits, auto-rotate, reset, loading/error
│   ├── variants.js              # color/material swatches (reads config)
│   ├── hotspots.js              # builds hotspot elements from config
│   ├── idle.js                  # inactivity timer and kiosk reset
│   └── ui.js                    # small helpers: toasts, overlays, safe try/catch storage
│
├── assets/
│   ├── models/
│   │   ├── product.glb          # optimized GLB (source of truth, <= ~5 MB)
│   │   └── product.usdz         # OPTIONAL hand-exported USDZ for best iOS quality
│   ├── posters/
│   │   └── poster.webp          # shown while the model loads
│   ├── env/
│   │   └── neutral.hdr          # OPTIONAL custom lighting; omit to use "neutral"
│   └── icons/                   # favicon, 192/512 px PWA icons
│
├── vendor/
│   └── model-viewer.min.js      # vendored, version pinned (see Section 4)
│
├── qr/
│   └── qr.png                   # QR code pointing at the deployed URL (print this)
│
├── scripts/
│   └── optimize-model.sh        # gltf-transform commands to compress the model
│
└── .github/
    └── workflows/
        └── deploy.yml           # OPTIONAL: GitHub Pages deploy on push to main
```

### `config/product.json` shape

```json
{
  "name": "Product Name",
  "model": "assets/models/product.glb",
  "iosModel": "assets/models/product.usdz",
  "poster": "assets/posters/poster.webp",
  "ar": { "placement": "floor", "scale": "auto" },
  "camera": { "orbit": "30deg 75deg auto", "minOrbit": "auto 20deg auto", "maxOrbit": "auto 100deg auto" },
  "variants": [
    { "name": "Silver", "color": "#e8e8e8" },
    { "name": "Blue", "color": "#4f8cff" }
  ],
  "hotspots": [
    { "label": "Feature name", "position": "0m 1m 0.2m", "normal": "0m 0m 1m" }
  ]
}
```

`iosModel` is optional. If absent, omit the `ios-src` attribute so `model-viewer` generates the iOS file from the GLB.

## 8. Implementation Phases

Complete and verify each phase before moving to the next.

**Phase 1: 3D viewer.** `index.html`, styles, `viewer.js`, `config/product.json`. Placeholder model is fine (any free GLB, for example from the model-viewer shared assets, then replaced). Done when FR-1 to FR-6 pass in a mobile browser.

**Phase 2: AR launch.** `ar.js`, `mode.js`, mode toggle UI. Done when FR-7 to FR-15 pass on one real Android phone and one real iPhone.

**Phase 3: Event hardening.** Service worker, vendored library, idle reset, error and unsupported states, loading polish. Done when FR-19 and FR-20 pass, including a test with airplane mode after first load.

**Phase 4: Extras (only if time allows).** Variants and hotspots (FR-16 to FR-18), custom lighting, branded look.

**Phase 5: Deploy.** Publish to GitHub Pages, generate the QR code from the live URL, and do a final real-device pass.

## 9. Acceptance Criteria / Test Matrix

Test on real devices. Emulators cannot test AR.

| # | Test | Android Chrome | iPhone Safari | iPhone Chrome |
|---|---|---|---|---|
| 1 | Page loads over HTTPS from QR scan | ☐ | ☐ | ☐ |
| 2 | Model renders, poster shown while loading | ☐ | ☐ | ☐ |
| 3 | Rotate, pinch-zoom, pan work smoothly | ☐ | ☐ | ☐ |
| 4 | Camera limits prevent losing the model | ☐ | ☐ | ☐ |
| 5 | AR button opens native AR viewer | ☐ | ☐ | ☐ |
| 6 | Model places on a table and stays fixed | ☐ | ☐ | ☐ |
| 7 | Walking around shows all angles | ☐ | ☐ | ☐ |
| 8 | Move, rotate, scale gestures work in AR | ☐ | ☐ | ☐ |
| 9 | Closing AR returns to the page cleanly | ☐ | ☐ | ☐ |
| 10 | Works offline after first load | ☐ | ☐ | ☐ |
| 11 | Unsupported device shows friendly message | ☐ | ☐ | n/a |
| 12 | Camera permission denied: no crash, clear message | ☐ | ☐ | ☐ |

Also test on a **matte, textured table** and in **dim lighting**, since those are the most common causes of AR placement failure at venues.

## 10. Out of Scope (do NOT build)

- Custom WebXR/Three.js AR scene, third-party web AR SDKs, or any paid AR service
- Native apps (Unity, Swift, Kotlin, React Native, Flutter)
- Camera-based hand tracking (MediaPipe, etc.)
- Backend, database, accounts, analytics, e-commerce, or payments
- Desktop-specific experience (it only needs to not break)

## 11. Agent Working Rules

1. Keep it dependency-light: no frameworks, no bundler, no npm runtime dependencies. `gltf-transform` is a dev-time CLI only.
2. Wrap every browser-storage access in `try/catch` (private mode and blocked storage throw).
3. Never block the 3D mode on AR support. AR is an enhancement.
4. Keep code small, commented where the reason is non-obvious, and readable on a phone-sized review.
5. Update `README.md` with exact commands for: running locally (`npx serve .`), testing on a phone via an HTTPS tunnel (`cloudflared` or `ngrok`, both free), optimizing the model, and deploying to GitHub Pages.
6. When finished, report what was verified on real devices and what was not.
