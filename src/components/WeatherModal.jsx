'use client';

import React, { useState, useEffect } from 'react';
import { X, CloudSun, Wind, Droplets, Calendar, Clock, MapPin, ExternalLink, RefreshCw, Sun, Compass } from 'lucide-react';

function getWeatherInfo(code) {
  if (code === 0) return { label: 'Clear Sky', icon: '☀️' };
  if (code === 1) return { label: 'Mainly Sunny', icon: '🌤️' };
  if (code === 2) return { label: 'Partly Cloudy', icon: '⛅' };
  if (code === 3) return { label: 'Overcast', icon: '☁️' };
  if (code === 45 || code === 48) return { label: 'Haze / Mist', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { label: 'Light Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 65) return { label: 'Rain Showers', icon: '🌧️' };
  if (code >= 80 && code <= 82) return { label: 'Tropical Downpour', icon: '⛈️' };
  if (code >= 95) return { label: 'Thunderstorm', icon: '⚡' };
  return { label: 'Tropical', icon: '🌴' };
}

function formatDayLabel(dateStr, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function WeatherModal({ isOpen, onClose, currentWeather }) {
  const [activeTab, setActiveTab] = useState('hourly'); // 'hourly' | 'daily' | 'radar'
  const [hourlyForecast, setHourlyForecast] = useState(null);
  const [dailyForecast, setDailyForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchForecast() {
      setLoading(true);
      setError(null);
      try {
        const url =
          'https://api.open-meteo.com/v1/forecast?latitude=12.9276&longitude=100.8771&hourly=temperature_2m,relative_humidity_2m,weather_code,precipitation_probability,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=Asia%2FBangkok';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch weather forecast');
        const json = await res.json();

        if (isMounted) {
          // 1. Process 24-Hour Hourly Forecast
          if (json.hourly && Array.isArray(json.hourly.time)) {
            const ictFormatter = new Intl.DateTimeFormat('sv-SE', {
              timeZone: 'Asia/Bangkok',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              hour12: false,
            });
            const currentIctHour = ictFormatter.format(new Date()).replace(' ', 'T') + ':00';
            let startIdx = json.hourly.time.findIndex((t) => t >= currentIctHour);
            if (startIdx === -1) startIdx = 0;

            const hourly = [];
            const endIdx = Math.min(startIdx + 24, json.hourly.time.length);
            for (let i = startIdx; i < endIdx; i++) {
              const timeStr = json.hourly.time[i];
              const hourPart = timeStr.split('T')[1];
              const code = json.hourly.weather_code[i];
              const info = getWeatherInfo(code);
              hourly.push({
                time: timeStr,
                hourLabel: i === startIdx ? 'Now' : hourPart,
                temp: Math.round(json.hourly.temperature_2m[i]),
                rainChance: json.hourly.precipitation_probability[i] ?? 0,
                wind: Math.round(json.hourly.wind_speed_10m[i] ?? 0),
                humidity: json.hourly.relative_humidity_2m[i] ?? 0,
                condition: info.label,
                icon: info.icon,
              });
            }
            setHourlyForecast(hourly);
          }

          // 2. Process 7-Day Daily Forecast
          if (json.daily && Array.isArray(json.daily.time)) {
            const days = [];
            for (let i = 0; i < json.daily.time.length; i++) {
              const code = json.daily.weather_code[i];
              const info = getWeatherInfo(code);
              days.push({
                date: json.daily.time[i],
                maxTemp: Math.round(json.daily.temperature_2m_max[i]),
                minTemp: Math.round(json.daily.temperature_2m_min[i]),
                rainChance: json.daily.precipitation_probability_max[i] ?? 0,
                maxWind: Math.round(json.daily.wind_speed_10m_max[i] ?? 0),
                condition: info.label,
                icon: info.icon,
              });
            }
            setDailyForecast(days);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchForecast();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-3xl rounded-2xl bg-surface border border-borderDark shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-borderDark bg-surfaceLight/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <CloudSun className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Pattaya 24-Hour & 7-Day Weather Radar</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-400 text-[10px] font-mono flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" /> 12.92°N, 100.87°E
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Real-time Gulf of Thailand meteorological telemetry & Open-Meteo ECMWF model
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Conditions Bar */}
        {currentWeather && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-canvas/60 border-b border-borderDark text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentWeather.icon}</span>
              <div>
                <div className="font-bold text-white text-base leading-none">
                  {currentWeather.temp}°C
                  <span className="text-xs font-normal text-slate-400 ml-2">{currentWeather.condition}</span>
                </div>
                <span className="text-[10px] text-slate-400">Pattaya Beach & Bay Area</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-blue-400" />
                <span>{currentWeather.humidity}% Humidity</span>
              </span>
              <span className="flex items-center gap-1">
                <Wind className="w-3 h-3 text-teal-400" />
                <span>{currentWeather.wind} km/h Wind</span>
              </span>
            </div>
          </div>
        )}

        {/* 3-Tab Switcher */}
        <div className="flex border-b border-borderDark bg-canvas/40 px-4 pt-2 gap-2 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab('hourly')}
            className={`pb-2 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'hourly'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>24-Hour Hourly Forecast</span>
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-2 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'daily'
                ? 'border-brandPink text-brandPink'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>7-Day Daily Forecast</span>
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`pb-2 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'radar'
                ? 'border-brandCyan text-brandCyan'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Live Animated Windy Map</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-mono">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Fetching Gulf of Thailand meteorological models...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300">
              <p className="font-semibold">Unable to fetch live forecast data.</p>
              <p className="text-[11px] text-slate-400 mt-1">{error}</p>
            </div>
          )}

          {/* TAB 1: 24-HOUR HOURLY FORECAST */}
          {activeTab === 'hourly' && hourlyForecast && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-semibold text-white">Next 24 Hours in Pattaya</span>
                <span>Scroll horizontally to view all hours ➔</span>
              </div>

              {/* Horizontal Scrollable Hourly Cards */}
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                {hourlyForecast.map((hour, idx) => (
                  <div
                    key={hour.time}
                    className={`min-w-[84px] p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all shrink-0 ${
                      idx === 0
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-canvas/70 border-borderDark hover:border-slate-600'
                    }`}
                  >
                    <span className={`text-[10px] font-bold ${idx === 0 ? 'text-amber-400 font-extrabold' : 'text-slate-300'}`}>
                      {hour.hourLabel}
                    </span>
                    <span className="text-2xl my-1.5">{hour.icon}</span>
                    <span className="text-white text-sm font-bold">{hour.temp}°C</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{hour.condition}</span>

                    <div className="mt-2 w-full pt-1.5 border-t border-borderDark/60 flex flex-col gap-1 text-[9px]">
                      <span className="text-blue-400 flex items-center justify-center gap-0.5" title="Precipitation Probability">
                        <Droplets className="w-2.5 h-2.5" />
                        {hour.rainChance}%
                      </span>
                      <span className="text-teal-400 flex items-center justify-center gap-0.5" title="Wind Speed">
                        <Wind className="w-2.5 h-2.5" />
                        {hour.wind}k
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: 7-DAY DAILY FORECAST */}
          {activeTab === 'daily' && dailyForecast && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {dailyForecast.map((day, idx) => (
                  <div
                    key={day.date}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                      idx === 0
                        ? 'bg-brandPink/15 border-brandPink/50 shadow-md shadow-brandPink/10'
                        : 'bg-canvas/70 border-borderDark hover:border-slate-600'
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase ${idx === 0 ? 'text-brandPink' : 'text-slate-300'}`}>
                      {formatDayLabel(day.date, idx)}
                    </span>
                    <span className="text-2xl my-1.5">{day.icon}</span>
                    <div className="flex items-baseline gap-1 font-bold">
                      <span className="text-white text-sm">{day.maxTemp}°</span>
                      <span className="text-slate-400 text-[11px]">{day.minTemp}°</span>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 line-clamp-1">{day.condition}</span>

                    {/* Rain Probability Badge */}
                    <div className="mt-2 w-full pt-1.5 border-t border-borderDark/60 flex items-center justify-between text-[9px]">
                      <span className="text-blue-400 flex items-center gap-0.5" title="Precipitation Probability">
                        <Droplets className="w-2.5 h-2.5" />
                        {day.rainChance}%
                      </span>
                      <span className="text-teal-400 flex items-center gap-0.5" title="Max Wind Speed">
                        <Wind className="w-2.5 h-2.5" />
                        {day.maxWind}k
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Climate Context Note */}
              <div className="p-3 rounded-xl bg-canvas/70 border border-borderDark text-[11px] text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pattaya Tropical Coastal Climate Guide</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Pattaya features a tropical wet and dry climate with three distinct seasons: Cool & Dry (November to February), Hot (March to May), and Monsoon (June to October). Sea breezes typically keep the coastal shoreline significantly fresher than inland Chonburi.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE WINDY RADAR */}
          {activeTab === 'radar' && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-borderDark bg-canvas shadow-inner">
                <iframe
                  title="Pattaya Live Windy Weather & Wind Radar"
                  width="100%"
                  height="360"
                  src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=default&metricTemp=default&radarRange=-1&algo=baseline&zoom=10&lat=12.9276&lon=100.8771"
                  frameBorder="0"
                  className="w-full h-80 sm:h-96"
                ></iframe>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Interactive satellite, wind particle dynamics & isobar layers</span>
                <a
                  href="https://www.windy.com/?12.928,100.877,10"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Open Fullscreen on Windy</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-borderDark bg-surfaceLight/30 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Official Open-Meteo & ECMWF Meteorological Data</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surfaceLight hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
