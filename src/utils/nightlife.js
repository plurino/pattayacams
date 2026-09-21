/**
 * Single source-of-truth for Pattaya nightlife vibe classification.
 *
 * Used by:
 *   - TickerBar / TickerOverflowMenu (chip label)
 *   - page.jsx Live Shuffle empty-state hint tooltip
 *
 * Both call sites previously shipped their own slightly-different copies of this
 * matrix with mismatched casing. Consolidating prevents label drift.
 */

const VIBE_MATRIX = [
  { startHour: 22, endHour: 27, label: 'Peak vibe',  icon: '🔥', sub: 'Walking St & Soi 6 Active',   nextStartHour: 22 },
  { startHour: 20, endHour: 22, label: 'Warming up', icon: '🍸', sub: 'Bars & Lounges Opening',     nextStartHour: 22 },
  { startHour: 17, endHour: 20, label: 'Happy hour', icon: '🍹', sub: 'Beach Sunset & Sundowners',  nextStartHour: 20 },
  { startHour: 12, endHour: 17, label: 'Day vibes',  icon: '🏖️', sub: 'Beach Clubs & Island Trips', nextStartHour: 17 },
  { startHour: 3,  endHour: 12, label: 'Recharging', icon: '🌙', sub: 'Pattaya resting before sunset', nextStartHour: 12 },
];

/**
 * Get current Pattaya nightlife vibe.
 * @param {Date} [now=new Date()]
 * @param {{ uppercase?: boolean }} [opts] - if `uppercase: true`, label is ALL-CAPS (for ticker chip UI)
 */
export function getNightlifeVibe(now = new Date(), { uppercase = false } = {}) {
  const ictHour = ((now.getUTCHours() + 7) % 24) + now.getUTCMinutes() / 60;

  const match = VIBE_MATRIX.find(({ startHour, endHour }) => {
    if (startHour > endHour) {
      // Wrap-around window (covers the night shift across midnight, e.g. 22 → 03)
      return ictHour >= startHour || ictHour < (endHour % 24);
    }
    return ictHour >= startHour && ictHour < endHour;
  });

  const row = match ?? VIBE_MATRIX[VIBE_MATRIX.length - 1];

  return {
    label: uppercase ? row.label.toUpperCase() : row.label,
    icon: row.icon,
    sub: row.sub,
    hour: ictHour,
  };
}

/**
 * Get the *next* nightlife vibe window. Useful for "next vibe at HH:MM" tooltips.
 * When already in Peak vibe, returns `{ isCurrentPeak: true }` so callers can render
 * "Peak vibe right now" instead of pointing at tomorrow.
 * @param {Date} [now=new Date()]
 */
export function getNextNightlifeHint(now = new Date()) {
  const vibe = getNightlifeVibe(now);

  if (vibe.label.toLowerCase() === 'peak vibe') {
    return { isCurrentPeak: true, hour: vibe.hour };
  }

  const row = VIBE_MATRIX.find((r) => r.label.toLowerCase() === vibe.label.toLowerCase());
  const nextStartHour = row?.nextStartHour ?? 22;

  return {
    label: vibe.label,
    hour: nextStartHour,
    minute: 0,
  };
}

/** Format an hour (0–23) and minute as "HH:MM" 24h. */
export function formatNightlifeTime(hour, minute = 0) {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const m = ((Math.floor(minute) % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
