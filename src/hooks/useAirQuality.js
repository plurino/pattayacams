'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useAirQuality — Real-time Pattaya air-quality from the WAQI Worker proxy.
 *
 * Why proxied through the Worker:
 *  - The WAQI API token (`WAQI_API_TOKEN`) is a Worker secret; exposing it on the
 *    client would leak it and let anyone burn the 1,000 req/day free quota.
 *  - The Worker caches each geo lookup for 15 min (matches this hook's poll
 *     interval) so a returning visitor hits the Worker memory cache, not WAQI.
 *  - The Worker normalises the response into a small, stable shape the UI
 *    can rely on regardless of upstream WAQI drift.
 *
 * Poll cadence: 15 min (= 96 calls/day × number of active tabs; well under
 * the 1,000/day WAQI free quota even with multiple sessions open).
 *
 * Cache: module-level (NOT localStorage) — AQI changes too fast to make a
 * 15-min localStorage read worthwhile on a frequently-visited tourist site.
 */

const WORKER_BASE = 'https://pattayacams.plurinoltd.workers.dev';
const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const REQUEST_TIMEOUT_MS = 9_000;

// Pattaya downtown (matches useTickerData, useLiveStatusVerify default anchors).
const DEFAULT_LAT = 12.9276;
const DEFAULT_LON = 100.8771;
const DEFAULT_RADIUS_M = 10000;

// In-memory cache shared across hook instances on the same page so we don't
// hammer the Worker when many map components subscribe at once.
let moduleCache = null; // { data: AqiPayload, fetchedAtMs: number }
const CACHE_TTL_MS = 15 * 60 * 1000;

let inflightPromise = null; // de-dupe concurrent fetches

async function fetchAqi({ lat, lon, radius, signal }) {
  const url = `${WORKER_BASE}/api/aqi?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radius=${encodeURIComponent(radius)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`aqi request failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data;
}

async function getAqi({ lat, lon, radius }) {
  // Module-cache hit: return immediately.
  if (moduleCache && Date.now() - moduleCache.fetchedAtMs < CACHE_TTL_MS) {
    return { ...moduleCache.data, fromCache: true };
  }

  // De-dupe concurrent fetches (multiple components mount together).
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const data = await fetchAqi({ lat, lon, radius, signal: controller.signal });
      clearTimeout(timeoutId);
      moduleCache = { data, fetchedAtMs: Date.now() };
      return data;
    } finally {
      clearTimeout(timeoutId);
      inflightPromise = null;
    }
  })();

  return inflightPromise;
}

function toNumberOrNull(v) {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function normalizeAqi(raw) {
  if (!raw) return null;
  const aqi = toNumberOrNull(raw.aqi);
  // WAQI returns "aqi": "-" when the station has no current reading. Treat that as null.
  if (aqi === null) return null;

  return {
    aqi,
    pm25: toNumberOrNull(raw.pm25),
    pm10: toNumberOrNull(raw.pm10),
    o3: toNumberOrNull(raw.o3),
    no2: toNumberOrNull(raw.no2),
    so2: toNumberOrNull(raw.so2),
    co: toNumberOrNull(raw.co),
    temperature: toNumberOrNull(raw.t),
    wind: toNumberOrNull(raw.w),
    humidity: toNumberOrNull(raw.h),
    city: typeof raw.city === 'string' ? raw.city : null,
    station: typeof raw.station === 'string' ? raw.station : null,
    distanceM: toNumberOrNull(raw.distance_m),
    fetchedAt: typeof raw.fetchedAt === 'string' ? raw.fetchedAt : null,
    source: typeof raw.source === 'string' ? raw.source : 'waqi',
  };
}

export function useAirQuality(options = {}) {
  const { lat = DEFAULT_LAT, lon = DEFAULT_LON, radius = DEFAULT_RADIUS_M, enabled = true } = options;

  const [data, setData] = useState(() => {
    if (moduleCache && Date.now() - moduleCache.fetchedAtMs < CACHE_TTL_MS) {
      return normalizeAqi(moduleCache.data);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(data === null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() =>
    moduleCache && Date.now() - moduleCache.fetchedAtMs < CACHE_TTL_MS ? moduleCache.fetchedAtMs : null
  );
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function poll() {
      // Skip fetch if module cache is still warm.
      if (moduleCache && Date.now() - moduleCache.fetchedAtMs < CACHE_TTL_MS) {
        if (!cancelled) {
          setData(normalizeAqi(moduleCache.data));
          setLastUpdated(moduleCache.fetchedAtMs);
          setIsLoading(false);
        }
        return;
      }

      try {
        const raw = await getAqi({ lat, lon, radius });
        if (cancelled) return;
        const normalized = normalizeAqi(raw);
        // Some upstream errors come back as `aqi: null` with `source: 'waqi_error'`.
        // We still want to surface that as the latest fetch (so the UI can decide).
        setData(normalized);
        setLastUpdated(Date.now());
        setIsLoading(false);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        // Network blip — keep the previous data if we have any, surface the error.
        setError(err && err.message ? err.message : String(err));
        setIsLoading(false);
      }
    }

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [lat, lon, radius, enabled]);

  return {
    aqi: data ? data.aqi : null,
    pm25: data ? data.pm25 : null,
    pm10: data ? data.pm10 : null,
    o3: data ? data.o3 : null,
    no2: data ? data.no2 : null,
    so2: data ? data.so2 : null,
    co: data ? data.co : null,
    temperature: data ? data.temperature : null,
    wind: data ? data.wind : null,
    humidity: data ? data.humidity : null,
    city: data ? data.city : 'Pattaya',
    station: data ? data.station : null,
    distanceM: data ? data.distanceM : null,
    isLoading,
    lastUpdated,
    error,
    source: data ? data.source : null,
  };
}

export default useAirQuality;