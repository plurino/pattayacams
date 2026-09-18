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
    <div className="h-8 bg-surface/95 border-b border-borderDark/70 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 text-[11px] font-mono select-none z-40 w-full max-w-full overflow-x-auto scrollbar-none shadow-inner text-slate-300 gap-2">
      {/* 1. Left: Digital ICT Clock, Weather, Sunset, Marine Swell & Dry Day Alert */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Indochina Time Clock */}
        <button
          onClick={onOpenWeather}
          className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-canvas/80 hover:bg-canvas border border-borderDark/80 hover:border-cyan-400/50 text-cyan-400 transition-colors shrink-0"
          title="Pattaya Local Time (ICT / UTC+7) • Click for 7-Day Forecast"
        >
          <Clock className="w-3 h-3 text-brandCyan shrink-0" />
          <span className="font-bold tracking-wider">{ictTime || '--:--:--'}</span>
          <span className="text-[9px] text-slate-400 hidden xs:inline">ICT</span>
        </button>

        {/* Weather Chip (Clickable) */}
        {weather ? (
          <button
            onClick={onOpenWeather}
            className="flex items-center gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-canvas/60 hover:bg-canvas border border-borderDark/60 hover:border-amber-400/50 text-slate-200 transition-colors cursor-pointer group shrink-0"
            title="Click for 7-Day Pattaya Forecast & Live Windy Satellite Map"
          >
            <span className="text-xs group-hover:scale-110 transition-transform">{weather.icon}</span>
            <span className="font-bold text-white">{weather.temp}°C</span>
            <span className="hidden md:inline text-slate-300">{weather.condition}</span>
            <span className="hidden lg:flex items-center gap-0.5 text-slate-400 text-[10px]">
              <Droplets className="w-2.5 h-2.5 text-blue-400" />
              <span>{weather.humidity}%</span>
            </span>
            <span className="hidden xl:flex items-center gap-0.5 text-slate-400 text-[10px]">
              <Wind className="w-2.5 h-2.5 text-teal-400" />
              <span>{weather.wind} km/h</span>
            </span>
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1 text-slate-500 text-[10px] shrink-0">
            <span>🌴 Pattaya Weather...</span>
          </div>
        )}

        {/* Sunset Countdown Chip */}
        {sunsetInfo && (
          <div
            className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-canvas/50 border border-borderDark/50 text-[10px] text-amber-300 font-mono shrink-0"
            title={`Sunset over Pattaya Bay & Koh Larn at ${sunsetInfo.sunsetTime} ICT`}
          >
            <span>{sunsetInfo.label}</span>
          </div>
        )}

        {/* Marine Wave Swell & PM2.5 Chip */}
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

        {/* Buddha Day Nationwide Alcohol Ban Alert */}
        <DryDayAlert />
      </div>

      {/* 2. Center: Thai Baht (THB) Exchange Ticker & Interactive Converter */}
      <div className="shrink-0 flex items-center justify-center min-w-0">
        {/* Mobile: 1-Tap Currency Cycler & Converter Launcher */}
        <div className="flex sm:hidden items-center gap-1">
          <button
            onClick={cycleCurrency}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-canvas/60 hover:bg-canvas border border-borderDark/60 hover:border-amber-400/50 text-[10px] font-mono text-slate-300 hover:text-white transition-colors"
            title="Tap to cycle currency (USD / GBP / EUR / AUD)"
          >
            <span>{activeCurrency.flag}</span>
            <span>{activeCurrency.symbol}</span>
            <strong className="text-amber-300">
              {rates ? rates[activeCurrency.code] : '--.--'}฿
            </strong>
            <ChevronRight className="w-2.5 h-2.5 text-slate-500" />
          </button>
          <button
            onClick={() => setIsConverterOpen(true)}
            className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 transition-colors"
            title="Open Thai Baht Converter"
          >
            <Calculator className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Desktop / Tablet: Clickable Multi-Currency Ticker (Compact & non-overflowing) */}
        <button
          onClick={() => setIsConverterOpen(true)}
          className="hidden sm:flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-canvas/50 hover:bg-canvas border border-borderDark/50 hover:border-amber-400/60 text-[10px] transition-all cursor-pointer group shadow-sm shrink-0"
          title="Click to Open Interactive Thai Baht Currency Converter & Street Exchange Guide"
        >
          <div className="flex items-center gap-1 text-amber-400 font-bold group-hover:scale-105 transition-transform shrink-0">
            <TrendingUp className="w-3 h-3" />
            <span className="hidden md:inline">THB FX:</span>
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
              <span className="text-slate-600 hidden xl:inline">•</span>
              <span title="Euro to Thai Baht" className="hidden xl:inline group-hover:text-white transition-colors">
                <span className="mr-0.5">🇪🇺</span> €1=<strong className="text-amber-300">{rates.EUR}฿</strong>
              </span>
              <span className="text-slate-600 hidden 2xl:inline">•</span>
              <span title="Australian Dollar to Thai Baht" className="hidden 2xl:inline group-hover:text-white transition-colors">
                <span className="mr-0.5">🇦🇺</span> A$1=<strong className="text-amber-300">{rates.AUD}฿</strong>
              </span>
              <Calculator className="w-3 h-3 text-amber-400/80 group-hover:text-amber-300 ml-0.5 shrink-0" />
            </div>
          ) : (
            <span className="text-slate-500 text-[10px]">Updating Baht rates...</span>
          )}
        </button>
      </div>

      {/* 3. Right: Visitor Utilities (Koh Larn Ferry, Events, VIP Club, Contact, Alerts) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Koh Larn Ferry (Hidden on mobile < sm) */}
        <button
          onClick={onOpenKohLarn}
          className="hidden sm:flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-blue-950/40 hover:bg-blue-900/60 border border-blue-600/40 text-blue-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0"
          title="Koh Larn Bali Hai Ferry Timetable & Tide Tracker"
        >
          <Ship className="w-2.5 h-2.5 text-blue-400 shrink-0" />
          <span className="hidden xl:inline">Koh Larn</span>
          <span>Ferry</span>
        </button>

        {/* Events (Hidden on mobile < md) */}
        <button
          onClick={onOpenEvents}
          className="hidden md:flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-purple-950/40 hover:bg-purple-900/60 border border-purple-600/40 text-purple-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0"
          title="Upcoming Pattaya Events, Festivals & Holidays"
        >
          <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />
          <span>Events</span>
        </button>

        {/* VIP Newsletter Dispatch (Hidden on tablet/mobile < xl) */}
        <button
          onClick={onOpenNewsletter}
          className="hidden xl:flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-pink-950/40 hover:bg-pink-900/60 border border-brandPink/40 text-brandPink hover:text-white transition-colors text-[10px] font-semibold shrink-0"
          title="Join Pattaya Pulse VIP Dispatch (Weekly Live Cam & Nightlife Alerts)"
        >
          <Mail className="w-2.5 h-2.5 text-brandPink shrink-0" />
          <span>VIP Club</span>
        </button>

        {/* Contact / Partner Desk (Hidden on mobile < lg) */}
        <button
          onClick={onOpenContact}
          className="hidden lg:flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 hover:text-white transition-colors text-[10px] font-semibold shrink-0"
          title="Contact Desk: Add Venue/Cam, Creator Verification, Advertising, or Bug Report"
        >
          <MessageSquare className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
          <span>Contact</span>
        </button>

        {/* Ambient Radio Player (Fabulous 103 FM Pattaya) */}
        <AmbientRadioPlayer />

        {/* Alerts Toggle */}
        <button
          onClick={onToggleAlerts}
          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded border transition-colors text-[10px] font-semibold shrink-0 ${
            hasLiveAlerts
              ? 'bg-brandPink/20 border-brandPink/60 text-brandPink shadow-[0_0_8px_rgba(255,42,109,0.3)]'
              : 'bg-surfaceLight hover:bg-slate-700 border-borderDark text-slate-300 hover:text-white'
          }`}
          title={hasLiveAlerts ? 'Stream Go-Live Alerts Active' : 'Enable Stream Go-Live Browser Alerts'}
        >
          <Bell className={`w-2.5 h-2.5 shrink-0 ${hasLiveAlerts ? 'text-brandPink fill-brandPink animate-pulse' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">{hasLiveAlerts ? 'Alerts ON' : 'Alerts'}</span>
          <span className="sm:hidden">{hasLiveAlerts ? 'ON' : 'Alerts'}</span>
        </button>
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
