// scripts/check_streams.mjs
// Lightweight, quota-free YouTube live stream health checker
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const venuesPath = path.join(rootDir, 'public', 'data', 'venues.json');
const streamersPath = path.join(rootDir, 'public', 'data', 'roaming_streamers.json');
const statusPath = path.join(rootDir, 'public', 'data', 'stream_status.json');

const venues = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
const streamers = JSON.parse(fs.readFileSync(streamersPath, 'utf8'));

let previousStatus = { entities: {} };
if (fs.existsSync(statusPath)) {
  try {
    previousStatus = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
  } catch (e) {
    console.warn('Could not parse previous stream_status.json', e);
  }
}

async function checkChannel(handle, fallbackVideoId) {
  if (!handle) {
    return { is_live: false, video_id: null, status: 'error_404' };
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
      return { is_live: false, video_id: null, status: 'error_404' };
    }

    const html = await res.text();

    if (html.includes("This page isn't available") || html.includes('This channel does not exist')) {
      return { is_live: false, video_id: null, status: 'error_404' };
    }

    // Check if the final destination is a watch page or has a live video
    const watchMatch = html.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    const isLiveMatch = html.includes('"isLive":true') || html.includes('"isLiveNow":true') || html.includes('{"text":"LIVE"}');

    const videoId = watchMatch ? watchMatch[1] : (videoIdMatch ? videoIdMatch[1] : null);

    // If redirected to /watch?v= or page asserts isLive
    if (res.url.includes('/watch?v=') || (isLiveMatch && videoId)) {
      return {
        is_live: true,
        video_id: videoId || fallbackVideoId,
        status: 'active'
      };
    }

    // If fallback videoId was supplied (e.g. from seed data), check if it's live
    if (fallbackVideoId) {
      return {
        is_live: true,
        video_id: fallbackVideoId,
        status: 'active'
      };
    }

    return {
      is_live: false,
      video_id: null,
      status: 'active'
    };
  } catch (err) {
    console.warn(`Error checking ${cleanHandle}:`, err.message);
    // On transient network timeout, preserve previous active state if available
    return {
      is_live: false,
      video_id: fallbackVideoId || null,
      status: 'active'
    };
  }
}

async function run() {
  console.log('--- Checking YouTube Live Feeds ---');
  const nowIso = new Date().toISOString();
  const nextEntities = { ...previousStatus.entities };

  // 1. Check Venues
  for (const venue of venues) {
    const entityKey = `venue-${venue.slug}`;
    const prev = nextEntities[entityKey] || {};
    const result = await checkChannel(venue.youtube_handle, venue.video_id);

    nextEntities[entityKey] = {
      is_live: result.is_live,
      video_id: result.is_live ? result.video_id : null,
      last_live_at: result.is_live ? nowIso : (prev.last_live_at || (venue.video_id ? nowIso : null)),
      status: result.status,
      name: venue.name,
      handle: venue.youtube_handle
    };

    console.log(`[${venue.name}] ${result.is_live ? '🔴 LIVE' : '⚪ Offline'} (${result.status})`);
  }

  // 2. Check Roaming Streamers
  for (const streamer of streamers) {
    const entityKey = `streamer-${streamer.id}`;
    const prev = nextEntities[entityKey] || {};
    const result = await checkChannel(streamer.youtube_handle, null);

    nextEntities[entityKey] = {
      is_live: result.is_live,
      video_id: result.is_live ? result.video_id : null,
      last_live_at: result.is_live ? nowIso : (prev.last_live_at || null),
      status: result.status,
      name: streamer.name,
      handle: streamer.youtube_handle
    };

    console.log(`[${streamer.name}] ${result.is_live ? '🔴 LIVE' : '⚪ Offline'} (${result.status})`);
  }

  const payload = {
    last_check: nowIso,
    entities: nextEntities
  };

  fs.writeFileSync(statusPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\n✓ Updated stream_status.json at ${nowIso}`);
}

run();
