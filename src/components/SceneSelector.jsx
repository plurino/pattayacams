'use client';

import React from 'react';
import scenesData from '@/public/data/scenes.json';

export default function SceneSelector({ activeSceneId, onSelectScene }) {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/90 backdrop-blur-md border border-borderDark/80 shadow-lg overflow-x-auto scrollbar-none">
      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1.5 font-bold shrink-0 hidden sm:inline">
        SCENES:
      </span>
      {scenesData.map((scene) => {
        const isActive = activeSceneId === scene.id;
        return (
          <button
            key={scene.id}
            onClick={() => onSelectScene(scene)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
              isActive
                ? 'bg-brandPink text-white shadow-[0_0_10px_rgba(255,42,109,0.5)] font-bold'
                : 'text-slate-300 hover:text-white hover:bg-surfaceLight/80'
            }`}
            title={scene.description}
          >
            <span>{scene.icon}</span>
            <span className="text-[11px] whitespace-nowrap">{scene.name}</span>
          </button>
        );
      })}
    </div>
  );
}
