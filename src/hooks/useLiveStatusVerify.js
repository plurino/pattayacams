'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useLiveStatusVerify - Real-time YouTube live status verification via Worker.
 *
 * The static `stream_status.json` is updated by a GH Actions cron that keeps
 * getting blocked by YouTube's datacenter IP filter, so live verdicts there
 * frequently lag reality by hours or days. This hook polls the Worker at
 * `/api/check-live?video_id=...` (or `handle=...`) for each entity the page
 * is currently displaying, returning a fresh verdict every few minutes.
 *
 * Used by MultiCamGrid and the Live Shuffle empty-state to verify that the
 * streams the user is about to watch are actually live right now — not stale
 * VODs from days ago.
 */

const WORKER_BASE = 'https://pattayacams.plurinoltd.workers.dev';
const VERIFY_INTERVAL_MS = 90_000; // 90 s — avoids hammering YouTube via Worker
const REQUEST_TIMEOUT_MS = 9_000;

/**
 * @param {Array} entities - list of objects with one or more of: video_id, youtube_handle, youtube_channel_id, handle, channel_id, slug, name
 * @param {boolean} enabled - gate polling (e.g., only run on Map View / MultiCam)
 */
export function useLiveStatusVerify(entities = [], enabled = true) {
  const [verdicts, setVerdicts] = useState({});
  const [lastVerifiedAt, setLastVerifiedAt] = useState(null);
  const inFlightRef = useRef(new Set());

  const entityKey = (e) => e?.key || e?.slug || e?.id || e?.video_id || e?.handle;

  useEffect(() => {
    if (!enabled) return undefined;
    if (!Array.isArray(entities) || entities.length === 0) return undefined;

    let cancelled = false;
    let intervalId = null;

    const fetchOne = async (entity) => {
      const key = entityKey(entity);
      if (!key) return;
      if (inFlightRef.current.has(key)) return; // de-dupe overlapping requests
      inFlightRef.current.add(key);

      // Build the query — prefer video_id (most direct), then channel id, then handle
      const params = new URLSearchParams();
      if (entity.video_id) params.set('v', entity.video_id);
      if (entity.youtube_channel_id || entity.channel_id) {
        params.set('channel_id', entity.youtube_channel_id || entity.channel_id);
      } else if (entity.youtube_handle || entity.handle) {
        params.set('handle', entity.youtube_handle || entity.handle);
      }

      const url = `${WORKER_BASE}/api/check-live?${params.toString()}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setVerdicts((prev) => ({
          ...prev,
          [key]: {
            is_live: data.is_live === true,
            is_upcoming: data.is_upcoming === true,
            is_error: data.is_error === true,
            source: data.source,
            video_id: data.video_id || entity.video_id,
            fetchedAt: data.fetchedAt,
          },
        }));
      } catch (err) {
        if (cancelled) return;
        setVerdicts((prev) => ({
          ...prev,
          [key]: { is_live: false, is_upcoming: false, is_error: true, source: 'fetch_failed', fetchedAt: new Date().toISOString() },
        }));
      } finally {
        inFlightRef.current.delete(key);
      }
    };

    const verifyAll = () => {
      // Prioritise entities without a verdict; only verify each at most once per interval
      const toVerify = entities.filter((e) => {
        const k = entityKey(e);
        return k && !verdicts[k];
      });
      // If everything has a verdict, refresh the oldest one to keep data fresh
      const candidates = toVerify.length > 0
        ? toVerify
        : entities.filter((e) => entityKey(e));
      // Cap concurrent fetches at 4 to be polite to the Worker / YouTube
      candidates.slice(0, 4).forEach(fetchOne);
      setLastVerifiedAt(new Date());
    };

    verifyAll();
    intervalId = setInterval(verifyAll, VERIFY_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [entities, enabled]);

  return { verdicts, lastVerifiedAt };
}

export default useLiveStatusVerify;
