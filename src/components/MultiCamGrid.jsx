'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Grid2X2, Grid3X3, Video, X, Smartphone } from 'lucide-react';
import UniversalPlayer from './common/UniversalPlayer';
import venuesData from '@/public/data/venues.json';
import liveCamsData from '@/public/data/live_cams.json';
import creatorsData from '@/public/data/creators.json';
import streamersData from '@/public/data/roaming_streamers.json';
import { useStreamStatus } from '@/src/hooks/useStreamStatus';

export default function MultiCamGrid({ onSelectEntity }) {
  const streamStatus = useStreamStatus();
  const [isMobile, setIsMobile] = useState(false);
  const [gridMode, setGridMode] = useState('2x2'); // mobile: '1x2' | '1x3'; desktop: '2x2' | '3x3'
  const [slots, setSlots] = useState([null, null, null, null]);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // Detect mobile portrait screen size
  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 640 || (window.innerWidth < 768 && window.innerHeight > window.innerWidth);
      setIsMobile(mobile);
      setGridMode((prev) => {
        if (mobile && (prev === '2x2' || prev === '3x3')) return '1x2';
        if (!mobile && (prev === '1x2' || prev === '1x3')) return '2x2';
        return prev;
      });
    };

    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Construct master pool of all entities with unified status
  const allLiveOptions = useMemo(() => {
    const list = [];
    const entities = streamStatus?.entities || {};

    // 1. Live Cams (Pattaya Beach Road, Soi Buakhao, etc.)
    liveCamsData.forEach((c) => {
      const statusInfo = entities[`livecam-${c.slug}`] || entities[c.slug];
      if (statusInfo?.status !== 'error_404' && statusInfo?.is_live !== false) {
        list.push({
          key: `livecam-${c.slug}`,
          slug: c.slug,
          name: c.name,
          category: '24/7 Live Cam',
          platform: statusInfo?.platform || c.platform || 'youtube',
          video_id: statusInfo?.video_id || c.video_id,
          youtube_channel_id: c.youtube_channel_id,
          handle: c.youtube_handle,
          is_live: true,
          type: 'livecam',
        });
      }
    });

    // 2. Venues (Only when genuinely live)
    venuesData.forEach((v) => {
      const statusInfo = entities[`venue-${v.slug}`] || entities[v.slug];
      if (statusInfo?.is_live === true) {
        list.push({
          key: `venue-${v.slug}`,
          slug: v.slug,
          name: v.name,
          category: v.category ? v.category.replace('_', ' ') : 'Venue',
          platform: statusInfo?.platform || v.platform || 'youtube',
          video_id: statusInfo?.video_id || v.video_id,
          youtube_channel_id: v.youtube_channel_id,
          handle: v.youtube_handle,
          is_live: true,
          type: 'venue',
        });
      }
    });

    // 3. Creators & IRL Streamers (Only when genuinely live)
    const creatorMap = new Map();
    creatorsData.forEach((c) => {
      const statusInfo = entities[`creator-${c.slug}`] || entities[c.slug];
      if (statusInfo?.is_live === true) {
        creatorMap.set(c.slug, {
          key: `creator-${c.slug}`,
          slug: c.slug,
          name: c.name,
          category: 'IRL Streamer',
          platform: statusInfo?.platform || c.platform || 'youtube',
          video_id: statusInfo?.video_id || null,
          youtube_channel_id: c.channel_id,
          handle: c.handle,
          kick_channel: c.kick_channel,
          is_live: true,
          type: 'creator',
        });
      }
    });

    // Also check roaming streamers
    streamersData.forEach((s) => {
      const key = s.id.toLowerCase();
      if (!creatorMap.has(key)) {
        const statusInfo = entities[`streamer-${s.id}`];
        if (statusInfo?.is_live === true) {
          creatorMap.set(key, {
            key: `streamer-${s.id}`,
            slug: s.id,
            name: s.name,
            category: 'IRL Streamer',
            platform: statusInfo?.platform || 'youtube',
            video_id: statusInfo?.video_id || null,
            youtube_channel_id: s.youtube_channel_id,
            handle: s.youtube_handle,
            is_live: true,
            type: 'streamer',
          });
        }
      }
    });

    list.push(...Array.from(creatorMap.values()));
    return list;
  }, [streamStatus]);

  // Lookup helper
  const resolveLiveEntity = useCallback((key) => {
    if (!key) return null;
    return allLiveOptions.find((item) => item.key === key || item.slug === key);
  }, [allLiveOptions]);

  // Initial population: populate with active live feeds
  useEffect(() => {
    const slotCount = gridMode === '3x3' ? 9 : (gridMode === '1x3' ? 3 : (gridMode === '1x2' ? 2 : 4));
    const nextSlots = Array(slotCount).fill(null);

    allLiveOptions.forEach((opt, idx) => {
      if (idx < slotCount) {
        nextSlots[idx] = opt.key;
      }
    });

    setSlots(nextSlots);
    setIsClientLoaded(true);
  }, [gridMode, allLiveOptions]);

  const handleModeChange = (newMode) => {
    const targetCount = newMode === '3x3' ? 9 : (newMode === '1x3' ? 3 : (newMode === '1x2' ? 2 : 4));
    const nextSlots = Array(targetCount).fill(null);
    allLiveOptions.forEach((opt, idx) => {
      if (idx < targetCount) {
        nextSlots[idx] = opt.key;
      }
    });
    setGridMode(newMode);
    setSlots(nextSlots);
  };

  const handleSelectSlotFeed = (index, value) => {
    const next = [...slots];
    next[index] = value || null;
    setSlots(next);
  };

  const handleClearSlot = (index) => {
    const next = [...slots];
    next[index] = null;
    setSlots(next);
  };

  if (!isClientLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-canvas text-slate-400">
        <span className="text-xs font-mono">Initializing Multi-Cam Command Center...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-canvas p-2.5 sm:p-4 overflow-y-auto">
      {/* Grid Controls Header */}
      <div className="flex items-center justify-between pb-2.5 shrink-0 border-b border-borderDark mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
            Multi-Cam Live Grid
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <strong className="text-white">{allLiveOptions.length}</strong> Live Now
          </span>
        </div>

        {/* Responsive Grid Mode Switcher */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-borderDark shadow-inner">
          {isMobile ? (
            /* Mobile Options: 1x2 and 1x3 */
            <>
              <button
                onClick={() => handleModeChange('1x2')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  gridMode === '1x2'
                    ? 'bg-brandCyan text-canvas shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>1x2</span>
              </button>
              <button
                onClick={() => handleModeChange('1x3')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  gridMode === '1x3'
                    ? 'bg-brandCyan text-canvas shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>1x3</span>
              </button>
            </>
          ) : (
            /* Desktop / Tablet Options: 2x2 and 3x3 */
            <>
              <button
                onClick={() => handleModeChange('2x2')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  gridMode === '2x2'
                    ? 'bg-brandCyan text-canvas shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid2X2 className="w-3.5 h-3.5" />
                <span>2x2 Wall</span>
              </button>
              <button
                onClick={() => handleModeChange('3x3')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  gridMode === '3x3'
                    ? 'bg-brandCyan text-canvas shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>3x3 Wall</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid Slots Layout */}
      <div
        className={`flex-1 grid gap-2.5 sm:gap-3.5 min-h-0 ${
          gridMode === '1x2'
            ? 'grid-cols-1 grid-rows-2'
            : gridMode === '1x3'
            ? 'grid-cols-1 grid-rows-3'
            : gridMode === '2x2'
            ? 'grid-cols-1 md:grid-cols-2 grid-rows-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {slots.map((feedKey, idx) => {
          const entity = resolveLiveEntity(feedKey);

          return (
            <div
              key={idx}
              className="bg-surface border border-borderDark rounded-xl overflow-hidden flex flex-col shadow-md relative min-h-[200px]"
            >
              {/* Slot Header Bar */}
              <div className="h-8 sm:h-9 bg-surfaceLight/80 border-b border-borderDark px-2 sm:px-3 flex items-center justify-between shrink-0 gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-brandCyan font-bold shrink-0">
                    CAM #{idx + 1}
                  </span>
                  {entity ? (
                    <span className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                      <span className="truncate">{entity.name}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic truncate">
                      Select Live Feed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Filtered Dropdown: ONLY Live Feeds */}
                  <select
                    value={feedKey || ''}
                    onChange={(e) => handleSelectSlotFeed(idx, e.target.value)}
                    className="bg-canvas border border-borderDark text-[11px] font-mono text-slate-200 rounded px-2 py-0.5 focus:outline-none focus:border-brandCyan max-w-[140px] sm:max-w-[180px] truncate"
                  >
                    <option value="">-- Choose Live Stream --</option>
                    {allLiveOptions.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        🔴 {opt.name} ({opt.category})
                      </option>
                    ))}
                  </select>

                  {feedKey && (
                    <button
                      onClick={() => handleClearSlot(idx)}
                      className="p-1 rounded hover:bg-canvas text-slate-400 hover:text-white transition-colors"
                      title="Clear Cam Slot"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Slot Live Video Player Stage (Autoplay Muted) */}
              <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {entity ? (
                  <UniversalPlayer
                    source={{
                      type: entity.platform || 'youtube',
                      video_id: entity.video_id,
                      youtube_channel_id: entity.youtube_channel_id,
                      channel: entity.kick_channel || entity.handle || entity.slug,
                    }}
                    title={entity.name}
                    isLive={true}
                    autoMount={true}
                    muted={true}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2 select-none">
                    <Video className="w-7 h-7 text-slate-600 animate-pulse" />
                    <span className="text-xs font-mono text-slate-400">
                      Empty Slot #{idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Select any active Pattaya stream from dropdown above
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
