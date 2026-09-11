'use client';

import React, { useState } from 'react';
import { Clock, Droplets, Wind, TrendingUp, Ship, Sparkles, Bell, ChevronRight } from 'lucide-react';
import { useTickerData } from '@/src/hooks/useTickerData';

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
  onToggleAlerts,
  hasLiveAlerts = false,
}) {
  const { ictTime, weather, rates } = useTickerData();
  const [currencyIndex, setCurrencyIndex] = useState(0);

  const activeCurrency = CURRENCIES[currencyIndex];

  const cycleCurrency = () => {
    setCurrencyIndex((prev) => (prev + 1) % CURRENCIES.length);
  };

  return (
    <div className="h-8 bg-surface/95 border-b border-borderDark/70 backdrop-blur-md flex items-center justify-between px-2 sm:px-4 text-[11px] font-mono select-none z-40 overflow-x-auto sm:overflow-x-visible no-scrollbar shadow-inner text-slate-300">
      {/* 1. Left: Digital ICT Clock & Clickable Weather Chip (Opens 7-Day Forecast & Windy Map) */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Indochina Time Clock */}
        <button
          onClick={onOpenWeather}
          className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-canvas/80 hover:bg-canvas border border-borderDark/80 hover:border-cyan-400/50 text-cyan-400 transition-colors"
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
            className="flex items-center gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-canvas/60 hover:bg-canvas border border-borderDark/60 hover:border-amber-400/50 text-slate-200 transition-colors cursor-pointer group"
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
          <div className="hidden sm:flex items-center gap-1 text-slate-500 text-[10px]">
            <span>🌴 Pattaya Weather...</span>
          </div>
        )}
      </div>

      {/* 2. Center: Thai Baht (THB) Exchange Ticker */}
      <div className="shrink-0 flex items-center">
        {/* Mobile: 1-Tap Currency Cycler (USD -> GBP -> EUR -> AUD) */}
        <div className="flex sm:hidden items-center">
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
        </div>

        {/* Desktop / Tablet: Full Multi-Currency Ticker */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-0.5 mx-2 rounded-md bg-canvas/40 border border-borderDark/40 text-[10px]">
          <div className="flex items-center gap-1 text-amber-400 font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>THB FX:</span>
          </div>

          {rates ? (
            <div className="flex items-center gap-2.5 text-slate-300 font-mono">
              <span title="US Dollar to Thai Baht" className="hover:text-white transition-colors">
                <span className="mr-0.5">🇺🇸</span> $1=<strong className="text-amber-300">{rates.USD}฿</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span title="British Pound to Thai Baht" className="hover:text-white transition-colors">
                <span className="mr-0.5">🇬🇧</span> £1=<strong className="text-amber-300">{rates.GBP}฿</strong>
              </span>
              <span className="text-slate-600 hidden md:inline">•</span>
              <span title="Euro to Thai Baht" className="hidden md:inline hover:text-white transition-colors">
                <span className="mr-0.5">🇪🇺</span> €1=<strong className="text-amber-300">{rates.EUR}฿</strong>
              </span>
              <span className="text-slate-600 hidden lg:inline">•</span>
              <span title="Australian Dollar to Thai Baht" className="hidden lg:inline hover:text-white transition-colors">
                <span className="mr-0.5">🇦🇺</span> A$1=<strong className="text-amber-300">{rates.AUD}฿</strong>
              </span>
            </div>
          ) : (
            <span className="text-slate-500 text-[10px]">Updating Baht rates...</span>
          )}
        </div>
      </div>

      {/* 3. Right: Visitor Utilities (Koh Larn Ferry, Events, Alerts) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Koh Larn Ferry */}
        <button
          onClick={onOpenKohLarn}
          className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-blue-950/40 hover:bg-blue-900/60 border border-blue-600/40 text-blue-300 hover:text-white transition-colors text-[10px] font-semibold"
          title="Koh Larn Bali Hai Ferry Timetable & Tide Tracker"
        >
          <Ship className="w-2.5 h-2.5 text-blue-400" />
          <span className="hidden sm:inline">Koh Larn</span>
          <span>Ferry</span>
        </button>

        {/* Events (formerly Festival Radar) */}
        <button
          onClick={onOpenEvents}
          className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-purple-950/40 hover:bg-purple-900/60 border border-purple-600/40 text-purple-300 hover:text-white transition-colors text-[10px] font-semibold"
          title="Upcoming Pattaya Events, Festivals & Holidays"
        >
          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
          <span>Events</span>
        </button>

        {/* Alerts Toggle */}
        <button
          onClick={onToggleAlerts}
          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded border transition-colors text-[10px] font-semibold ${
            hasLiveAlerts
              ? 'bg-brandPink/20 border-brandPink/60 text-brandPink shadow-[0_0_8px_rgba(255,42,109,0.3)]'
              : 'bg-surfaceLight hover:bg-slate-700 border-borderDark text-slate-300 hover:text-white'
          }`}
          title={hasLiveAlerts ? 'Stream Go-Live Alerts Active' : 'Enable Stream Go-Live Browser Alerts'}
        >
          <Bell className={`w-2.5 h-2.5 ${hasLiveAlerts ? 'text-brandPink fill-brandPink animate-pulse' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">{hasLiveAlerts ? 'Alerts ON' : 'Alerts'}</span>
          <span className="sm:hidden">{hasLiveAlerts ? 'ON' : 'Alerts'}</span>
        </button>
      </div>
    </div>
  );
}
