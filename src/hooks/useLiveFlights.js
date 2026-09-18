'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * useLiveFlights - Live Flight Telemetry over Pattaya Bay & U-Tapao (UTP)
 * Powered by adsb.lol open real-time ADS-B point API (25 NM radius)
 */
export function useLiveFlights(enabled = false) {
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  const fetchFlights = async () => {
    if (!enabled) return;
    try {
      setIsLoading(true);
      let res = null;

      // 1. Try Cloudflare Worker proxy endpoint with 3.5s timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        res = await fetch('https://pattayacams.plurinoltd.workers.dev/api/flights', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (_) {
        // Worker proxy unreached or timed out
      }

      // 2. Fallback to local live snapshot
      if (!res || !res.ok) {
        res = await fetch(`/data/live_flights.json?t=${Date.now()}`);
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
      setLastUpdated(new Date());
    } catch (_) {
      // Fail silently without console error spam
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setFlights([]);
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
    lastUpdated,
    refresh: fetchFlights,
  };
}
