/**
 * PattayaCams.com - Cloudflare Worker Edge M3U8 Manifest Proxy
 * 
 * Strict Bandwidth & SSRF Guard:
 * 1. Strict Upstream Allowlist: ONLY proxies from official municipal CCTV domain (livestream.pattaya.go.th).
 * 2. Hard 4-Second Upstream Connect Timeout to prevent hanging socket exhaustion.
 * 3. EGRESS GUARD: Explicitly blocks (403 Forbidden) all .ts, .m4s, .mp4, and .aac binary media segments
 *    to guarantee ZERO bandwidth egress fees on Cloudflare.
 * 4. Manifest Rewriter: Automatically rewrites relative media segment URLs in .m3u8 playlists to
 *    absolute upstream CDN URLs, ensuring client video players stream segments directly from Pattaya City Hall.
 * 5. Spoofs Origin and Referer headers to satisfy City Hall streaming server security policies.
 * 6. Injects full CORS headers for browser player compatibility.
 */

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

    // 0. Route: /api/check-live — Real-time YouTube live status verification.
    // Replaces the failing GH Actions cron (which keeps getting blocked by YouTube's
    // datacenter IP filter). Frontend polls this for entities whose static status is
    // unknown or stale. Cache 60s per (platform, id) tuple to avoid rate limits.
    if (url.pathname === '/api/check-live') {
      const cacheKey = '__checkLiveCache';
      const cacheTtlMs = 60_000;

      const videoId = url.searchParams.get('v');
      const handle = url.searchParams.get('handle');
      const channelId = url.searchParams.get('channel_id');
      const cacheId = (videoId || handle || channelId || '').toLowerCase();

      if (!cacheId) {
        return new Response(
          JSON.stringify({ is_live: null, source: 'noop', reason: 'missing id' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }

      const cached = globalThis[cacheKey]?.[cacheId];
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

      const YOUTUBE_COOKIES = [
        'SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA3X3AwGgJlbiACGgYIgPzytgY',
        'PREF=hl=en&gl=US',
      ].join('; ');

      const commonHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': YOUTUBE_COOKIES,
      };

      const parsePlayerResponse = (html) => {
        const match =
          html.match(/var ytInitialPlayerResponse\s*=\s*({.+?});(?:var|<\/script>)/s) ||
          html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);
        if (!match) return null;
        try { return JSON.parse(match[1]); } catch (_) { return null; }
      };

      const inspectWatchHtml = (html) => {
        const pr = parsePlayerResponse(html);
        if (pr) {
          const playabilityStatus = pr.playabilityStatus?.status;
          const isLiveDetails = pr.microformat?.playerMicroformatRenderer?.liveBroadcastDetails;
          const videoDetails = pr.videoDetails;
          const isLiveNow =
            isLiveDetails?.isLiveNow === true ||
            (videoDetails?.isLive === true && playabilityStatus === 'OK');
          const isUpcoming =
            playabilityStatus === 'LIVE_STREAM_OFFLINE' ||
            !!pr.playabilityStatus?.liveStreamability?.liveStreamabilityRenderer?.offlineSlate;
          const isError = playabilityStatus === 'ERROR' || playabilityStatus === 'LOGIN_REQUIRED';
          return { is_live: isLiveNow && !isUpcoming, is_upcoming: isUpcoming && !isLiveNow, is_error: isError };
        }
        // Fallback string check
        const hasLiveNow = html.includes('"isLiveNow":true');
        const hasOffline = html.includes('LIVE_STREAM_OFFLINE') || html.includes('"isUpcoming":true');
        return {
          is_live: hasLiveNow && !hasOffline,
          is_upcoming: hasOffline && !hasLiveNow,
          is_error: html.includes('"playabilityStatus":{"status":"ERROR"'),
        };
      };

      const checkVideoId = async (id) => {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 8000);
        try {
          const r = await fetch(`https://www.youtube.com/watch?v=${id}&gl=US&hl=en`, {
            headers: commonHeaders,
            signal: controller.signal,
          });
          clearTimeout(t);
          if (r.status === 404) return { is_live: false, is_upcoming: false, is_error: true, source: '404' };
          const html = await r.text();
          const verdict = inspectWatchHtml(html);
          return { ...verdict, source: 'watch' };
        } catch (e) {
          clearTimeout(t);
          return { is_live: null, is_upcoming: null, is_error: true, source: 'fetch_error', reason: e?.message };
        }
      };

      const checkChannelHandle = async (h) => {
        const clean = h.startsWith('@') ? h : `@${h}`;
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 8000);
        try {
          const r = await fetch(`https://www.youtube.com/${clean}/live?gl=US&hl=en`, {
            headers: commonHeaders,
            redirect: 'follow',
            signal: controller.signal,
          });
          clearTimeout(t);
          const html = await r.text();
          const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
          const canonicalUrl = canonicalMatch ? canonicalMatch[1] : r.url;
          const watchMatch = canonicalUrl.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
          if (!watchMatch) {
            return { is_live: false, is_upcoming: false, is_error: false, source: 'channel_no_live' };
          }
          return { ...(await checkVideoId(watchMatch[1])), video_id: watchMatch[1], source: 'channel_live' };
        } catch (e) {
          clearTimeout(t);
          return { is_live: null, is_upcoming: null, is_error: true, source: 'fetch_error', reason: e?.message };
        }
      };

      let result;
      if (videoId) {
        result = await checkVideoId(videoId);
        result.video_id = videoId;
      } else if (handle) {
        result = await checkChannelHandle(handle);
      } else if (channelId) {
        // Fall back to RSS feed which exposes recent video IDs without scraping watch pages
        try {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), 6000);
          const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: controller.signal,
          });
          clearTimeout(t);
          if (r.ok) {
            const xml = await r.text();
            const ids = [...xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)].map((m) => m[1]);
            let foundLive = null;
            for (const id of ids.slice(0, 2)) {
              const v = await checkVideoId(id);
              if (v.is_live) { foundLive = { ...v, video_id: id, source: 'rss' }; break; }
            }
            result = foundLive || { is_live: false, is_upcoming: false, is_error: false, source: 'rss_none_live' };
          } else {
            result = { is_live: null, is_upcoming: null, is_error: true, source: 'rss_failed' };
          }
        } catch (e) {
          result = { is_live: null, is_upcoming: null, is_error: true, source: 'fetch_error', reason: e?.message };
        }
      }

      const payload = { ...result, fetchedAt: new Date().toISOString() };

      // Cache the verdict (only on definitive answers — don't cache errors for 60s)
      if (globalThis[cacheKey] === undefined) globalThis[cacheKey] = {};
      if (result.is_live !== null) {
        globalThis[cacheKey][cacheId] = { payload, fetchedAtMs: Date.now() };
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
    if (url.pathname === '/api/marine') {
      const cacheKey = '__marineCache';
      const cacheTtlMs = 30_000;
      const collectMs = 6_000;

      // Cache hit.
      const cached = globalThis[cacheKey];
      if (cached && (Date.now() - cached.fetchedAtMs) < cacheTtlMs) {
        return new Response(JSON.stringify(cached.payload), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=15',
            ...CORS_HEADERS,
          },
        });
      }

      const apiKey = env.AISSTREAM_API_KEY;
      const fetchedAt = new Date().toISOString();

      // No key bound: return stub so the browser hook knows to use the local snapshot.
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            vessels: [],
            count: 0,
            source: 'stub',
            fetchedAt,
            reason: 'AISSTREAM_API_KEY secret not bound to Worker.',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=15',
              ...CORS_HEADERS,
            },
          }
        );
      }

      // Subscribe to AISStream via outbound WebSocket and collect vessels.
      // Architecture mirrors `useLiveFlights.js`'s worker-first pattern:
      //   1. Open WS, subscribe, collect PositionReport messages for 6 s.
      //   2. If AISStream disconnects early (e.g. key not yet activated on their
      //      side, or invalid bbox), we still return a clean stub response so the
      //      browser hook can fall back to its local snapshot.
      const vessels = await new Promise((resolve) => {
        const collected = [];

        const finish = (source, reason) => {
          const payload = {
            vessels: collected,
            count: collected.length,
            source,
            fetchedAt,
            ...(reason ? { reason } : {}),
          };
          if (source === 'aisstream') {
            globalThis[cacheKey] = { payload, fetchedAtMs: Date.now() };
          }
          resolve(payload);
        };

        let timer;
        fetch('https://stream.aisstream.io/v0/stream', {
          headers: {
            Upgrade: 'websocket',
            Connection: 'Upgrade',
          },
        })
          .then(async (resp) => {
            const ws = resp.webSocket;
            if (!ws) {
              let body = '';
              try { body = await resp.text(); } catch (_) {}
              return finish('stub', `no-webSocket status=${resp.status} body=${body.slice(0, 200)}`);
            }
            ws.accept();

            // Subscribe to PositionReport messages in the Pattaya Bay corridor bbox.
            // Send immediately after accept() — Cloudflare Workers supports this
            // pattern and AISStream expects the subscription at handshake time.
            try {
              ws.send(
                JSON.stringify({
                  APIKey: apiKey,
                  BoundingBoxes: [[[12.40, 100.50], [13.40, 101.20]]],
                  FilterMessageTypes: ['PositionReport'],
                })
              );
            } catch (_) {
              ws.close(1011, 'subscription-send-failed');
              return finish('stub', 'subscription-send-failed');
            }

            timer = setTimeout(() => {
              try { ws.close(1000, 'collect-window-done'); } catch (_) {}
              finish(collected.length > 0 ? 'aisstream' : 'stub', 'collect-window-done');
            }, collectMs);

            ws.addEventListener('message', (event) => {
              try {
                const data = JSON.parse(event.data);
                if (
                  data?.MessageType === 'PositionReport' &&
                  data?.Message?.PositionReport
                ) {
                  const pr = data.Message.PositionReport;
                  const meta = data.MetaData || {};
                  collected.push({
                    mmsi: pr.UserID ?? meta.MMSI ?? null,
                    name: (meta.ShipName || '').trim() || 'Unknown',
                    lat: pr.Latitude,
                    lng: pr.Longitude,
                    sog: pr.Sog ?? null,
                    cog: pr.Cog ?? null,
                    heading: pr.TrueHeading ?? null,
                    type: meta.ShipType ?? null,
                    lastSeen: fetchedAt,
                  });
                }
              } catch (_) {
                // Ignore malformed frames — AISStream occasionally sends
                // non-JSON control frames.
              }
            });

            const cleanupAndFinish = (reason) => {
              clearTimeout(timer);
              finish(collected.length > 0 ? 'aisstream' : 'stub', reason);
            };
            ws.addEventListener('error', () => cleanupAndFinish('ws-error'));
            ws.addEventListener('close', () => cleanupAndFinish('ws-close'));
          })
          .catch((err) => {
            if (timer) clearTimeout(timer);
            finish('stub', `fetch-error ${err?.message || err}`);
          });
      });

      return new Response(JSON.stringify(vessels), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=15',
          ...CORS_HEADERS,
        },
      });
    }

    // 1b. Route: ADS-B Live Flights telemetry proxy with CORS headers
    if (url.pathname === '/api/flights') {
      try {
        const flightRes = await fetch('https://api.adsb.lol/v2/point/13.05/100.88/45', {
          headers: { 'User-Agent': 'PattayaCams-Proxy/1.0' },
        });
        const flightData = await flightRes.text();
        return new Response(flightData, {
          status: flightRes.status,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=10',
            ...CORS_HEADERS,
          },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Failed to fetch flights', details: e.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }
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
