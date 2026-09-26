'use client';

import { useState, useEffect } from 'react';

const WEATHER_CACHE_KEY = 'pattayacams_weather_cache';
const WEATHER_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const FX_CACHE_KEY = 'pattayacams_fx_cache';
const FX_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getWeatherCondition(code) {
  if (code === 0) return { label: 'Clear Sky', icon: '☀️' };
  if (code <= 3) return { label: 'Partly Cloudy', icon: '⛅' };
  if (code === 45 || code === 48) return { label: 'Hazy', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { label: 'Light Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 65) return { label: 'Rain', icon: '🌧️' };
  if (code >= 80 && code <= 82) return { label: 'Showers', icon: '🌦️' };
  if (code >= 95) return { label: 'Thunderstorm', icon: '⛈️' };
  return { label: 'Tropical', icon: '🌴' };
}

export function useTickerData() {
  const [ictTime, setIctTime] = useState('');
  const [weather, setWeather] = useState(null);
  const [rates, setRates] = useState(null);
  const [isHeavyRain, setIsHeavyRain] = useState(false);
  const [rainRate, setRainRate] = useState(0);

  // 1. Indochina Time (ICT / UTC+7) Clock
  useEffect(() => {
    const updateTime = () => {
      try {
        const formatter = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        setIctTime(formatter.format(new Date()));
      } catch {
        // Fallback calculation
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const ict = new Date(utc + 7 * 3600000);
        setIctTime(ict.toTimeString().slice(0, 8));
      }
    };

    let timer = null;
    const startClock = () => {
      updateTime();
      timer = setInterval(updateTime, 1000);
    };
    const stopClock = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') {
        startClock();
      } else {
        stopClock();
      }
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      startClock();
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      stopClock();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, []);

  // 2. Open-Meteo Pattaya Weather
  useEffect(() => {
    async function fetchWeather() {
      // Check localStorage cache
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(WEATHER_CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < WEATHER_CACHE_TTL) {
              setWeather(data);
              const p = data.precipitation || 0;
              setRainRate(p);
              setIsHeavyRain(p >= 15);
              return;
            }
          } catch (e) {
            console.warn('Weather cache parse error', e);
          }
        }
      }

      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=12.9276&longitude=100.8771&current=temperature_2m,relative_humidity_2m,weather_code,precipitation,wind_speed_10m,wind_direction_10m,uv_index&daily=uv_index_max,uv_index_clear_sky_max&timezone=Asia%2FBangkok&forecast_days=1'
        );
        if (!res.ok) return;
        const json = await res.json();
        const current = json.current;
        const daily = json.daily;
        if (!current) return;

        const condition = getWeatherCondition(current.weather_code);
        const uvNow = typeof current.uv_index === 'number' ? current.uv_index : null;
        const uvMax = daily && Array.isArray(daily.uv_index_max) ? daily.uv_index_max[0] : null;
        const uvClearSkyMax = daily && Array.isArray(daily.uv_index_clear_sky_max) ? daily.uv_index_clear_sky_max[0] : null;
        const uvValue = uvNow ?? uvMax ?? uvClearSkyMax ?? null;

        const weatherPayload = {
          temp: Math.round(current.temperature_2m),
          humidity: current.relative_humidity_2m,
          wind: Math.round(current.wind_speed_10m),
          windDirection: typeof current.wind_direction_10m === 'number' ? current.wind_direction_10m : null,
          precipitation: current.precipitation || 0,
          condition: condition.label,
          icon: condition.icon,
          uvIndex: uvValue !== null ? Math.round(uvValue * 10) / 10 : null,
        };

        setWeather(weatherPayload);
        const p = weatherPayload.precipitation;
        setRainRate(p);
        setIsHeavyRain(p >= 15);

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            WEATHER_CACHE_KEY,
            JSON.stringify({ data: weatherPayload, timestamp: Date.now() })
          );
        }
      } catch (err) {
        console.warn('Weather fetch warning', err);
      }
    }

    let interval = null;
    const startPolling = () => {
      fetchWeather();
      interval = setInterval(fetchWeather, WEATHER_CACHE_TTL);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      startPolling();
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      stopPolling();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, []);

  // 3. Thai Baht (THB) Currency Rates via open.er-api.com
  useEffect(() => {
    async function fetchRates() {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(FX_CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < FX_CACHE_TTL) {
              setRates(data);
              return;
            }
          } catch (e) {
            console.warn('FX cache parse error', e);
          }
        }
      }

      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) return;
        const json = await res.json();
        const r = json.rates;
        if (!r || !r.THB) return;

        const thb = r.THB;
        const ratesPayload = {
          USD: thb.toFixed(2),
          GBP: (thb / (r.GBP || 0.75)).toFixed(2),
          EUR: (thb / (r.EUR || 0.86)).toFixed(2),
          AUD: (thb / (r.AUD || 1.39)).toFixed(2),
          CAD: (thb / (r.CAD || 1.36)).toFixed(2),
          JPY: (thb / (r.JPY || 150)).toFixed(3),
          SGD: (thb / (r.SGD || 1.30)).toFixed(2),
          CHF: (thb / (r.CHF || 0.85)).toFixed(2),
        };

        setRates(ratesPayload);

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            FX_CACHE_KEY,
            JSON.stringify({ data: ratesPayload, timestamp: Date.now() })
          );
        }
      } catch (err) {
        console.warn('FX rates fetch warning', err);
      }
    }

    let interval = null;
    const startPolling = () => {
      fetchRates();
      interval = setInterval(fetchRates, FX_CACHE_TTL);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      startPolling();
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      stopPolling();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, []);

  return {
    ictTime,
    weather,
    rates,
    isHeavyRain,
    rainRate,
  };
}
