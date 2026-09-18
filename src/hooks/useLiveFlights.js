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
      const res = await fetch('https://api.adsb.lol/v2/point/12.9345/100.8825/25');
      if (!res.ok) throw new Error(`ADS-B HTTP ${res.status}`);
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
    } catch (err) {
      console.warn('ADS-B Live Flights telemetry warning:', err);
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
