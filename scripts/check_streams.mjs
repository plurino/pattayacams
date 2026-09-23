// scripts/check_streams.mjs
// Resilient live stream health checker using the official YouTube Data API v3.
// Replaces the brittle watch-page scraping (which YouTube blocks from datacenter IPs)
// with batched /videos.list calls (~1 quota unit per 50 entities) + RSS feed discovery
// for fresh video IDs on channels where the stored ID is stale.
//
// Quota math: 100 entities × 1 batch every 3 hours = 8 calls/day = 8 units.
// Free tier: 10,000 units/day. Headroom: 1250x.
//
// Run by: .github/workflows/scheduled_pipeline.yml (every 3 hours)
// Secrets: YOUTUBE_API_KEY must be set in GitHub repo Settings → Secrets → Actions

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  batchCheckVideos,
  getLatestLiveVideoFromChannel,
} from '../src/utils/youtubeClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
if (!YOUTUBE_API_KEY) {
  console.error('❌ Missing YOUTUBE_API_KEY env var. Set it in GitHub repo Settings → Secrets → Actions.');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public', 'data');
const venuesPath = path.join(publicDir, 'venues.json');
const liveCamsPath = path.join(publicDir, 'live_cams.json');
const streamersPath = path.join(publicDir, 'roaming_streamers.json');
const creatorsPath = path.join(publicDir, 'creators.json');
const statusPath = path.join(publicDir, 'stream_status.json');

const venues = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const liveCams = JSON.parse(fs.readFileSync(liveCamsPath, 'utf8'));
const streamers = JSON.parse(fs.readFileSync(streamersPath, 'utf8'));
const creators = JSON.parse(fs.readFileSync(creatorsPath, 'utf8'));

const previousStatus = fs.existsSync(statusPath)
  ? JSON.parse(fs.readFileSync(statusPath, 'utf8'))
  : { last_check: null, entities: {} };

const nowIso = new Date().toISOString();

// ------------------------------------------------------------------
// Kick (kept intact — Kick's public API is still scrape-friendly)
// ------------------------------------------------------------------
async function checkKickChannel(slug) {
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${slug}`);
    if (!res.ok) return { is_live: false, is_upcoming: false, status: 'active', platform: 'kick' };
    const data = await res.json();
    return {
      is_live: data.livestream !== null && data.livestream !== undefined,
      is_upcoming: false,
      video_id: data.livestream?.slug || null,
      status: 'active',
      platform: 'kick',
      avatar_url: data.user?.profile_pic || null,
    };
  } catch {
    return { is_live: false, is_upcoming: false, status: 'active', platform: 'kick' };
  }
}

// ------------------------------------------------------------------
// Build the nextEntities map by batch-checking every YouTube video_id.
// For entities whose stored ID has gone stale (no longer live),
// discover the current live stream via RSS feed + YouTube API.
// ------------------------------------------------------------------
async function checkYouTubeBatch(entities) {
  // Step 1: batch-check every video_id we already know about
  const knownIds = entities
    .map((e) => e.video_id)
    .filter((id) => typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id));

  console.log(`\n[videos.list] batch-checking ${knownIds.length} known IDs…`);
  const verdicts = await batchCheckVideos(YOUTUBE_API_KEY, knownIds);
  console.log(`  → ${Object.values(verdicts).filter((v) => v?.is_live).length} confirmed live`);

  // Step 2: for entities that aren't live on their stored ID, try to discover
  // the current live stream via RSS + a quick follow-up API check.
  const needDiscovery = entities.filter((e) => {
    if (!e.youtube_channel_id) return false; // can't discover without channel_id
    const v = verdicts[e.video_id];
    return !v || !v.is_live; // stored ID is stale or unknown
  });

  if (needDiscovery.length > 0) {
    console.log(`\n[rss+api] discovering fresh live stream for ${needDiscovery.length} stale entities…`);
    for (const e of needDiscovery) {
      try {
        const fresh = await getLatestLiveVideoFromChannel(
          YOUTUBE_API_KEY,
          e.youtube_channel_id
        );
        if (fresh?.video_id) {
          verdicts[fresh.video_id] = { video_id: fresh.video_id, is_live: fresh.is_live, checked_at: nowIso };
          if (fresh.is_live) {
            e.video_id = fresh.video_id; // mutate the source JSON in memory
          }
        }
      } catch (err) {
        console.warn(`  ⚠️ Discovery failed for ${e.slug || e.id || e.name}: ${err.message}`);
      }
    }
  }

  return verdicts;
}

// ------------------------------------------------------------------
// Build the nextEntities map
// ------------------------------------------------------------------

/**
 * Decide whether an entity should be checked for live status on this run.
 *
 * Per-entity `check_live_status` flag (default: true):
 *   true  → include in batch / RSS-discovery
 *   false → mark as `idle` immediately, skip API calls entirely
 *           (saves quota for channels that publish VODs only)
 *
 * This lets the user manually opt specific creators / streamers out of
 * live polling — useful for channels that only upload pre-recorded
 * videos and never stream live.
 */
function shouldCheckLive(entity) {
  return entity?.check_live_status !== false;
}

async function buildStatusMap() {
  const nextEntities = { ...previousStatus.entities };

  // YouTube entities — venues, live cams, streamers, creators
  // Each entity can opt out of live polling via check_live_status: false
  const youTubeEntities = [
    ...venues.map((v) => ({ ...v, _kind: 'venue' })),
    ...liveCams.map((c) => ({ ...c, _kind: 'livecam' })),
    ...streamers.map((s) => ({ ...s, _kind: 'streamer' })),
    ...creators
      .filter((c) => c.platform !== 'kick')
      .map((c) => ({ ...c, _kind: 'creator' })),
  ];

  // Pre-mark opted-out entities as idle so they appear in stream_status.json
  // with `is_live: false` but don't consume API quota.
  for (const e of youTubeEntities) {
    if (!shouldCheckLive(e)) {
      const entityKey = e._kind === 'livecam'
        ? `livecam-${e.slug}`
        : e._kind === 'venue'
          ? `venue-${e.slug}`
          : e._kind === 'streamer'
            ? `streamer-${e.id}`
            : `creator-${e.slug}`;
      nextEntities[entityKey] = {
        is_live: false,
        is_upcoming: false,
        video_id: null,
        last_live_at: previousStatus.entities?.[entityKey]?.last_live_at || null,
        status: 'opted_out',
        name: e.name,
        platform: 'youtube',
        handle: e.youtube_handle || e.handle || null,
        verified_at: nowIso,
      };
    }
  }

  // Only check entities that haven't opted out
  const checkableEntities = youTubeEntities.filter(shouldCheckLive);
  const skippedCount = youTubeEntities.length - checkableEntities.length;
  if (skippedCount > 0) {
    console.log(`\n[opt-out] ${skippedCount} entities marked check_live_status:false — skipping API calls`);
  }

  const verdicts = await checkYouTubeBatch(checkableEntities);

  for (const entity of checkableEntities) {
    const entityKey = entity._kind === 'livecam'
      ? `livecam-${entity.slug}`
      : entity._kind === 'venue'
        ? `venue-${entity.slug}`
        : entity._kind === 'streamer'
          ? `streamer-${entity.id}`
          : `creator-${entity.slug}`;

    const verdict = verdicts[entity.video_id];
    const isLive = Boolean(verdict?.is_live);
    const isUpcoming = Boolean(verdict?.is_upcoming);

    nextEntities[entityKey] = {
      is_live: isLive,
      is_upcoming: isUpcoming,
      video_id: entity.video_id || previousStatus.entities?.[entityKey]?.video_id || null,
      last_live_at: isLive ? nowIso : (previousStatus.entities?.[entityKey]?.last_live_at || null),
      status: isLive ? 'active' : (verdict ? 'idle' : 'unknown'),
      name: entity.name,
      platform: 'youtube',
      handle: entity.youtube_handle || entity.handle || null,
      verified_at: nowIso,
    };

    const label = isLive ? '🔴 LIVE' : isUpcoming ? '⏳ UPCOMING' : '⚪ Offline';
    console.log(`  [${entity._kind}] ${entity.name}: ${label}${entity.video_id ? ` (${entity.video_id})` : ''}`);
  }

  // Kick-only creators
  for (const creator of creators.filter((c) => c.platform === 'kick')) {
    const entityKey = `creator-${creator.slug}`;
    const kickSlug = creator.kick_channel || creator.channel_id || creator.slug || creator.handle;
    const result = await checkKickChannel(kickSlug);
    nextEntities[entityKey] = {
      is_live: result.is_live,
      is_upcoming: false,
      video_id: result.video_id || previousStatus.entities?.[entityKey]?.video_id || null,
      last_live_at: result.is_live ? nowIso : (previousStatus.entities?.[entityKey]?.last_live_at || null),
      status: 'active',
      name: creator.name,
      platform: 'kick',
      handle: creator.handle || null,
      kick_channel: creator.kick_channel || null,
      avatar_url: creator.avatar_url || result.avatar_url || null,
      verified_at: nowIso,
    };
    console.log(`  [creator/kick] ${creator.name}: ${result.is_live ? '🔴 LIVE' : '⚪ Offline'}`);
  }

  // Creators on BOTH platforms — YouTube verdict wins if live; else try Kick
  for (const creator of creators.filter((c) => c.platform === 'both' || (c.kick_channel && c.platform !== 'kick'))) {
    const entityKey = `creator-${creator.slug}`;
    const ytVerdict = verdicts[creator.video_id];
    let isLive = Boolean(ytVerdict?.is_live);
    let videoId = creator.video_id;
    if (!isLive && creator.kick_channel) {
      const kickResult = await checkKickChannel(creator.kick_channel);
      if (kickResult.is_live) {
        isLive = true;
        videoId = kickResult.video_id;
      }
    }
    nextEntities[entityKey] = {
      is_live: isLive,
      is_upcoming: Boolean(ytVerdict?.is_upcoming),
      video_id: videoId || previousStatus.entities?.[entityKey]?.video_id || null,
      last_live_at: isLive ? nowIso : (previousStatus.entities?.[entityKey]?.last_live_at || null),
      status: isLive ? 'active' : 'idle',
      name: creator.name,
      platform: 'youtube+kick',
      handle: creator.handle || null,
      kick_channel: creator.kick_channel || null,
      verified_at: nowIso,
    };
    console.log(`  [creator/both] ${creator.name}: ${isLive ? '🔴 LIVE' : '⚪ Offline'}`);
  }

  return nextEntities;
}

async function run() {
  console.log('=== Checking Live Feeds (YouTube Data API v3 + RSS discovery) ===');
  console.log(`Started at ${nowIso}`);
  console.log(`Known entities: ${venues.length} venues, ${liveCams.length} live cams, ${streamers.length} streamers, ${creators.length} creators`);

  const nextEntities = await buildStatusMap();

  const initialLiveCount = Object.values(nextEntities).filter((e) => e.is_live).length;
  const prevLiveCount = Object.values(previousStatus.entities || {}).filter((e) => e.is_live).length;

  // Circuit breaker (defence-in-depth): if API returned nearly nothing but
  // we had many live streams before, retain previously verified active streams
  // so the site doesn't flip to "all offline" on a transient API outage.
  if (initialLiveCount <= 1 && prevLiveCount >= 4) {
    console.warn(`\n⚠️ Safety Circuit Breaker Triggered: Detected only ${initialLiveCount} live streams while previously ${prevLiveCount} were live.`);
    console.warn(`Preserving previously verified active streams to protect production site from transient outages.`);
    for (const [key, prev] of Object.entries(previousStatus.entities || {})) {
      if (prev.is_live && nextEntities[key] && !nextEntities[key].is_live) {
        nextEntities[key].is_live = true;
        nextEntities[key].video_id = prev.video_id;
        nextEntities[key].status = 'active';
        nextEntities[key].breaker_preserved = true;
      }
    }
  }

  const finalLiveCount = Object.values(nextEntities).filter((e) => e.is_live).length;

  const payload = {
    last_check: nowIso,
    source: 'youtube_data_api_v3',
    entities: nextEntities,
  };

  fs.writeFileSync(statusPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\n✓ Successfully updated stream_status.json at ${nowIso}`);
  console.log(`Total Genuine Live Broadcasts: ${finalLiveCount}`);

  // Sync updated live video IDs back to source JSONs (so the static data
  // references the currently-live video, not an expired one).
  writeBackIfChanged(venuesPath, venues);
  writeBackIfChanged(liveCamsPath, liveCams);
}

function writeBackIfChanged(path_, data) {
  fs.writeFileSync(path_, JSON.stringify(data, null, 2), 'utf8');
}

run().catch((err) => {
  console.error('❌ check_streams.mjs failed:', err);
  process.exit(1);
});
