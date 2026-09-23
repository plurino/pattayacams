# PattayaCams Master Implementation Plan

**Date:** 2026-09-23
**Status:** Planning only — awaiting user approval before any code changes
**Audience:** 1-person operator (Kieran) + future collaborators
**Goal:** Make PattayaCams a self-maintaining live-streaming aggregator that works forever for free, looks like a Vice City-themed tourist tool, and ranks well in search engines without getting flagged as adult content.

---

## TL;DR

12 user requests. 6 work streams. ~3 weeks of work if done end-to-end. All fully free, no API keys beyond the YouTube Data API v3 key already bound.

**Critical path:** the "site shows 0 live" bug must be fixed FIRST. Root cause: the browser reads a 7-hour-stale `stream_status.json` from Cloudflare Pages' edge cache. Fix: a new Worker `/api/stream-status` route that re-verifies every entity via the YouTube Data API in real-time and returns the verdict. Frontend switches to poll that endpoint as the primary signal. The static JSON becomes a cold-start fallback only.

After that, in any order:
- **A.** UI/UX: back button, trip date, nav crowding, Vice City logo
- **B.** Map: auto day/night, bus routes, rain forecast honesty
- **C.** Content: 5 new venues, admin portal, terms/privacy, SEO

---

## Root cause of the "0 live" bug

**Investigation findings (verified against live data):**

| What | Actual state |
|---|---|
| `stream_status.json` last_write | 2026-09-23T09:33 UTC (cron ran ~7 h ago) |
| Live entities in stream_status.json | **1 entity**, but it's **stale** (`streamer-RS-010: Pattaya Beach Live`) — the streamer no longer exists in `roaming_streamers.json` (RS-010 was removed; file now has RS-001…RS-009, RS-011…RS-016) |
| Stale entities (in status, no longer in source) | 5: `livecam-soi-buakhao-live-cam-ismannen`, `venue-ud-restaurant-shokudo`, `venue-rum-runner-bar`, `streamer-RS-010`, `creator-pattaya-beach-live` |
| Cron behaviour | Running every 15 min on the new peak schedule ✅; YouTube API returning truthful verdicts ✅ |
| Worker `/api/check-live` | Working correctly — tested live, returns `is_live: true` for `Qa5LqU9xxtc` (the actual current live stream for Pattaya Beach Road) |
| **Actual current live streams** (right now) | Very few. It's 23:30 ICT — most Pattaya bars are dark streams late at night. Only 1 of 10 random streams is actually live on YouTube right now. |

**Two real problems:**

1. **Stale `stream_status.json` propagation.** The browser fetches `/data/stream_status.json` every 60 s with cache-bust query param, but Cloudflare Pages caches the static file for ~5 min after a new deploy. Users see the old "1 live (stale)" or "0 live" for several minutes after each cron commit.

2. **The 1 "live" entry is a ghost.** The cron preserves last-known-live state via a circuit breaker (`check_streams.mjs:212-225`), but doesn't clean up entries for entities that have since been removed from the source JSON. The "1 live" entity (`streamer-RS-010`) doesn't exist anymore — it's just stale noise.

**Two additional problems revealed by the investigation:**

3. **The Worker `/api/check-live` is being polled by `useLiveStatusVerify` only for entities currently on screen.** Users on the home view (no specific cam open) don't see fresh verdicts at all.

4. **Cloudflare Pages Cache-Control headers aren't configured for `stream_status.json`.** Every request goes through CDN cache.

---

## Phase 0 — Critical: Fix live status display (MUST SHIP FIRST)

**Effort:** ~3 hours
**Goal:** Site shows current live status within 60 s of any YouTube stream going live.

### Steps

1. **Add `/api/stream-status` route to the Worker** (`proxy/worker.js`).
   - Reads cached status from Worker memory (refresh every 5 min via cron trigger OR on-demand).
   - Falls back to the existing static `/data/stream_status.json` if memory cache is empty (cold start).
   - Re-verifies ALL entities via `batchCheckVideos()` when cache is stale.
   - Returns shape compatible with current `useStreamStatus` hook: `{ last_check, entities }`.
   - Sets `Cache-Control: no-store` so the browser always re-fetches.

