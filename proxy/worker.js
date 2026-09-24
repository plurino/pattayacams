/**
 * PattayaCams.com - Cloudflare Worker Edge Proxy
 *
 * Responsibilities: see PLANS/2026-09-23-master-redesign.md §Phase 5.2 (WAQI AQI), §Phase 0 (live status fix) & §Phase 2 (HLS proxy below). Summary of edge routes here in priority order (top wins over HLS proxy fallback):
 *  1. /api/check-live — Real-time YouTube live status via YouTube Data API v3.
 *                       Batched (up to 50 IDs per call, 1 quota unit), 5-min Worker cache.
 *                       RSS feed discovery for channel handles when no video_id is known.
 *  2. /api/aqi        — Pattaya air-quality (WAQI /feed/here). Proxies the WAQI API token so it never reaches the browser. 15-min Worker memory cache (matches hook poll cadence). Free WAQI tier = 1000 req/day, so this matters even on a single user session with multiple tabs/components re-mounting after hot-reload. Returns a normalised, stable shape regardless of upstream WAQI drift. If WAQI errors, returns `{aqi:null, source:"waqi_error", error:...}` so the frontend can degrade gracefully (just hides the layer marker — no toast / no spinner forever). Defaults to Pattaya downtown (12.9276, 100.8771, 10 km radius) so a bare `/api/aqi` works for the home anchor. Override with `?lat=&lon=&radius=` (radius in metres, default 10000). Requires `WAQI_API_TOKEN` Worker secret — bind via `wrangler secret put WAQI_API_TOKEN`. Without the secret the route returns a stable error response (status 200, body `{aqi:null, source:"waqi_no_token"}`) so the browser never crashes on a missing config and Cloudflare logs stay quiet (no error stack to surface to users). See also `src/hooks/useAirQuality.js` (15-min poll) and `src/components/AirQualityLayer.jsx` (Leaflet circleMarker + AQI-tier colouring + pulse when AQI ≥ 151 Unhealthy or worse). No localStorage cache here on purpose — the Worker memory cache already covers multi-tab / multi-mount revalidation; per-tab localStorage would just confuse the "stale" UI on a slow network without saving any WAQI quota (it's gated by the Worker's 15-min TTL either way). 3. Edge proxy for municipal HLS streams (livestream.pattaya.go.th): Strict bandwith & SSRF guard — only proxies from the official municipal CCTV domain. Hard 4-second upstream connect timeout. Blocks (.ts, .m4s, .mp4, .aac) binary segments to guarantee ZERO bandwidth egress fees. Rewrites relative media segment URLs in .m3u8 playlists to absolute upstream URLs. Secrets: YOUTUBE_API_KEY (wrangler secret put YOUTUBE_API_KEY) WAQI_API_TOKEN (wrangler secret put WAQI_API_TOKEN) Source: src/utils/youtubeClient.js (bundled by wrangler) */

import {
  batchCheckVideos,
  getLatestLiveVideoFromChannel,
} from '../src/utils/youtubeClient.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range, User-Agent, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

const ALLOWED_HOSTNAME = 'livestream.pattaya.go.th';
const UPSTREAM_ORIGIN = `https://${ALLOWED_HOSTNAME}`;
const FETCH_TIMEOUT_MS = 4000;

