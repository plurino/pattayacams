'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Youtube, Star, Play, Radio, ChevronRight } from 'lucide-react';
import streamersData from '@/public/data/roaming_streamers.json';
import { useStreamStatus } from '@/src/hooks/useStreamStatus';
import { FEATURES } from '@/src/config/features';

export default function RoamingTray({ onSelectStreamer, onOpenSponsorModal }) {
  const streamStatus = useStreamStatus();
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'live' | 'walks'

  const getStreamerStatus = useCallback((streamer) => {
    return (
      streamStatus?.entities?.[`streamer-${streamer.id}`] ||
      streamStatus?.entities?.[`streamer-${streamer.id.toLowerCase()}`]
    );
  }, [streamStatus]);

  const liveStreamers = useMemo(() => {
    return streamersData.filter((streamer) => {
      const status = getStreamerStatus(streamer);
      return status?.is_live === true;
    });
  }, [getStreamerStatus]);

  const displayedStreamers = useMemo(() => {
    if (filterMode === 'live') {
      return liveStreamers;
    }
    if (filterMode === 'walks') {
      return streamersData.filter(
        (s) =>
          s.name.toLowerCase().includes('walk') ||
          s.current_route.toLowerCase().includes('walk') ||
          s.youtube_handle.toLowerCase().includes('walk')
      );
    }
    return streamersData;
  }, [filterMode, liveStreamers]);

  const hasLiveStreamers = liveStreamers.length > 0;

  return (
    <aside
      aria-label="Pattaya Live Streamers and Venue Sponsorship"
      className="h-16 border-t border-borderDark bg-surface flex items-center justify-between px-3 md:px-5 shrink-0 z-40 select-none shadow-lg"
    >
      {/* Streamers Section */}
      <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none flex-1 mr-3">
        {/* Dock Header */}
        <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-borderDark">
          <Youtube className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-[11px] font-bold font-mono text-slate-200 uppercase tracking-wider hidden lg:inline flex items-center gap-1.5">
            {hasLiveStreamers ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            ) : null}
            Pattaya Streamers:
          </span>

          {/* Quick Filter Pills */}
          <div className="flex items-center bg-canvas/80 p-0.5 rounded-lg border border-borderDark/80 text-[10px] font-mono shrink-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterMode === 'all'
                  ? 'bg-surfaceLight text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({streamersData.length})
            </button>
            <button
              onClick={() => setFilterMode('live')}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                filterMode === 'live'
                  ? 'bg-red-950/80 text-red-400 border border-red-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Live ({liveStreamers.length})
            </button>
            <button
              onClick={() => setFilterMode('walks')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterMode === 'walks'
                  ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4K Walks
            </button>
          </div>
        </div>

        {/* Empty state for 'live' filter when 0 are live */}
        {displayedStreamers.length === 0 && filterMode === 'live' ? (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>No streamers live right now.</span>
            <button
              onClick={() => setFilterMode('all')}
              className="text-brandPink hover:underline font-bold"
            >
              Browse all {streamersData.length} creators ➔
            </button>
          </div>
        ) : (
          /* Streamer Channel Cards */
          <div className="flex items-center gap-2">
            {displayedStreamers.map((streamer) => {
              const status = getStreamerStatus(streamer);
              const isLive = status?.is_live === true;

              return (
                <div
                  key={streamer.id}
                  className={`flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border transition-all shrink-0 ${
                    isLive
                      ? 'bg-red-950/20 hover:bg-red-950/40 border-red-500/40 hover:border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                      : 'bg-surfaceLight/60 hover:bg-surfaceLight border-borderDark hover:border-slate-500'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={streamer.avatar_url}
                      alt={streamer.name}
                      className={`w-7 h-7 rounded-full object-cover border shrink-0 ${
                        isLive ? 'border-red-500' : 'border-slate-600'
                      }`}
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=60';
                      }}
                    />
                    {isLive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-surface animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">
                        {streamer.name}
                      </span>
                      {isLive ? (
                        <span className="text-[9px] font-mono font-bold text-red-400 bg-red-950/60 px-1 py-0.2 rounded border border-red-500/30">
                          LIVE
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-400 bg-surface px-1 rounded">
                          {streamer.youtube_handle}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 truncate max-w-[140px]">
                      {streamer.current_route}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      onSelectStreamer({
                        slug: streamer.id.toLowerCase(),
                        name: streamer.name,
                        youtube_channel_id: streamer.youtube_channel_id,
                        youtube_handle: streamer.youtube_handle,
                        description: `Live street stream and 4K walking tours around Pattaya by ${streamer.name} (${streamer.youtube_handle}).`,
                        type: 'streamer',
                        is_live: isLive,
                        video_id: isLive ? status?.video_id : null,
                      })
                    }
                    className={`ml-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors flex items-center gap-1 shadow-sm cursor-pointer ${
                      isLive
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <span>{isLive ? 'Watch Live' : 'Channel'}</span>
                    <Play className="w-2.5 h-2.5 fill-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* B2B Self-Serve List Venue Button */}
      {FEATURES.SHOW_B2B_SPONSOR_MODAL && (
        <div className="shrink-0">
          <button
            onClick={onOpenSponsorModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brandGold/20 to-brandAmber/20 hover:from-brandGold/30 hover:to-brandAmber/30 border border-brandGold/60 text-brandGold text-xs font-bold transition-all shadow-[0_0_12px_rgba(234,179,8,0.25)] hover:shadow-[0_0_16px_rgba(234,179,8,0.4)] cursor-pointer"
          >
            <Star className="w-3.5 h-3.5 fill-brandGold" />
            <span className="whitespace-nowrap">List Venue</span>
          </button>
        </div>
      )}
    </aside>
  );
}