2. **Add a scheduled handler to the Worker** (Cloudflare Workers supports this via `wrangler.toml` `[triggers] crons = ["*/5 * * * *"]`).
   - Runs every 5 min, re-verifies all 80 YouTube entities via batched `videos.list` calls.
   - Stores verdicts in Worker memory (clears when Worker restarts — that's fine, cold start triggers re-verification on next browser poll).
   - Estimated quota: 80 entities × 1 batch + 30 RSS discoveries × 1 each = ~110 units per 5 min = 288 runs/day × 110 = 31,680 units/day — **OVER THE FREE TIER.**
   - **Tune:** only re-verify entities currently flagged as live or as recently live. Plus all venues + cams + streamers (62 entities). Plus creators with channel_id. Reduces per-cycle cost to ~70 units.
   - **Quota math with tuning:** 288 runs/day × 70 units = 20,160 units/day — **still over.**
   - **Realistic:** make the Worker scheduled handler poll every 5 min ONLY for entities that were live in the previous cycle (typically <5 entities), plus a lightweight "anything changed in the last 2 hours" check. This brings daily cost to ~500 units + ~1500 units cron-bulk = 2000 units/day. Headroom 5x.

3. **Update `useStreamStatus` hook** (`src/hooks/useStreamStatus.js`).
   - Switch primary fetch from `/data/stream_status.json` to `/api/stream-status` (Worker).
   - Keep the static JSON as fallback only (cold-start if Worker is down).
   - Add a 30 s polling interval (was 60 s).

4. **Update `check_streams.mjs`** to clean up stale entries.
   - Before writing, delete any `nextEntities[key]` where the entity no longer exists in source JSON.
   - This kills the "ghost" RS-010 entry and prevents future drift.

5. **Configure Cloudflare Pages cache** for `/data/stream_status.json`.
   - Add a `_headers` file in `public/` with: `Cache-Control: public, max-age=0, must-revalidate` for `/data/*.json`. Browser still re-fetches but edge cache is bypassed when Worker route is preferred.

**Acceptance:**
- Live stream appears on site within 60 s of going live on YouTube.
- Stale entries auto-clean within 24 h.
- Quota stays under 3,000 units/day (3× headroom).
- Works with zero API key rotations, zero scheduled cron jobs to maintain (Cloudflare handles the cron).

---

## Phase 1 — UI/UX fixes

**Effort:** ~3 hours
**Files touched:** `src/utils/urlState.js`, `src/app/page.jsx`, `src/components/Navbar.jsx`, `src/components/LayerToggleHUD.jsx`, `src/app/globals.css`

### 1.1 Mobile browser back button

**Fix:** switch `replaceState` → `pushState` for drawer-open state, listen for `popstate` to close drawer.
**Files:**
- `src/utils/urlState.js:70` — add `pushStateToUrl(state, { mode: 'push' })` parameter.
- `src/app/page.jsx:247-250` — split the useEffect: drawer-open → push, drawer-close → replace.
- `src/app/page.jsx` — add `useEffect(() => { window.addEventListener('popstate', handleCloseDrawer); … })`.
**Effort:** 30–45 min.

### 1.2 Trip date input overflow on mobile

**Fix:** make the Navbar Trip button icon-only — `[🌴 Nd]` at all breakpoints, never the longer text. Wider text → only inside the modal.
**Files:** `src/components/Navbar.jsx:198-215`
**Effort:** 10 min.

### 1.3 Nav bar crowding at 1024–1280 px

**Fix:** move the Zone selector off the top nav and into the LayerToggleHUD's open panel. Top nav loses ~150–250 px depending on breakpoint. Zone selector appears only on map view (where it's relevant).
**Files:**
- `src/components/Navbar.jsx:132-193` — remove the center zone group.
- `src/components/LayerToggleHUD.jsx` — add Zone popover to the open panel.
- Lift `activeZone` state from Navbar to page.jsx (or a small hook).
**Effort:** 45–60 min.

### 1.4 "Live in Pattaya" bar at bottom

**Investigation finding:** the bottom bar (`RoamingTray.jsx`) is functional, not decorative. It shows currently-broadcasting streamers and is the primary live-content discovery surface outside the map. **Do not remove.**

If the user wants the visible label changed, the minimal change is `RoamingTray.jsx:149-150` "Live in Pattaya" → "Live Now". 5-min rename if explicitly approved.

