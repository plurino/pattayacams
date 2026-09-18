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
    <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-surface/90 backdrop-blur-md border border-borderDark/80 shadow-2xl overflow-x-auto scrollbar-none select-none">
      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1.5 font-bold shrink-0 hidden md:inline">
        SCENES:
      </span>
      {scenesData.map((scene) => {
        const isActive = activeSet.has(scene.id);
        const activeClass = THEME_ACTIVE_CLASSES[scene.themeColor] || THEME_ACTIVE_CLASSES.pink;

        return (
          <button
            key={scene.id}
            onClick={() => onToggleScene && onToggleScene(scene)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 cursor-pointer ${
              isActive
                ? `${activeClass} font-bold scale-105`
                : 'text-slate-400 hover:text-white border-transparent hover:bg-surfaceLight/80 opacity-75 hover:opacity-100'
            }`}
            title={`${scene.description} (Click to toggle)`}
          >
            <span>{scene.icon}</span>
            <span className="text-[11px] whitespace-nowrap">{scene.name}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-slate-600'}`} />
          </button>
        );
      })}
    </div>
  );
}
