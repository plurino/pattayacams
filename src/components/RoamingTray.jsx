'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Youtube, Star, Play, Radio, Users } from 'lucide-react';
import streamersData from '@/public/data/roaming_streamers.json';
import creatorsData from '@/public/data/creators.json';
import { useStreamStatus } from '@/src/hooks/useStreamStatus';
import { FEATURES } from '@/src/config/features';

export default function RoamingTray({ onSelectStreamer, onOpenSponsorModal }) {
  const streamStatus = useStreamStatus();

  // Combine both roaming streamers and full creators pool
  const allPool = useMemo(() => {
    const map = new Map();
    // Add creators first
    creatorsData.forEach((c) => {
      map.set(c.slug, {
        id: c.slug,
        slug: c.slug,
        name: c.name,
        handle: c.handle,
        avatar_url: c.avatar_url,
        platform: c.platform,
        channel_id: c.channel_id,
        kick_channel: c.kick_channel,
        type: 'creator',
      });
    });
    // Add roaming streamers if not already present
    streamersData.forEach((s) => {
      const key = s.id.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: s.id,
          slug: s.id.toLowerCase(),
          name: s.name,
          handle: s.youtube_handle,
          avatar_url: s.avatar_url,
          platform: 'youtube',
          channel_id: s.youtube_channel_id,
          type: 'streamer',
        });
      }
    });
    return Array.from(map.values());
  }, []);

  const getEntityStatus = useCallback((item) => {
    return (
      streamStatus?.entities?.[item.slug] ||
      streamStatus?.entities?.[item.id] ||
      streamStatus?.entities?.[item.id?.toLowerCase()] ||
      streamStatus?.entities?.[item.slug ? `creator-${item.slug}` : ''] ||
      streamStatus?.entities?.[item.id ? `streamer-${item.id}` : ''] ||
      streamStatus?.entities?.[item.id ? `streamer-${item.id.toLowerCase()}` : '']
    );
  }, [streamStatus]);

  // Filter ONLY active live creators
  const liveCreators = useMemo(() => {
    return allPool.filter((item) => {
      const status = getEntityStatus(item);
      return status?.is_live === true;
    }).map((item) => {
      const status = getEntityStatus(item);
      return {
        ...item,
        is_live: true,
        video_id: status?.video_id || null,
        active_platform: status?.platform || item.platform,
      };
    });
  }, [allPool, getEntityStatus]);

  const hasLive = liveCreators.length > 0;

  return (
    <aside
      aria-label="Live in Pattaya"
      className="h-14 sm:h-16 border-t border-borderDark bg-surface flex items-center justify-between px-2 sm:px-4 md:px-5 shrink-0 z-40 select-none shadow-lg gap-2"
    >
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 scrollbar-none flex-1 min-w-0">
        {/* Dock Header: Responsive (compact on mobile, full on desktop) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pr-2 sm:pr-3 border-r border-borderDark">
          {hasLive ? (
            <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-red-500"></span>
            </span>
          ) : (
            <Radio className="w-3.5 h-3.5 text-slate-400" />
          )}

          <div className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-bold">
            <span className="text-white uppercase tracking-wider hidden sm:inline">Live in Pattaya</span>
            <span className="text-white uppercase tracking-wider sm:hidden">Live</span>
            {hasLive ? (
              <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-extrabold shadow-[0_0_8px_#EF4444]">
                {liveCreators.length} Live
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-surfaceLight border border-borderDark text-slate-400 text-[9px]">
                0
              </span>
            )}
          </div>
        </div>

        {/* When NO creators are live: Standby state */}
        {!hasLive ? (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 truncate">
            <span className="hidden sm:inline">No creators broadcasting live right now.</span>
            <span className="sm:hidden text-[11px]">No creators live.</span>
            <span className="text-slate-600">•</span>
            <Link
              href="/creators"
              className="text-brandPink hover:text-pink-300 font-bold transition-colors flex items-center gap-1 shrink-0 text-[11px] sm:text-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Explore 70+ Channels ↗</span>
            </Link>
          </div>
        ) : (
          /* When creators ARE live: Immediate prominent display with ZERO clipping */
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {liveCreators.map((creator) => {
              return (
                <div
                  key={creator.id}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border bg-red-950/40 hover:bg-red-950/60 border-red-500/60 hover:border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all shrink-0 max-w-full"
                >
                  <div className="relative shrink-0">
                    <img
                      src={creator.avatar_url}
                      alt={creator.name}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-red-500 shrink-0"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=60';
                      }}
                    />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-surface animate-pulse" />
                  </div>

                  <div className="flex flex-col pr-1 min-w-0">
                    <span className="text-xs font-bold font-mono text-white leading-tight max-w-[90px] sm:max-w-[130px] truncate">
                      {creator.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-300 leading-tight truncate">
                      {creator.handle || `@${creator.slug}`}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectStreamer(creator)}
                    className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-all cursor-pointer shrink-0"
                  >
                    <span>Watch</span>
                    <Play className="w-2.5 h-2.5 fill-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* B2B Self-Serve List Venue Button (Compact icon on mobile when a stream is live) */}
      {FEATURES.SHOW_B2B_SPONSOR_MODAL && (
        <div className="shrink-0">
          <button
            onClick={onOpenSponsorModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-brandGold/20 to-brandAmber/20 hover:from-brandGold/30 hover:to-brandAmber/30 border border-brandGold/60 text-brandGold text-xs font-bold transition-all shadow-[0_0_12px_rgba(234,179,8,0.25)] hover:shadow-[0_0_16px_rgba(234,179,8,0.4)] cursor-pointer"
            title="List your Pattaya Venue"
          >
            <Star className="w-3.5 h-3.5 fill-brandGold" />
            <span className="hidden sm:inline whitespace-nowrap">List Venue</span>
          </button>
        </div>
      )}
    </aside>
  );
}
