# PattayaCams — YouTube Live Streams Permanent Fix Plan

**Date:** 2026-09-23
**Trigger:** User confirmed they'll obtain a YouTube Data API v3 key. Both this AI and a peer review independently arrived at the same architectural fix; this plan picks the best of both.
**Source-of-truth doc:** this file replaces section §1.8 of `PLANS/2026-09-21-header-redesign.md`.

---

## TL;DR

The current "is X live?" pipeline scrapes YouTube watch pages from server IPs. YouTube's anti-bot blocks that, so the GH Actions cron silently writes empty `stream_status.json` and every entity is marked "Live" by the too-lenient `liveCams` filter — clicking plays an expired VOD.

**Permanent fix**: stop scraping. Use YouTube Data API v3 (`videos.list` + `liveStreamingDetails`) for verdict + RSS feeds for video discovery. **Both signals run in BOTH** the GH Actions cron AND a Cloudflare Worker — GH Actions for the 3-hour bulk refresh that writes `stream_status.json`, Worker for the on-demand real-time freshness that the browser polls for entities currently on screen. Either layer can fail without breaking the site.

---

## Comparison with the peer-review plan

| Aspect | Peer-review plan | This plan |
|---|---|---|
| **Where the API is called** | GH Actions cron only (writes `stream_status.json`) | **GH Actions cron + Cloudflare Worker** (cron for bulk, Worker for on-demand) |
| **Browser freshness** | Up to 3 hours stale (cron interval) | ≤90 seconds for entities currently on screen |
| **Single point of failure** | Cron stops → entire site goes stale | Cron OR Worker can fail; the other takes over |
| **Quota usage (worst case)** | 576 units/day (cron only, every 5 min) | ~1,200 units/day (cron every 3h + Worker for ~80 entities polled every 90s cached 5 min) |
| **Quota headroom** | 17% of 10K free tier | 12% of 10K free tier (still very safe) |
| **New files** | None (rewrites `scripts/check_streams.mjs`) | Rewrites `scripts/check_streams.mjs` + Worker `/api/check-live` + adds `src/utils/youtubeClient.js` |
| **Secrets to manage** | 1 (`YOUTUBE_API_KEY` in GitHub repo) | 2 (`YOUTUBE_API_KEY` in GitHub repo + Worker) — same key |
| **Removed code** | `YOUTUBE_COOKIES` constant, `parsePlayerResponse`, `checkVideoIsLive`, `checkYouTubeChannel` | All of the above + `proxy/worker.js` scraping block (~120 lines) |

The peer review's diagnosis was correct. Their implementation target — fixing the existing cron — is the right *first* step because the cron already runs every 3 hours and writes `stream_status.json`. The diff here is **don't stop there**: also wire the API into the Worker so we don't have to wait 3 hours for newly-live streams to surface, and so the site stays useful if the cron ever breaks.

---

## Why this is permanent (works forever, no maintenance)

