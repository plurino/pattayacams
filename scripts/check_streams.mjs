// scripts/check_streams.mjs
// Resilient, quota-free YouTube & Kick live stream health checker with official RSS feed verification
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const venuesPath = path.join(rootDir, 'public', 'data', 'venues.json');
const liveCamsPath = path.join(rootDir, 'public', 'data', 'live_cams.json');
const streamersPath = path.join(rootDir, 'public', 'data', 'roaming_streamers.json');
const creatorsPath = path.join(rootDir, 'public', 'data', 'creators.json');
const statusPath = path.join(rootDir, 'public', 'data', 'stream_status.json');

const venues = fs.existsSync(venuesPath) ? JSON.parse(fs.readFileSync(venuesPath, 'utf8')) : [];
const liveCams = fs.existsSync(liveCamsPath) ? JSON.parse(fs.readFileSync(liveCamsPath, 'utf8')) : [];
const streamers = fs.existsSync(streamersPath) ? JSON.parse(fs.readFileSync(streamersPath, 'utf8')) : [];
const creators = fs.existsSync(creatorsPath) ? JSON.parse(fs.readFileSync(creatorsPath, 'utf8')) : [];

let previousStatus = { entities: {} };
if (fs.existsSync(statusPath)) {
  try {
    previousStatus = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  } catch (e) {
    console.warn('Could not parse previous stream_status.json', e);
  }
}

const BLOCKED_AUTHORS = [
  'tucker carlson',
  'paypal',
  'cnn',
  'fox news',
  'msnbc',
  'jacksepticeye',
  'mrbeast',
  'pewdiepie',
  'acc digital network',
  'espn',
  'sky news'
];

async function checkVideoIsLive(videoId) {
  if (!videoId) return { is_live: false, is_upcoming: false, is_ended: false };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'SOCS=CAESEwgDEgk2MTQ3MzI4MzQaAmVuIAEaBgiA_LyaBg; CONSENT=YES+cb.20210328-17-p0.en+FX+478'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    const html = await res.text();

    const isLive = html.includes('"isLive":true') ||
                   html.includes('"isLiveNow":true') ||
                   html.includes('"liveBroadcastDetails":{"isLiveNow":true');

    const isUpcoming = html.includes('"isUpcoming":true') || 
                       html.includes('"status":"UPCOMING"') || 
                       html.includes('Premieres in ') || 
                       html.includes('Scheduled for ');

    const isEnded = html.includes('Streamed live') || html.includes('"isLive":false');

    return {
      is_live: Boolean(isLive && !isUpcoming && !isEnded),
      is_upcoming: Boolean(isUpcoming),
      is_ended: Boolean(isEnded)
    };
  } catch (e) {
    return { is_live: false, is_upcoming: false, is_ended: false };
  }
}

async function checkYouTubeChannel(handle, fallbackVideoId, channelId = null, expectedName = null) {
  if (!handle && !channelId) {
    return { is_live: false, is_upcoming: false, video_id: null, status: 'error_404', platform: 'youtube' };
  }

  const cleanHandle = handle ? (handle.startsWith('@') ? handle : '@' + handle) : null;
  let candidateVideoIds = [];

  // 1. YouTube RSS Feed Check (Unblockable on any IP - Google never shows consent walls on XML RSS)
  if (channelId) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (rssRes.ok) {
        const xml = await rssRes.text();
        const matches = [...xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)];
        if (matches.length > 0) {
          // Take the top 2 newest video IDs
          candidateVideoIds.push(matches[0][1]);
          if (matches.length > 1) candidateVideoIds.push(matches[1][1]);
        }
      }
    } catch (err) {
      // RSS failover continues to /live
    }
  }

  // 2. YouTube /live Endpoint Probe
  if (cleanHandle) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const liveUrl = `https://www.youtube.com/${cleanHandle}/live`;

      const res = await fetch(liveUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': 'SOCS=CAESEwgDEgk2MTQ3MzI4MzQaAmVuIAEaBgiA_LyaBg; CONSENT=YES+cb.20210328-17-p0.en+FX+478'
        },
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.status === 404) {
        return { is_live: false, is_upcoming: false, video_id: null, status: 'error_404', platform: 'youtube' };
      }

      const html = await res.text();
      const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
      const canonicalUrl = canonicalMatch ? canonicalMatch[1] : res.url;
      const watchMatch = canonicalUrl.match(/watch\?v=([a-zA-Z0-9_-]{11})/);

      if (watchMatch) {
        const liveVideoId = watchMatch[1];
        if (!candidateVideoIds.includes(liveVideoId)) {
          // /live redirect is primary candidate
          candidateVideoIds.unshift(liveVideoId);
        }
      }
    } catch (err) {
      // /live network error handled gracefully
    }
  }

  // 3. Verify Candidates in priority order
  for (const videoId of candidateVideoIds) {
    const check = await checkVideoIsLive(videoId);
    if (check.is_live) {
      return {
        is_live: true,
        is_upcoming: false,
        video_id: videoId,
        status: 'active',
        platform: 'youtube'
      };
    }
    if (check.is_upcoming) {
      return {
        is_live: false,
        is_upcoming: true,
        video_id: videoId,
        status: 'active',
        platform: 'youtube'
      };
    }
  }

  // If fallback video exists, check if it happens to still be live
  if (fallbackVideoId && !candidateVideoIds.includes(fallbackVideoId)) {
    const check = await checkVideoIsLive(fallbackVideoId);
    if (check.is_live) {
      return {
        is_live: true,
        is_upcoming: false,
        video_id: fallbackVideoId,
        status: 'active',
        platform: 'youtube'
      };
    }
  }

  return {
    is_live: false,
    is_upcoming: false,
    video_id: candidateVideoIds[0] || fallbackVideoId || null,
    status: 'active',
    platform: 'youtube'
  };
}

