// scripts/fetch_creator_vods.mjs
// Quota-free RSS scraper fetching recent YouTube videos from Pattaya creators
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const creatorsPath = path.join(rootDir, 'public', 'data', 'creators.json');
const publicVideosPath = path.join(rootDir, 'public', 'data', 'creator_videos.json');
const rootVideosDir = path.join(rootDir, 'data');
const rootVideosPath = path.join(rootVideosDir, 'creator_videos.json');

if (!fs.existsSync(creatorsPath)) {
  console.error('Error: creators.json not found at', creatorsPath);
  process.exit(1);
}

const creators = JSON.parse(fs.readFileSync(creatorsPath, 'utf8'));
const youtubeCreators = creators.filter(c => (c.platform === 'youtube' || c.platform === 'both' || c.handle?.startsWith('@')) && c.channel_id && c.channel_id.startsWith('UC'));

console.log(`Found ${youtubeCreators.length} YouTube creators with valid channel IDs.`);

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/')
    .trim();
}

async function fetchChannelRss(channelId) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return null;
    }

    const xml = await res.text();
    return xml;
  } catch (err) {
    console.warn(`Failed to fetch RSS for ${channelId}:`, err.message);
    return null;
  }
}

const forbiddenKeywords = [
  'bar fine', 'barfine', 'gogo', 'go-go', 'ladyboy', 'freelancer',
  'escort', 'happy ending', 'massage parlor', 'soi 6 girls', 'red light', 'red-light'
];

function isCompliant(title) {
  const lower = (title || '').toLowerCase();
  return !forbiddenKeywords.some(kw => lower.includes(kw));
}

const liveOnlyChannels = ['pattaya-beach-live', 'pattayabob', 'ismannen'];

const scheduledOrLivePatterns = [
  /getting ready to go live/i,
  /going live/i,
  /is live\b/i,
  /are live\b/i,
  /live stream/i,
  /livestream/i,
  /live now/i,
  /live tonight/i,
  /sunday live/i,
  /midweek live/i,
  /night live/i,
  /members area live/i,
  /irl live/i,
  /irl stream/i,
  /the stream\b/i,
  /restart the stream/i,
  /miss the stream/i,
  /join our.*stream/i,
  /live from/i,
  /🔴/,
  /\blive\s*!/i,
  /\|\s*live\b/i,
  /-\s*live\b/i,
  /\[live\]/i,
  /\(live\)/i,
  /\bnew condo live\b/i,
  /\blive\s*$/i,
  /waiting room/i,
  /premiere in/i,
  /starts in \d+/i
];

function isScheduledOrLive(title, channelSlug) {
  if (liveOnlyChannels.includes(channelSlug)) return true;
  const t = (title || '').trim();
  return scheduledOrLivePatterns.some(p => p.test(t));
}

function parseEntries(xml, creator) {
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryBlock = match[1];

    const videoIdMatch = entryBlock.match(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/);
    const titleMatch = entryBlock.match(/<title>([\s\S]*?)<\/title>/);
    const publishedMatch = entryBlock.match(/<published>([\s\S]*?)<\/published>/);
    const thumbnailMatch = entryBlock.match(/<media:thumbnail[^>]+url="([^"]+)"/);

    if (videoIdMatch && titleMatch && publishedMatch) {
      const videoId = videoIdMatch[1];
      const title = decodeHtmlEntities(titleMatch[1]);

      if (!isCompliant(title)) {
        continue;
      }

      // Filter out live streams, scheduled waiting rooms, and 24/7 webcams from VOD feed
      if (isScheduledOrLive(title, creator.slug)) {
        continue;
      }

      const publishedAt = publishedMatch[1].trim();
      const thumbnailUrl = thumbnailMatch ? thumbnailMatch[1] : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      entries.push({
        id: videoId,
        title,
        channel_name: creator.name,
        channel_slug: creator.slug,
        channel_avatar: creator.avatar_url,
        thumbnail_url: thumbnailUrl,
        published_at: publishedAt,
        url: `https://www.youtube.com/watch?v=${videoId}`
      });
    }
  }

  return entries;
}

async function run() {
  console.log('=== Fetching Creator VODs via RSS Feeds ===\n');
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const allEntries = [];
  const fallbackEntries = [];

  for (const creator of youtubeCreators) {
    console.log(`[RSS] Fetching ${creator.name} (${creator.channel_id})...`);
    const xml = await fetchChannelRss(creator.channel_id);
    if (!xml) continue;

    const entries = parseEntries(xml, creator);
    console.log(`  -> Found ${entries.length} uploads`);

    for (const entry of entries) {
      const pubDate = new Date(entry.published_at);
      if (pubDate >= sevenDaysAgo) {
        allEntries.push(entry);
      } else if (pubDate >= thirtyDaysAgo) {
        fallbackEntries.push(entry);
      }
    }
  }

  // If 7-day window has few videos (e.g. low off-peak season), supplement with recent fallback uploads
  let finalVideos = [...allEntries];
  if (finalVideos.length < 20 && fallbackEntries.length > 0) {
    console.log(`\nSupplementing ${allEntries.length} 7-day videos with ${fallbackEntries.length} recent fallback videos...`);
    finalVideos = finalVideos.concat(fallbackEntries);
  }

  // Deduplicate by video id
  const seen = new Set();
  const deduplicated = [];
  for (const v of finalVideos) {
    if (!seen.has(v.id)) {
      seen.add(v.id);
      deduplicated.push(v);
    }
  }

  // Sort chronologically (newest first)
  deduplicated.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  const payload = {
    last_updated: now.toISOString(),
    total_videos: deduplicated.length,
    videos: deduplicated
  };

  // Write to public/data/creator_videos.json and data/creator_videos.json
  if (!fs.existsSync(rootVideosDir)) {
    fs.mkdirSync(rootVideosDir, { recursive: true });
  }

  const jsonStr = JSON.stringify(payload, null, 2);
  fs.writeFileSync(publicVideosPath, jsonStr, 'utf8');
  fs.writeFileSync(rootVideosPath, jsonStr, 'utf8');

  console.log(`\n✓ Saved ${deduplicated.length} sorted VODs to:`);
  console.log(`  - ${publicVideosPath}`);
  console.log(`  - ${rootVideosPath}`);
}

run();
