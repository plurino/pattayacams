'use client';

import React, { useState, useEffect } from 'react';
import { Grid2X2, Grid3X3, Video, X, Maximize2, RefreshCw, Radio } from 'lucide-react';
import YouTubePlayer from './common/YouTubePlayer';
import UniversalPlayer from './common/UniversalPlayer';
import venuesData from '@/public/data/venues.json';
import streamersData from '@/public/data/roaming_streamers.json';
import { COASTAL_AND_WEATHER_CAMS } from '@/src/config/coastalCams';
import { useStreamStatus } from '@/src/hooks/useStreamStatus';
import { getSavedGridConfig, saveGridConfig } from '@/src/utils/storage';

export default function MultiCamGrid({ onSelectEntity }) {
  const streamStatus = useStreamStatus();
  const [gridMode, setGridMode] = useState('2x2'); // '2x2' or '3x3'
  const [slots, setSlots] = useState([null, null, null, null]);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // Filter out 404 / broken entities
  const activeVenues = venuesData.filter(
    (v) => streamStatus?.entities?.[`venue-${v.slug}`]?.status !== 'error_404'
  );
  const activeStreamers = streamersData.filter(
    (s) => streamStatus?.entities?.[`streamer-${s.id}`]?.status !== 'error_404'
  );

  // Auto-populate prioritized candidate list: live venues first, then live creators, then top venues
  const liveVenues = activeVenues.filter(
    (v) => streamStatus?.entities?.[`venue-${v.slug}`]?.is_live
  );
  const liveStreamers = activeStreamers.filter(
    (s) => streamStatus?.entities?.[`streamer-${s.id}`]?.is_live
  );
  const offlineVenues = activeVenues.filter(
    (v) => !streamStatus?.entities?.[`venue-${v.slug}`]?.is_live
  );

  const prioritizedCandidates = [
    ...liveVenues.map((v) => v.slug),
    ...liveStreamers.map((s) => s.id),
    ...offlineVenues.map((v) => v.slug),
  ];

  // Find entity by id or slug (strictly venues & streamers, NO CCTVs)
  const resolveEntity = (val) => {
    if (!val) return null;
    const coastal = COASTAL_AND_WEATHER_CAMS.find((c) => c.id === val);
    if (coastal) {
      return coastal;
    }
    const venue = activeVenues.find((v) => v.slug === val || v.id === val);
    if (venue) {
      const statusInfo = streamStatus?.entities?.[`venue-${venue.slug}`];
      const isWebcam = Boolean(venue.webcam_id || venue.snapshot_url);
      return {
        ...venue,
        type: venue.webcam_id ? 'windy' : (venue.snapshot_url ? 'snapshot' : 'venue'),
        video_id: statusInfo?.video_id || venue.video_id,
        is_live: isWebcam ? true : (statusInfo ? statusInfo.is_live : !!venue.video_id),
      };
    }
    const streamer = activeStreamers.find((s) => s.id === val || s.slug === val);
    if (streamer) {
      const statusInfo = streamStatus?.entities?.[`streamer-${streamer.id}`];
      return {
        ...streamer,
        type: 'streamer',
        video_id: statusInfo?.video_id || null,
        is_live: statusInfo?.is_live || false,
      };
    }
    return null;
  };

  // Load from localStorage or auto-populate with live streams
  useEffect(() => {
    const saved = getSavedGridConfig();
    const mode = saved.mode === '3x3' ? '3x3' : '2x2';
    const slotCount = mode === '3x3' ? 9 : 4;

    // Check if saved slots contain non-CCTV valid entities
    const hasValidSaved =
      saved.slots &&
      saved.slots.length === slotCount &&
      saved.slots.some((s) => s && !s.startsWith('CC-') && resolveEntity(s));

    let initialSlots;
    if (hasValidSaved) {
      initialSlots = saved.slots.map((s, idx) => {
        // If it was a CCTV or invalid, replace with a live prioritized candidate
        if (!s || s.startsWith('CC-') || !resolveEntity(s)) {
          return prioritizedCandidates[idx % prioritizedCandidates.length] || null;
        }
        return s;
      });
    } else {
      // Auto-populate slots with up to 4 (or 9) active live streams
      initialSlots = Array(slotCount)
        .fill(null)
        .map((_, idx) => prioritizedCandidates[idx] || null);
    }

    setGridMode(mode);
    setSlots(initialSlots);
    setIsClientLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    className="bg-canvas border border-borderDark text-[11px] font-mono text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-brandCyan max-w-[150px] truncate"
                  >
                    <option value="">-- Choose Live Feed --</option>
                    <optgroup label="✨ Live Venues">
                      {activeVenues.map((v) => {
                        const isLive = streamStatus?.entities?.[`venue-${v.slug}`]?.is_live;
                        return (
                          <option key={v.slug} value={v.slug}>
                            {isLive ? '🔴 ' : '⚪ '}{v.name} ({v.category})
                          </option>
                        );
                      })}
                    </optgroup>
                    <optgroup label="🌊 Panoramic & Weather Cams">
                      {COASTAL_AND_WEATHER_CAMS.map((c) => (
                        <option key={c.id} value={c.id}>
                          📹 {c.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🚶 Live Streamers & Creators">
                      {activeStreamers.map((s) => {
                        const isLive = streamStatus?.entities?.[`streamer-${s.id}`]?.is_live;
                        return (
                          <option key={s.id} value={s.id}>
                            {isLive ? '🔴 ' : '⚪ '}{s.name} ({s.youtube_handle})
                          </option>
                        );
                      })}
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
                  entity.webcam_id || entity.snapshot_url || entity.type === 'windy' || entity.type === 'snapshot' ? (
                    <UniversalPlayer
                      source={{
                        type: entity.webcam_id ? 'windy' : (entity.snapshot_url ? 'snapshot' : entity.type),
                        webcam_id: entity.webcam_id,
                        url: entity.snapshot_url || entity.url,
                        refreshIntervalMs: entity.refreshIntervalMs || 5000,
                      }}
                      title={entity.name}
                      autoMount={false}
                    />
                  ) : entity.is_live && (entity.video_id || entity.youtube_channel_id || entity.platform === 'kick' || entity.platform === 'twitch') ? (
                    <UniversalPlayer
                      source={{
                        type: entity.platform || 'youtube',
                        video_id: entity.video_id,
                        youtube_channel_id: entity.youtube_channel_id,
                        channel: entity.channel_id || entity.handle || entity.slug,
                      }}
                      title={entity.name}
                      isLive={entity.is_live}
                      autoMount={false}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-surface to-canvas text-center gap-3 select-none">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-surfaceLight border border-borderDark flex items-center justify-center text-xl font-bold text-brandPink shadow-inner">
                          {entity.name?.charAt(0) || 'P'}
                        </div>
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 border border-slate-600">
                          <Radio className="w-2.5 h-2.5 text-slate-400" />
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold text-white tracking-wide">
                          {entity.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-surfaceLight border border-borderDark text-slate-400">
                            {entity.category ? entity.category.toUpperCase().replace('_', ' ') : (entity.type || 'STANDBY')}
                          </span>
                          <span>•</span>
                          <span className="text-slate-400">Currently Offline</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 max-w-[220px] line-clamp-2">
                        Live stream is on standby. The feed will activate when broadcast begins.
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        {entity.youtube_handle ? (
                          <a
                            href={`https://www.youtube.com/${entity.youtube_handle.startsWith('@') ? entity.youtube_handle : '@' + entity.youtube_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-surfaceLight hover:bg-slate-700 text-white text-[11px] font-mono font-semibold transition-colors flex items-center gap-1 border border-borderDark"
                          >
                            <span>Open Channel</span>
                            <span className="text-[10px]">↗</span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2">
                    <Video className="w-8 h-8 text-slate-600 animate-pulse" />
                    <span className="text-xs font-mono text-slate-400">
                      Empty Slot #{idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Use dropdown above to assign a live stream
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
