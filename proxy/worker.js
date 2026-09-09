/**
 * PattayaCams.com - Cloudflare Worker Edge M3U8 Manifest Proxy
 * 
 * Strict Bandwidth Guard:
 * 1. ONLY proxies lightweight text-based .m3u8 playlist manifests.
 * 2. Explicitly blocks (403 Forbidden) all .ts, .m4s, .mp4, and .aac binary media segments
 *    to guarantee ZERO bandwidth egress fees on Cloudflare. Media segments are pulled directly
 *    by client video players from the upstream CDN.
 * 3. Spoofs Origin and Referer headers to satisfy City Hall streaming server security policies.
 * 4. Injects full CORS headers for browser player compatibility.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range, User-Agent, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

const UPSTREAM_ORIGIN = 'https://livestream.pattaya.go.th';

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
    const targetPath = url.searchParams.get('url') || url.pathname;

    // 2. EGRESS GUARD: Reject all binary video chunks (.ts, .m4s, etc.)
    const lowerPath = targetPath.toLowerCase();
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

    // Determine target URL to fetch
    let upstreamUrl;
    if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
      upstreamUrl = targetPath;
    } else {
      upstreamUrl = `${UPSTREAM_ORIGIN}${targetPath.startsWith('/') ? '' : '/'}${targetPath}`;
    }

    try {
      // 4. Forward request with spoofed origin/referer headers
      const upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': `${UPSTREAM_ORIGIN}/`,
          'Origin': UPSTREAM_ORIGIN,
          'Accept': '*/*',
        },
      });

      // 5. Clone headers and attach CORS
      const newHeaders = new Headers(upstreamResponse.headers);
      Object.entries(CORS_HEADERS).forEach(([k, v]) => newHeaders.set(k, v));
      newHeaders.set('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      newHeaders.set('Cache-Control', 'public, max-age=2, s-maxage=2'); // Short 2s cache for live manifests

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: newHeaders,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: 'Upstream gateway error fetching municipal stream manifest.',
          details: err.message,
          upstream: upstreamUrl,
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }
  },
};
