# PattayaCams UX & Header Redesign Plan

**Date:** 2026-09-21
**Scope:** Ticker, Navbar, Map Layers UI, Logo, Quick Share, Mobile responsiveness, Marine Traffic verification, low-effort improvements
**Out of scope (today):** Full redesign of video drawer, multi-cam grid, creator directory, monetisation work.

---

## TL;DR — What's wrong, in one paragraph

The current header stack eats roughly a third of vertical mobile space because the TickerBar unconditionally renders **three** horizontal rows of pill UI (clock/sunset/vibe · weather/PM2.5/swell/FX · weather-radar/ferry/events/hotlines/radio/alerts), the Navbar forces **four** view-mode buttons (Map/Multi/Videos/Creators) plus a Trip countdown and a "Live Radar" pill, and the floating Map Layers panel is always open on desktop with no collapse affordance. On top of that the SceneSelector at `top-3 left-1/2` covers Leaflet's zoom controls on narrow viewports, the `Quick Share` button in the camera drawer currently shares a Google Maps URL instead of a PattayaCams permalink, the marine traffic layer connects directly from the user's browser to a third-party WebSocket with no fallback (high chance of being silently broken), and the PattayaCams logo is a static PNG with no hover affordance. This plan addresses each item directly and adds ten low-effort high-reward wins.

---

## 1. Direct user requests

### 1.1 Restructure `TickerBar` (src/components/TickerBar.jsx) — priority **HIGH**

**Current state:** Three stacked rows on screens `< xl`, two rows on `xl+`, ~13 individual pills with conflicting colour systems (cyan, amber, rose, emerald, indigo, blue, purple, amber-gold).

**Proposed structure (single compact row + overflow menu):**

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🕒 21:16 ICT • 27°C ☁️ • $1=฿33.34                              [ ▾ More ] │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Always-visible "Ambient Status Pill"** (one row, ≤ `h-9`):
  - `21:16 ICT` (clickable → opens existing `WeatherModal`)
  - `27°C ☁️` (clickable → opens existing `WeatherModal`)
  - `$1=฿33.34` (clickable → opens existing `CurrencyConverterModal`)
  - Separator dot between each, low-contrast text (`text-slate-300`), no per-tile colour background. Mono font stays.
- **Right side: `[ ▾ More ]` overflow button** that opens a slide-down popover / bottom sheet listing secondary telemetry:
  - Sunset / Golden Hour
  - PM2.5 + air quality tier
  - Marine swell & rip current
  - Nightlife vibe meter
  - Dry Day alcohol ban alert (already its own component)
  - `Weather Radar`, `Ferry & Tides`, `Events`, `Hotlines` action shortcuts
  - Ambient Radio Player
  - Live Alerts toggle
- On `xl+` screens, expand to two rows again but with **consistent low-contrast treatment** (no `bg-cyan-950/40 border-cyan-600/40` competing palettes — collapse everything to a single `bg-canvas/40 border-borderDark` style and only colour-code the *icon*, not the whole pill).
- Hidden on `vids` view (already handled by being per-layout, but verify).