### 1.5 Vice City-style wordmark

**Fix:** CSS-only wordmark using Anton (Google Font, OFL) + multi-stack `text-shadow` for the black drop shadow + `-webkit-text-stroke` for the pink outline + `transform: skewX(-8deg)` for the italic lean + `paint-order: stroke fill` + custom `vice-pulse` keyframe.
**Files:**
- `src/app/layout.jsx:16-21` — swap `Bricolage_Grotesque` import for `Anton`.
- `tailwind.config.js:29` — update `wordmark` family.
- `src/components/Navbar.jsx:115-120` — rewrite the wordmark JSX.
- `src/app/globals.css` — add `@keyframes vice-pulse` + reduced-motion override.
- Delete `public/images/logo-dark.png`, `logo-mark.png`, `logo.png`.
**IP note:** deliberately NOT using Rage Italic (commercial font, IP risk). The "feel" — pink-stroke italic with black shadow — is achievable with Anton + CSS.
**Effort:** 25–35 min.

---

## Phase 2 — Map improvements

**Effort:** ~5 hours
**Files touched:** `src/components/MapCanvas.jsx`, `src/components/LayerToggleHUD.jsx`, `src/utils/suncalc.js`, `public/data/pattaya_baht_bus.json`, `src/hooks/useRainViewer.js`

### 2.1 Auto day/night map theme (Pattaya-synced)

**Fix:** add `'auto'` third state to `mapTheme`. Auto uses `suncalc.getSunsetStatus(new Date()).isNight` to choose. Re-evaluates every 60 s while in auto. User's manual override persists in `localStorage`.

**Files:**
- `src/components/MapCanvas.jsx:37` — `useState('auto')`.
- `src/components/MapCanvas.jsx:59-72` — accept `'auto'` in localStorage read.
- `src/components/MapCanvas.jsx:105-114` — `handleToggleTheme` cycles `auto → light → dark → auto`.
- Add `useEffect` that re-runs every 60 s when `mapTheme === 'auto'`.
- `src/components/LayerToggleHUD.jsx:154-168` — three-icon toggle.

**Effort:** 1–2 hours.
**Risk:** low; existing `suncalc.js` already proven via TickerBar.

### 2.2 Songthaew bus route geometry fixes

**Pure data edits — no code changes.**

| Route | Issue | Fix |
|---|---|---|
| `buakhao-line` (blue, id `route-buakhao-line`) | Dead-end branch near Soi Chaiyapoon / Soi 19 (red circles 1+2 in screenshot) | Delete coordinate indices 22–34 (the out-and-back loop), keep the junction at `[100.887023, 12.932583]` |
| `buakhao-line` | Endpoint stops ~150 m short of Pattaya Tai intersection (red circle 3) | Add 3 new coordinates between penultimate and final points to reach the intersection |
| `naklua-line` (light blue) | Confusingly close to buakhao-line blue | Change `"color": "#0284C7"` to `"#EAB308"` (brandGold, matches Tailwind palette) |
| `naklua-line` | Sharp diagonal tail at the far end (last 2 coords) | Remove `[100.9065, 12.9745]` and `[100.9055, 12.9738]` |

**Exact coordinate list provided by sub-agent audit (Section 2 of the Map audit).**

**Files:**
- `public/data/pattaya_baht_bus.json` — pure data edits.
- Delete `public/data/pattaya_baht_bus.geojson` (orphan duplicate, imported by nothing).

**Effort:** 20 min for the edits + visual verification.

### 2.3 RainViewer forecast honesty fix

**Fix:** detect when `data.radar.nowcast` is empty, expose `hasForecast` from the hook, and update the LayerToggleHUD timeline to render grey "Forecast Unavailable" + cap the slider at the last live frame.

**Files:**
- `src/hooks/useRainViewer.js:39-47` — add `setHasForecast(nowcast.length > 0)`.
- `src/components/LayerToggleHUD.jsx:362-405` — conditional badge + capped slider.

**Effort:** 20 min.
**Risk:** low; nothing is removed, just honestified.

### 2.4 (Optional) Wind + UV layer

**Spec from sub-agent audit, ranked #1 + #5 by effort/value.**

