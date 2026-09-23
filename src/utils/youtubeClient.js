/**
 * youtubeClient.js — Pure, environment-agnostic YouTube Data API v3 helpers.
 *
 * Used by:
 *   - scripts/check_streams.mjs (Node, GH Actions cron — bulk refresh every 3 hours)
 *   - proxy/worker.js          (Cloudflare Worker — on-demand freshness, every 90 s)
 *
 * Both callers pass the same `apiKey` argument so this module works in:
 *   - Node 20+ (process is defined, fetch is global)
 *   - Cloudflare Workers (process is undefined; pass apiKey from env.YOUTUBE_API_KEY)
 *
 * Replaces the brittle scraping approach (parsePlayerResponse, YOUTUBE_COOKIES,
 * checkYouTubeChannel, etc.) with the official, contracted, never-blocked endpoint.
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const BATCH_SIZE = 50; // YouTube Data API allows up to 50 IDs per videos.list call

/**
 * Normalise a single video API response item into our internal verdict shape.
 * @param {object} item  one item from the YouTube videos.list response
 */
function normaliseVideoItem(item) {
  if (!item || !item.id) return null;
  const live = item.snippet?.liveBroadcastContent; // 'live' | 'upcoming' | 'none'
  const liveDetails = item.liveStreamingDetails || null;
  const hasActualEndTime = Boolean(liveDetails?.actualEndTime);

  return {
    video_id: item.id,
    title: item.snippet?.title || '',
    channel_id: item.snippet?.channelId || null,
    channel_title: item.snippet?.channelTitle || '',
    is_live: live === 'live' && !hasActualEndTime,
    is_upcoming: live === 'upcoming',
    is_vod: live === 'none' || (live === 'live' && hasActualEndTime),
    started_at: liveDetails?.actualStartTime || null,
    ended_at: liveDetails?.actualEndTime || null,
    scheduled_start_at: liveDetails?.scheduledStartTime || null,
    concurrent_viewers: liveDetails?.concurrentViewers ?? null,
    thumbnail: item.snippet?.thumbnails?.default?.url || null,
    checked_at: new Date().toISOString(),
  };
}

/**
 * Batch check up to 50 YouTube video IDs in a single API call (1 quota unit).
 * Returns a map keyed by video ID. IDs not returned by the API map to null.
 *
 * @param {string} apiKey
 * @param {string[]} videoIds
 * @param {{ fetchImpl?: typeof fetch }} [opts] - injection point for tests
 * @returns {Promise<Record<string, ReturnType<typeof normaliseVideoItem> | null>>}
 */
export async function batchCheckVideos(apiKey, videoIds, opts = {}) {
  const fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!fetchImpl) throw new Error('No fetch implementation available');

  const cleanIds = [...new Set((videoIds || []).filter((id) => typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id)))];
  const results = {};
  if (cleanIds.length === 0 || !apiKey) return results;

  for (let i = 0; i < cleanIds.length; i += BATCH_SIZE) {
    const chunk = cleanIds.slice(i, i + BATCH_SIZE);
    const url =
      `${YOUTUBE_API_BASE}/videos` +
      `?part=snippet,liveStreamingDetails` +
      `&id=${chunk.join(',')}` +
      `&key=${encodeURIComponent(apiKey)}`;

    let data;
    try {
      const res = await fetchImpl(url);
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`[youtubeClient] videos.list ${res.status} ${res.statusText}: ${errText.slice(0, 200)}`);
        // Mark the chunk's IDs as null so the caller knows we tried
        chunk.forEach((id) => { results[id] = null; });
        continue;
      }
      data = await res.json();
    } catch (e) {
      console.error(`[youtubeClient] fetch error: ${e?.message || e}`);
      chunk.forEach((id) => { results[id] = null; });
      continue;
    }

    const apiReturned = new Set();
    for (const item of data.items || []) {
      const verdict = normaliseVideoItem(item);
      if (verdict) {
        results[verdict.video_id] = verdict;
        apiReturned.add(verdict.video_id);
      }
    }
    // IDs the API didn't return → video doesn't exist or was deleted
    chunk.forEach((id) => {
      if (!apiReturned.has(id)) results[id] = null;
    });
  }
  return results;
}

