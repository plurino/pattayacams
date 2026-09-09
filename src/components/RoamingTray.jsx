'use client';

import React from 'react';
import { Youtube, Star, ExternalLink, Play } from 'lucide-react';
import streamersData from '@/public/data/roaming_streamers.json';

export default function RoamingTray({ onSelectStreamer, onOpenSponsorModal }) {
  return (
    <aside aria-label="IRL Walking Channels and Venue Sponsorship" className="h-16 border-t border-borderDark bg-surface flex items-center justify-between px-3 md:px-5 shrink-0 z-40 select-none shadow-lg">
      {/* Real YouTube IRL Creators Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none flex-1 mr-3">
        <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-borderDark">
          <Youtube className="w-4 h-4 text-red-500" />
          <span className="text-[11px] font-bold font-mono text-slate-300 uppercase tracking-wider hidden sm:inline">
            IRL Walking Channels:
          </span>
        </div>

        {/* Creator Channel Pills */}
        <div className="flex items-center gap-2">
          {streamersData.map((streamer) => (
            <div
              key={streamer.id}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-surfaceLight/60 hover:bg-surfaceLight border border-borderDark hover:border-slate-500 transition-all shrink-0"
            >
              <img
                src={streamer.avatar_url}
                alt={streamer.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-600 shrink-0"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=60';
                }}
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">
                    {streamer.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 bg-surface px-1 rounded">
                    {streamer.youtube_handle}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 truncate max-w-[140px]">
                  {streamer.current_route}
                </span>
              </div>
              <button
                onClick={() => onSelectStreamer({
                  slug: streamer.id.toLowerCase(),
                  name: streamer.name,
                  youtube_channel_id: streamer.youtube_channel_id,
                  youtube_handle: streamer.youtube_handle,
                  description: `Popular YouTube IRL walking creator ${streamer.name} (${streamer.youtube_handle}) capturing 4K pedestrian street walks around Pattaya, Thailand.`,
                  type: 'streamer'
                })}
                className="ml-1 px-2 py-0.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase transition-colors flex items-center gap-0.5 shadow-sm"
              >
                <span>Channel</span>
                <Play className="w-2.5 h-2.5 fill-white" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* B2B Self-Serve List Venue Button */}
      <div className="shrink-0">
        <button
          onClick={onOpenSponsorModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brandGold/20 to-brandAmber/20 hover:from-brandGold/30 hover:to-brandAmber/30 border border-brandGold/60 text-brandGold text-xs font-bold transition-all shadow-[0_0_12px_rgba(234,179,8,0.25)] hover:shadow-[0_0_16px_rgba(234,179,8,0.4)]"
        >
          <Star className="w-3.5 h-3.5 fill-brandGold" />
          <span className="whitespace-nowrap">List Venue</span>
        </button>
      </div>
    </aside>
  );
}