Single Open-Meteo request extension + new `useWind.js` hook + new `WindLayer.jsx` rendering arrow glyphs every 500 m across Pattaya Bay. Same fetch also returns `uv_index_max` for the TickerBar.

**Effort:** 1 day combined.

---

## Phase 3 — Content: 5 new venues + admin portal

**Effort:** ~2 weeks (admin portal is the heaviest single feature)
**Files touched:** many (new `src/app/admin/*` routes, `src/utils/adminSchemas.js`, Worker admin route)

### 3.1 Add 5 new venues immediately (manual path, no admin yet)

All 5 require operator-side lookups (YouTube Data API for channel_id, Google Maps for lat/lng). Sub-agent audit Section 2.2 has the full table.

**Manually edit `public/data/venues.json`** with:

| Slug | Name | Handle | Channel ID (lookup) | Lat/Lng (manual) |
|---|---|---|---|---|
| `green-stop-cannabis` *(fix existing entry — update handle only)* | Green Stop Cannabis | `@greenstop7377` | lookup required | `12.9382557, 100.8907861` (existing, verify) |
| `cydonia-bar-soi-6` | Cydonia Bar Pattaya Soi 6 | `@CydoniaBarSoi6Pattaya` | lookup required | needs manual pin (~12.942, 100.886) |
| `wild-69-bar` | The Wild 69 Bar | `@TheWild69` | lookup required | needs manual pin |
| `cherry-bar-pattaya` | Cherry Bar Pattaya | `@cherrybarpattaya2396` | lookup required | needs manual pin |
| `sober-bar` | Sober Bar | `@SoberBar` | lookup required | needs manual pin |

**Effort:** 1 hour once operator has the API + Google Maps pins.

### 3.2 Admin portal (Option D — GitHub-backed, Cloudflare Access)

**Sub-agent audit Section 1 has the full design.** Key files:
- New: `src/app/admin/{venues,live-cams,creators,roaming-streamers,import}/page.jsx`
- New: `src/app/admin/components/EntityForm.jsx`, `YoutubeImporter.jsx`
- New: `src/app/admin/lib/schemas.js` (zod), `githubCommit.js` (Worker fetch wrapper)
- Modified: `proxy/worker.js` (add `/api/admin/*` routes), `wrangler.toml` (admin route bindings, secrets)
- Secrets: `ADMIN_GITHUB_TOKEN` (GitHub PAT with `repo` scope, content write), `ADMIN_GITHUB_BRANCH` (default `main`), `ADMIN_GITHUB_REPO` (e.g. `plurino/pattayacams`)
- Cloudflare Access: add `/admin/*` policy with email OTP for operator

**Auth:** Cloudflare Access with email OTP. Free tier covers 50 users; only operator needs allow-list.

**Logo upload:** drag-and-drop → base64 → POST `/api/admin/upload-image` → Worker commits to `public/images/entities/{type}/{slug}.png` via GitHub Contents API. Cache-bust with `?v={commitSha}`.

**Effort:** 5–7 days (most of it is the form UX + YouTube importer).

### 3.3 Venue type icon registry (shared)

**Move** the `category → emoji` switch from `src/components/MapCanvas.jsx:228-240` into a new `src/config/categoryIcons.js`:

```js
export const CATEGORY_ICONS = {
  bar:            { emoji: '🍸', label: 'Bar',           color: '#FF2A6D' },
  beer_bar:       { emoji: '🍺', label: 'Beer Bar',      color: '#F59E0B' },
  sports_bar:     { emoji: '⚽', label: 'Sports Bar',    color: '#22C55E' },
  cocktail_bar:   { emoji: '🍸', label: 'Cocktail Bar',  color: '#A855F7' },
  rooftop_bar:    { emoji: '🌃', label: 'Rooftop Bar',   color: '#6366F1' },
  go_go_bar:      { emoji: '🎤', label: 'Live Music',    color: '#EC4899' },
  lounge:         { emoji: '✨', label: 'Lounge',        color: '#A855F7' },
  club:           { emoji: '🎧', label: 'Nightclub',     color: '#7C3AED' },
  dispensary:     { emoji: '🌿', label: 'Wellness Lounge', color: '#10B981' },  // sanitized display label
  cafe:           { emoji: '☕', label: 'Cafe',          color: '#92400E' },
  restaurant:     { emoji: '🍜', label: 'Restaurant',    color: '#EF4444' },
  restaurant_bar: { emoji: '🍽️', label: 'Kitchen & Bar', color: '#F97316' },
  beach_club:     { emoji: '🏖️', label: 'Beach Club',    color: '#0EA5E9' },
  live_cam:       { emoji: '📹', label: 'Live Cam',      color: '#06B6D4' },
  cctv:           { emoji: '🎥', label: 'CCTV',          color: '#475569' },
  hotel:          { emoji: '🏨', label: 'Hotel',         color: '#0F766E' },
  market:         { emoji: '🛍️', label: 'Market',        color: '#EA580C' },
  attraction:     { emoji: '🎢', label: 'Attraction',    color: '#DB2777' },
  default:        { emoji: '📍', label: 'Venue',         color: '#64748B' },
};
```