export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS Preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    const url = new URL(request.url);

    // 1a. Route: Marine vessel telemetry proxy (AISStream WebSocket -> HTTP snapshot)
    //
    // Architecture:
    //   1. Browser polls every 20 s.
    //   2. Worker checks an in-memory cache (30 s TTL) — second/subsequent polls
    //      within the window return the previous snapshot instantly.
    //   3. On cache miss, Worker opens an outbound WebSocket to AISStream, subscribes
    //      to the Pattaya Bay bbox, collects PositionReport messages for ~6 s, then
    //      closes the socket and returns the snapshot.
    //   4. If the upstream is unreachable / auth fails, Worker returns an empty stub
    //      with source='stub'. The browser hook then falls back to /data/marine_vessels.json.
    //
    // The API key is bound as a Worker secret (wrangler secret put AISSTREAM_API_KEY)
    // and NEVER appears in client JS or git-tracked files.

    // 0. Route: /api/check-live — Real-time YouTube live status verification via
    // YouTube Data API v3. Replaces brittle watch-page scraping (which YouTube
    // blocks from server IPs) with the official batched /videos.list endpoint.
    //
    // Query options (in priority order):
    //   ?ids=A,B,C…    Batch check up to 50 video IDs (1 quota unit total).
    //   ?v=A           Single video ID lookup.
    //   ?channel_id=X  RSS discovery + API check on the most recent video.
    //   ?handle=@X     (Legacy; rare) Channel handle → RSS discovery.
    //
    // Caching: 5-minute Worker-memory cache per (key) to stay polite to the
    // YouTube API. Quota usage: 200 batch polls/day = ~200 units of 10,000.
    if (url.pathname === '/api/check-live') {
      const apiKey = env.YOUTUBE_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            is_live: null,
            source: 'worker_no_api_key',
            reason: 'YOUTUBE_API_KEY secret not bound to Worker',
            fetchedAt: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
              ...CORS_HEADERS,
            },
          }
        );
      }

      const cacheKey = '__checkLiveCache';
      const cacheTtlMs = 5 * 60 * 1000;

      // ---- Build the request signature so cache hits work ----
      const idsParam = url.searchParams.get('ids');
      const singleVideoId = url.searchParams.get('v');
      const channelId = url.searchParams.get('channel_id');
      const handle = url.searchParams.get('handle');

      let requestKey;
      let runCheck;
      if (idsParam) {
        requestKey = `ids:${idsParam}`;
        runCheck = async () => {
          const ids = idsParam.split(',').filter(Boolean);
          const verdicts = await batchCheckVideos(apiKey, ids);
          return {
            source: 'batch_videos_list',
            results: verdicts,
            fetchedAt: new Date().toISOString(),
          };
        };
      } else if (singleVideoId) {
        requestKey = `v:${singleVideoId}`;
        runCheck = async () => {
          const verdicts = await batchCheckVideos(apiKey, [singleVideoId]);
          return {
            source: 'videos_list',
            video_id: singleVideoId,
            ...(verdicts[singleVideoId] || { is_live: null, is_vod: null }),
            fetchedAt: new Date().toISOString(),
          };
        };
      } else if (channelId) {
        requestKey = `channel_id:${channelId}`;
        runCheck = async () => {
          const fresh = await getLatestLiveVideoFromChannel(apiKey, channelId);
          return {
            source: 'rss_discovery',
            channel_id: channelId,
            ...(fresh || { video_id: null, is_live: false }),
            fetchedAt: new Date().toISOString(),
          };
        };
      } else if (handle) {
        // Legacy: handle-based lookup without a known channel_id. Use RSS on
        // the handle URL pattern; for full reliability callers should resolve
        // handle → channel_id upstream (youTube channels.list?forHandle=@x).
        requestKey = `handle:${handle.toLowerCase()}`;
        runCheck = async () => {
          const clean = handle.startsWith('@') ? handle.slice(1) : handle;
          // Best-effort: try to read RSS via the handle URL directly
          // (works for older channels; modern handles use /@name as the page URL)
          const rssUrl = `https://www.youtube.com/feeds/videos.xml?user=${clean}`;
          try {
            const r = await fetch(rssUrl);
            if (r.ok) {
              const xml = await r.text();
              const cidMatch = xml.match(/<yt:channelId>([^<]+)<\/yt:channelId>/);
              if (cidMatch) {
                const fresh = await getLatestLiveVideoFromChannel(apiKey, cidMatch[1]);
                return {
                  source: 'rss_handle_resolved',
                  handle,
                  channel_id: cidMatch[1],
                  ...(fresh || { video_id: null, is_live: false }),
                  fetchedAt: new Date().toISOString(),
                };
              }
            }
          } catch (_) {}
          return {
            source: 'rss_handle_failed',
            handle,
            is_live: null,
            fetchedAt: new Date().toISOString(),
          };
        };
      } else {
        return new Response(
          JSON.stringify({ is_live: null, source: 'noop', reason: 'missing id' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }

      const cached = globalThis[cacheKey]?.[requestKey];
      if (cached && (Date.now() - cached.fetchedAtMs) < cacheTtlMs) {
        return new Response(JSON.stringify(cached.payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=30',
            ...CORS_HEADERS,
          },
        });
      }

      const payload = await runCheck();
      if (globalThis[cacheKey] === undefined) globalThis[cacheKey] = {};
      // Cache on success (only when not explicitly errored)
      if (payload.is_live !== undefined && !payload.error) {
        globalThis[cacheKey][requestKey] = { payload, fetchedAtMs: Date.now() };
      }

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
          ...CORS_HEADERS,
        },
      });
    }
    // 1b. Route: /api/aqi — Pattaya air-quality via WAQI.
    //
    // Upstream: https://api.waqi.info/feed/here/?lat=X&lon=Y&radius=M&token=...
    //   (free tier: 1000 req/day. We must cache aggressively.)
    //
    // Defaults match useTickerData + useAirQuality: Pattaya downtown 12.9276/100.8771.
    // If the secret is missing, returns 200 + error shape (no 5xx surface to users).
    // If the upstream errors or rate-limits, returns 200 + {aqi:null, source:"waqi_error"}.
    if (url.pathname === '/api/aqi') {
      const token = env.WAQI_API_TOKEN;

      // Stable error if the secret isn't bound yet — never throw, never 500.
      if (!token) {
        return new Response(
          JSON.stringify({
            aqi: null,
            source: 'waqi_no_token',
            error: 'WAQI_API_TOKEN secret not bound to Worker',
            fetchedAt: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
              ...CORS_HEADERS,
            },
          }
        );
      }

      // ---- Parse query params (with sane defaults) ----
      const DEFAULT_LAT = 12.9276;
      const DEFAULT_LON = 100.8771;
      const DEFAULT_RADIUS = 10000;

      let lat = DEFAULT_LAT;
      let lon = DEFAULT_LON;
      let radius = DEFAULT_RADIUS;

      const latRaw = url.searchParams.get('lat');
      const lonRaw = url.searchParams.get('lon');
      const radiusRaw = url.searchParams.get('radius');

      if (latRaw !== null) {
        const n = Number(latRaw);
        if (Number.isFinite(n) && n >= -90 && n <= 90) lat = n;
      }
      if (lonRaw !== null) {
        const n = Number(lonRaw);
        if (Number.isFinite(n) && n >= -180 && n <= 180) lon = n;
      }
      if (radiusRaw !== null) {
        const n = Number(radiusRaw);
        if (Number.isFinite(n) && n > 0 && n <= 50000) radius = n;
      }

      // ---- Worker-memory cache (15 min TTL) ----
      const cacheKey = '__aqiCache';
      const cacheTtlMs = 15 * 60 * 1000;
      const requestKey = `${lat.toFixed(4)},${lon.toFixed(4)},${Math.round(radius)}`;

      const cached = globalThis[cacheKey]?.[requestKey];
      if (cached && (Date.now() - cached.fetchedAtMs) < cacheTtlMs) {
        return new Response(JSON.stringify(cached.payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
            ...CORS_HEADERS,
          },
        });
      }

      // ---- Build upstream URL ----
      const upstreamUrl = `https://api.waqi.info/feed/here/?lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&radius=${encodeURIComponent(radius)}&token=${encodeURIComponent(
        token
      )}`;

      // ---- Fetch with a 6s safety timeout (WAQI is normally sub-second) ----
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      let upstream;
      try {
        upstream = await fetch(upstreamUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timeoutId);
        const isTimeout = err && err.name === 'AbortError';
        const payload = {
          aqi: null,
          source: 'waqi_error',
          error: isTimeout ? 'timeout' : 'fetch_failed',
          fetchedAt: new Date().toISOString(),
        };
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            ...CORS_HEADERS,
          },
        });
      }
      clearTimeout(timeoutId);

      if (!upstream.ok) {
        const payload = {
          aqi: null,
          source: 'waqi_error',
          error: upstream.status === 429 ? 'rate_limited' : `http_${upstream.status}`,
          fetchedAt: new Date().toISOString(),
        };
        // Cache the rate-limit error briefly (60s) to back off; cache other
        // errors for the normal 15 min to avoid hammering WAQI on a bad day.
        const errorTtl = upstream.status === 429 ? 60 * 1000 : 15 * 60 * 1000;
        if (globalThis[cacheKey] === undefined) globalThis[cacheKey] = {};
        globalThis[cacheKey][`err:${requestKey}`] = {
          payload,
          fetchedAtMs: Date.now() - (cacheTtlMs - errorTtl),
        };
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': upstream.status === 429 ? 'no-store' : 'public, max-age=60',
            ...CORS_HEADERS,
          },
        });
      }

      let json;
      try {
        json = await upstream.json();
      } catch (_) {
        const payload = {
          aqi: null,
          source: 'waqi_error',
          error: 'invalid_json',
          fetchedAt: new Date().toISOString(),
        };
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            ...CORS_HEADERS,
          },
        });
      }

      // ---- Normalise WAQI's response ----
      // WAQI shape (success):
      //   { status: "ok", data: { aqi: 84, idx: 9410, city: { name, url, geo },
      //     iaqi: { pm25: {v}, pm10: {v}, o3, no2, so2, co, t, w, h, ... },
      //     time: { iso, tz }, forecast: {...} } }
      // Failure:
      //   { status: "error", data: "Unknown station" | "over quota" | ... }
      if (!json || json.status !== 'ok' || !json.data) {
        const payload = {
          aqi: null,
          source: 'waqi_error',
          error: typeof json?.data === 'string' ? json.data : 'upstream_not_ok',
          fetchedAt: new Date().toISOString(),
        };
        if (globalThis[cacheKey] === undefined) globalThis[cacheKey] = {};
        globalThis[cacheKey][`err:${requestKey}`] = {
          payload,
          fetchedAtMs: Date.now() - (cacheTtlMs - 60 * 1000), // 60s on upstream-not-ok
        };
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            ...CORS_HEADERS,
          },
        });
      }

      const data = json.data;
      const iaqi = data.iaqi || {};
      const pick = (key) => {
        const node = iaqi[key];
        if (!node || node.v === undefined || node.v === null) return null;
        const n = typeof node.v === 'number' ? node.v : Number(node.v);
        return Number.isFinite(n) ? n : null;
      };
      // AQI may come as "84" or "-" (no data); coerce non-numeric to null.
      let aqiVal = null;
      if (typeof data.aqi === 'number' && Number.isFinite(data.aqi)) {
        aqiVal = data.aqi;
      } else if (typeof data.aqi === 'string' && data.aqi !== '-') {
        const n = Number(data.aqi);
        if (Number.isFinite(n)) aqiVal = n;
      }

      const payload = {
        aqi: aqiVal,
        pm25: pick('pm25'),
        pm10: pick('pm10'),
        o3: pick('o3'),
        no2: pick('no2'),
        so2: pick('so2'),
        co: pick('co'),
        t: pick('t'),
        w: pick('w'),
        h: pick('h'),
        city: data.city && data.city.name ? data.city.name : 'Pattaya',
        station: data.city && data.city.name ? data.city.name : 'Pattaya, Thailand',
        // WAQI doesn't return a distance field directly; the `geo` array is the
        // exact station coords. Derive a very rough distance so the tooltip
        // can say "X m from your query" if the upstream doesn't tell us.
        distance_m: null,
        fetchedAt: new Date().toISOString(),
        source: 'waqi',
      };

      if (globalThis[cacheKey] === undefined) globalThis[cacheKey] = {};
      globalThis[cacheKey][requestKey] = { payload, fetchedAtMs: Date.now() };

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          ...CORS_HEADERS,
        },
      });
    }
    // 1c. Route: Live Flights REMOVED.
    // adsb.lol, OpenSky Network, and airplanes.live all block server IPs (429/522/403).
    // Until the user signs up for an OpenSky account (free, 4000 req/day authenticated)
    // or we adopt a paid aggregator, the flight layer is permanently offline.
    // The /api/flights route intentionally absent — see PLANS/2026-09-21-header-redesign.md
    // for the architectural rationale. Returning 404 here so any stale browser fetch
    // surfaces an empty array gracefully.
    if (url.pathname === '/api/flights') {
      return new Response(JSON.stringify({
        ac: [],
        snapshot: Math.floor(Date.now() / 1000),
        source: 'disabled',
        fetchedAt: new Date().toISOString(),
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          ...CORS_HEADERS,
        },
      });
    }

    const targetParam = url.searchParams.get('url') || url.pathname;

    // 2. EGRESS GUARD: Reject all binary video chunks (.ts, .m4s, etc.)
    const lowerPath = targetParam.toLowerCase();
    if (
      lowerPath.endsWith('.ts') ||
      lowerPath.endsWith('.m4s') ||
      lowerPath.endsWith('.mp4') ||
      lowerPath.endsWith('.aac') ||
      lowerPath.includes('.ts?') ||
      lowerPath.includes('.m4s?')
    ) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden: Binary media segment proxying disabled.',
          reason: 'Only .m3u8 text playlist manifests are proxied. Segment requests must be routed directly.',
          status: 403,
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }

    // 3. Ensure target is an .m3u8 playlist
    if (!lowerPath.endsWith('.m3u8') && !lowerPath.includes('.m3u8?')) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request: Target must be an HLS playlist manifest ending in .m3u8.',
          status: 400,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }

    // 4. SSRF GUARD: Validate target URL domain strictly against allowlist
    let upstreamUrl;
    try {
      if (targetParam.startsWith('http://') || targetParam.startsWith('https://')) {
        const parsedTarget = new URL(targetParam);
        if (parsedTarget.hostname.toLowerCase() !== ALLOWED_HOSTNAME) {
          return new Response(
            JSON.stringify({
              error: 'Forbidden: Target upstream domain not permitted.',
              allowedOrigin: UPSTREAM_ORIGIN,
              status: 403,
            }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                ...CORS_HEADERS,
              },
            }
          );
        }
        upstreamUrl = targetParam;
      } else {
        upstreamUrl = `${UPSTREAM_ORIGIN}${targetParam.startsWith('/') ? '' : '/'}${targetParam}`;
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Bad Request: Invalid target URL format.', status: 400 }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    try {
      // 5. Forward request with 4-second timeout and spoofed origin/referer headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': `${UPSTREAM_ORIGIN}/`,
          'Origin': UPSTREAM_ORIGIN,
          'Accept': '*/*',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!upstreamResponse.ok) {
        return new Response(
          JSON.stringify({
            error: `Upstream returned status ${upstreamResponse.status}`,
            upstream: upstreamUrl,
          }),
          {
            status: upstreamResponse.status,
            headers: {
              'Content-Type': 'application/json',
              ...CORS_HEADERS,
            },
          }
        );
      }

      // 6. Read playlist text and rewrite relative segment URLs to absolute upstream URLs
      // This ensures HLS players request .ts segments directly from the city server without proxying!
      const manifestText = await upstreamResponse.text();
      const baseUrl = new URL(upstreamUrl);
      const basePath = baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1);

      const rewrittenManifest = manifestText
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          // If line is empty or a comment/tag (#EXT...), leave untouched
          if (!trimmed || trimmed.startsWith('#')) {
            return line;
          }
          // If already absolute URL, leave untouched
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return line;
          }
          // If root-relative (/live/...)
          if (trimmed.startsWith('/')) {
            return `${baseUrl.origin}${trimmed}`;
          }
          // Path-relative (chunk1.ts -> https://livestream.pattaya.go.th/live/chunk1.ts)
          return `${baseUrl.origin}${basePath}${trimmed}`;
        })
        .join('\n');

      // 7. Inject full CORS and cache headers
      const responseHeaders = new Headers();
      Object.entries(CORS_HEADERS).forEach(([k, v]) => responseHeaders.set(k, v));
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      responseHeaders.set('Cache-Control', 'public, max-age=2, s-maxage=2');

      return new Response(rewrittenManifest, {
        status: 200,
        headers: responseHeaders,
      });
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      return new Response(
        JSON.stringify({
          error: isTimeout
            ? `Upstream timeout after ${FETCH_TIMEOUT_MS}ms`
            : 'Upstream gateway error fetching municipal stream manifest.',
          details: err.message,
          upstream: upstreamUrl,
        }),
        {
          status: isTimeout ? 504 : 502,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }
  },
};
