// scripts/check_streams.mjs
// Lightweight, quota-free YouTube & Kick live stream health checker with strict channel verification
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

// Blocked authors from trending/homepage redirects when datacenter bot checks fail
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

async function checkYouTubeChannel(handle, fallbackVideoId, expectedChannelId = null, expectedName = null) {
  if (!handle) {
    return { is_live: false, video_id: null, status: 'error_404', platform: 'youtube' };
  }

  const cleanHandle = handle.startsWith('@') ? handle : '@' + handle;
  const liveUrl = `https://www.youtube.com/${cleanHandle}/live`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(liveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+478'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.status === 404) {
      return { is_live: false, video_id: null, status: 'error_404', platform: 'youtube' };
    }

    const html = await res.text();

    if (html.includes("This page isn't available") || html.includes('This channel does not exist')) {
      return { is_live: false, video_id: null, status: 'error_404', platform: 'youtube' };
    }

    // 1. Check canonical link: MUST be a video watch page (not a redirect to the YouTube homepage or explore feed)
    const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
    const canonicalUrl = canonicalMatch ? canonicalMatch[1] : res.url;
    const watchMatch = canonicalUrl.match(/watch\?v=([a-zA-Z0-9_-]{11})/);

    if (!watchMatch) {
      return { is_live: false, video_id: null, status: 'active', platform: 'youtube' };
    }

    const videoId = watchMatch[1];

    // 2. Channel ID verification: If channelId is in page, it must match expected channel ID
    const pageChannelIdMatch = html.match(/"externalChannelId":"([^"]+)"/) || html.match(/"channelId":"([^"]+)"/);
    const pageChannelId = pageChannelIdMatch ? pageChannelIdMatch[1] : null;

    if (expectedChannelId && pageChannelId && pageChannelId !== expectedChannelId) {
      console.warn(`[REJECTED] Channel mismatch for ${cleanHandle}: found ${pageChannelId}, expected ${expectedChannelId}`);
      return { is_live: false, video_id: null, status: 'active', platform: 'youtube' };
    }

    // 3. Specific live stream indicators on the video
    const isLiveBroadcast = html.includes('"liveBroadcastDetails":{"isLiveNow":true') ||
                           html.includes('"isLive":true') ||
                           html.includes('"isLiveNow":true');

    const isUpcoming = html.includes('"isUpcoming":true') || 
                       html.includes('"status":"UPCOMING"') || 
                       html.includes('"upcomingEventData"') || 
                       html.includes('Premieres in ') ||
                       html.includes('Scheduled for ');

    const isEnded = html.includes('Streamed live') || html.includes('"isLive":false');

    if (!isLiveBroadcast || isUpcoming || isEnded) {
      return { is_live: false, video_id: null, status: 'active', platform: 'youtube' };
    }

    // 4. Double-check with lightweight oEmbed to verify author
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        const author = (oembedData.author_name || '').toLowerCase();
        if (BLOCKED_AUTHORS.some(b => author.includes(b))) {
          console.warn(`[BLOCKED HIJACK] Video ${videoId} by ${oembedData.author_name} is in blocked authors list!`);
          return { is_live: false, video_id: null, status: 'active', platform: 'youtube' };
        }
      }
    } catch (e) {
      // Ignore oEmbed fetch errors
    }

    return {
      is_live: true,
      video_id: videoId,
      status: 'active',
      platform: 'youtube'
    };
  } catch (err) {
    console.warn(`Error checking YouTube ${cleanHandle}:`, err.message);
    return {
      is_live: false,
      video_id: null,
      status: 'active',
      platform: 'youtube'
    };
  }
}

async function checkKickChannel(slug) {
  if (!slug) {
    return { is_live: false, status: 'error_404', platform: 'kick' };
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
      return { is_live: false, status: 'error_404', platform: 'kick' };
    }

    if (!res.ok) {
      return { is_live: false, status: 'active', platform: 'kick' };
    }

    const data = await res.json();
    const isLive = Boolean(data && data.livestream && (data.livestream.is_live === true || data.livestream.id));

    return {
      is_live: isLive,
      status: 'active',
      title: data?.livestream?.session_title || null,
      viewer_count: data?.livestream?.viewer_count || 0,
      avatar_url: data?.user?.profile_pic || null,
      platform: 'kick'
    };
  } catch (err) {
    console.warn(`Error checking Kick ${cleanSlug}:`, err.message);
    return {
      is_live: false,
      status: 'active',
      platform: 'kick'
    };
  }
}

async function run() {
  console.log('=== Checking Live Feeds (YouTube & Kick) ===');
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
      video_id: result.is_live ? result.video_id : null,
      last_live_at: result.is_live ? nowIso : (prev.last_live_at || null),
      status: result.status,
      name: venue.name,
      platform: 'youtube',
      handle: venue.youtube_handle
    };

    console.log(`[${venue.name}] ${result.is_live ? '🔴 LIVE (' + result.video_id + ')' : '⚪ Offline'} (${result.status})`);
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
      video_id: result.is_live ? result.video_id : cam.video_id,
      last_live_at: result.is_live ? nowIso : (prev.last_live_at || null),
      status: result.status,
      name: cam.name,
      platform: 'youtube',
      handle: cam.youtube_handle
    };

    console.log(`[${cam.name}] ${result.is_live ? '🔴 LIVE (' + result.video_id + ')' : '⚪ Offline'} (${result.status})`);
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
      video_id: result.is_live ? result.video_id : null,
      last_live_at: result.is_live ? nowIso : (prev.last_live_at || null),
      status: result.status,
      name: streamer.name,
      platform: 'youtube',
      handle: streamer.youtube_handle
    };

    console.log(`[${streamer.name}] ${result.is_live ? '🔴 LIVE (' + result.video_id + ')' : '⚪ Offline'} (${result.status})`);
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
      console.log(`[Kick: ${creator.name}] ${result.is_live ? '🟢 LIVE' : '⚪ Offline'} (${result.status})`);
    } else if (creator.platform === 'both' || creator.kick_channel) {
      result = await checkYouTubeChannel(creator.handle, null, creator.channel_id, creator.name);
      if (result.is_live) {
        console.log(`[YouTube (Both): ${creator.name}] 🔴 LIVE (${result.status})`);
      } else {
        const kickSlug = creator.kick_channel || creator.channel_id || creator.slug;
        const kickResult = await checkKickChannel(kickSlug);
        if (kickResult.is_live) {
          result = kickResult;
          console.log(`[Kick (Both): ${creator.name}] 🟢 LIVE on Kick!`);
        } else {
          console.log(`[Both: ${creator.name}] ⚪ Offline on both YouTube & Kick`);
        }
      }
    } else {
      result = await checkYouTubeChannel(creator.handle, null, creator.channel_id, creator.name);
      console.log(`[YouTube: ${creator.name}] ${result.is_live ? '🔴 LIVE (' + result.video_id + ')' : '⚪ Offline'} (${result.status})`);
    }

    nextEntities[entityKey] = {
      is_live: result.is_live,
      video_id: result.video_id || null,
      last_live_at: result.is_live ? nowIso : (prev.last_live_at || null),
      status: result.status,
      name: creator.name,
      platform: result.platform || creator.platform,
      handle: creator.handle,
      kick_channel: creator.kick_channel || null,
      avatar_url: creator.avatar_url || result.avatar_url || null
    };
  }

  const payload = {
    last_check: nowIso,
    entities: nextEntities
  };

  fs.writeFileSync(statusPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\n✓ Successfully updated stream_status.json at ${nowIso}`);
}

run();
