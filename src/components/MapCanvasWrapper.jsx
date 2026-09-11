'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Layers, Compass, Radio } from 'lucide-react';

const DynamicMapCanvas = dynamic(() => import('./MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-full bg-[#0B0F17] overflow-hidden flex items-center justify-center select-none">
      {/* 1. Cyberpunk Cartographic Background Grid Lines */}
      <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#00E5FF_1px,transparent_1px),linear-gradient(to_bottom,#00E5FF_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* 2. Concentric Radar Rings & Sweeping Beam */}
      <div className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] rounded-full border border-cyan-500/20 flex items-center justify-center">
        {/* Outer Ring */}
        <div className="absolute inset-4 rounded-full border border-cyan-500/15" />
        {/* Middle Ring */}
        <div className="absolute inset-16 rounded-full border border-cyan-500/20" />
        {/* Inner Ring */}
        <div className="absolute inset-28 rounded-full border border-brandPink/25 animate-pulse" />
        {/* Radar Crosshairs */}
        <div className="absolute inset-x-0 h-px bg-cyan-500/20" />
        <div className="absolute inset-y-0 w-px bg-cyan-500/20" />

        {/* Sweeping Radar Scanner Line */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-cyan-500/10 to-transparent pointer-events-none animate-spin"
          style={{ animationDuration: '4s' }}
        />

        {/* Center Target Lock */}
        <div className="relative flex flex-col items-center gap-2 z-10">
          <div className="w-12 h-12 rounded-full bg-surface/90 border border-brandCyan/60 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)]">
            <Radio className="w-6 h-6 text-brandCyan animate-pulse" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-mono font-black text-brandCyan tracking-wider uppercase drop-shadow">
              Pattaya Radar HUD
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Initializing Vectors & Geo-Layers...
            </span>
          </div>
        </div>
      </div>

      {/* 3. Skeleton HUD Telemetry Badges */}
      {/* Top Right Controls Skeleton */}
      <div className="absolute top-24 right-3 flex flex-col items-center gap-1.5 opacity-60 pointer-events-none">
        <div className="w-9 h-9 rounded-xl bg-surface/80 border border-borderDark flex items-center justify-center text-slate-500">
          <Compass className="w-4 h-4" />
        </div>
        <div className="w-9 h-16 rounded-xl bg-surface/80 border border-borderDark" />
      </div>

      {/* Bottom Left Layers Skeleton */}
      <div className="absolute bottom-4 sm:bottom-6 left-3 sm:left-6 opacity-60 pointer-events-none">
        <div className="h-9 w-24 rounded-xl bg-surface/80 border border-borderDark flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Layers</span>
        </div>
      </div>
    </div>
  ),
});

export default function MapCanvasWrapper(props) {
  return <DynamicMapCanvas {...props} />;
}