**Files touched:**
- `src/components/TickerBar.jsx` (full rewrite, keep the same exported props so `page.jsx` doesn't change)
- Add a new file `src/components/TickerOverflowMenu.jsx` if the popover is non-trivial.

**Acceptance:**
- Mobile header height drops from ~90 px (3 rows × 28 px + borders) to ~36 px.
- No competing pill colours in the always-visible row.
- Tapping any ambient chip still opens the right modal.
- All existing tests / call sites (`onOpenKohLarn`, `onOpenEvents`, `onOpenWeather`, `onOpenConverter`, `onOpenEmergency`, `onToggleAlerts`, `hasLiveAlerts`) keep working.

### 1.2 Clean `Navbar` (src/components/Navbar.jsx) — priority **HIGH**

**Current state:** Logo + "Live Radar" pill + (zone nav pills xl-only) + Trip countdown + view switcher (4 coloured buttons).

**Proposed structure:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ PattayaCams  [Zones ▾]              [📅 12d]   Map │ Multi │ Videos │ ✨  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Left:** Wordmark logo (see 1.5) replacing the PNG. Replace the "Live Radar · Active" pill with a tiny status dot + live count, hidden on mobile: `<span class="hidden md:flex items-center gap-1 text-[10px] font-mono"><span class="w-1.5 h-1.5 rounded-full bg-brandPink animate-pulse"/>{activeLiveCount} LIVE</span>`.
- **Centre:** The Tree Town location dropdown stays (moved into contextual position), but uses the same `bg-canvas/60 border-borderDark` low-contrast treatment as the ambient status pill. Drop the xl-only expanded pill row entirely — the dropdown is enough and it's the same dropdown the user is using today.
- **Right:** Trip countdown (keep) + the 4 view buttons, but with **monochrome active state**:
  - Inactive: `text-slate-400 hover:text-white hover:bg-surfaceLight`
  - Active: `bg-surfaceLight text-white border border-borderDark`
  - Drop the cyan / amber / pink / purple gradients. Optional: keep a single subtle coloured dot (e.g. brandPink) inside the icon of the *currently active* view to preserve identity without screaming.

**Files touched:**
- `src/components/Navbar.jsx` (rewrite the view switcher block, ~lines 211-312)
- Drop `FEATURES` reference if it becomes dead code (it already isn't used inside Navbar — the import is dead, remove it).

**Acceptance:**
- View switcher is colour-neutral. Active state is "lifted" not "neon".
- Header on `xl+` is single-row (currently it's logo + Live Radar + zone pills + Trip + 4 view buttons = same row, but cleaner).
- Header on mobile is single-row, ~48 px tall.
- All `useStreamStatus`-driven counts render.

### 1.3 `SiteFooter` cleanup (src/components/SiteFooter.jsx) — priority **HIGH** (easy)

**Current state:** 5 links: Contact Desk · Police 1155 · City Hall CCTV · Creators · Privacy.

**Proposed (per user request):**

```
PattayaCams.com © 2026 • Non-Commercial Tourism Guide & City Transit Radar
                                          Contact · Creators · Privacy
```

- **Drop:** Police 1155, City Hall CCTV.
- **Rename:** "Contact Desk" → "Contact" (also drop the `Desk` from the `title` attr).
- **Keep:** Creators, Privacy.

**Files touched:** `src/components/SiteFooter.jsx` only — small edit.

**Acceptance:** Footer reads cleaner and aligns with the "transit/tourism guide" tone. No external service numbers in the chrome.

### 1.4 Map Layers panel: collapsible on **desktop** too (src/components/LayerToggleHUD.jsx) — priority **HIGH** (small fix)

**Current state:**
- `<sm`: collapsed pill by default, tap → full panel, X to close.
- `>=sm`: panel is **always** shown (`hidden sm:flex`). No collapse button.

**Proposed:** Add a desktop collapse button to mirror mobile behaviour.

- Header of the panel already has a close `X` button (line 198-204) but it's `sm:hidden`. Change to `flex` (always visible).
- When the panel is collapsed on desktop, swap the wide panel for a slim vertical "Layers" pill at the same `bottom-6 left-6` anchor — same look as mobile, larger (`w-12 h-12`).
- Persist collapsed state in `localStorage` (`pattayacams_layers_collapsed`) so it survives reload.
- The existing `isMobileMenuOpen` state already drives the show/hide — rename to `isPanelOpen` and apply to all sizes, not just mobile. Add the desktop pill render path alongside the mobile one.

**Files touched:** `src/components/LayerToggleHUD.jsx` (~lines 161-205).

**Acceptance:**
- A user can collapse the layers panel on desktop and it stays collapsed across page reloads.
- The collapsed pill is the same visual treatment as on mobile, just slightly larger.
- The X button is visible at all sizes when the panel is open.

### 1.5 Wordmark logo (src/components/Navbar.jsx + layout.jsx + tailwind.config.js) — priority **HIGH**

**Current state:** `<img src="/images/logo-dark.png">` PNG, no hover affordance beyond `scale + brightness + drop-shadow`.

**Proposed:** Replace PNG with a typographic wordmark.

- Add a new Google Font to `layout.jsx`. Candidate: **Bricolage Grotesque** (modern, geometric, distinctive, fits "city that never sleeps" energy) or **Space Grotesk** (cleaner, more tech). My recommendation: **Bricolage Grotesque** for the wordmark, keep Inter for body, JetBrains Mono for the chrome.
- Render in Navbar as:
  ```jsx
  <Link href="/" className="group font-[var(--font-wordmark)] text-[22px] sm:text-[26px] font-extrabold tracking-tight leading-none">
    <span className="bg-gradient-to-r from-brandPink via-brandCyan to-brandGold bg-clip-text text-transparent transition-all duration-300 group-hover:bg-[length:200%_200%] group-hover:bg-[position:100%_0] group-hover:drop-shadow-[0_0_18px_rgba(255,42,109,0.5)]">
      PattayaCams
    </span>
    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-brandPink align-middle animate-pulse group-hover:scale-150 group-hover:bg-brandCyan transition-all duration-300"/>
  </Link>
  ```
- On hover: gradient animates, drop-shadow glows pink, the trailing dot scales and changes colour.
- Update `layout.jsx` metadata — `<title>` is fine, but remove reliance on `/images/logo-dark.png` for OG image fallback (OG keeps the JPG).
- Delete `public/images/logo-dark.png`, `public/images/logo-mark.png`, `public/images/logo.png` after the cutover (keep one as a 512×512 fallback for browsers without webfont, optional).

**Files touched:**
- `src/app/layout.jsx` (add font import, attach CSS var `--font-wordmark`)
- `tailwind.config.js` (add `wordmark` family)
- `src/components/Navbar.jsx` (~lines 100-115 — swap `<img>` for wordmark)

**Acceptance:**
- Wordmark renders crisply, gradient visible, hover effect smooth (300ms).
- Lighthouse contrast check still passes on dark background.
- The `title` attribute remains "PattayaCams – The city that never sleeps" for accessibility.

### 1.6 SceneSelector overlapping zoom/rotate on mobile (src/components/MapCanvas.jsx + SceneSelector.jsx) — priority **HIGH** (small fix)

**Current state:** SceneSelector at `top-3 left-1/2 -translate-x-1/2 z-20` with `overflow-x-auto`. On a 320 px-wide phone the strip is ~280 px wide and centered, which means its left edge reaches x ≈ 20 px — right where Leaflet's default `top-left` zoom `+`/`−` buttons live.

**Proposed:**

- Move SceneSelector to **top-right** (`top-3 right-3` or `top-3 left-3`) on mobile; keep `top-3 left-1/2 -translate-x-1/2` on `md+` where there's room.
- Lower it slightly on mobile so it doesn't fight with anything: `top-12 md:top-3`.
- Tighten SceneSelector internals on mobile: drop the "SCENES:" label, shrink icon size, switch from horizontal row to a **horizontal scroll-snap strip** with hidden scrollbar.
- Add `flex-shrink: 0` on each button (already there via `shrink-0`) and `min-w-[64px]` to ensure tap targets are ≥ 44 px tall.
- Consider a "compact mode" toggle: tap the strip header to expand into a vertical card list on mobile.

**Files touched:**
- `src/components/MapCanvas.jsx` (~line 904 wrapper div)
- `src/components/SceneSelector.jsx` (smaller mobile styles)

**Acceptance:**
- Tap targets for all four scenes ≥ 44 px tall.
- Zoom controls (`+`/`−`) and the rotation compass (`top-24 right-3`) are not obscured at any width ≥ 320 px.
- Strip still scroll-snaps on overflow.

### 1.7 Quick Share button — link to PattayaCams, not Google Maps (src/components/VideoDrawer.jsx) — priority **HIGH** (one-line fix)

**Current bug:** `onClick={() => handleNativeShare(googleMapsUrl)}` at VideoDrawer.jsx:463. This passes the Google Maps URL to the share dialog, so tapping "Quick Share" shares `https://www.google.com/maps/...` instead of a PattayaCams permalink.

**Fix:**
- Construct a PattayaCams share URL (using the existing `permalink` variable defined at line 137-139: `/cams/${slug}`, `/creators/${slug}`, or `/venues/${slug}`).
- Use absolute URL: `${window.location.origin}${permalink}`.
- Pass that to `handleNativeShare` instead of `googleMapsUrl`.

```jsx
const pattayaCamsShareUrl = typeof window !== 'undefined'
  ? `${window.location.origin}${permalink}`
  : permalink;

onClick={() => handleNativeShare(pattayaCamsShareUrl)}
```

**Files touched:** `src/components/VideoDrawer.jsx` line 463 only.

**Acceptance:**
- Native `navigator.share()` on iOS/Android gets a `pattayacams.com/cams/{slug}` URL.
- Clipboard fallback copies the same URL.
- Web Share API text and title still reflect the entity name.
- Test on: Tree Town Market, Soi 6 cam, a CCTV cam (verify `/cams/` permalink works), a creator.

### 1.8 Marine Traffic — verify and add fallback (src/hooks/useMarineTraffic.js + proxy) — priority **HIGH** (investigation + small fix)

**Current state:** `useMarineTraffic.js` opens a WebSocket **directly from the browser** to `wss://stream.aisstream.io/v0/stream` using a hardcoded API key. There is **no fallback** if the connection fails, the key is rate-limited, the browser blocks the WebSocket, or the bbox yields zero vessels.

**Verification checklist (do first, before any code change):**
1. Open the deployed site, enable the "Marine Traffic" layer in the Layers panel, watch the Layers HUD counter (`marineCount`). Does it increment past 0?
2. Open DevTools → Network → WS. Is the WebSocket to `stream.aisstream.io` connecting? Any 401 / 429?
3. Tail the browser console for any unhandled rejection from `useMarineTraffic`.
4. Inspect the bbox: `[[12.40, 100.50], [13.40, 101.20]]`. That's correct for Pattaya Bay → Sattahip corridor. Should yield traffic.
5. Check the free-tier rate limit on `aisstream.io` — if it's been throttled, the socket will open but stay silent.

**If the layer is broken, fix:**

- **Add a Cloudflare Worker fallback** mirroring the flight radar pattern (`useLiveFlights.js:25-31`):
  - Worker route: `https://pattayacams.plurinoltd.workers.dev/api/marine`
  - Worker polls `aisstream.io` server-side (Workers support WebSockets) and returns a JSON snapshot of the current vessel list for the same bbox.
  - Browser hook tries the Worker first with 5s timeout, falls back to a local `/data/marine_vessels.json` snapshot (regenerated nightly by a GitHub Action).
- **Expose connection health to UI:** if `isConnected === false` for > 30s while `showMarine === true`, show a small "⚠ Marine radar offline" pill inside the Layers panel next to the Marine toggle so users know the layer isn't producing data.

**Files touched (if broken):**
- `src/hooks/useMarineTraffic.js` — add Worker-first fetch with local fallback.
- `proxy/` or new `marine-proxy/` Worker.
- `src/components/LayerToggleHUD.jsx` — small offline indicator next to the Marine toggle.
- New `public/data/marine_vessels.json` (empty array initially; populated by the Worker/GH Action).

**Acceptance:**
- On a clean dev session, toggling Marine in the Layers panel shows vessels within 10 seconds.
- If the upstream is down, the layer still shows "last known" vessels from the snapshot and an offline pill.
- No API key is committed to git (the current hardcoded key should be rotated if it was ever pushed).

---

## 2. Top 10 low-effort high-reward improvements

These are independent of the user's direct asks. Each is small enough to ship in a single PR.

### #1 — Persist map layer toggles across reloads
**Effort:** ~30 min
**Why:** Currently `showVenues`, `showRadar`, `showMarine` etc. all default to `true` on every page load (in `MapCanvas.jsx:36-38`). Power users who turn off Venues lose that preference on refresh. Add a `useEffect` that hydrates from `localStorage.pattayacams_layer_state` and writes back on change.
**Files:** `src/components/MapCanvas.jsx`.

### #2 — Quiet the Leaflet attribution + move zoom controls to bottom-right on mobile
**Effort:** ~20 min
**Why:** Default Leaflet zoom sits `top-left` (collides with the SceneSelector on mobile — see §1.6). Set `zoomControl: false` in map options and add an explicit `L.control.zoom({ position: 'bottomright' })` so it lives next to the Layers panel on mobile and stays out of the SceneSelector's way.
**Files:** `src/components/MapCanvas.jsx` (map init + cleanup).

### #3 — Make the "Live Shuffle" reposition when *any* bottom-left control is open, not only when a drawer is open
**Effort:** ~10 min
**Why:** Today in `page.jsx:404-408` the Shuffle button moves to `left-4 sm:left-6` only when a video drawer is open. On mobile, when the Layers panel opens, the Shuffle sits on top of it. Move it to `left-4` whenever Layers panel is expanded (could expose this via a shared context).
**Files:** `src/app/page.jsx` + new lightweight `UiContext`.

### #4 — Add a `<noscript>` fallback for the map view
**Effort:** ~15 min
**Why:** `MapCanvas.jsx` is a `dynamic(..., { ssr: false })` import. Users with JS disabled see nothing. Add a small `noscript` block in `layout.jsx` (or `page.jsx`) that lists the active venues/cams as plain `<a>` links.
**Files:** `src/app/page.jsx` (small `<noscript>` block at the top of `<main>`).

### #5 — "Tap to open" indicator for the Live Shuffle when 0 streams live
**Effort:** ~10 min
**Why:** When `activeLiveCount === 0` the button is rendered disabled and greyed out (page.jsx:423-435). It would be friendlier to render a tooltip-style helper: "Next live stream expected ~21:00 ICT" computed from the nightlife vibe logic.
**Files:** `src/app/page.jsx`.

### #6 — Add `prefers-reduced-motion` respect across animations
**Effort:** ~30 min
**Why:** Several animations (radar sweep, dash-flow on transit lines, neon pulse on markers) run unconditionally. Wrap them in `@media (prefers-reduced-motion: reduce)` in `globals.css` to disable animation for users who request it.
**Files:** `src/app/globals.css`.

### #7 — Replace the hardcoded `AISSTREAM_API_KEY` with a Cloudflare Worker proxy
**Effort:** ~1 hr
**Why:** Already in scope of §1.8 if the marine layer is broken, but even if it's working, shipping a free-tier key in client JS is a leak. Move it to a Worker and rotate the existing key.
**Files:** `src/hooks/useMarineTraffic.js`, new Worker.

### #8 — Lazy-load the `useTickerData` poll
**Effort:** ~20 min
**Why:** `useTickerData` polls every minute and renders even when the page is in the background. Add a `document.visibilityState === 'visible'` guard.
**Files:** `src/hooks/useTickerData.js`.

### #9 — Add a manifest + install-prompt banner
**Effort:** ~30 min
**Why:** `layout.jsx` declares `manifest: '/manifest.json'` but no `manifest.json` exists at `public/`. Add a real PWA manifest (name, icons, theme colour `#FF2A6D`, background `#0B0F17`, start_url `/`) and a tiny install-prompt component that surfaces once per user.
**Files:** `public/manifest.json` (new), new `src/components/InstallPrompt.jsx`, wire into `page.jsx`.

### #10 — Per-cam "city portal" CTA copy fix
**Effort:** ~5 min
**Why:** `VideoDrawer.jsx:206` says "Open City CCTV Portal" — user wants to be taken to `livestream.pattaya.go.th`. The link works, but the section title at line ~190 still says "Open YouTube Channel" for `cctv` entities in some branches. Audit the entity-type-aware copy paths and standardise on `Open Pattaya City Portal` for CCTV.
**Files:** `src/components/VideoDrawer.jsx`.

---

## 3. Suggested implementation order

Each phase is independently shippable behind a feature flag if you want to be cautious.

| Phase | Items                                                  | Risk    | Notes                                                              |
| ----- | ------------------------------------------------------ | ------- | ------------------------------------------------------------------ |
| 1     | §1.3 Footer cleanup, §1.7 Quick Share fix, #10 copy    | None    | Tiny edits, ship today.                                            |
| 2     | §1.6 SceneSelector mobile positioning, #2 zoom controls | Low     | Pure CSS / Leaflet option changes.                                 |
| 3     | §1.4 Layers panel collapsible on desktop, #1 layer persist | Low   | One component, one localStorage hook.                              |
| 4     | §1.5 Wordmark logo                                     | Low     | Add font, swap markup, optional PNG delete.                        |
| 5     | §1.8 Marine Traffic verification + Worker fallback     | Medium  | Requires Worker deploy + key rotation; might need DNS / domain.    |
| 6     | §1.1 TickerBar restructure                             | Medium  | Largest UI change, needs design pass on the overflow popover.      |
| 7     | §1.2 Navbar cleanup                                    | Medium  | Drop the neon gradients; might require user feedback before commit. |
| 8     | #3–#9 polish                                           | Low     | Independent; pick as time allows.                                  |

---

## 4. Open questions for the user

1. **Wordmark font:** Bricolage Grotesque (my pick) vs Space Grotesk vs something else? Default = Bricolage Grotesque.
2. **Marine Traffic fallback:** If the verification step shows the WebSocket *is* working, do you still want me to migrate to a Worker for key hygiene? Or only fix if it's broken?
3. **View switcher colour treatment:** Drop the neon gradients entirely (my pick) or keep them but desaturated to muted tones?
4. **TickerBar overflow:** Slide-down popover (desktop) + bottom sheet (mobile) — both from a single component? Or two separate components?
5. **Quick Share on map popup vs drawer:** The current "Quick Share" lives inside `VideoDrawer`. Are there also Leaflet popups (not yet implemented) on the map itself that should get a Share button, or is the drawer the only entry point?