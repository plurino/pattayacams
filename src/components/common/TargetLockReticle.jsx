'use client';

import React from 'react';
import { Crosshair, Shield, Radio, Activity } from 'lucide-react';

/**
 * Tactical Target Lock Reticle
 * Cyber-tactical HUD overlay inspired by Gods-Eye-View, built with 100% lightweight Tailwind CSS.
 */
export default function TargetLockReticle({
  name,
  code,
  type = 'TARGET',
  lat,
  lng,
  isLive = true,
  status = 'ONLINE',
}) {
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black/40 backdrop-blur-sm border border-cyan-500/30 p-3 select-none animate-in fade-in duration-300">
      {/* 4 Corner Tactical Brackets */}
      <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

      {/* Header Info */}
      <div className="flex items-center justify-between font-mono text-[10px] text-cyan-300 pb-1.5 border-b border-cyan-500/20">
        <div className="flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="font-bold tracking-widest uppercase">LOCK // {type}</span>
          {code && <span className="text-slate-400 font-normal">[{code}]</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLive ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'
            }`}
          />
          <span className={`font-bold ${isLive ? 'text-emerald-400' : 'text-slate-400'}`}>
            {isLive ? 'SIGNAL LOCK' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Target Details */}
      <div className="flex items-center justify-between pt-2">
        <div className="min-w-0 pr-2">
          <div className="text-xs font-bold text-white tracking-wide truncate">
            {name || 'Unknown Target'}
          </div>
          {hasCoords && (
            <div className="text-[10px] font-mono text-cyan-400/80 pt-0.5">
              LAT: {lat.toFixed(4)}° / LNG: {lng.toFixed(4)}°
            </div>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end text-[9px] font-mono text-slate-400">
          <span className="text-cyan-300 font-bold tracking-wider">SECTOR: PTY-01</span>
          <span>SYS: OPTICAL</span>
        </div>
      </div>
    </div>
  );
}
