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
