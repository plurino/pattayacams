'use client';

import React, { useState, useEffect } from 'react';
import { Grid2X2, Grid3X3, Video, X, Maximize2, RefreshCw } from 'lucide-react';
import HlsPlayer from './common/HlsPlayer';
import YouTubePlayer from './common/YouTubePlayer';
import venuesData from '@/public/data/venues.json';
import cctvData from '@/public/data/cctv_cams.json';
import { getSavedGridConfig, saveGridConfig } from '@/src/utils/storage';

const DEFAULT_SLOTS_2X2 = [
  'CC-001', // Dolphin Roundabout
  'CC-002', // Soi 6 Entrance
  'myth-night-lounge-soi6', // Myth Lounge
  'republic-club-walking-street', // Republic Club
];

export default function MultiCamGrid({ onSelectEntity }) {
  const [gridMode, setGridMode] = useState('2x2'); // '2x2' or '3x3'
  const [slots, setSlots] = useState([null, null, null, null]);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // Load from localStorage or use sensible defaults
  useEffect(() => {
    const saved = getSavedGridConfig();
    const mode = saved.mode === '3x3' ? '3x3' : '2x2';
    const slotCount = mode === '3x3' ? 9 : 4;
    
    let initialSlots = saved.slots && saved.slots.length === slotCount
      ? saved.slots
      : (mode === '2x2' ? DEFAULT_SLOTS_2X2 : [...DEFAULT_SLOTS_2X2, null, null, null, null, null]);

    setGridMode(mode);
    setSlots(initialSlots);
    setIsClientLoaded(true);
  }, []);

  const handleModeChange = (newMode) => {
    const targetCount = newMode === '3x3' ? 9 : 4;
    const newSlots = Array(targetCount).fill(null);
    for (let i = 0; i < Math.min(slots.length, targetCount); i++) {
      newSlots[i] = slots[i];
    }
    setGridMode(newMode);
    setSlots(newSlots);
    saveGridConfig({ mode: newMode, slots: newSlots });
  };

  const handleSelectSlotFeed = (index, value) => {
    const next = [...slots];
    next[index] = value || null;
    setSlots(next);
    saveGridConfig({ mode: gridMode, slots: next });
  };

  const handleClearSlot = (index) => {
    const next = [...slots];
    next[index] = null;
    setSlots(next);
    saveGridConfig({ mode: gridMode, slots: next });
  };

  // Find entity by id or slug
  const resolveEntity = (val) => {
    if (!val) return null;
    const cam = cctvData.find(c => c.id === val || c.slug === val);
    if (cam) return { ...cam, type: 'cctv' };
    const venue = venuesData.find(v => v.slug === val || v.id === val);
    if (venue) return { ...venue, type: 'venue' };
    return null;
  };

  if (!isClientLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-canvas text-slate-400">
        <span className="text-xs font-mono">Initializing Multi-Cam Command Center...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-canvas p-3 sm:p-4 overflow-y-auto">
      {/* Grid Controls Header */}
      <div className="flex items-center justify-between pb-3 shrink-0 border-b border-borderDark mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white tracking-tight">
            Multi-Cam Command Grid
          </span>
          <span className="text-[10px] font-mono text-brandCyan bg-surface px-2 py-0.5 rounded border border-borderDark">
            {gridMode.toUpperCase()} WALL
          </span>
        </div>

        <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-borderDark">
          <button
            onClick={() => handleModeChange('2x2')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors ${
              gridMode === '2x2'
                ? 'bg-brandCyan text-canvas font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid2X2 className="w-3.5 h-3.5" />
            <span>2x2</span>
          </button>
          <button
            onClick={() => handleModeChange('3x3')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors ${
              gridMode === '3x3'
                ? 'bg-brandCyan text-canvas font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>3x3</span>
          </button>
        </div>
      </div>

      {/* Grid Slots Canvas */}
      <div
        className={`flex-1 grid gap-3 min-h-0 ${
          gridMode === '2x2'
            ? 'grid-cols-1 md:grid-cols-2 grid-rows-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {slots.map((feedKey, idx) => {
          const entity = resolveEntity(feedKey);

          return (
            <div
              key={idx}
              className="bg-surface border border-borderDark rounded-xl overflow-hidden flex flex-col shadow-md relative min-h-[220px]"
            >
              {/* Slot Header Toolbar */}
              <div className="h-9 bg-surfaceLight/80 border-b border-borderDark px-3 flex items-center justify-between shrink-0 gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold shrink-0">
                    #{idx + 1}
                  </span>
                  {entity ? (
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {entity.name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic truncate">
                      Select Camera Feed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Feed Selector Dropdown */}
                  <select
                    value={feedKey || ''}
                    onChange={(e) => handleSelectSlotFeed(idx, e.target.value)}
                    className="bg-canvas border border-borderDark text-[11px] font-mono text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-brandCyan max-w-[140px] truncate"
                  >
                    <option value="">-- Choose Feed --</option>
                    <optgroup label="✨ Live Venues">
                      {venuesData.map((v) => (
                        <option key={v.slug} value={v.slug}>
                          {v.name} ({v.category})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="📹 Municipal CCTVs">
                      {cctvData.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id} - {c.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {feedKey && (
                    <button
                      onClick={() => handleClearSlot(idx)}
                      className="p-1 rounded hover:bg-canvas text-slate-400 hover:text-white transition-colors"
                      title="Clear Slot"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Slot Video Content */}
              <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {entity ? (
                  entity.type === 'cctv' ? (
                    <HlsPlayer streamUrl={entity.stream_url} title={entity.name} />
                  ) : (
                    <YouTubePlayer
                      channelId={entity.youtube_channel_id}
                      title={entity.name}
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2">
                    <Video className="w-8 h-8 text-slate-600 animate-pulse" />
                    <span className="text-xs font-mono text-slate-400">
                      Empty Slot #{idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Use dropdown above to assign a live camera
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
