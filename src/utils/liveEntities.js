import venuesData from '@/public/data/venues.json';
import liveCamsData from '@/public/data/live_cams.json';
import creatorsData from '@/public/data/creators.json';
import streamersData from '@/public/data/roaming_streamers.json';

/**
 * Single source of truth for genuine live entities across the entire application.
 *
 * Strict semantics:
 *   is_live === true    → "LIVE NOW" badge + video plays immediately
 *   is_live === false   → "Offline" badge
 *   is_live === undefined (or status missing) → "Unverified" badge, NOT live
 *
 * Every entity type uses the same strict rule. The previous `liveCams` filter
 * (`is_live !== false`) was too lenient — an empty statusInfo `{}` would always
 * pass through and cause "Live" badges on cams that were actually playing old
 * VODs. That bug is what made "all venues show 10 live but clicking plays old
 * video" happen. Fixed: strict equality required everywhere.
 */
export function isEntityLive(statusInfo) {
  return Boolean(statusInfo) && statusInfo?.is_live === true && statusInfo?.is_upcoming !== true;
}

export function isEntityUnverified(statusInfo) {
  if (!statusInfo) return true;
  return statusInfo.is_live !== true && statusInfo.is_live !== false && !statusInfo.status;
}

export function getLastCheckedAt(streamStatus) {
  return streamStatus?.last_check || null;
}

export function getLiveEntities(streamStatus) {
  const entities = streamStatus?.entities || {};
  const lastCheckedAt = getLastCheckedAt(streamStatus);

  // 1. Live Venues: Strictly requires is_live === true and not upcoming
  const liveVenues = venuesData.filter((v) => {
    const statusInfo = entities[`venue-${v.slug}`] || entities[v.slug];
    return isEntityLive(statusInfo);
  }).map((v) => {
    const statusInfo = entities[`venue-${v.slug}`] || entities[v.slug];
    return {
      ...v,
      type: 'venue',
      is_live: true,
      statusInfo,
      lastCheckedAt,
      video_id: statusInfo?.video_id || v.video_id,
      category: v.category ? v.category.replace('_', ' ') : 'Venue',
      platform: statusInfo?.platform || v.platform || 'youtube',
      handle: v.youtube_handle || null,
      youtube_channel_id: v.youtube_channel_id || null,
    };
  });

  // 2. 24/7 Live Webcams (Beach Road, Buakhao, etc.)
  // STRICT: require is_live === true. Empty statusInfo → NOT counted.
  const liveCams = liveCamsData.filter((c) => {
    const statusInfo = entities[`livecam-${c.slug}`] || entities[c.slug];
    return isEntityLive(statusInfo);
  }).map((c) => {
    const statusInfo = entities[`livecam-${c.slug}`] || entities[c.slug];
    return {
      ...c,
      type: 'livecam',
      is_live: true,
      statusInfo,
      lastCheckedAt,
      video_id: statusInfo?.video_id || c.video_id,
      category: '24/7 Live Cam',
      platform: statusInfo?.platform || c.platform || 'youtube',
      handle: c.youtube_handle || null,
      youtube_channel_id: c.youtube_channel_id || null,
    };
  });

  // 3. Creators & Roaming Streamers (strict)
  const creatorMap = new Map();
  creatorsData.forEach((c) => {
    const statusInfo = entities[`creator-${c.slug}`] || entities[c.slug];
    if (isEntityLive(statusInfo)) {
      creatorMap.set(c.slug, {
        ...c,
        key: `creator-${c.slug}`,
        category: 'IRL Streamer',
        type: 'creator',
        is_live: true,
        statusInfo,
        lastCheckedAt,
        video_id: statusInfo?.video_id || null,
        platform: statusInfo?.platform || c.platform || 'youtube',
        handle: c.handle || null,
        kick_channel: c.kick_channel || null,
      });
    }
  });

  streamersData.forEach((s) => {
    const key = (s.id || '').toLowerCase();
    if (!creatorMap.has(key)) {
      const statusInfo = entities[`streamer-${s.id}`];
      if (isEntityLive(statusInfo)) {
        creatorMap.set(key, {
          ...s,
          key: `streamer-${s.id}`,
          category: 'Roaming Streamer',
          type: 'streamer',
          is_live: true,
          statusInfo,
          lastCheckedAt,
          video_id: statusInfo?.video_id || null,
          platform: statusInfo?.platform || s.platform || 'youtube',
          handle: s.youtube_handle || null,
        });
      }
    }
  });

  const liveCreators = Array.from(creatorMap.values());

  // Unified master list for MultiCam Grid & Live Shuffle
  const allLiveOptions = [
    ...liveCams.map((c) => ({ ...c, key: `livecam-${c.slug}` })),
    ...liveVenues.map((v) => ({ ...v, key: `venue-${v.slug}` })),
    ...liveCreators,
  ];

  const totalLiveCount = allLiveOptions.length;

  return {
    liveVenues,
    liveCams,
    liveCreators,
    allLiveOptions,
    totalLiveCount,
    lastCheckedAt,
  };
}
