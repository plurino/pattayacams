'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * useLiveFlights - Live Flight Telemetry over Pattaya Bay & U-Tapao (UTP)
 * Powered by adsb.lol open real-time ADS-B point API (25 NM radius)
 *
 * Surfaces `isStale` so the UI can warn users when the snapshot is a fallback
 * (the Worker proxy is often rate-limited by adsb.lol during peak hours —
 * the local `live_flights.json` is then served, which can be hours/days old).
 */
export function useLiveFlights(enabled = false) {
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [source, setSource] = useState(null); // 'worker' | 'local' | null
  const [lastUpdated, setLastUpdated] = useState(null);
  const [snapshotAgeSeconds, setSnapshotAgeSeconds] = useState(null);
  const timerRef = useRef(null);

  const fetchFlights = async () => {
    if (!enabled) return;
    try {
      setIsLoading(true);
      let res = null;
      let fromWorker = false;

      // 1. Try Cloudflare Worker proxy endpoint with 3.5s timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        res = await fetch('https://pattayacams.plurinoltd.workers.dev/api/flights', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res && res.ok) fromWorker = true;
      } catch (_) {
        // Worker proxy unreached or timed out
      }

      // 2. Fallback to local live snapshot
      if (!res || !res.ok) {
        try {
          res = await fetch(`/data/live_flights.json?t=${Date.now()}`, { cache: 'no-store' });
        } catch (_) {
          // even snapshot fetch failed
        }
      }

      if (!res || !res.ok) return;
      const data = await res.json();

      const rawAc = data?.ac || [];
      const parsed = rawAc
        .filter((ac) => typeof ac.lat === 'number' && typeof ac.lon === 'number')
        .map((ac) => {
          const altFeet = ac.alt_baro === 'ground' ? 0 : (ac.alt_baro || ac.alt_geom || 0);
          return {
            id: ac.hex,
            callsign: (ac.flight || '').trim() || `ICAO-${ac.hex?.toUpperCase()}`,
            registration: ac.r || '',
            aircraftType: ac.t || 'JET',
            lat: ac.lat,
            lng: ac.lon,
            altitudeFeet: typeof altFeet === 'number' ? altFeet : 0,
            altitudeMeters: typeof altFeet === 'number' ? Math.round(altFeet * 0.3048) : 0,
            speedKnots: Math.round(ac.gs || 0),
            speedKmh: Math.round((ac.gs || 0) * 1.852),
            track: Math.round(ac.track || 0),
            squawk: ac.squawk || '',
          };
        });

      setFlights(parsed);
      setSource(fromWorker ? 'worker' : 'local');
      setLastUpdated(new Date());

      // Estimate snapshot age: adsb.lol snapshots include `snapshot` epoch seconds
      // when proxied; otherwise fall back to file LastWriteTime (we ship that
      // as `snapshotWrittenAtMs` via build-time, optional).
      const nowSec = Date.now() / 1000;
      const snapSec = typeof data?.snapshot === 'number' ? data.snapshot : null;
      if (snapSec) {
        setSnapshotAgeSeconds(Math.max(0, Math.round(nowSec - snapSec)));
        setIsStale(nowSec - snapSec > 120); // > 2 minutes old = stale
      } else {
        setSnapshotAgeSeconds(null);
        setIsStale(!fromWorker); // local fallback = always consider stale
      }
    } catch (_) {
      // Fail silently without console error spam
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setFlights([]);
      setIsStale(false);
      setSource(null);
      return;
    }

    fetchFlights();
    timerRef.current = setInterval(fetchFlights, 12000); // 12-second ADS-B refresh

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled]);

  return {
    flights,
    count: flights.length,
    isLoading,
    isStale,
    source,
    snapshotAgeSeconds,
    lastUpdated,
    refresh: fetchFlights,
  };
}
