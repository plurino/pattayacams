'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Map as MapIcon, Grid, Film, Users } from 'lucide-react';
// QUICK_JUMP_TARGETS is no longer rendered in the navbar — the zone selector
// has moved into the LayerToggleHUD's panel (Phase 1.3). Importing the
// constants is no longer required here.
// The Trip Countdown button has moved to TickerOverflowMenu.jsx (Sep 2026
// redesign) — TripModal + trip-state lives there now to keep the navbar
// focused on view-switching.

export default function Navbar({
  viewMode = 'map',
  setViewMode,
  onQuickJump,
  onLiveShuffle,
}) {

  const handleViewChange = (mode) => {
    if (setViewMode) {
      setViewMode(mode);
      if (typeof window !== 'undefined' && window.history) {
        const path = mode === 'map' ? '/' : `/?view=${mode}`;
        window.history.replaceState(null, '', path);
      }
    }
  };

  const isVidsActive = viewMode === 'vids' || viewMode === 'pulse';
  const isCreatorsActive = viewMode === 'creators' || viewMode === 'hub';

  // Monochrome view-switcher styling: lifted (not neon) active state.
  // Active icon picks up brandPink so each view still has a subtle identity cue.
  const navBtnClass = (active) =>
    active
      ? 'bg-surfaceLight text-white border border-borderDark shadow-sm'
      : 'text-slate-400 hover:text-white hover:bg-surfaceLight/60 border border-transparent';

  return (
    <header className="h-18 sm:h-20 border-b border-borderDark bg-surface/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-5 md:px-6 shrink-0 z-50 select-none shadow-lg">
      {/* 1. Left: PattayaCams Logo with interactive neon glow & scale hover */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        <Link
          href="/"
          onClick={() => { if (setViewMode) setViewMode('map'); }}
          className="flex items-center group shrink-0 py-1"
          title="PattayaCams - The city that never sleeps"
        >
          <Image
            src="/images/logo.png"
            alt="PattayaCams Logo"
            width={240}
            height={134}
            priority
            className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-all duration-300 ease-out filter drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)] group-hover:scale-105 group-hover:brightness-110 group-hover:drop-shadow-[0_0_20px_rgba(255,42,109,0.85)] active:scale-95 select-none"
          />
        </Link>

        {/* Live Network Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surfaceLight border border-borderDark text-[11px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-brandPink animate-pulse shadow-[0_0_8px_#FF2A6D]"></span>
          <span className="font-semibold text-brandPink">Live Radar</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Active</span>
        </div>
      </div>

      {/* 2. (Center Zone selector REMOVED in Phase 1.3 — now lives inside LayerToggleHUD's panel) */}

      {/* 3. Right: View Switcher (Trip Countdown now lives in TickerOverflowMenu) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* View Mode Switcher: Map, Multi, Videos, Creators — enlarged buttons */}
        <div className="flex items-center bg-canvas/90 p-1 rounded-2xl border border-borderDark/90 shadow-inner gap-0.5 sm:gap-1">
          {/* 1. Live Map */}
          {setViewMode ? (
            <button
              onClick={() => handleViewChange('map')}
              className={`flex items-center gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(viewMode === 'map')}`}
              title="Interactive Live Map & City Overview"
            >
              <MapIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${viewMode === 'map' ? 'text-brandPink' : ''}`} />
              <span>Map</span>
            </button>
          ) : (
            <Link
              href="/?view=map"
              className={`flex items-center gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(viewMode === 'map')}`}
              title="Interactive Live Map & City Overview"
            >
              <MapIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${viewMode === 'map' ? 'text-brandPink' : ''}`} />
              <span>Map</span>
            </Link>
          )}

          {/* 2. Multi Cam */}
          {setViewMode ? (
            <button
              onClick={() => handleViewChange('grid')}
              className={`flex items-center gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(viewMode === 'grid')}`}
              title="Multi Cam Command Grid"
            >
              <Grid className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${viewMode === 'grid' ? 'text-brandPink' : ''}`} />
              <span>Multi</span>
            </button>
          ) : (
            <Link
              href="/?view=grid"
              className={`flex items-center gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(viewMode === 'grid')}`}
              title="Multi Cam Command Grid"
            >
              <Grid className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${viewMode === 'grid' ? 'text-brandPink' : ''}`} />
              <span>Multi</span>
            </Link>
          )}

          {/* 3. Videos */}
          {setViewMode ? (
            <button
              onClick={() => handleViewChange('vids')}
              className={`flex items-center gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(isVidsActive)}`}
              title="Curated 4K Street Walks, Nightlife Highlights & Expat Guides"
            >
              <Film className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isVidsActive ? 'text-brandPink' : ''}`} />
              <span>Videos</span>
            </button>
          ) : (
            <Link
              href="/?view=vids"
              className={`flex items-center gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(isVidsActive)}`}
              title="Curated 4K Street Walks, Nightlife Highlights & Expat Guides"
            >
              <Film className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isVidsActive ? 'text-brandPink' : ''}`} />
              <span>Videos</span>
            </Link>
          )}

          {/* 4. Creators */}
          <Link
            href="/creators"
            className={`flex items-center gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(isCreatorsActive)}`}
            title="Pattaya Creators & Live Venues Directory"
          >
            <Users className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isCreatorsActive ? 'text-brandPink' : ''}`} />
            <span>Creators</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
