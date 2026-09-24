'use client';

import React from 'react';
import scenesData from '@/public/data/scenes.json';

const THEME_ACTIVE_CLASSES = {
  teal: 'bg-teal-500/25 text-teal-200 border-teal-400/60 shadow-[0_0_12px_rgba(20,184,166,0.35)]',
  cyan: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
  emerald: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  pink: 'bg-brandPink/25 text-pink-200 border-brandPink/60 shadow-[0_0_12px_rgba(255,42,109,0.35)]',
};

export default function SceneSelector({ activeSceneIds = [], onToggleScene }) {
  const activeSet = new Set(Array.isArray(activeSceneIds) ? activeSceneIds : [activeSceneIds]);

  return (
    <div
      aria-label="Scene filters"
      // Mobile sizing tightened in Sep 2026 redesign:
      // - smaller gaps + padding so the pill strip doesn't blow past the Leaflet compass / direction
      //   controls at top-24 right-3 on small screens
      // - max-w-[calc(100vw-6rem)] keeps horizontal scroll inside the viewport even after the
      //   parent wrapper pads away the right gutter; on md+ the wrapper is centred, full width is fine
      className="flex items-center gap-0.5 sm:gap-1.5 px-1 sm:px-2 md:px-2.5 max-w-[calc(100vw-6rem)] md:max-w-none max-h-[40px] md:max-h-none overflow-x-auto overflow-y-hidden snap-x snap-mandatory md:snap-none scrollbar-none select-none p-1 rounded-xl bg-surface/90 backdrop-blur-md border border-borderDark/80 shadow-2xl"
    >
      <span className="text-[9px] md:text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1 md:px-1.5 font-bold shrink-0 hidden md:inline">
        SCENES:
      </span>
      {scenesData.map((scene) => {
        const isActive = activeSet.has(scene.id);
        const activeClass = THEME_ACTIVE_CLASSES[scene.themeColor] || THEME_ACTIVE_CLASSES.pink;

        return (
          <button
            key={scene.id}
            onClick={() => onToggleScene && onToggleScene(scene)}
            // Mobile tap target stays at 40px (iOS HIG friendly) but text + icon shrink so
            // 4-5 pills fit on a 375px-wide phone without horizontal scroll.
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all shrink-0 snap-start min-h-[40px] md:min-h-[44px] cursor-pointer ${
              isActive
                ? `${activeClass} font-bold scale-105`
                : 'text-slate-400 hover:text-white border-transparent hover:bg-surfaceLight/80 opacity-75 hover:opacity-100'
            }`}
            title={`${scene.description} (Click to toggle)`}
          >
            <span className="text-xs sm:text-base">{scene.icon}</span>
            <span className="text-[10px] sm:text-[11px] whitespace-nowrap hidden sm:inline">{scene.name}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-slate-600'}`} />
          </button>
        );
      })}
    </div>
  );
}
