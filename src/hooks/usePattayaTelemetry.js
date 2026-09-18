'use client';

import { useState, useEffect } from 'react';

/**
 * usePattayaTelemetry
 * Integrates Open-Meteo Microclimate, Air Quality (PM2.5), and Marine Wave APIs
 * (100% keyless, open CORS, zero quota consumption)
 */
export function usePattayaTelemetry() {
  const [telemetry, setTelemetry] = useState({
    temperature: 30,
    feelsLike: 34,
    humidity: 75,
    windSpeedKmh: 12,
    windDirection: 180,
    precipitationMm: 0,
    pm25: 8.5,
    aqiLabel: 'Good',
    waveHeightMeters: 0.35,
    waveDirection: 200,
    waveAdvisory: 'Calm Bay (Safe Crossing)',
    isRoughSea: false,
    lastFetched: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchTelemetry() {
      try {
        const [weatherRes, aqiRes, marineRes] = await Promise.allSettled([
          fetch(
            'https://api.open-meteo.com/v1/forecast?latitude=12.9345&longitude=100.8825&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m'
          ).then((r) => (r.ok ? r.json() : null)),
          fetch(
            'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=12.9345&longitude=100.8825&current=pm2_5,european_aqi'
          ).then((r) => (r.ok ? r.json() : null)),
          fetch(
            'https://marine-api.open-meteo.com/v1/marine?latitude=12.9255&longitude=100.85&current=wave_height,wave_direction,wave_period'
          ).then((r) => (r.ok ? r.json() : null)),
        ]);

        if (!isMounted) return;

        const weatherData = weatherRes.status === 'fulfilled' ? weatherRes.value?.current : null;
        const aqiData = aqiRes.status === 'fulfilled' ? aqiRes.value?.current : null;
        const marineData = marineRes.status === 'fulfilled' ? marineRes.value?.current : null;

        const waveHeight = marineData?.wave_height ?? 0.35;
        let waveAdvisory = 'Calm Bay (Safe Crossing)';
        let isRoughSea = false;
        if (waveHeight >= 1.2) {
          waveAdvisory = '⚠️ Rough Swell (Small Craft Alert)';
          isRoughSea = true;
        } else if (waveHeight >= 0.6) {
          waveAdvisory = 'Moderate Swell (Ferries OK)';
        }

        const pm25 = aqiData?.pm2_5 ?? 8.5;
        let aqiLabel = 'Good';
        if (pm25 > 35) aqiLabel = 'Sensitive';
        else if (pm25 > 15) aqiLabel = 'Moderate';

        setTelemetry({
          temperature: Math.round(weatherData?.temperature_2m ?? 30),
          feelsLike: Math.round(weatherData?.apparent_temperature ?? 34),
          humidity: Math.round(weatherData?.relative_humidity_2m ?? 75),
          windSpeedKmh: Math.round(weatherData?.wind_speed_10m ?? 12),
          windDirection: Math.round(weatherData?.wind_direction_10m ?? 180),
          precipitationMm: weatherData?.precipitation ?? 0,
          pm25: Number(pm25.toFixed(1)),
          aqiLabel,
          waveHeightMeters: Number(waveHeight.toFixed(2)),
          waveDirection: Math.round(marineData?.wave_direction ?? 200),
          waveAdvisory,
          isRoughSea,
          lastFetched: new Date(),
        });
      } catch (err) {
        console.warn('Pattaya telemetry fetch warning:', err);
      }
    }

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 600000); // 10-minute refresh

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return telemetry;
}
