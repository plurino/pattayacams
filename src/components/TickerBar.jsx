'use client';

import React from 'react';
import { Clock, Droplets, Wind, TrendingUp, Ship, Sparkles, Bell } from 'lucide-react';
import { useTickerData } from '@/src/hooks/useTickerData';

export default function TickerBar({
  onOpenKohLarn,
  onOpenEvents,
  onToggleAlerts,
  hasLiveAlerts = false,
}) {
  const { ictTime, weather, rates } = useTickerData();

  return (
    <div className="h-8 bg-surface/95 border-b border-borderDark/70 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 text-[11px] font-mono select-none z-40 overflow-x-auto no-scrollbar shadow-inner text-slate-300">
      {/* 1. Left: Digital ICT Clock & Live Open-Meteo Weather */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Indochina Time Clock */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-canvas/80 border border-borderDark/80 text-cyan-400">
          <Clock className="w-3 h-3 text-brandCyan shrink-0" />
          <span className="font-bold tracking-wider">{ictTime || '--:--:--'}</span>
          <span className="text-[9px] text-slate-400">ICT</span>
        </div>

        {/* Weather Chip */}
        {weather ? (
          <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-canvas/60 border border-borderDark/60 text-slate-200">
            <span className="text-xs">{weather.icon}</span>
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
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1 text-slate-500 text-[10px]">
            <span>🌴 Pattaya Weather Loading...</span>
          </div>
        )}
      </div>

      {/* 2. Center: Live Thai Baht (THB) Exchange Ticker */}
      <div className="flex items-center gap-2.5 px-3 py-0.5 mx-2 rounded-md bg-canvas/40 border border-borderDark/40 text-[10px] shrink-0">
        <div className="flex items-center gap-1 text-amber-400 font-bold">
          <TrendingUp className="w-3 h-3" />
          <span className="hidden sm:inline">THB FX:</span>
        </div>

        {rates ? (
          <div className="flex items-center gap-2.5 text-slate-300 font-mono">
            <span title="British Pound to Thai Baht" className="hover:text-white transition-colors">
              <span className="mr-0.5">🇬🇧</span> £1=<strong className="text-amber-300">{rates.GBP}฿</strong>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span title="Euro to Thai Baht" className="hover:text-white transition-colors">
              <span className="mr-0.5">🇪🇺</span> €1=<strong className="text-amber-300">{rates.EUR}฿</strong>
            </span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span title="US Dollar to Thai Baht" className="hover:text-white transition-colors">
              <span className="mr-0.5">🇺🇸</span> $1=<strong className="text-amber-300">{rates.USD}฿</strong>
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

      {/* 3. Right: Visitor Utilities Triggers (Koh Larn Ferry & Event Radar & Notifications) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onOpenKohLarn}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/40 hover:bg-blue-900/60 border border-blue-600/40 text-blue-300 hover:text-white transition-colors text-[10px] font-semibold"
          title="Koh Larn Bali Hai Ferry Timetable & Tide Tracker"
        >
          <Ship className="w-2.5 h-2.5 text-blue-400" />
          <span className="hidden sm:inline">Koh Larn</span>
          <span>Ferry</span>
        </button>

        <button
          onClick={onOpenEvents}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/40 hover:bg-purple-900/60 border border-purple-600/40 text-purple-300 hover:text-white transition-colors text-[10px] font-semibold"
          title="Upcoming Pattaya Festivals & Countdown Radar"
        >
          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
          <span className="hidden md:inline">Festival</span>
          <span>Radar</span>
        </button>

        <button
          onClick={onToggleAlerts}
          className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors text-[10px] font-semibold ${
            hasLiveAlerts
              ? 'bg-brandPink/20 border-brandPink/60 text-brandPink shadow-[0_0_8px_rgba(255,42,109,0.3)]'
              : 'bg-surfaceLight hover:bg-slate-700 border-borderDark text-slate-300 hover:text-white'
          }`}
          title={hasLiveAlerts ? 'Stream Go-Live Alerts Active' : 'Enable Stream Go-Live Browser Alerts'}
        >
          <Bell className={`w-2.5 h-2.5 ${hasLiveAlerts ? 'text-brandPink fill-brandPink animate-pulse' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">{hasLiveAlerts ? 'Alerts ON' : 'Live Alerts'}</span>
        </button>
      </div>
    </div>
  );
}