/**
 * Read the most recent video ID from a channel's RSS feed (no quota).
 * Returns null if the channel has no videos or the feed is unreachable.
 *
 * @param {string} channelId - YouTube channel ID (UCxxxxxxxxxxxx)
 * @param {{ fetchImpl?: typeof fetch }} [opts]
 * @returns {Promise<string | null>}
 */
export async function getLatestVideoIdFromRSS(channelId, opts = {}) {
  const fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!fetchImpl || !channelId) return null;
  try {
    const res = await fetchImpl(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
      headers: { 'User-Agent': 'PattayaCams/1.0 (live status verifier)' },
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const match = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    return match ? match[1] : null;
  } catch (_) {
    return null;
  }
}

/**
 * Read the first <yt:videoId> from a channel's RSS feed (same as latest; RSS is reverse-chron).
 * Returns a *list* of the most recent N video IDs so callers can probe each for live status.
 *
 * @param {string} channelId
 * @param {number} [maxResults=5]
 * @returns {Promise<string[]>}
 */
export async function getRecentVideoIdsFromRSS(channelId, maxResults = 5, opts = {}) {
  const fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!fetchImpl || !channelId) return [];
  try {
    const res = await fetchImpl(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
      headers: { 'User-Agent': 'PattayaCams/1.0 (live status verifier)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const matches = [...xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)].map((m) => m[1]);
    return matches.slice(0, maxResults);
  } catch (_) {
    return [];
  }
}

/**
 * High-level convenience: given a channel_id, find the most recent video on the
 * channel that is currently live (or return the most recent video period if none are live).
 *
 * @param {string} apiKey
 * @param {string} channelId
 * @param {{ fetchImpl?: typeof fetch }} [opts]
 * @returns {Promise<{ video_id: string, is_live: boolean } | null>}
 */
export async function getLatestLiveVideoFromChannel(apiKey, channelId, opts = {}) {
  const fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!apiKey || !channelId) return null;
  const recentIds = await getRecentVideoIdsFromRSS(channelId, 3, { fetchImpl });
  if (recentIds.length === 0) return null;
  const verdicts = await batchCheckVideos(apiKey, recentIds, { fetchImpl });
  // Prefer the most recent live video
  for (const id of recentIds) {
    const v = verdicts[id];
    if (v && v.is_live) return { video_id: id, is_live: true };
  }
  // Fall back to the most recent video period (probably a VOD, but better than nothing)
  const mostRecent = verdicts[recentIds[0]];
  if (mostRecent) return { video_id: recentIds[0], is_live: false };
  return null;
}

/**
 * Read a channel's handle (e.g. "@pattayacams") and resolve it to a channel_id
 * via the channels.list endpoint (1 quota unit).
 *
 * @param {string} apiKey
 * @param {string} handle - with or without leading @
 * @returns {Promise<string | null>}
 */
export async function resolveHandleToChannelId(apiKey, handle, opts = {}) {
  const fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!apiKey || !handle) return null;
  const clean = handle.startsWith('@') ? handle.slice(1) : handle;
  try {
    const url =
      `${YOUTUBE_API_BASE}/channels` +
      `?part=id` +
      `&forHandle=${encodeURIComponent(clean)}` +
      `&key=${encodeURIComponent(apiKey)}`;
    const res = await fetchImpl(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.items?.[0]?.id || null;
  } catch (_) {
    return null;
  }
}

/**
 * Public-API: build the empty `entities` map shape that the cron writes.
 * Used as the initial state when the cron hasn't run yet today.
 */
export function emptyEntitiesMap() {
  return {};
}

export default {
  batchCheckVideos,
  getLatestVideoIdFromRSS,
  getRecentVideoIdsFromRSS,
  getLatestLiveVideoFromChannel,
  resolveHandleToChannelId,
  emptyEntitiesMap,
  normaliseVideoItem,
};
