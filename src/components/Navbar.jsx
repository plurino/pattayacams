'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Map as MapIcon, Grid, Film, Users } from 'lucide-react';
// QUICK_JUMP_TARGETS is no longer rendered in the navbar — the zone selector
// has moved into the LayerToggleHUD's panel (Phase 1.3). Importing the
// constants is no longer required here.
import { getSavedTripDate } from '@/src/utils/storage';
import TripModal from '@/src/components/TripModal';

export default function Navbar({
  viewMode = 'map',
  setViewMode,
  onQuickJump,
  onOpenTripModal,
  onOpenSponsorModal,
  onLiveShuffle,
}) {
  const [tripDays, setTripDays] = useState(null);
  const [isInternalTripOpen, setIsInternalTripOpen] = useState(false);

  useEffect(() => {
    function calculateDays() {
      const saved = getSavedTripDate();
      if (!saved) {
        setTripDays(null);
        return;
      }
      const target = new Date(saved);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      const diffMs = target.getTime() - today.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      setTripDays(days > 0 ? days : 0);
    }

    calculateDays();

    window.addEventListener('pattayacams_trip_updated', calculateDays);
    return () => window.removeEventListener('pattayacams_trip_updated', calculateDays);
  }, []);


  const handleTripClick = () => {
    if (onOpenTripModal) {
      onOpenTripModal();
    } else {
      setIsInternalTripOpen(true);
    }
  };

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
    <header className="h-14 border-b border-borderDark bg-surface/95 backdrop-blur-md flex items-center justify-between px-2.5 sm:px-4 md:px-5 shrink-0 z-50 select-none shadow-lg">
      {/* 1. Left: Vice City-style Wordmark (Anton font, pink stroke, black drop shadow, pulsing) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          href="/"
          onClick={() => { if (setViewMode) setViewMode('map'); }}
          className="flex items-center gap-1.5 group shrink-0"
          title="PattayaCams - The city that never sleeps"
        >
          <span className="font-wordmark text-[28px] sm:text-[34px] leading-none whitespace-nowrap select-none italic text-white [transform:skewX(-8deg)] [paint-order:stroke_fill] [-webkit-text-stroke:2px_#FF2A6D] [text-shadow:2px_2px_0_#000,-1px_-1px_0_#000,2px_-1px_0_#000,-1px_2px_0_#000,3px_3px_0_#000] hover:text-black hover:scale-[1.04] transition-all duration-200 ease-out animate-[vice-pulse_2.5s_ease-in-out_infinite]">
            PattayaCams
          </span>
        </Link>

        {/* Live Network Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surfaceLight border border-borderDark text-[10px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-brandPink animate-pulse shadow-[0_0_8px_#FF2A6D]"></span>
          <span className="font-semibold text-brandPink">Live Radar</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Active</span>
        </div>
      </div>

      {/* 2. (Center Zone selector REMOVED in Phase 1.3 — now lives inside LayerToggleHUD's panel) */}

      {/* 3. Right: Trip Countdown & View Switcher (Countdown to the LEFT of View Switcher) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Icon-only Trip Countdown / Date Picker Button — always shows palm + days,
            never the longer "to Pattaya" text. Wider labels live only inside the modal. */}
        <button
          onClick={handleTripClick}
          className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 border border-borderDark text-xs font-mono transition-all text-slate-200 hover:border-brandPink/50 shrink-0"
          title={
            tripDays !== null
              ? `${tripDays} day${tripDays === 1 ? '' : 's'} until your trip to Pattaya — click to change`
              : 'Click to set your departure date & start the countdown'
          }
          aria-label={
            tripDays !== null
              ? `Trip countdown: ${tripDays} day${tripDays === 1 ? '' : 's'} until Pattaya`
              : 'Set your trip departure date'
          }
        >
          <span aria-hidden="true">{tripDays !== null ? '🌴' : '📅'}</span>
          <span className="text-brandPink font-bold text-[11px] sm:text-xs">
            {tripDays !== null ? `${tripDays}d` : 'Trip'}
          </span>
        </button>

        {/* View Mode Switcher: Map, Multi, Videos, Creators — monochrome lifted state, no neon gradients */}
        <div className="flex items-center bg-canvas/90 p-0.5 rounded-xl border border-borderDark/90 shadow-inner">
          {/* 1. Live Map */}
          {setViewMode ? (
            <button
              onClick={() => handleViewChange('map')}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(viewMode === 'map')}`}
              title="Interactive Live Map & City Overview"
            >
              <MapIcon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${viewMode === 'map' ? 'text-brandPink' : ''}`} />
              <span className="text-[11px] sm:text-xs">Map</span>
            </button>
          ) : (
            <Link
              href="/?view=map"
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(viewMode === 'map')}`}
              title="Interactive Live Map & City Overview"
            >
              <MapIcon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${viewMode === 'map' ? 'text-brandPink' : ''}`} />
              <span className="text-[11px] sm:text-xs">Map</span>
            </Link>
          )}

          {/* 2. Multi Cam */}
          {setViewMode ? (
            <button
              onClick={() => handleViewChange('grid')}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(viewMode === 'grid')}`}
              title="Multi Cam Command Grid"
            >
              <Grid className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${viewMode === 'grid' ? 'text-brandPink' : ''}`} />
              <span className="text-[11px] sm:text-xs">Multi</span>
            </button>
          ) : (
            <Link
              href="/?view=grid"
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(viewMode === 'grid')}`}
              title="Multi Cam Command Grid"
            >
              <Grid className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${viewMode === 'grid' ? 'text-brandPink' : ''}`} />
              <span className="text-[11px] sm:text-xs">Multi</span>
            </Link>
          )}

          {/* 3. Videos */}
          {setViewMode ? (
            <button
              onClick={() => handleViewChange('vids')}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(isVidsActive)}`}
              title="Curated 4K Street Walks, Nightlife Highlights & Expat Guides"
            >
              <Film className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isVidsActive ? 'text-brandPink' : ''}`} />
              <span className="text-[11px] sm:text-xs">Videos</span>
            </button>
          ) : (
            <Link
              href="/?view=vids"
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(isVidsActive)}`}
              title="Curated 4K Street Walks, Nightlife Highlights & Expat Guides"
            >
              <Film className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isVidsActive ? 'text-brandPink' : ''}`} />
              <span className="text-[11px] sm:text-xs">Videos</span>
            </Link>
          )}

          {/* 4. Creators */}
          <Link
            href="/creators"
            className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${navBtnClass(isCreatorsActive)}`}
            title="Pattaya Creators & Live Venues Directory"
          >
            <Users className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isCreatorsActive ? 'text-brandPink' : ''}`} />
            <span className="text-[11px] sm:text-xs">Creators</span>
          </Link>
        </div>
      </div>

      {/* Internal Trip Modal if opened from page without external state */}
      {!onOpenTripModal && (
        <TripModal
          isOpen={isInternalTripOpen}
          onClose={() => setIsInternalTripOpen(false)}
        />
      )}
    </header>
  );
}