**Display-label sanitization:** the JSON `category` stays as-is for filtering/admin purposes; user-facing labels (`map tooltips`, `venue detail page breadcrumb`) come from the registry and sanitise "dispensary" → "Wellness Lounge" to avoid payment-processor/ad-network auto-flagging.

**Effort:** 1 hour + sweep every file that renders the icon.

---

## Phase 4 — SEO + legal

**Effort:** ~2 days for all 12 SEO items + terms/privacy pages.

### 4.1 SEO — prioritized 12-item checklist

| # | Change | File | Effort |
|---|---|---|---|
| 1 | Add `LocalBusiness` JSON-LD with `image` array to `/venues/[slug]` | `src/app/venues/[slug]/page.jsx:75` | 30 min |
| 2 | Add `VideoObject` JSON-LD to venue page | same | 30 min |
| 3 | Per-creator `VideoObject` JSON-LD | `src/app/creators/[slug]/page.jsx:114` | 30 min |
| 4 | Improve `/creators` index metadata (avoid "bars"/"vlogs" wording) | `src/app/creators/page.jsx:7-16` | 15 min |
| 5 | `ItemList` JSON-LD on `/creators` index | new script tag | 30 min |
| 6 | `robots.txt` refinement (add `Disallow: /admin/`) | `public/robots.txt` | 5 min |
| 7 | Add roaming streamers to sitemap (or drop if no public pages) | `src/app/sitemap.js` | 1 hr (optional) |
| 8 | Per-entity OG image (use venue photo as preview) | `src/app/venues/[slug]/page.jsx:48-53` | 1 hr |
| 9 | BreadcrumbList — already present everywhere | — | 0 |
| 10 | Internal linking rail on home page | `src/app/page.jsx:411` | 1 hr |
| 11 | **Per-zone landing pages** (`/zones/soi-buakhao`, etc.) — biggest SEO win | new `src/app/zones/[zone]/page.jsx` | 3-4 hr |
| 12 | Description wording audit (avoid flagged terms in root meta) | `src/app/layout.jsx:25` | 15 min |

**Wording guardrails for SEO + payment-processor safety:** never put `nightlife`, `bar`, `cannabis`, `weed`, `dispensary`, `adult` in `<title>` / `<meta description>` / visible H1. Use `venue`, `destination`, `after-hours`, `wellness lounge`.

### 4.2 Terms of Service page (new)

**Sub-agent audit Section 4.3 has the full paste-ready code.** 10 sections covering: nature of service, no warranty, content attribution/DMCA, third-party links, acceptable use, reporting concerns, operator identity + liability cap, governing law + arbitration, changes, contact.

**Files:**
- New: `src/app/terms/page.jsx`
- Modified: `src/components/SiteFooter.jsx` (add Terms link)

**IP / liability flags (sub-agent §4.5):**
- Operator is described as "a small, independent, non-commercial publishing effort… staffed by a single individual" — deliberately not naming Plurino Ltd to keep the liability shield personal.
- "Plain-language summary" at the bottom is labelled **non-binding** so the strict text prevails in any dispute.
- No SLAs, no resolution timeframes, no commitments.
- Arbitration clause + class-action waiver + jury waiver.

**⚠️ User should run the Terms text past a lawyer before publishing.** Standard caveat; this is a template, not legal advice.

### 4.3 Privacy page expansion

Append 3 new sections to existing `src/app/privacy/page.jsx:144+`:

