/**
 * Safe browser localStorage manager for PattayaCams.com
 * Handles grid layouts, departure dates, and strictly enforced single-vote emoji telemetry
 */

const GRID_KEY = 'pattayacams_grid_v1';
const TRIP_DATE_KEY = 'pattayacams_trip_departure';
const TELEMETRY_KEY = 'pattayacams_telemetry_v3';
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
    return JSON.parse(raw);
  } catch (e) {
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
 * Emoji Telemetry (Strict Single-Vote Per User per Video/Entity)
 * Schema:
 * {
 *   [entitySlug]: {
 *     userVote: 'vibe' | 'busy' | 'quiet' | 'flood' | null,
 *     userVoteTime: timestamp,
 *     baseCounts: { busy: 12, quiet: 4, flood: 1, vibe: 25 }
 *   }
 * }
 */
const DEFAULT_BASE_COUNTS = {
  busy: 0,
  quiet: 0,
  flood: 0,
  vibe: 0,
};

export function getEntityReactions(slug) {
  if (!isClient() || !slug) return { busy: 0, quiet: 0, flood: 0, vibe: 0, userVoted: null };
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    const allData = raw ? JSON.parse(raw) : {};
    const entityData = allData[slug] || {};
    const now = Date.now();

    // Check if user vote is still within the 2-hour window
    const hasValidVote = entityData.userVote && (now - (entityData.userVoteTime || 0) < TWO_HOURS_MS);
    const userVoted = hasValidVote ? entityData.userVote : null;

    const base = entityData.baseCounts || { ...DEFAULT_BASE_COUNTS };

    return {
      busy: (base.busy || 0) + (userVoted === 'busy' ? 1 : 0),
      quiet: (base.quiet || 0) + (userVoted === 'quiet' ? 1 : 0),
      flood: (base.flood || 0) + (userVoted === 'flood' ? 1 : 0),
      vibe: (base.vibe || 0) + (userVoted === 'vibe' ? 1 : 0),
      userVoted,
    };
  } catch (e) {
    return { busy: 0, quiet: 0, flood: 0, vibe: 0, userVoted: null };
  }
}

/**
 * Casts or switches vote for an entity.
 * User can ONLY have 1 active vote per entity.
 * Clicking the same vote toggles it off.
 * Clicking another vote switches it.
 */
export function toggleEntityReaction(slug, reactionType) {
  if (!isClient() || !slug || !reactionType) return;
  try {
    const now = Date.now();
    const raw = localStorage.getItem(TELEMETRY_KEY);
    const allData = raw ? JSON.parse(raw) : {};

    if (!allData[slug]) {
      allData[slug] = {
        userVote: null,
        userVoteTime: 0,
        baseCounts: { ...DEFAULT_BASE_COUNTS },
      };
    }

    const entityData = allData[slug];
    if (!entityData.baseCounts) {
      entityData.baseCounts = { ...DEFAULT_BASE_COUNTS };
    }

    const currentVote = (now - (entityData.userVoteTime || 0) < TWO_HOURS_MS) ? entityData.userVote : null;

    if (currentVote === reactionType) {
      // Toggle off
      entityData.userVote = null;
      entityData.userVoteTime = 0;
    } else {
      // Set single vote
      entityData.userVote = reactionType;
      entityData.userVoteTime = now;
    }

    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(allData));
  } catch (e) {
    console.error('Failed to toggle reaction', e);
  }
}
