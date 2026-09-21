'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Droplets,
  Wind,
  TrendingUp,
  Ship,
  Sparkles,
  Bell,
  Calculator,
  Waves,
  CloudSun,
  ShieldAlert,
} from 'lucide-react';
import { useTickerData } from '@/src/hooks/useTickerData';
import { usePattayaTelemetry } from '@/src/hooks/usePattayaTelemetry';
import { getSunsetStatus } from '@/src/utils/suncalc';
import { playTacticalClick } from '@/src/utils/sfx';
import DryDayAlert from './DryDayAlert';
import AmbientRadioPlayer from './AmbientRadioPlayer';

function getNightlifeVibe() {
  const now = new Date();
  const ictHours = (now.getUTCHours() + 7) % 24;
  if (ictHours >= 22 || ictHours < 3) {
    return { label: 'PEAK VIBE', sub: 'Walking St & Soi 6 Active', icon: '🔥', badge: 'bg-rose-950/60 border-rose-500/50 text-rose-300' };
  }
  if (ictHours >= 20) {
    return { label: 'WARMING UP', sub: 'Bars & Lounges Opening', icon: '🍸', badge: 'bg-amber-950/60 border-amber-500/50 text-amber-300' };
  }
  if (ictHours >= 17) {
    return { label: 'HAPPY HOUR', sub: 'Beach Sunset & Sundowners', icon: '🍹', badge: 'bg-orange-950/60 border-orange-500/50 text-orange-300' };
  }
  if (ictHours >= 12) {
    return { label: 'DAY VIBES', sub: 'Beach Clubs & Island Trips', icon: '🏖️', badge: 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300' };
  }
  return { label: 'RECHARGING', sub: 'Pattaya resting before sunset', icon: '🌙', badge: 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300' };
}

export default function TickerBar({
  onOpenKohLarn,
  onOpenEvents,
  onOpenWeather,
  onToggleAlerts,
  hasLiveAlerts = false,
  onOpenConverter,
  onOpenEmergency,
}) {
  const { ictTime, weather, rates } = useTickerData();
  const telemetry = usePattayaTelemetry();
  const [sunsetInfo, setSunsetInfo] = useState(() => getSunsetStatus());
  const [nightlifeVibe, setNightlifeVibe] = useState(() => getNightlifeVibe());

  useEffect(() => {
    const t = setInterval(() => {
      setSunsetInfo(getSunsetStatus());
      setNightlifeVibe(getNightlifeVibe());
    }, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside
      aria-label="Tactical Pattaya Telemetry Panel"
      className="bg-surface/95 border-b border-borderDark/80 backdrop-blur-md text-[11px] font-mono select-none z-40 w-full max-w-full overflow-hidden shadow-md text-slate-300"
    >
      {/* 3-Line Deep Tactical Architecture on medium & smaller screens, clean 2-row on widescreen */}
      <div className="flex flex-col divide-y divide-borderDark/60 w-full max-w-full">
        {/* LINE 1: Time, Solar Position, Nightlife Vibe & Holiday Alerts */}
        <div className="flex items-center justify-between px-2.5 sm:px-4 py-1 gap-2 flex-wrap w-full bg-canvas/30 min-h-[28px]">
          <div className="flex items-center gap-2 flex-wrap">
            {/* ICT Digital Clock */}
            <button
              onClick={() => {
                playTacticalClick();
                if (onOpenWeather) onOpenWeather();
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-canvas/90 hover:bg-canvas border border-borderDark/80 hover:border-cyan-400/50 text-cyan-400 transition-colors shrink-0 cursor-pointer shadow-sm"
              title="Pattaya Local Time (ICT / UTC+7) • Click for 7-Day Forecast & Weather Radar"
            >
              <Clock className="w-3 h-3 text-brandCyan shrink-0" />
              <span className="font-bold tracking-wider">{ictTime || '--:--:--'}</span>
              <span className="text-[9px] text-slate-400 font-semibold">ICT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Sunset Countdown / Golden Hour */}
            {sunsetInfo && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-300 font-mono shrink-0 shadow-sm"
                title={`Pattaya Bay & Koh Larn Sunset at ${sunsetInfo.sunsetTime} ICT`}
              >
                <span>{sunsetInfo.label}</span>
              </div>
            )}

            {/* Nightlife Vibe Meter */}
            {nightlifeVibe && (
              <div
                className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono shrink-0 shadow-sm ${nightlifeVibe.badge}`}
                title={nightlifeVibe.sub}
              >
                <span>{nightlifeVibe.icon}</span>
                <span className="font-bold">{nightlifeVibe.label}</span>
                <span className="text-slate-400 text-[9px] hidden md:inline">• {nightlifeVibe.sub}</span>
              </div>
            )}
          </div>

          {/* Right: Dry Day Alcohol Ban Alert */}
          <div className="flex items-center shrink-0">
            <DryDayAlert />
          </div>
        </div>

        {/* LINE 2: Environmental Telemetry, PM2.5, Swell & Foreign Exchange (THB) */}
        <div className="flex items-center justify-between px-2.5 sm:px-4 py-1 gap-2 flex-wrap w-full bg-canvas/50 min-h-[28px]">
          {/* Microclimate, AQI & Marine Wave Swell */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Weather Microclimate */}
            {weather ? (
              <button
                onClick={() => {
                  playTacticalClick();
                  if (onOpenWeather) onOpenWeather();
                }}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-canvas/70 hover:bg-canvas border border-borderDark/70 hover:border-amber-400/50 text-slate-200 transition-colors cursor-pointer group shrink-0"
                title="Click for 7-Day Pattaya Forecast & Live Weather Radar"
              >
                <span className="text-xs group-hover:scale-110 transition-transform">{weather.icon}</span>
                <strong className="text-white">{weather.temp}°C</strong>
                <span className="text-slate-300 hidden xs:inline">{weather.condition}</span>
                <span className="hidden md:flex items-center gap-0.5 text-slate-400 text-[10px]">
                  <Droplets className="w-2.5 h-2.5 text-blue-400" />
                  <span>{weather.humidity}%</span>
                </span>
                {telemetry && (
                  <span className="hidden lg:flex items-center gap-0.5 text-slate-400 text-[10px]">
                    <Wind className="w-2.5 h-2.5 text-cyan-400" />
                    <span>{telemetry.windSpeedKmh}km/h</span>
                  </span>
                )}
              </button>
            ) : null}

            {/* Air Quality / PM2.5 Live Index */}
            {telemetry && (
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono shrink-0 shadow-sm ${
                  telemetry.airQualityTier === 'Good'
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : telemetry.airQualityTier === 'Moderate'
                    ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
                title={`Pattaya Central Air Quality: ${telemetry.airQualityTier}`}
              >
                <span>PM2.5:</span>
                <strong>{telemetry.pm25}</strong>
                <span className="hidden sm:inline text-[9px] text-slate-400">({telemetry.airQualityTier})</span>
              </div>
            )}

            {/* Maritime Wave Swell & Marine Safety */}
            {telemetry && (
              <div
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950/30 border border-blue-500/30 text-[10px] text-blue-300 font-mono shrink-0 shadow-sm"
                title={`Gulf of Thailand Swell: ${telemetry.waveHeightM}m • Low rip risk`}
              >
                <Waves className="w-2.5 h-2.5 text-blue-400" />
                <span>Swell:</span>
                <strong>{telemetry.waveHeightM}m</strong>
              </div>
            )}
          </div>

          {/* Foreign Exchange (THB) Converter Trigger */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => {
                playTacticalClick();
                if (onOpenConverter) onOpenConverter();
              }}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-canvas/80 hover:bg-canvas border border-borderDark hover:border-amber-400/80 text-[10px] transition-all cursor-pointer group shadow-sm shrink-0"
              title="Click to Open Interactive Thai Baht Currency Converter"
            >
              <div className="flex items-center gap-1 text-amber-400 font-bold group-hover:scale-105 transition-transform shrink-0">
                <TrendingUp className="w-3 h-3" />
                <span>THB FX:</span>
              </div>

              {rates ? (
                <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                  <span title="US Dollar to Thai Baht" className="group-hover:text-white transition-colors">
                    <span className="mr-0.5">🇺🇸</span>$1=<strong className="text-amber-300">{rates.USD}฿</strong>
                  </span>
                  <span className="text-slate-600 hidden xs:inline">•</span>
                  <span title="British Pound to Thai Baht" className="hidden xs:inline group-hover:text-white transition-colors">
                    <span className="mr-0.5">🇬🇧</span>£1=<strong className="text-amber-300">{rates.GBP}฿</strong>
                  </span>
                  <span className="text-slate-600 hidden md:inline">•</span>
                  <span title="Euro to Thai Baht" className="hidden md:inline group-hover:text-white transition-colors">
                    <span className="mr-0.5">🇪🇺</span>€1=<strong className="text-amber-300">{rates.EUR}฿</strong>
                  </span>
                  <Calculator className="w-3 h-3 text-amber-400/80 group-hover:text-amber-300 ml-0.5 shrink-0" />
                </div>
              ) : (
                <span className="text-slate-500 text-[10px]">Tap to Convert Baht</span>
              )}
            </button>
          </div>
        </div>

        {/* LINE 3: Tactical Action Tools, Emergency Hotlines, Radio & Alerts */}
        <div className="flex items-center justify-between px-2.5 sm:px-4 py-1 gap-1.5 flex-wrap w-full bg-canvas/60 min-h-[28px]">
          {/* Action Buttons: Weather Radar, Ferry & Tides, Events, Tourist Emergency Hotlines */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Weather Radar (renamed from Rain Radar) */}
            <button
              onClick={() => {
                playTacticalClick();
                if (onOpenWeather) onOpenWeather();
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-600/40 text-cyan-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0 cursor-pointer shadow-sm"
              title="Doppler Weather Radar, Wind Vectors & Rain Precipitation"
            >
              <CloudSun className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
              <span>Weather Radar</span>
            </button>

            {/* Ferry & Tides (renamed from Koh Larn) */}
            <button
              onClick={() => {
                playTacticalClick();
                if (onOpenKohLarn) onOpenKohLarn();
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/40 hover:bg-blue-900/60 border border-blue-600/40 text-blue-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0 cursor-pointer shadow-sm"
              title="Bali Hai ⇄ Koh Larn 30฿ Ferries, Speedboats & Sea Tides"
            >
              <Ship className="w-2.5 h-2.5 text-blue-400 shrink-0" />
              <span>Ferry & Tides</span>
            </button>

            {/* Pattaya Event Radar */}
            <button
              onClick={() => {
                playTacticalClick();
                if (onOpenEvents) onOpenEvents();
              }}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/40 hover:bg-purple-900/60 border border-purple-600/40 text-purple-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0 cursor-pointer shadow-sm"
              title="Festivals, Nightlife Events & Thai Holidays"
            >
              <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />
              <span>Events</span>
            </button>

            {/* Tourist Emergency Hotlines (24/7 Police, City Hall, Hospital) */}
            <button
              onClick={() => {
                playTacticalClick();
                if (onOpenEmergency) onOpenEmergency();
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/50 hover:bg-rose-900/70 border border-rose-500/50 text-rose-300 hover:text-white transition-colors text-[10px] font-bold shrink-0 cursor-pointer shadow-sm hover:shadow-[0_0_8px_rgba(244,63,94,0.4)]"
              title="Pattaya Tourist Emergency: 24/7 Free Hotlines (Police 1155, City Hall 1337, ER 1719)"
            >
              <ShieldAlert className="w-2.5 h-2.5 text-rose-400 shrink-0" />
              <span>🚨 Hotlines</span>
            </button>
          </div>

          {/* Audio & Alerts Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <AmbientRadioPlayer />

            {/* Live Alerts Toggle */}
            <button
              onClick={() => {
                playTacticalClick();
                if (onToggleAlerts) onToggleAlerts();
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors text-[10px] font-semibold shrink-0 cursor-pointer ${
                hasLiveAlerts
                  ? 'bg-brandPink/20 border-brandPink/60 text-brandPink shadow-[0_0_8px_rgba(255,42,109,0.3)]'
                  : 'bg-surfaceLight hover:bg-slate-700 border-borderDark text-slate-300 hover:text-white'
              }`}
              title={hasLiveAlerts ? 'Stream Go-Live Alerts Active' : 'Enable Stream Go-Live Browser Alerts'}
            >
              <Bell className={`w-2.5 h-2.5 shrink-0 ${hasLiveAlerts ? 'text-brandPink fill-brandPink animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden xs:inline">{hasLiveAlerts ? 'Alerts ON' : 'Alerts'}</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