- **Section 5: Cookies, Local Storage & Browser Data** — explicitly state PattayaCams sets no tracking cookies; only localStorage preferences.
- **Section 6: GDPR / UK GDPR / CCPA rights** — minimal scope because no server-side data is collected.
- **Section 7: Children's Privacy** — age 13+, no intentional collection.

**Effort:** 30 min.

---

## Phase 5 — Free APIs to add (Wind + UV first, AQI second)

**Effort:** 1 day for Wind + UV, 1.5 days for WAQI AQI

### 5.1 Wind arrows + UV badge (1 day, no new keys)

- Extend existing Open-Meteo call in `src/hooks/useTickerData.js:109` to include `current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&daily=uv_index_max,uv_index_clear_sky_max&timezone=Asia%2FBangkok`.
- New `src/hooks/useWind.js` — fetches the wind data every 10 min.
- New `src/components/WindLayer.jsx` — renders arrow glyphs every 500 m across Pattaya Bay (12.92–12.96 lat, 100.87–100.91 lng) using `Leaflet.divIcon` with CSS-rotated triangle + opacity-mapped wind speed.
- UV badge: small chip in TickerBar showing today's UV max with colour tier (green/yellow/orange/red/maroon).

### 5.2 WAQI AQI (1.5 days, requires free token)

- Apply for free token at `aqicn.org/data-platform/token/`.
- Add `WAQI_API_TOKEN` as a Worker secret.
- New Worker route `/api/aqi` (proxy the token).
- New `src/hooks/useAirQuality.js` — polls Worker every 15 min.
- New `src/components/AirQualityLayer.jsx` — colour-coded `Leaflet.circleMarker` at the Pattaya WAQI station.

### 5.3 Deferred (lower value)

- **Pattaya news RSS feed** (1 day) — Thaivisa forum + Pattaya Mail + The Pattaya News. Worker-proxied because most RSS lacks CORS.
- **Tide chart** (2 days) — self-computed NOAA harmonics OR WorldTides free tier (100 calls/day).
- **Pollen** — Open-Meteo doesn't cover Asia. Skip.

---

## Phase 6 — Site-wide polish

**Effort:** 1–2 days

- **Mobile UX:** back button, trip date icon-only (Phase 1) already covers most. Add a 2-tap "drop pin" flow on the mobile map for non-venue entities.
- **Onboarding:** first-time visitor tooltip tour explaining Layers panel, Zone selector, Live Shuffle.
- **Empty states:** if 0 streams are live, the home view should still feel populated — surface "today's most-watched VODs" or "newest creators".
- **Share:** add a `Share` button on every venue/creator page that copies `pattayacams.com/{type}/{slug}/` to clipboard with a toast.
- **404 page:** currently default Next.js. Customise to a tactical "No live feed at this coordinate" map placeholder.

---

## Ship order (final)

| Order | Phase | Why this order |
|---|---|---|
| **1** | **Phase 0: Live status fix** | The site is broken without it. Ship first. |
| 2 | Phase 1.2 Trip date icon-only | Tiny diff, no risk. Improves mobile immediately. |
| 3 | Phase 1.1 Back button | Single-purpose fix, well-bounded. |
| 4 | Phase 1.5 Vice City logo | Visual brand refresh, isolated. |
| 5 | Phase 1.3 Nav crowding | Larger refactor (lift state) — do after the smaller Phase 1 items. |
| 6 | Phase 2.2 Bus routes | Pure data edits. |
| 7 | Phase 2.3 Rain forecast honesty | Tiny UX fix. |
| 8 | Phase 2.1 Auto day/night | Pure UI state change. |
| 9 | Phase 3.1 Add 5 venues (manual) | Data entry only — independent of any code. |
| 10 | Phase 3.3 Venue icon registry | Small shared utility. |
| 11 | Phase 4.3 Privacy expansion | Quick win. |
| 12 | Phase 4.1 SEO items 1–6, 9, 12 | SEO is independent of features. |
| 13 | Phase 4.1 SEO items 7, 8, 10, 11 | Larger SEO wins (per-zone pages, dynamic OG). |
| 14 | Phase 4.2 Terms page | Add legal shield before anything that could attract attention. |
| 15 | Phase 5.1 Wind + UV | High user value, no new keys. |
| 16 | Phase 5.2 WAQI AQI | Medium value, needs free token + Worker route. |
| 17 | Phase 6 Polish | Catch-all for outstanding UX gaps. |
| 18 | **Phase 3.2 Admin portal** | Save for last — biggest single feature, requires Cloudflare Access setup, GitHub PAT, and time to test the auth flow. |

