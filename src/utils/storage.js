/**
 * Safe browser localStorage manager for PattayaCams.com
 * Handles grid layouts, departure dates, and 2-hour sliding window emoji telemetry
 */

const GRID_KEY = 'pattayacams_grid_v1';
const TRIP_DATE_KEY = 'pattayacams_trip_departure';
const TELEMETRY_KEY = 'pattayacams_telemetry_v2';
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function isClient() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Grid Configuration (Multi-Cam Command Center)
 */
export function getSavedGridConfig() {
  if (!isClient()) return { mode: '2x2', slots: [null, null, null, null] };
  try {
    const raw = localStorage.getItem(GRID_KEY);
    if (!raw) return { mode: '2x2', slots: [null, null, null, null] };
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.error('Failed to load grid config from localStorage', e);
    return { mode: '2x2', slots: [null, null, null, null] };
  }
}

export function saveGridConfig(config) {
  if (!isClient()) return;
  try {
    localStorage.setItem(GRID_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save grid config', e);
  }
}

/**
 * Trip Departure Countdown Date
 */
export function getSavedTripDate() {
  if (!isClient()) return null;
  try {
    return localStorage.getItem(TRIP_DATE_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function saveTripDate(isoDateStr) {
  if (!isClient()) return;
  try {
    if (!isoDateStr) {
      localStorage.removeItem(TRIP_DATE_KEY);
    } else {
      localStorage.setItem(TRIP_DATE_KEY, isoDateStr);
    }
  } catch (e) {
    console.error('Failed to save trip date', e);
  }
}

export function clearTripDate() {
  if (!isClient()) return;
  try {
    localStorage.removeItem(TRIP_DATE_KEY);
  } catch (e) {
    console.error('Failed to clear trip date', e);
  }
}

/**
 * Emoji Telemetry with 2-Hour Sliding Window
 * Telemetry format:
 * {
 *   [entitySlug]: {
 *     busy: [timestamp1, timestamp2],
 *     quiet: [timestamp],
 *     flood: [timestamp],
 *     vibe: [timestamp]
 *   }
 * }
 */
export function getEntityReactions(slug) {
  if (!isClient() || !slug) return { busy: 0, quiet: 0, flood: 0, vibe: 0, userVoted: null };
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    if (!raw) return { busy: 0, quiet: 0, flood: 0, vibe: 0, userVoted: null };
    
    const allData = JSON.parse(raw);
    const entityData = allData[slug] || {};
    const now = Date.now();
    const cutoff = now - TWO_HOURS_MS;

    const counts = {
      busy: 0,
      quiet: 0,
      flood: 0,
      vibe: 0,
      userVoted: entityData.lastUserVote && (now - entityData.lastUserVoteTime < TWO_HOURS_MS) ? entityData.lastUserVote : null
    };

    ['busy', 'quiet', 'flood', 'vibe'].forEach((type) => {
      const timestamps = Array.isArray(entityData[type]) ? entityData[type] : [];
      // Filter out stamps older than 2 hours
      const valid = timestamps.filter(t => t > cutoff);
      counts[type] = valid.length;
    });

    return counts;
  } catch (e) {
    return { busy: 0, quiet: 0, flood: 0, vibe: 0, userVoted: null };
  }
}

export function addEntityReaction(slug, reactionType) {
  if (!isClient() || !slug || !reactionType) return;
  try {
    const now = Date.now();
    const cutoff = now - TWO_HOURS_MS;
    const raw = localStorage.getItem(TELEMETRY_KEY);
    const allData = raw ? JSON.parse(raw) : {};
    
    if (!allData[slug]) {
      allData[slug] = { busy: [], quiet: [], flood: [], vibe: [], lastUserVote: null, lastUserVoteTime: 0 };
    }

    const entityData = allData[slug];

    // Prune expired
    ['busy', 'quiet', 'flood', 'vibe'].forEach((type) => {
      if (Array.isArray(entityData[type])) {
        entityData[type] = entityData[type].filter(t => t > cutoff);
      } else {
        entityData[type] = [];
      }
    });

    // Add new vote timestamp
    if (entityData[reactionType]) {
      entityData[reactionType].push(now);
    }
    entityData.lastUserVote = reactionType;
    entityData.lastUserVoteTime = now;

    // Prune other entities in store that are wholly expired
    Object.keys(allData).forEach((k) => {
      const ent = allData[k];
      let hasValid = false;
      ['busy', 'quiet', 'flood', 'vibe'].forEach((type) => {
        if (Array.isArray(ent[type])) {
          ent[type] = ent[type].filter(t => t > cutoff);
          if (ent[type].length > 0) hasValid = true;
        }
      });
      if (!hasValid && (!ent.lastUserVoteTime || ent.lastUserVoteTime < cutoff)) {
        delete allData[k];
      }
    });

    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(allData));
  } catch (e) {
    console.error('Failed to record reaction', e);
  }
}
