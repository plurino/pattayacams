'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Droplets, Wind, TrendingUp, Ship, Sparkles, Bell, ChevronRight, Calculator, Mail, MessageSquare, Waves, Compass } from 'lucide-react';
import { useTickerData } from '@/src/hooks/useTickerData';
import { usePattayaTelemetry } from '@/src/hooks/usePattayaTelemetry';
import { getSunsetStatus } from '@/src/utils/suncalc';
import CurrencyConverterModal from './CurrencyConverterModal';
import DryDayAlert from './DryDayAlert';
import AmbientRadioPlayer from './AmbientRadioPlayer';

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', symbol: '$1=' },
  { code: 'GBP', flag: '🇬🇧', symbol: '£1=' },
  { code: 'EUR', flag: '🇪🇺', symbol: '€1=' },
  { code: 'AUD', flag: '🇦🇺', symbol: 'A$1=' },
];

export default function TickerBar({
  onOpenKohLarn,
  onOpenEvents,
  onOpenWeather,
  onOpenNewsletter,
  onOpenContact,
  onToggleAlerts,
  hasLiveAlerts = false,
}) {
  const { ictTime, weather, rates } = useTickerData();
  const telemetry = usePattayaTelemetry();
  const [sunsetInfo, setSunsetInfo] = useState(() => getSunsetStatus());
  const [currencyIndex, setCurrencyIndex] = useState(0);
  const [isConverterOpen, setIsConverterOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setSunsetInfo(getSunsetStatus()), 60000);
    return () => clearInterval(t);
  }, []);

  const activeCurrency = CURRENCIES[currencyIndex];

  const cycleCurrency = () => {
    setCurrencyIndex((prev) => (prev + 1) % CURRENCIES.length);
  };

  return (
    <div className="bg-surface/95 border-b border-borderDark/70 backdrop-blur-md text-[11px] font-mono select-none z-40 w-full max-w-full overflow-hidden shadow-inner text-slate-300">
      {/* 1. DESKTOP SINGLE ROW (>= xl screens, 1280px+) */}
      <div className="hidden xl:flex h-8 items-center justify-between px-3 sm:px-5 text-[11px] font-mono select-none w-full max-w-full overflow-hidden gap-2">
        {/* Left: Digital ICT Clock, Weather, Sunset, Marine Swell & Dry Day Alert */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-hidden">
          <button
            onClick={onOpenWeather}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-canvas/80 hover:bg-canvas border border-borderDark/80 hover:border-cyan-400/50 text-cyan-400 transition-colors shrink-0 cursor-pointer"
            title="Pattaya Local Time (ICT / UTC+7) • Click for 7-Day Forecast"
          >
            <Clock className="w-3 h-3 text-brandCyan shrink-0" />
            <span className="font-bold tracking-wider">{ictTime || '--:--:--'}</span>
            <span className="text-[9px] text-slate-400">ICT</span>
          </button>

          {weather ? (
            <button
              onClick={onOpenWeather}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-canvas/60 hover:bg-canvas border border-borderDark/60 hover:border-amber-400/50 text-slate-200 transition-colors cursor-pointer group shrink-0"
              title="Click for 7-Day Pattaya Forecast & Live Windy Satellite Map"
            >
              <span className="text-xs group-hover:scale-110 transition-transform">{weather.icon}</span>
              <span className="font-bold text-white">{weather.temp}°C</span>
              <span className="text-slate-300 truncate max-w-[75px] 2xl:max-w-[130px]">{weather.condition}</span>
              <span className="hidden 2xl:flex items-center gap-0.5 text-slate-400 text-[10px]">
                <Droplets className="w-2.5 h-2.5 text-blue-400" />
                <span>{weather.humidity}%</span>
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-slate-500 text-[10px] shrink-0">
              <span>🌴 Pattaya Weather...</span>
            </div>
          )}

          {sunsetInfo && (
            <div
              className="hidden 2xl:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-canvas/50 border border-borderDark/50 text-[10px] text-amber-300 font-mono shrink-0"
              title={`Sunset over Pattaya Bay & Koh Larn at ${sunsetInfo.sunsetTime} ICT`}
            >
              <span>{sunsetInfo.label}</span>
            </div>
          )}

          {telemetry && (
            <div
              className="hidden 2xl:flex items-center gap-2 px-1.5 py-0.5 rounded-md bg-canvas/40 border border-borderDark/40 text-[10px] text-slate-300 shrink-0"
              title={`Pattaya Bay Wave Height: ${telemetry.waveHeightMeters}m (${telemetry.waveAdvisory}) • PM2.5 Air: ${telemetry.pm25} µg/m³`}
            >
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <Waves className="w-2.5 h-2.5 text-cyan-400" />
                <span>{telemetry.waveHeightMeters}m Swell</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span>🍃 PM2.5: {telemetry.pm25}</span>
              </span>
            </div>
          )}

          <DryDayAlert />
        </div>

        {/* Center: Thai Baht FX Ticker */}
        <div className="shrink-0 flex items-center justify-center min-w-0">
          <button
            onClick={() => setIsConverterOpen(true)}
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
                <span className="text-slate-600 hidden 2xl:inline">•</span>
                <span title="Euro to Thai Baht" className="hidden 2xl:inline group-hover:text-white transition-colors">
                  <span className="mr-0.5">🇪🇺</span> €1=<strong className="text-amber-300">{rates.EUR}฿</strong>
                </span>
                <Calculator className="w-3 h-3 text-amber-400/80 group-hover:text-amber-300 ml-0.5 shrink-0" />
              </div>
            ) : (
              <span className="text-slate-500 text-[10px]">Updating Baht rates...</span>
            )}
          </button>
        </div>

        {/* Right: Visitor Utilities */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenKohLarn}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/40 hover:bg-blue-900/60 border border-blue-600/40 text-blue-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0 cursor-pointer"
            title="Koh Larn Bali Hai Ferry Timetable & Tide Tracker"
          >
            <Ship className="w-2.5 h-2.5 text-blue-400 shrink-0" />
            <span>Koh Larn Ferry</span>
          </button>

          <button
            onClick={onOpenEvents}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/40 hover:bg-purple-900/60 border border-purple-600/40 text-purple-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0 cursor-pointer"
            title="Upcoming Pattaya Events, Festivals & Holidays"
          >
            <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />
            <span>Events</span>
          </button>

          <button
            onClick={onOpenNewsletter}
            className="hidden 2xl:flex items-center gap-1 px-2 py-0.5 rounded bg-pink-950/40 hover:bg-pink-900/60 border border-brandPink/40 text-brandPink hover:text-white transition-colors text-[10px] font-semibold shrink-0 cursor-pointer"
            title="Join Pattaya Pulse VIP Dispatch"
          >
            <Mail className="w-2.5 h-2.5 text-brandPink shrink-0" />
            <span>VIP Club</span>
          </button>

          <button
            onClick={onOpenContact}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0 cursor-pointer"
            title="Contact Desk"
          >
            <MessageSquare className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            <span>Contact</span>
          </button>

          <AmbientRadioPlayer />

          <button
            onClick={onToggleAlerts}
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

      {/* 2. DEDICATED 2-LINE ROW (< xl screens: tablet, mobile, resized desktop) */}
      <div className="flex xl:hidden flex-col py-1.5 px-3 sm:px-4 gap-1 w-full max-w-full overflow-hidden text-[10px] font-mono">
        {/* Line 1: Clock, Weather, Sunset/DryDay, and Alerts */}
        <div className="flex items-center justify-between gap-1 w-full">
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Clock */}
            <button
              onClick={onOpenWeather}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-canvas/80 border border-borderDark text-cyan-400 font-bold"
              title="Pattaya Local Time (ICT)"
            >
              <Clock className="w-2.5 h-2.5 text-brandCyan shrink-0" />
              <span>{ictTime || '--:--:--'}</span>
              <span className="text-[8.5px] text-slate-400">ICT</span>
            </button>

            {/* Weather */}
            {weather && (
              <button
                onClick={onOpenWeather}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-canvas/60 border border-borderDark text-slate-200"
                title="Click for Forecast"
              >
                <span>{weather.icon}</span>
                <span className="font-bold text-white">{weather.temp}°C</span>
                <span className="text-slate-300 truncate max-w-[70px] sm:max-w-[120px]">{weather.condition}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <DryDayAlert />
            {sunsetInfo && (
              <span className="hidden sm:inline text-[9.5px] text-amber-300">
                {sunsetInfo.label}
              </span>
            )}
            <button
              onClick={onToggleAlerts}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9.5px] font-semibold ${
                hasLiveAlerts
                  ? 'bg-brandPink/20 border-brandPink/60 text-brandPink'
                  : 'bg-surfaceLight border-borderDark text-slate-300'
              }`}
            >
              <Bell className={`w-2.5 h-2.5 ${hasLiveAlerts ? 'text-brandPink fill-brandPink animate-pulse' : 'text-slate-400'}`} />
              <span>{hasLiveAlerts ? 'ON' : 'Alerts'}</span>
            </button>
          </div>
        </div>

        {/* Line 2: THB FX Currency Converter & Visitor Utilities */}
        <div className="flex items-center justify-between gap-1 w-full pt-1 border-t border-borderDark/40">
          {/* Left: THB Currency Cycler & Converter Button */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={cycleCurrency}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-canvas/70 border border-borderDark text-[9.5px] text-slate-300"
              title="Tap to cycle currency"
            >
              <span>{activeCurrency.flag}</span>
              <span>{activeCurrency.symbol}</span>
              <strong className="text-amber-300">
                {rates ? rates[activeCurrency.code] : '--.--'}฿
              </strong>
              <ChevronRight className="w-2 h-2 text-slate-500" />
            </button>
            <button
              onClick={() => setIsConverterOpen(true)}
              className="p-1 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300"
              title="Open Baht Calculator"
            >
              <Calculator className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Right: Ferry, Events, VIP, Contact, and Radio */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenKohLarn}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-950/40 border border-blue-600/40 text-blue-300 text-[9.5px] font-semibold"
              title="Koh Larn Ferry Schedule"
            >
              <Ship className="w-2.5 h-2.5 text-blue-400" />
              <span>Ferry</span>
            </button>
            <button
              onClick={onOpenEvents}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-600/40 text-purple-300 text-[9.5px] font-semibold"
              title="Upcoming Events"
            >
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              <span>Events</span>
            </button>
            <button
              onClick={onOpenContact}
              className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-[9.5px] font-semibold"
              title="Contact Desk"
            >
              <MessageSquare className="w-2.5 h-2.5 text-emerald-400" />
              <span>Contact</span>
            </button>
            <AmbientRadioPlayer />
          </div>
        </div>
      </div>

      {/* Currency Converter Interactive Popover / Modal */}
      <CurrencyConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
        rates={rates}
      />
    </div>
  );
}
