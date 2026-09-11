// scripts/check_streams.mjs
// Lightweight, quota-free YouTube & Kick live stream health checker
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const venuesPath = path.join(rootDir, 'public', 'data', 'venues.json');
const streamersPath = path.join(rootDir, 'public', 'data', 'roaming_streamers.json');
const creatorsPath = path.join(rootDir, 'public', 'data', 'creators.json');
const statusPath = path.join(rootDir, 'public', 'data', 'stream_status.json');

const venues = fs.existsSync(venuesPath) ? JSON.parse(fs.readFileSync(venuesPath, 'utf8')) : [];
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

async function checkYouTubeChannel(handle, fallbackVideoId) {
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

    // Check if the final destination has a live video
    const watchMatch = res.url.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    const videoId = watchMatch ? watchMatch[1] : (videoIdMatch ? videoIdMatch[1] : null);

    const hasLiveBadge = html.includes('"isLive":true') || 
                         html.includes('"isLiveNow":true') || 
                         html.includes('{"text":"LIVE"}') ||
                         html.includes('"label":"LIVE"');

    const isEnded = html.includes('Streamed live') || html.includes('"isLive":false');

    const isLive = Boolean(hasLiveBadge && !isEnded && videoId);

    return {
      is_live: isLive,
      video_id: videoId || fallbackVideoId || null,
      status: 'active',
      platform: 'youtube'
    };
  } catch (err) {
    console.warn(`Error checking YouTube ${cleanHandle}:`, err.message);
    return {
      is_live: false,
      video_id: fallbackVideoId || null,
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
    const result = await checkYouTubeChannel(venue.youtube_handle, venue.video_id);

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

    console.log(`[${venue.name}] ${result.is_live ? '🔴 LIVE' : '⚪ Offline'} (${result.status})`);
  }

  if (venuesUpdated) {
    fs.writeFileSync(venuesPath, JSON.stringify(venues, null, 2), 'utf8');
    console.log('✓ Synced updated live video IDs to venues.json');
  }

  // 2. Check Roaming Streamers (YouTube)
  console.log('\n--- Checking Roaming Streamers ---');
  for (const streamer of streamers) {
    const entityKey = `streamer-${streamer.id}`;
    const prev = nextEntities[entityKey] || {};
    const result = await checkYouTubeChannel(streamer.youtube_handle, null);

    nextEntities[entityKey] = {
      is_live: result.is_live,
      video_id: result.is_live ? result.video_id : null,
      last_live_at: result.is_live ? nowIso : (prev.last_live_at || null),
      status: result.status,
      name: streamer.name,
      platform: 'youtube',
      handle: streamer.youtube_handle
    };

    console.log(`[${streamer.name}] ${result.is_live ? '🔴 LIVE' : '⚪ Offline'} (${result.status})`);
  }

  // 3. Check Creators (YouTube & Kick)
  console.log('\n--- Checking Creators Hub (YouTube & Kick) ---');
  for (const creator of creators) {
    const entityKey = `creator-${creator.slug}`;
    const prev = nextEntities[entityKey] || {};

    let result;
    if (creator.platform === 'kick') {
      const kickSlug = creator.channel_id || creator.slug || creator.handle;
      result = await checkKickChannel(kickSlug);
      console.log(`[Kick: ${creator.name}] ${result.is_live ? '🟢 LIVE' : '⚪ Offline'} (${result.status})`);
    } else {
      result = await checkYouTubeChannel(creator.handle, null);
      console.log(`[YouTube: ${creator.name}] ${result.is_live ? '🔴 LIVE' : '⚪ Offline'} (${result.status})`);
    }

    nextEntities[entityKey] = {
      is_live: result.is_live,
      video_id: result.video_id || null,
      last_live_at: result.is_live ? nowIso : (prev.last_live_at || null),
      status: result.status,
      name: creator.name,
      platform: creator.platform,
      handle: creator.handle
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