async function checkKickChannel(slug) {
  if (!slug) {
    return { is_live: false, is_upcoming: false, status: 'error_404', platform: 'kick' };
  }

  const cleanSlug = slug.replace(/^@/, '').toLowerCase().trim();
  const apiUrl = `https://kick.com/api/v2/channels/${cleanSlug}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.status === 404) {
      return { is_live: false, is_upcoming: false, status: 'error_404', platform: 'kick' };
    }

    if (!res.ok) {
      return { is_live: false, is_upcoming: false, status: 'active', platform: 'kick' };
    }

    const data = await res.json();
    const isLive = Boolean(data && data.livestream && (data.livestream.is_live === true || data.livestream.id));

    return {
      is_live: isLive,
      is_upcoming: false,
      status: 'active',
      title: data?.livestream?.session_title || null,
      viewer_count: data?.livestream?.viewer_count || 0,
      avatar_url: data?.user?.profile_pic || null,
      platform: 'kick'
    };
  } catch (err) {
    return {
      is_live: false,
      is_upcoming: false,
      status: 'active',
      platform: 'kick'
    };
  }
}

async function run() {
  console.log('=== Checking Live Feeds (YouTube RSS & Live Watch Verification) ===');
  const nowIso = new Date().toISOString();
  const nextEntities = { ...previousStatus.entities };

  // 1. Check Venues (YouTube)
  console.log('\n--- Checking Venues ---');
  let venuesUpdated = false;
  for (const venue of venues) {
    const entityKey = `venue-${venue.slug}`;
    const prev = nextEntities[entityKey] || {};
    const result = await checkYouTubeChannel(venue.youtube_handle, venue.video_id, venue.youtube_channel_id, venue.name);

    if (result.is_live && result.video_id && result.video_id !== venue.video_id) {
      venue.video_id = result.video_id;
      venuesUpdated = true;
    }

    nextEntities[entityKey] = {
      is_live: result.is_live,
      is_upcoming: result.is_upcoming,
      video_id: result.video_id || prev.video_id || venue.video_id || null,
      last_live_at: result.is_live ? nowIso : (prev.last_live_at || null),
      status: result.status,
      name: venue.name,
      platform: 'youtube',
      handle: venue.youtube_handle
    };

    const statusLabel = result.is_live
      ? `🔴 LIVE (${result.video_id})`
      : (result.is_upcoming ? `⏳ UPCOMING (${result.video_id})` : '⚪ Offline');
    console.log(`[${venue.name}] ${statusLabel}`);
  }

  if (venuesUpdated) {
    fs.writeFileSync(venuesPath, JSON.stringify(venues, null, 2), 'utf8');
    console.log('✓ Synced updated live video IDs to venues.json');
  }

  // 1b. Check 24/7 Live Webcams (YouTube)
  console.log('\n--- Checking 24/7 Live Webcams ---');
  let liveCamsUpdated = false;
  for (const cam of liveCams) {
    const entityKey = `livecam-${cam.slug}`;
    const prev = nextEntities[entityKey] || {};
    const result = await checkYouTubeChannel(cam.youtube_handle, cam.video_id, cam.youtube_channel_id, cam.name);

    if (result.is_live && result.video_id && result.video_id !== cam.video_id) {
      cam.video_id = result.video_id;
      liveCamsUpdated = true;
    }

    nextEntities[entityKey] = {
      is_live: result.is_live,
      is_upcoming: result.is_upcoming,
      video_id: result.video_id || prev.video_id || cam.video_id,
      last_live_at: result.is_live ? nowIso : (prev.last_live_at || null),
      status: result.status,
      name: cam.name,
      platform: 'youtube',
      handle: cam.youtube_handle
    };

    const statusLabel = result.is_live
      ? `🔴 LIVE (${result.video_id})`
      : (result.is_upcoming ? `⏳ UPCOMING (${result.video_id})` : '⚪ Offline');
    console.log(`[${cam.name}] ${statusLabel}`);
  }

  if (liveCamsUpdated) {
    fs.writeFileSync(liveCamsPath, JSON.stringify(liveCams, null, 2), 'utf8');
    console.log('✓ Synced updated live video IDs to live_cams.json');
  }

  // 2. Check Roaming Streamers (YouTube)
  console.log('\n--- Checking Roaming Streamers ---');
  for (const streamer of streamers) {
    const entityKey = `streamer-${streamer.id}`;
    const prev = nextEntities[entityKey] || {};
    const result = await checkYouTubeChannel(streamer.youtube_handle, null, streamer.youtube_channel_id, streamer.name);

    nextEntities[entityKey] = {
      is_live: result.is_live,
      is_upcoming: result.is_upcoming,
      video_id: result.video_id || prev.video_id || null,
      last_live_at: result.is_live ? nowIso : (prev.last_live_at || null),
      status: result.status,
      name: streamer.name,
      platform: 'youtube',
      handle: streamer.youtube_handle
    };

    const statusLabel = result.is_live
      ? `🔴 LIVE (${result.video_id})`
      : (result.is_upcoming ? `⏳ UPCOMING (${result.video_id})` : '⚪ Offline');
    console.log(`[${streamer.name}] ${statusLabel}`);
  }

  // 3. Check Creators (YouTube & Kick)
  console.log('\n--- Checking Creators Hub (YouTube & Kick) ---');
  for (const creator of creators) {
    const entityKey = `creator-${creator.slug}`;
    const prev = nextEntities[entityKey] || {};

    let result;
    if (creator.platform === 'kick') {
      const kickSlug = creator.kick_channel || creator.channel_id || creator.slug || creator.handle;
      result = await checkKickChannel(kickSlug);
    } else if (creator.platform === 'both' || creator.kick_channel) {
      result = await checkYouTubeChannel(creator.handle, null, creator.channel_id, creator.name);
      if (!result.is_live) {
        const kickSlug = creator.kick_channel || creator.channel_id || creator.slug;
        const kickResult = await checkKickChannel(kickSlug);
        if (kickResult.is_live) {
          result = kickResult;
        }
      }
    } else {
      result = await checkYouTubeChannel(creator.handle, null, creator.channel_id, creator.name);
    }

    nextEntities[entityKey] = {
      is_live: result.is_live,
      is_upcoming: Boolean(result.is_upcoming),
      video_id: result.video_id || prev.video_id || null,
      last_live_at: result.is_live ? nowIso : (prev.last_live_at || null),
      status: result.status,
      name: creator.name,
      platform: result.platform || creator.platform,
      handle: creator.handle,
      kick_channel: creator.kick_channel || null,
      avatar_url: creator.avatar_url || result.avatar_url || null
    };

    const statusLabel = result.is_live
      ? `🔴 LIVE (${result.video_id || 'Kick'})`
      : (result.is_upcoming ? `⏳ UPCOMING (${result.video_id})` : '⚪ Offline');
    console.log(`[${creator.name}] ${statusLabel}`);
  }

  const payload = {
    last_check: nowIso,
    entities: nextEntities
  };

  fs.writeFileSync(statusPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\n✓ Successfully updated stream_status.json at ${nowIso}`);
  
  const liveCount = Object.values(nextEntities).filter(e => e.is_live).length;
  console.log(`Total Genuine Live Broadcasts: ${liveCount}`);
}

run();
