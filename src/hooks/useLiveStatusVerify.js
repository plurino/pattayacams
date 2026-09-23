'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useLiveStatusVerify - Real-time YouTube live status verification via Worker.
 *
 * Polls `/api/check-live?ids=...` every 90 s for the entities currently on screen.
 * Up to 50 IDs per call (1 quota unit via YouTube Data API v3, never blocked).
 *
 * Static `stream_status.json` is the baseline (refreshed by GH Actions cron every 3 h);
 * this hook is the *real-time overlay* that keeps the badge truthful for entities the
 * user is actively viewing. If the Worker is unreachable, we keep the last-known verdict.
 */

const WORKER_BASE = 'https://pattayacams.plurinoltd.workers.dev';
const VERIFY_INTERVAL_MS = 90_000;
const BATCH_SIZE = 50;
const REQUEST_TIMEOUT_MS = 9_000;

const entityKey = (e) => e?.key || e?.slug || e?.id || e?.video_id || e?.handle;

export function useLiveStatusVerify(entities = [], enabled = true) {
  const [verdicts, setVerdicts] = useState({});
  const [lastVerifiedAt, setLastVerifiedAt] = useState(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;
    if (!Array.isArray(entities) || entities.length === 0) return undefined;

    let cancelled = false;

    const fetchBatch = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        // Build the work list: prefer video_id (1 API unit covers 50 of them).
        // Fall back to channel_id when video_id is missing.
        const byId = [];
        const byChannelId = [];
        for (const e of entities) {
          const k = entityKey(e);
          if (!k) continue;
          if (e.video_id && /^[A-Za-z0-9_-]{11}$/.test(e.video_id)) {
            byId.push({ key: k, video_id: e.video_id });
          } else if (e.youtube_channel_id || e.channel_id) {
            byChannelId.push({ key: k, channel_id: e.youtube_channel_id || e.channel_id });
          }
        }

        // ---- Batch 1: all known video_ids, single API call ----
        if (byId.length > 0) {
          for (let i = 0; i < byId.length; i += BATCH_SIZE) {
            if (cancelled) return;
            const chunk = byId.slice(i, i + BATCH_SIZE);
            const ids = chunk.map((c) => c.video_id).join(',');
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
              const res = await fetch(
                `${WORKER_BASE}/api/check-live?ids=${ids}`,
                { signal: controller.signal }
              );
              clearTimeout(timeoutId);
              if (!res.ok) throw new Error(`status ${res.status}`);
              const data = await res.json();
              if (cancelled) return;
              const results = data?.results || {};
              setVerdicts((prev) => {
                const next = { ...prev };
                for (const { key, video_id } of chunk) {
                  const v = results[video_id];
                  if (v) {
                    next[key] = {
                      is_live: v.is_live === true,
                      is_upcoming: v.is_upcoming === true,
                      is_error: false,
                      source: data.source || 'youtube_api',
                      video_id: v.video_id || video_id,
                      title: v.title,
                      viewers: v.concurrent_viewers,
                      started_at: v.started_at,
                      fetchedAt: data.fetchedAt,
                    };
                  } else if (v === null) {
                    // API explicitly returned nothing for this ID → video deleted/private
                    next[key] = {
                      is_live: false,
                      is_upcoming: false,
                      is_error: true,
                      source: 'deleted',
                      video_id,
                      fetchedAt: data.fetchedAt,
                    };
                  }
                  // undefined → keep prior verdict
                }
                return next;
              });
            } catch (err) {
              if (cancelled) return;
              // Mark the batch as unverified rather than wiping verdicts
              setVerdicts((prev) => {
                const next = { ...prev };
                for (const { key, video_id } of chunk) {
                  if (!next[key]) {
                    next[key] = { is_live: false, is_upcoming: false, is_error: true, source: 'fetch_failed', video_id, fetchedAt: new Date().toISOString() };
                  }
                }
                return next;
              });
            }
          }
        }

        // ---- Batch 2: entities without a known video_id → channel discovery ----
        // RSS-discovery polls are expensive (one API call per channel), so only
        // run them for entities where no verdict exists yet.
        if (byChannelId.length > 0 && !cancelled) {
          for (const { key, channel_id } of byChannelId) {
            if (cancelled) return;
            if (verdicts[key]) continue; // already have one
            try {
              const controller = new AbortController();
              const tid = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
              const res = await fetch(
                `${WORKER_BASE}/api/check-live?channel_id=${encodeURIComponent(channel_id)}`,
                { signal: controller.signal }
              );
              clearTimeout(tid);
              if (!res.ok) continue;
              const data = await res.json();
              if (cancelled) return;
              if (data.video_id) {
                setVerdicts((prev) => ({
                  ...prev,
                  [key]: {
                    is_live: data.is_live === true,
                    is_upcoming: false,
                    is_error: false,
                    source: data.source || 'rss_discovery',
                    video_id: data.video_id,
                    fetchedAt: data.fetchedAt,
                  },
                }));
              }
            } catch (_) { /* silent — try again next interval */ }
          }
        }

        if (!cancelled) setLastVerifiedAt(new Date());
      } finally {
        inFlightRef.current = false;
      }
    };

    fetchBatch();
    const intervalId = setInterval(fetchBatch, VERIFY_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [entities, enabled]);

  return { verdicts, lastVerifiedAt };
}

export default useLiveStatusVerify;