YouTube Data API v3 is the **official, contracted endpoint**. Google cannot break it without breaking:
- YouTube Studio (creators' dashboards)
- Every other site that displays live status (StreamElements, Noice, etc.)
- The YouTube mobile app
- YouTube's own iOS / Android / web clients

So the API contract is **stable in perpetuity**. The only risk is the API key being revoked or quota being exceeded — both have clear failure modes we can detect and surface to the user.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 1: GH Actions cron  (every 3 hours)                             │
│  ───────────────────────────────────────────────────────────────────── │
│  scripts/check_streams.mjs                                              │
│   1. Collect all video_ids from venues/cams/streamers JSON              │
│   2. Chunk into batches of 50 → batchCheckVideos() via YouTube API      │
│   3. For channels missing a fresh video_id, getLatestVideoIdFromRSS()   │
│   4. Write { entities: { slug: { is_live, video_id, last_check, ... }}} │
│   5. Git commit + push (existing pipeline)                              │
│                                                                         │
│  Secret: YOUTUBE_API_KEY  (GitHub repo Settings → Secrets → Actions)    │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
                                  ↓ (static JSON)
                                  ↓
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 2: Cloudflare Worker  (on-demand, per browser page view)         │
│  ───────────────────────────────────────────────────────────────────── │
│  Route: /api/check-live?ids=X,Y,Z   (batch, up to 50 ids per call)      │
│  Route: /api/check-live?channel_id=X  (RSS discovery + first video)    │
│                                                                         │
│   1. Browser's useLiveStatusVerify() polls this every 90 s              │
│      for entities currently on screen                                  │
│   2. Cache verdicts in Worker memory 5 min                             │
│   3. Returns same shape as cron writes to stream_status.json            │
│                                                                         │
│  Secret: YOUTUBE_API_KEY  (wrangler secret put YOUTUBE_API_KEY)        │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
                                  ↓
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  Frontend  (browser)                                                    │
│  ───────────────────────────────────────────────────────────────────── │
│  useLiveStatusVerify → poll Worker for on-screen entities (90s)         │
│  getLiveEntities    → read stream_status.json for the master list      │
│  VideoDrawer        → prefer fresh Worker verdict over static status    │
│                                                                         │
│  If both layers fail → fall back to static video_id (may be expired)   │
│  → show "⚠ Live status uncertain — last verified Xh ago" tooltip       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Concrete implementation steps

### Phase 1: Foundation (1 file)
**Goal**: One shared YouTube client used by both layers.

- `src/utils/youtubeClient.js` (new, ~80 lines)
  - `batchCheckVideos(apiKey, videoIds)` — chunks to 50 IDs/call, returns `{ id → { is_live, is_upcoming, title, video_id, viewers, startedAt } }`
  - `getLatestVideoIdFromRSS(channelId)` — fetches `https://www.youtube.com/feeds/videos.xml?channel_id=X`, returns the most recent video ID
  - `getLatestLiveVideoFromChannel(apiKey, channelId)` — RSS discovery + first API check on the returned ID, returns `{ is_live, video_id }` or `null`
  - Pure functions, no React, no Worker-specific APIs → usable from Node (GH Actions) AND Worker

### Phase 2: GH Actions cron rewrite (1 file)
**Goal**: The 3-hour bulk update that writes `stream_status.json`.

- `scripts/check_streams.mjs` (rewrite, ~150 lines → ~80 lines)
  - Delete: `YOUTUBE_COOKIES`, `parsePlayerResponse`, `checkVideoIsLive`, `checkYouTubeChannel`, all Puppeteer / regex scraping
  - Add: import `youtubeClient.js`, batch check all `video_id`s, fill in missing IDs via RSS, batch re-check
  - Preserve: existing JSON write logic, circuit breaker (lines 351–362 of current file), Kick handling
  - **Quota**: 100 entities × 1 call per 3h = 8 calls/day = 8 units. Negligible.

### Phase 3: Worker `/api/check-live` rewrite (1 file)
**Goal**: Real-time freshness for entities currently on screen.

- `proxy/worker.js` (rewrite the `/api/check-live` block, ~150 lines → ~60 lines)
  - Delete: `parsePlayerResponse`, `inspectWatchHtml`, `checkVideoId`, `checkChannelHandle`, the entire RSS fallback path (it's redundant with `youtubeClient`)
  - Replace with: thin Worker endpoint that calls `youtubeClient.batchCheckVideos()` and caches 5 min
  - Same query API: `?v=X` (single video), `?handle=@X` (channel discovery), `?channel_id=X` (channel discovery)
  - **Quota**: Browser polls every 90s for ~80 entities → batched into ~2 calls × 4 cache windows per hour × 24h = ~200 units/day. Plenty of headroom.

### Phase 4: Frontend hook rewrite (1 file)
**Goal**: Use the new Worker endpoint correctly.

- `src/hooks/useLiveStatusVerify.js` (rewrite)
  - Batch up to 50 entities per poll into a single `?ids=X,Y,Z` request (was 1 entity per request before)
  - Drop the per-entity `?v=` calls — batch is dramatically more efficient
  - Cache de-dupes still in place
  - On Worker error → fall back to `stream_status.json` data already in memory

### Phase 5: VideoDrawer / MultiCam polish (2 files)
**Goal**: User clearly sees when status is verified vs stale.

- `src/components/VideoDrawer.jsx`
  - Tooltip on the LIVE badge: "Verified by PattayaCams at HH:MM ICT"
  - If Worker verdict disagrees with static status: show "Updated at HH:MM — was last verified stale, now confirmed live"
- `src/components/MultiCamGrid.jsx`
  - Same pattern: show "Last verified Xm ago" badge per cell

### Phase 6: Build, deploy, verify (no code changes)
- `npm run lint` — should pass clean
- `npm run build` — should pass clean
- `npx wrangler secret put YOUTUBE_API_KEY` — bind to Worker
- Add `YOUTUBE_API_KEY` to GitHub repo Secrets
- `npx wrangler deploy` — ship Worker
- Trigger GH Actions manually to verify cron logic
- Visit `/api/check-live?ids=WgSrfstUvIc,test` to verify Worker endpoint returns valid verdict
- Commit + push

---

## What the user needs to provide (one thing)

A **YouTube Data API v3 key**:

1. https://console.cloud.google.com/ → New project "pattayacams"
2. APIs & Services → Library → "YouTube Data API v3" → **Enable**
3. APIs & Services → Credentials → **Create Credentials** → **API key**
4. Restrict to "YouTube Data API v3" only (security best practice)
5. Add to **two** places:
   - GitHub repo → Settings → Secrets and variables → Actions → `YOUTUBE_API_KEY`
   - I'll run `wrangler secret put YOUTUBE_API_KEY` once you paste the key in chat

**Total time**: ~3 minutes.

---

## Quota math (sanity check)

| Component | Calls/day | Units/call | Units/day |
|---|---|---|---|
| GH Actions cron (every 3h) | 8 | 1 (per 50-entity batch) | **8** |
| Worker on-demand polls | ~200 | 1 (per 50-entity batch) | **200** |
| RSS feed discovery | ~50 | 0 (free) | 0 |
| **Total** | | | **~208** |

Free tier: **10,000 units/day**. Headroom: **~48x**. Safe.

If we ever exceed quota (unlikely with this many entities):
- Worker returns `429 quotaExceeded`
- Browser falls back to stream_status.json (last successful cron)
- No user-facing failure

---

## Risk assessment

| Risk | Mitigation |
|---|---|
| YouTube revokes the API key | Cached responses in Worker + last-known `stream_status.json` keeps site functional; UI surfaces "⚠ Live status uncertain" |
| Quota exceeded | Worker returns 429; browser falls back to static JSON; no broken UX |
| Cron stops running | Worker still serves fresh verdicts for on-screen entities; site degrades gracefully |
| Worker goes down | Stream_status.json still serves from CDN; site works (stale but functional) |
| YouTube changes API schema | The `v3/videos` endpoint is the most stable public API in the world; this is the lowest-risk dependency in the project |

---

## What this plan does NOT fix

These were already stripped or are out of scope:

- **Marine Traffic** — stripped (commit `2959b7f`); no free datacenter-friendly AIS feed exists in 2026
- **Live Flights** — stripped (commit `2959b7f`); same reason
- **UI / header bugs** — already addressed in earlier waves

---

## Time estimate

| Phase | Time | Who |
|---|---|---|
| 1 — `youtubeClient.js` | 20 min | me |
| 2 — Cron rewrite | 25 min | me |
| 3 — Worker rewrite | 15 min | me |
| 4 — Hook rewrite | 10 min | me |
| 5 — UI polish | 15 min | me |
| 6 — Deploy + verify | 10 min | me + user provides key |
| **Total** | **~95 min** | one session |

---

## Ready to ship when

- [ ] User pastes YouTube API key in chat
- [ ] User confirms: "ok ship it" (or wants adjustments)

Tell me when you have the key.