---

## What I need from you to start

**Confirm the plan.** Once you say "proceed", I start with Phase 0 (the live status fix). Each phase gets a separate git commit + push when done, so you can review as we go.

**Open questions (please answer when reviewing):**

1. **"Live in Pattaya" bar at bottom** — do you want me to leave `RoamingTray.jsx` alone (it's functional), or rename the visible label to "Live Now"? (Sub-agent recommended: leave it.)
2. **Terms page — operator identity** — should Section 7 name "Plurino Ltd" as the operating entity, or keep it as "a small independent publishing effort… staffed by a single individual"? (Naming a company gives Stripe/AdSense verification someone to talk to; keeps the liability shield personal.)
3. **Admin portal timing** — do you want this as the last phase (after site is feature-complete), or earlier (so you can use it to add the 5 new venues without manual JSON edits)?
4. **Wind + UV vs AQI** — both are free, both add value. AQI needs a free token (5-min signup at aqicn.org). Wind + UV uses the Open-Meteo call you already have. Which first?

---

## Risks worth flagging

- **Phase 0 success depends on the Cloudflare Worker scheduled handler working.** Workers free tier includes 5 scheduled triggers per Worker — well under. Tested pattern, should be fine.
- **Phase 3.2 admin portal** requires a GitHub PAT with `repo` scope. If the PAT leaks (it's stored as a Worker secret), the attacker can commit to your repo. Mitigation: PAT should be scoped to a single repo with `Contents: Read & write` only, never `admin:org` or `admin:repo_hook`.
- **Phase 4.2 Terms page** is a template, not legal advice. Run it past a lawyer before publishing if this site ever receives revenue, advertising, or business inquiries.
- **Phase 5.2 WAQI AQI** needs a free token. The free tier allows 1,000 calls/day. If the Worker scheduled handler polls too aggressively, it could exceed quota. Mitigation: poll every 30 min, not every 15.
- **All phases** assume the YouTube Data API v3 key stays valid. If Google revokes it (unlikely but possible), the live-status flow falls back to the static JSON (which would be ~15 min stale). The fix path is to re-issue the key and bind it as a Worker secret — 5 minutes of work.

---

## Total effort estimate

| Phase | Days |
|---|---|
| 0 — Live status | 0.5 |
| 1 — UI/UX (4 items) | 0.5 |
| 2 — Map (3 items + optional Wind/UV) | 1 (2 with Wind/UV) |
| 3 — 5 venues + admin portal + icon registry | 7 |
| 4 — SEO + terms/privacy | 1.5 |
| 5 — Free APIs (Wind/UV first, AQI second) | 1.5 |
| 6 — Polish | 1 |
| **Total** | **~13 working days** |

At ~2 hours/day of agent time + your review, this is roughly a **3-week project**. The admin portal alone is half the time.

---

## Validation strategy

After each phase:
- `npm run lint` must pass clean
- `npm run build` must complete (next build → static export to `out/`)
- Worker deploys with `wrangler deploy`
- For UI changes: visual smoke test at desktop + mobile viewport
- For Worker changes: hit `/api/stream-status` (or the new endpoint) and verify the response shape
- For data changes: commit + verify Cloudflare Pages picks up the new build

---

## What this plan does NOT do

- **Real-time AIS marine traffic** — no free datacenter-friendly feed exists (already removed in `2959b7f`).
- **Real-time ADS-B flight data** — no free datacenter-friendly feed exists (already removed in `2959b7f`).
- **Native mobile app** — web-only.
- **Paid advertising / monetization** — explicitly out of scope per user's "non-commercial" stance.
- **Multi-language support** — currently English-only.

---

## Status

- [x] Plan delivered
- [ ] User approval
- [ ] Phase 0 implementation
- [ ] Phases 1–6 implementation (per ship order above)

Tell me when you're ready to proceed and answer the 4 open questions. Once approved, Phase 0 starts immediately.
