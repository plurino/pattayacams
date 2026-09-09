'use client';

import React from 'react';
import { Radio, Star, Play, ChevronRight } from 'lucide-react';
import streamersData from '@/public/data/roaming_streamers.json';

export default function RoamingTray({ onSelectStreamer, onOpenSponsorModal }) {
  return (
    <aside aria-label="Live Roaming Creators and Venue Sponsorship" className="h-16 border-t border-borderDark bg-surface flex items-center justify-between px-3 md:px-5 shrink-0 z-40 select-none shadow-lg">
      {/* Live IRL Walkers Stream Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none flex-1 mr-3">
        <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-borderDark">
          <span className="w-2 h-2 rounded-full bg-brandPink animate-ping"></span>
          <span className="text-[11px] font-bold font-mono text-brandPink uppercase tracking-wider hidden sm:inline">
            IRL Walkers:
          </span>
        </div>

        {/* Creator Pills */}
        <div className="flex items-center gap-2">
          {streamersData.map((streamer) => (
            <div
              key={streamer.id}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-surfaceLight/60 hover:bg-surfaceLight border border-borderDark hover:border-brandPink/50 transition-all shrink-0"
            >
              <img
                src={streamer.avatar_url}
                alt={streamer.name}
                className="w-7 h-7 rounded-full object-cover border border-brandPink/40 shrink-0"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=60';
                }}
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">
                    {streamer.name}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brandGreen"></span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 truncate max-w-[140px]">
                  {streamer.current_route}
                </span>
              </div>
              <button
                onClick={() => onSelectStreamer({ ...streamer, type: 'streamer' })}
                className="ml-1 px-2 py-0.5 rounded-full bg-brandPink hover:bg-pink-600 text-white text-[10px] font-bold uppercase transition-colors flex items-center gap-0.5 shadow-sm"
              >
                <span>Watch</span>
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
