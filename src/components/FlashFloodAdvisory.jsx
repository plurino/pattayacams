'use client';

import React from 'react';
import { AlertTriangle, X, ShieldAlert, Navigation } from 'lucide-react';

export default function FlashFloodAdvisory({
  rainRate = 0,
  onHighlightFloodZones,
  onDismiss,
}) {
  return (
    <aside aria-label="Hazard Advisory" className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 max-w-2xl w-[94%] sm:w-auto pointer-events-auto select-none animate-bounce-short">
      <div className="bg-gradient-to-r from-red-950/95 via-amber-950/90 to-red-950/95 backdrop-blur-md border border-red-500/80 shadow-[0_0_24px_rgba(239,68,68,0.5)] rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-white">
          <div className="w-8 h-8 rounded-full bg-red-600/30 border border-red-500 flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-300" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-amber-300 tracking-wider text-[11px] uppercase">
                Flash Flood Advisory
              </span>
              <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-mono text-[9px] font-bold">
                {rainRate ? `${rainRate} mm/hr` : 'HEAVY RAIN'}
              </span>
            </div>
            <p className="text-slate-200 text-[11px] leading-tight mt-0.5">
              Heavy monsoon rain detected. Low-lying corridors (Sukhumvit, Railway Soi, Third Rd) likely impassable for motorbikes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onHighlightFloodZones && (
            <button
              onClick={onHighlightFloodZones}
              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] font-bold transition-all shadow flex items-center gap-1"
            >
              <Navigation className="w-3 h-3" />
              <span className="hidden sm:inline">View Flood</span>
              <span>Zones</span>
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-6 h-6 rounded-full bg-surfaceLight/80 hover:bg-surfaceLight flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              title="Dismiss warning"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
