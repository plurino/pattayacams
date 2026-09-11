'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Video, Map as MapIcon, Grid, Calendar, Wifi, Film, ChevronDown, Sparkles, Users } from 'lucide-react';
import { QUICK_JUMP_TARGETS } from '@/src/utils/zones';
import { getSavedTripDate } from '@/src/utils/storage';
import { FEATURES } from '@/src/config/features';
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
  const [activeZone, setActiveZone] = useState('');
  const [isZoneMenuOpen, setIsZoneMenuOpen] = useState(false);
  const [isInternalTripOpen, setIsInternalTripOpen] = useState(false);
  const zoneMenuRef = useRef(null);

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

  // Close zone dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (zoneMenuRef.current && !zoneMenuRef.current.contains(e.target)) {
        setIsZoneMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleJump = (target) => {
    setActiveZone(target.label);
    setIsZoneMenuOpen(false);
    if (onQuickJump) {
      if (viewMode !== 'map' && setViewMode) {
        setViewMode('map');
        setTimeout(() => {
          onQuickJump(target.center, target.zoom);
        }, 120);
      } else {
        onQuickJump(target.center, target.zoom);
      }
    } else {
      window.location.href = `/?jump=${encodeURIComponent(target.label)}`;
    }
  };


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

  return (
    <header className="h-14 border-b border-borderDark bg-surface/95 backdrop-blur-md flex items-center justify-between px-2.5 sm:px-4 md:px-5 shrink-0 z-50 select-none shadow-lg">
      {/* 1. Left: Brand Logo & Sexy Hover */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link href="/" className="flex items-center gap-1.5 group shrink-0" title="PattayaCams - The city that never sleeps">
          <img
            src="/images/logo-dark.png"
            alt="PattayaCams Logo"
            className="h-7 sm:h-8 md:h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110 group-hover:drop-shadow-[0_0_14px_rgba(255,42,109,0.7)]"
          />
        </Link>

        {/* Live Network Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surfaceLight border border-borderDark text-[10px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-brandPink animate-pulse shadow-[0_0_8px_#FF2A6D]"></span>
          <span className="font-semibold text-brandPink">Live Radar</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Active</span>
        </div>
      </div>

      {/* 2. Center: Zone Navigation (Only displayed in Live Map mode) */}
      {viewMode === 'map' && (
        <div className="flex items-center shrink-0">
          {/* Desktop Quick Jump Zone Pills (xl+ screens) */}
          <nav aria-label="Zone Quick Jumps" className="hidden xl:flex items-center gap-1 bg-canvas/60 p-1 rounded-xl border border-borderDark/80">
            {QUICK_JUMP_TARGETS.map((target) => {
              const isActive = activeZone === target.label;
              return (
                <button
                  key={target.label}
                  onClick={() => handleJump(target)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-surfaceLight text-brandPink shadow-sm border border-brandPink/40 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-surfaceLight/50'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: target.color }}
                  ></span>
                  {target.label}
                </button>
              );
            })}
          </nav>

          {/* Compact Zone Dropdown for Mobile & Tablet (< xl screens) */}
          <div className="relative xl:hidden" ref={zoneMenuRef}>
            <button
              onClick={() => setIsZoneMenuOpen(!isZoneMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-surfaceLight/70 hover:bg-surfaceLight border border-borderDark text-xs font-mono text-slate-300 hover:text-white transition-colors whitespace-nowrap"
              title="Jump to City Zones"
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brandPink shrink-0"></span>
              <span className="text-[10px] sm:text-[11px] font-semibold">{activeZone || 'Zones'}</span>
              <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform ${isZoneMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isZoneMenuOpen && (
              <div className="absolute left-0 mt-1 w-44 rounded-xl bg-surface border border-borderDark shadow-2xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-md">
                <div className="text-[9px] font-mono uppercase text-slate-400 px-2 py-1 border-b border-borderDark/60">
                  Quick Jump Zones
                </div>
                {QUICK_JUMP_TARGETS.map((target) => (
                  <button
                    key={target.label}
                    onClick={() => handleJump(target)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-brandPink/20 flex items-center gap-2 transition-colors"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: target.color }}
                    ></span>
                    <span>{target.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Right: Trip Countdown & View Switcher (Countdown to the LEFT of View Switcher) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Dynamic Trip Countdown / Date Picker Button (Positioned to the LEFT of the mode options) */}
        <button
          onClick={handleTripClick}
          className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 border border-borderDark text-xs font-mono transition-all text-slate-200 hover:border-brandPink/50 shrink-0"
          title="Click to set your departure date & view countdown clock"
        >
          {tripDays !== null ? (
            <>
              <span className="text-xs sm:text-sm">🌴</span>
              <span className="text-brandPink font-bold text-[11px] sm:text-xs">{tripDays}d</span>
              <span className="hidden lg:inline text-slate-400">to Pattaya</span>
            </>
          ) : (
            <>
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brandPink" />
              <span className="hidden md:inline font-semibold text-slate-200">Trip</span>
            </>
          )}
        </button>

        {/* View Mode Switcher: Map, Multi, Videos, Creators positioned to the RIGHT */}
        <div className="flex items-center bg-canvas/90 p-0.5 rounded-xl border border-borderDark/90 shadow-inner">
          {/* 1. Live Map (Electric Cyan) */}
          {setViewMode ? (
            <button
              onClick={() => handleViewChange('map')}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-white shadow-[0_0_14px_rgba(0,229,255,0.45)] border border-cyan-300/30'
                  : 'text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/15'
              }`}
              title="Interactive Live Map & City Overview"
            >
              <MapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs">Map</span>
            </button>
          ) : (
            <Link
              href="/?view=map"
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-white shadow-[0_0_14px_rgba(0,229,255,0.45)] border border-cyan-300/30'
                  : 'text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/15'
              }`}
              title="Interactive Live Map & City Overview"
            >
              <MapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs">Map</span>
            </Link>
          )}

          {/* 2. Multi Cam (Neon Amber / Gold) */}
          {setViewMode ? (
            <button
              onClick={() => handleViewChange('grid')}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white shadow-[0_0_14px_rgba(245,158,11,0.45)] border border-amber-300/30'
                  : 'text-amber-400 hover:text-amber-200 hover:bg-amber-500/15'
              }`}
              title="Multi Cam Command Grid"
            >
              <Grid className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs">Multi</span>
            </button>
          ) : (
            <Link
              href="/?view=grid"
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white shadow-[0_0_14px_rgba(245,158,11,0.45)] border border-amber-300/30'
                  : 'text-amber-400 hover:text-amber-200 hover:bg-amber-500/15'
              }`}
              title="Multi Cam Command Grid"
            >
              <Grid className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs">Multi</span>
            </Link>
          )}

          {/* 3. Videos (Hot Pink / Rose) */}
          {setViewMode ? (
            <button
              onClick={() => handleViewChange('vids')}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isVidsActive
                  ? 'bg-gradient-to-r from-brandPink via-rose-600 to-pink-600 text-white shadow-[0_0_14px_rgba(255,42,109,0.45)] border border-rose-300/30'
                  : 'text-brandPink hover:text-pink-200 hover:bg-brandPink/15'
              }`}
              title="Curated 4K Street Walks, Nightlife Highlights & Expat Guides"
            >
              <Film className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs">Videos</span>
            </button>
          ) : (
            <Link
              href="/?view=vids"
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isVidsActive
                  ? 'bg-gradient-to-r from-brandPink via-rose-600 to-pink-600 text-white shadow-[0_0_14px_rgba(255,42,109,0.45)] border border-rose-300/30'
                  : 'text-brandPink hover:text-pink-200 hover:bg-brandPink/15'
              }`}
              title="Curated 4K Street Walks, Nightlife Highlights & Expat Guides"
            >
              <Film className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs">Videos</span>
            </Link>
          )}

          {/* 4. Creators (Electric Purple / Violet) */}
          <Link
            href="/creators"
            className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              isCreatorsActive
                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white shadow-[0_0_14px_rgba(168,85,247,0.45)] border border-purple-300/30'
                : 'text-purple-400 hover:text-purple-200 hover:bg-purple-500/15'
            }`}
            title="Pattaya Creators & Live Venues Directory"
          >
            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
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
