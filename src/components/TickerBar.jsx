'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown, TrendingUp } from 'lucide-react';
import { useTickerData } from '@/src/hooks/useTickerData';
import { usePattayaTelemetry } from '@/src/hooks/usePattayaTelemetry';
import { getSunsetStatus } from '@/src/utils/suncalc';
import { getNightlifeVibe } from '@/src/utils/nightlife';
import { playTacticalClick } from '@/src/utils/sfx';
import TickerOverflowMenu from './TickerOverflowMenu';

export default function TickerBar({
  onOpenKohLarn,
  onOpenEvents,
  onOpenWeather,
  onOpenNewsletter,
  onToggleAlerts,
  hasLiveAlerts = false,
  onOpenConverter,
  onOpenEmergency,
}) {
  const { ictTime, weather, rates } = useTickerData();
  const telemetry = usePattayaTelemetry();
  const [sunsetInfo, setSunsetInfo] = useState(() => getSunsetStatus());
  const [nightlifeVibe, setNightlifeVibe] = useState(() => getNightlifeVibe(undefined, { uppercase: true }));
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowButtonRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => {
      setSunsetInfo(getSunsetStatus());
      setNightlifeVibe(getNightlifeVibe(undefined, { uppercase: true }));
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const toggleOverflow = () => {
    playTacticalClick();
    setIsOverflowOpen((v) => !v);
  };

  return (
    <aside
      aria-label="Tactical Pattaya Telemetry Panel"
      className="bg-surface/95 border-b border-borderDark/80 backdrop-blur-md text-[11px] font-mono select-none z-40 w-full max-w-full overflow-visible shadow-md text-slate-300"
    >
      <div className="flex items-center justify-between gap-2 px-2.5 sm:px-4 py-1 min-h-[28px] bg-canvas/40 border-b border-borderDark/40 w-full">
        {/* Always-visible compact ambient pill */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Time chip (clickable → Weather) */}
          <button
            onClick={() => {
              playTacticalClick();
              if (onOpenWeather) onOpenWeather();
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-canvas/50 border border-borderDark/70 text-slate-300 hover:text-white hover:border-borderDark transition-colors shrink-0 cursor-pointer"
            title="Pattaya Local Time (ICT / UTC+7) • Click for 7-Day Forecast & Weather Radar"
          >
            <Clock className="w-3 h-3 text-brandCyan shrink-0" />
            <span className="font-bold tracking-wider">{ictTime || '--:--:--'}</span>
            <span className="text-[9px] text-slate-400 font-semibold">ICT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <span className="text-slate-600 shrink-0" aria-hidden="true">•</span>

          {/* Weather chip (clickable → Weather) */}
          {weather ? (
            <button
              onClick={() => {
                playTacticalClick();
                if (onOpenWeather) onOpenWeather();
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-canvas/50 border border-borderDark/70 text-slate-300 hover:text-white hover:border-borderDark transition-colors shrink-0 cursor-pointer"
              title="Click for 7-Day Pattaya Forecast & Live Weather Radar"
            >
              <span className="text-xs">{weather.icon}</span>
              <strong className="text-white">{weather.temp}°C</strong>
              <span className="text-slate-400 hidden sm:inline">{weather.condition}</span>
            </button>
          ) : (
            <span className="text-slate-500 text-[10px]">…loading weather</span>
          )}

          <span className="text-slate-600 shrink-0" aria-hidden="true">•</span>

          {/* FX chip (clickable → Converter) */}
          <button
            onClick={() => {
              playTacticalClick();
              if (onOpenConverter) onOpenConverter();
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-canvas/50 border border-borderDark/70 text-slate-300 hover:text-white hover:border-borderDark transition-colors shrink-0 cursor-pointer"
            title="Click to Open Interactive Thai Baht Currency Converter"
          >
            <TrendingUp className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="text-amber-300 font-mono">
              $1=<strong className="text-amber-300">฿{rates?.USD || '—'}</strong>
            </span>
            <span className="hidden md:inline text-slate-600">•</span>
            <span className="hidden md:inline text-amber-300 font-mono">£1=<strong className="text-amber-300">{rates?.GBP || '—'}฿</strong></span>
            <span className="hidden lg:inline text-slate-600">•</span>
            <span className="hidden lg:inline text-amber-300 font-mono">€1=<strong className="text-amber-300">{rates?.EUR || '—'}฿</strong></span>
          </button>
        </div>

        {/* Right side: More overflow toggle */}
        <div className="relative shrink-0">
          <button
            ref={overflowButtonRef}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={toggleOverflow}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
              isOverflowOpen
                ? 'bg-surfaceLight border-borderDark text-white'
                : 'bg-canvas/50 border-borderDark/70 text-slate-300 hover:text-white hover:border-borderDark'
            }`}
            aria-expanded={isOverflowOpen}
            aria-haspopup="dialog"
            title="More telemetry, actions & radio"
          >
            <span>More</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOverflowOpen ? 'rotate-180' : ''}`} />
          </button>

          <TickerOverflowMenu
            isOpen={isOverflowOpen}
            onClose={() => setIsOverflowOpen(false)}
            weather={weather}
            rates={rates}
            telemetry={telemetry}
            sunsetInfo={sunsetInfo}
            nightlifeVibe={nightlifeVibe}
            onOpenKohLarn={onOpenKohLarn}
            onOpenEvents={onOpenEvents}
            onOpenWeather={onOpenWeather}
            onOpenConverter={onOpenConverter}
            onOpenEmergency={onOpenEmergency}
            onToggleAlerts={onToggleAlerts}
            hasLiveAlerts={hasLiveAlerts}
          />
        </div>
      </div>
    </aside>
  );
}