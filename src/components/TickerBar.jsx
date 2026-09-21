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
  MessageSquare,
  Waves,
  CloudRain,
} from 'lucide-react';
import { useTickerData } from '@/src/hooks/useTickerData';
import { usePattayaTelemetry } from '@/src/hooks/usePattayaTelemetry';
import { getSunsetStatus } from '@/src/utils/suncalc';
import { playTacticalClick } from '@/src/utils/sfx';
import CurrencyConverterModal from './CurrencyConverterModal';
import DryDayAlert from './DryDayAlert';
import AmbientRadioPlayer from './AmbientRadioPlayer';

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', symbol: '$1=' },
  { code: 'GBP', flag: '🇬🇧', symbol: '£1=' },
  { code: 'EUR', flag: '🇪🇺', symbol: '€1=' },
  { code: 'AUD', flag: '🇦🇺', symbol: 'A$1=' },
];

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
  return { label: 'MORNING CHILL', sub: 'Promenade & Coffee', icon: '☕', badge: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' };
}

export default function TickerBar({
  onOpenKohLarn,
  onOpenEvents,
  onOpenWeather,
  onOpenNewsletter,
  onOpenContact,
  onToggleAlerts,
  hasLiveAlerts = false,
  onStartTour,
}) {
  const { ictTime, weather, rates } = useTickerData();
  const telemetry = usePattayaTelemetry();
  const [sunsetInfo, setSunsetInfo] = useState(() => getSunsetStatus());
  const [currencyIndex, setCurrencyIndex] = useState(0);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [nightlifeVibe, setNightlifeVibe] = useState(() => getNightlifeVibe());

  useEffect(() => {
    const t = setInterval(() => {
      setSunsetInfo(getSunsetStatus());
      setNightlifeVibe(getNightlifeVibe());
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const activeCurrency = CURRENCIES[currencyIndex];

  return (
    <aside
      aria-label="Tactical Pattaya Telemetry Panel"
      className="bg-surface/95 border-b border-borderDark/80 backdrop-blur-md text-[11px] font-mono select-none z-40 w-full max-w-full overflow-hidden shadow-md text-slate-300"
    >
      {/* 2-Tier Tactical Panel: Substantial height across desktop & mobile */}
      <div className="flex flex-col divide-y divide-borderDark/50 w-full">
        {/* Tier 1: Environmental & Situational Intelligence */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-1 gap-2 overflow-x-auto no-scrollbar w-full min-h-[30px]">
          {/* Left: Clock, Sunset, Weather Microclimate, PM2.5 & Marine */}
          <div className="flex items-center gap-2 shrink-0">
            {/* ICT Digital Clock */}
            <button
              onClick={() => {
                playTacticalClick();
                if (onOpenWeather) onOpenWeather();
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-canvas/80 hover:bg-canvas border border-borderDark/80 hover:border-cyan-400/50 text-cyan-400 transition-colors shrink-0 cursor-pointer shadow-sm"
              title="Pattaya Local Time (ICT / UTC+7) • Click for 7-Day Forecast & Rain Radar"
            >
              <Clock className="w-3 h-3 text-brandCyan shrink-0" />
              <span className="font-bold tracking-wider">{ictTime || '--:--:--'}</span>
              <span className="text-[9px] text-slate-400 font-semibold">ICT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Sunset Countdown / Golden Hour */}
            {sunsetInfo && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/30 border border-amber-500/30 text-[10px] text-amber-300 font-mono shrink-0 shadow-sm"
                title={`Pattaya Bay & Koh Larn Sunset at ${sunsetInfo.sunsetTime} ICT`}
              >
                <span>{sunsetInfo.label}</span>
              </div>
            )}

            {/* Weather Microclimate */}
            {weather ? (
              <button
                onClick={() => {
                  playTacticalClick();
                  if (onOpenWeather) onOpenWeather();
                }}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-canvas/60 hover:bg-canvas border border-borderDark/60 hover:border-amber-400/50 text-slate-200 transition-colors cursor-pointer group shrink-0"
                title="Click for 7-Day Pattaya Forecast & Live Rain Radar"
              >
                <span className="text-xs group-hover:scale-110 transition-transform">{weather.icon}</span>
                <strong className="text-white">{weather.temp}°C</strong>
                <span className="text-slate-300">{weather.condition}</span>
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
                className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/30 border border-emerald-500/30 text-[10px] text-emerald-300 shrink-0"
                title={`Chonburi Air Quality: PM2.5 ${telemetry.pm25} µg/m³ (${telemetry.aqiLabel})`}
              >
                <span>🍃 PM2.5: <strong>{telemetry.pm25}</strong></span>
                <span className="text-[9px] text-emerald-400/80">({telemetry.aqiLabel})</span>
              </div>
            )}

            {/* Marine Wave Swell & Crossing Advisory */}
            {telemetry && (
              <button
                onClick={() => {
                  playTacticalClick();
                  if (onOpenKohLarn) onOpenKohLarn();
                }}
                className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-950/30 hover:bg-blue-950/50 border border-blue-500/30 text-[10px] text-cyan-300 shrink-0 cursor-pointer"
                title={`Pattaya Bay Wave Height: ${telemetry.waveHeightMeters}m • ${telemetry.waveAdvisory}`}
              >
                <Waves className="w-2.5 h-2.5 text-cyan-400" />
                <span>{telemetry.waveHeightMeters}m Swell</span>
                <span className="text-slate-400 text-[9px]">({telemetry.waveAdvisory.split('(')[0].trim()})</span>
              </button>
            )}
          </div>

          {/* Right: Nightlife Activity Meter & Dry Day Alert */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Nightlife Status Meter */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold shrink-0 ${nightlifeVibe.badge}`}
              title={`${nightlifeVibe.label} • ${nightlifeVibe.sub}`}
            >
              <span>{nightlifeVibe.icon}</span>
              <span className="tracking-wide">{nightlifeVibe.label}</span>
              <span className="hidden xl:inline text-slate-400 font-normal">({nightlifeVibe.sub})</span>
            </div>

            <DryDayAlert />
          </div>
        </div>

        {/* Tier 2: Operations, Currency FX & Visitor Utilities */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-1 gap-2 overflow-x-auto no-scrollbar w-full min-h-[30px]">
          {/* Left: Thai Baht FX Rates */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                playTacticalClick();
                setIsConverterOpen(true);
              }}
              className="flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-canvas/50 hover:bg-canvas border border-borderDark/50 hover:border-amber-400/60 text-[10px] transition-all cursor-pointer group shadow-sm shrink-0"
              title="Click to Open Interactive Thai Baht Currency Converter"
            >
              <div className="flex items-center gap-1 text-amber-400 font-bold group-hover:scale-105 transition-transform shrink-0">
                <TrendingUp className="w-3 h-3" />
                <span>THB FX:</span>
              </div>

              {rates ? (
                <div className="flex items-center gap-2 text-slate-300 font-mono">
                  <span title="US Dollar to Thai Baht" className="group-hover:text-white transition-colors">
                    <span className="mr-0.5">🇺🇸</span> $1=<strong className="text-amber-300">{rates.USD}฿</strong>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span title="British Pound to Thai Baht" className="group-hover:text-white transition-colors">
                    <span className="mr-0.5">🇬🇧</span> £1=<strong className="text-amber-300">{rates.GBP}฿</strong>
                  </span>
                  <span className="text-slate-600 hidden md:inline">•</span>
                  <span title="Euro to Thai Baht" className="hidden md:inline group-hover:text-white transition-colors">
                    <span className="mr-0.5">🇪🇺</span> €1=<strong className="text-amber-300">{rates.EUR}฿</strong>
                  </span>
                  <span className="text-slate-600 hidden xl:inline">•</span>
                  <span title="Australian Dollar to Thai Baht" className="hidden xl:inline group-hover:text-white transition-colors">
                    <span className="mr-0.5">🇦🇺</span> A$1=<strong className="text-amber-300">{rates.AUD}฿</strong>
                  </span>
                  <Calculator className="w-3 h-3 text-amber-400/80 group-hover:text-amber-300 ml-0.5 shrink-0" />
                </div>
              ) : (
                <span className="text-slate-500 text-[10px]">Updating Baht rates...</span>
              )}
            </button>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Doppler Rain Radar */}
            <button
              onClick={() => {
                playTacticalClick();
                if (onOpenWeather) onOpenWeather();
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-600/40 text-cyan-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0 cursor-pointer"
              title="Doppler Rain Radar & Satellite Precipitation"
            >
              <CloudRain className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
              <span>Rain Radar</span>
            </button>

            {/* Koh Larn Ferries */}
            <button
              onClick={() => {
                playTacticalClick();
                if (onOpenKohLarn) onOpenKohLarn();
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/40 hover:bg-blue-900/60 border border-blue-600/40 text-blue-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0 cursor-pointer"
              title="Bali Hai ⇄ Koh Larn 30฿ Ferries & Live Tides"
            >
              <Ship className="w-2.5 h-2.5 text-blue-400 shrink-0" />
              <span className="hidden sm:inline">Koh Larn</span>
              <span className="sm:hidden">Ferry</span>
            </button>

            {/* Event Radar */}
            <button
              onClick={() => {
                playTacticalClick();
                if (onOpenEvents) onOpenEvents();
              }}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/40 hover:bg-purple-900/60 border border-purple-600/40 text-purple-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0 cursor-pointer"
              title="Festivals, Nightlife Events & Thai Holidays"
            >
              <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />
              <span>Events</span>
            </button>

            {/* Drone Tour Mode */}
            {onStartTour && (
              <button
                onClick={() => {
                  playTacticalClick();
                  onStartTour();
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-brandPink/50 text-brandPink hover:text-white transition-colors text-[10px] font-semibold shrink-0 cursor-pointer"
                title="Cinematic Drone Tour across Walking Street, Beach Road & Soi Buakhao"
              >
                <span>🎬</span>
                <span className="hidden sm:inline">Drone Tour</span>
                <span className="sm:hidden">Tour</span>
              </button>
            )}

            {/* Contact Desk */}
            <button
              onClick={() => {
                playTacticalClick();
                if (onOpenContact) onOpenContact();
              }}
              className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0 cursor-pointer"
              title="Submit Live Stream, Feature Venue, or Report Bug"
            >
              <MessageSquare className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span>Contact</span>
            </button>

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
              <span>{hasLiveAlerts ? 'Alerts ON' : 'Alerts'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Currency Converter Modal */}
      <CurrencyConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
        rates={rates}
      />
    </aside>
  );
}
