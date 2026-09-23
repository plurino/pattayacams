/**
 * PattayaCams.com - Cloudflare Worker Edge Proxy
 *
 * Responsibilities:
 *  1. /api/check-live — Real-time YouTube live status via YouTube Data API v3.
 *                       Batched (up to 50 IDs per call, 1 quota unit), 5-min Worker cache.
 *                       RSS feed discovery for channel handles when no video_id is known.
 *  2. Edge proxy for municipal HLS streams (livestream.pattaya.go.th):
 *     Strict bandwith & SSRF guard — only proxies from the official municipal CCTV domain.
 *     Hard 4-second upstream connect timeout.
 *     Blocks (.ts, .m4s, .mp4, .aac) binary segments to guarantee ZERO bandwidth egress fees.
 *     Rewrites relative media segment URLs in .m3u8 playlists to absolute upstream URLs.
 *
 * Secrets: YOUTUBE_API_KEY  (wrangler secret put YOUTUBE_API_KEY)
 *          Source:           src/utils/youtubeClient.js  (bundled by wrangler)
 */

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
    // 1b. Route: Live Flights REMOVED.
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
