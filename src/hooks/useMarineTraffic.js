'use client';

import { useState, useEffect } from 'react';

/**
 * useMarineTraffic - Marine vessel telemetry over Pattaya Bay & Sattahip Gulf corridor.
 *
 * Architecture (matches useLiveFlights.js pattern):
 *   1. Try the Cloudflare Worker proxy at /api/marine (12s timeout via AbortController,
 *      which covers the cold-cache 6s AISStream collect window + network overhead).
 *   2. On failure, fall back to a local /data/marine_vessels.json snapshot.
 *   3. Poll every 20 seconds (reasonable AIS refresh rate for this corridor).
 *
 * The previous direct-WebSocket path to wss://stream.aisstream.io/v0/stream with a
 * hardcoded API key has been retired — it leaked the free-tier key and was unreliable
 * across browser WebSocket policies. The deprecated WebSocket code is preserved at the
 * bottom of this file for reference only and is not invoked.
 */

// Expanded Pattaya Bay, Koh Larn, Laem Chabang & Sattahip Gulf corridor
const PATTAYA_BBOX = [[12.40, 100.50], [13.40, 101.20]];
const WORKER_TIMEOUT_MS = 12000;
const POLL_INTERVAL_MS = 20000;

export function useMarineTraffic(enabled = false) {
  const [vessels, setVessels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchVessels = async () => {
    if (!enabled) return;
    setIsLoading(true);
    let res = null;

    // 1. Try Cloudflare Worker proxy with 12s timeout (covers cold-cache WS collect)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WORKER_TIMEOUT_MS);
      res = await fetch('https://pattayacams.plurinoltd.workers.dev/api/marine', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (_) {
      // Worker unreachable or timed out — will fall through to local snapshot
    }

    // 2. Fall back to local snapshot if Worker didn't return a usable response
    if (!res || !res.ok) {
      try {
        res = await fetch(`/data/marine_vessels.json?t=${Date.now()}`);
      } catch (_) {
        // Snapshot fetch also failed — surface offline state
      }
    }

    if (!res || !res.ok) {
      setIsOffline(true);
      setIsLoading(false);
      return;
    }

    try {
      const data = await res.json();
      const raw = Array.isArray(data?.vessels) ? data.vessels : [];

      const parsed = raw
        .filter((v) => typeof v.lat === 'number' && typeof v.lng === 'number')
        .map((v) => ({
          mmsi: String(v.mmsi ?? ''),
          name: (v.name || `MMSI-${v.mmsi}`).trim(),
          lat: v.lat,
          lng: v.lng,
          sog: typeof v.sog === 'number' ? v.sog : 0,
          cog: typeof v.cog === 'number' ? v.cog : 0,
          heading: typeof v.heading === 'number' ? v.heading : 0,
          type: v.type || 'Marine Vessel',
          lastSeen: typeof v.lastSeen === 'number' ? v.lastSeen : Date.now(),
        }));

      setVessels(parsed);
      // Worker stub returns source:'stub' (or source:'snapshot' on snapshot fallback).
      // If we got here via the Worker stub OR the local snapshot, we're effectively offline.
      const source = data?.source;
      setIsOffline(source === 'stub' || source === 'snapshot');
      setLastUpdated(new Date());
    } catch (_) {
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setVessels([]);
      setIsOffline(false);
      return undefined;
    }

    let intervalId = null;
    const startPolling = () => {
      fetchVessels();
      intervalId = setInterval(fetchVessels, POLL_INTERVAL_MS);
    };
    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      startPolling();
    }

    const onVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      stopPolling();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [enabled]);

  return {
    vessels,
    count: vessels.length,
    isOffline,
    isLoading,
    lastUpdated,
    refresh: fetchVessels,
    // Legacy alias — kept so any consumer reading `isConnected` still gets a sensible value.
    isConnected: !isOffline,
  };
}

// =============================================================================
// DEPRECATED: direct WebSocket path to aisstream.io (kept for reference only)
//
// The previous implementation opened a WebSocket directly from the browser to
// wss://stream.aisstream.io/v0/stream using a hardcoded free-tier API key. This
// was retired for two reasons:
//   (a) Shipping a free-tier API key in client JS is a leak — the key can be
//       extracted and abused, exhausting the daily quota and getting it revoked.
//   (b) Some browsers block third-party WebSocket connections from HTTPS pages,
//       leaving the layer silently dead with no fallback.
//
// The Worker-first / snapshot-fallback architecture above replaces this. If a
// real-time AIS feed is needed in the future, the Worker should hold the API
// key (as an env-bound secret) and either proxy a WebSocket or push snapshots
// on a timer. Do not resurrect the browser-side WebSocket.
//
// --- BEGIN DEPRECATED REFERENCE CODE (DO NOT INVOKE) ---
//
// const AISSTREAM_API_KEY = '<REMOVED>';
//
// function connect() {
//   const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
//   ws.onopen = () => {
//     ws.send(JSON.stringify({
//       APIKey: AISSTREAM_API_KEY,
//       BoundingBoxes: [PATTAYA_BBOX],
//       FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
//     }));
//   };
//   // ... onmessage / onerror / onclose handlers omitted
//   setTimeout(connect, 10000); // reconnect loop
// }
//
// --- END DEPRECATED REFERENCE CODE ---
