'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Video, Map as MapIcon, Grid, Calendar, Wifi, Film, ChevronDown, Sparkles } from 'lucide-react';
import { QUICK_JUMP_TARGETS } from '@/src/utils/zones';
import { getSavedTripDate } from '@/src/utils/storage';
import { FEATURES } from '@/src/config/features';

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
    if (viewMode !== 'map') {
      setViewMode('map');
      setTimeout(() => {
        if (onQuickJump) onQuickJump(target.center, target.zoom);
      }, 120);
    } else {
      if (onQuickJump) onQuickJump(target.center, target.zoom);
    }
  };

  const isVidsActive = viewMode === 'vids' || viewMode === 'pulse';

  return (
    <header className="h-14 border-b border-borderDark bg-surface/95 backdrop-blur-md flex items-center justify-between px-2.5 sm:px-4 md:px-5 shrink-0 z-50 select-none shadow-lg">
      {/* 1. Left: Brand Logo & Sexy Hover */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <a href="/" className="flex items-center gap-2 group shrink-0" title="PattayaCams - The city that never sleeps">
          <img
            src="/images/logo-dark.png"
            alt="PattayaCams Logo"
            className="h-8 sm:h-9 md:h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105 group-hover:brightness-110 group-hover:drop-shadow-[0_0_14px_rgba(255,42,109,0.7)]"
          />
        </a>

        {/* Live Network Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surfaceLight border border-borderDark text-[10px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-brandPink animate-pulse shadow-[0_0_8px_#FF2A6D]"></span>
          <span className="font-semibold text-brandPink">Live Radar</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Active</span>
        </div>
      </div>

      {/* 2. Center: Zone Navigation (Desktop Bar & Mobile/Tablet Dropdown) */}
      <div className="flex items-center">
        {/* Desktop Quick Jump Zone Pills (xl+ screens) */}
        <nav aria-label="Zone Quick Jumps" className="hidden xl:flex items-center gap-1 bg-canvas/60 p-1 rounded-xl border border-borderDark/80">
          {QUICK_JUMP_TARGETS.map((target) => {
            const isActive = activeZone === target.label;
            return (
              <button
                key={target.label}
                onClick={() => handleJump(target)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
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
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surfaceLight/70 hover:bg-surfaceLight border border-borderDark text-xs font-mono text-slate-300 hover:text-white transition-colors"
            title="Jump to City Zones"
          >
            <span className="w-2 h-2 rounded-full bg-brandPink"></span>
            <span className="text-[11px] font-semibold">{activeZone || 'Zones'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isZoneMenuOpen ? 'rotate-180' : ''}`} />
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

      {/* 3. Right: View Switcher, Live Shuffle & Trip Countdown */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* City Roulette: Live Shuffle Button (Shown on sm+ screens) */}
        {FEATURES.ENABLE_ROULETTE && (
          <button
            onClick={onLiveShuffle}
            className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-brandPink/20 via-purple-600/20 to-brandRed/20 hover:from-brandPink/30 hover:to-brandRed/30 border border-brandPink/60 hover:border-brandPink text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,42,109,0.25)] cursor-pointer shrink-0 active:scale-95"
            title="City Roulette: Fly to a random live stream"
          >
            <span className="text-sm">🎲</span>
            <span className="hidden md:inline font-mono tracking-wide">Live Shuffle</span>
          </button>
        )}

        {/* View Mode Switcher: Radar vs Multi-Cam vs PattayaVids */}
        <div className="flex items-center bg-canvas/90 p-0.5 rounded-xl border border-borderDark/90 shadow-inner">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'map'
                ? 'bg-gradient-to-r from-brandPink to-rose-600 text-white shadow-[0_0_12px_rgba(255,42,109,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-surfaceLight/50'
            }`}
            title="Interactive Live Map & Surveillance Radar"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Radar</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-brandPink to-rose-600 text-white shadow-[0_0_12px_rgba(255,42,109,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-surfaceLight/50'
            }`}
            title="Multi-Cam Command Grid (4-up Quad View)"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Multi-Cam</span>
          </button>
          <button
            onClick={() => setViewMode('vids')}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all ${
              isVidsActive
                ? 'bg-gradient-to-r from-brandPink via-purple-600 to-rose-600 text-white shadow-[0_0_14px_rgba(255,42,109,0.5)] border border-white/20'
                : 'text-brandPink hover:text-white hover:bg-brandPink/10'
            }`}
            title="PattayaVids: Curated 4K Street Walks, Nightlife Highlights & Expat Guides"
          >
            <Film className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Pattaya<span className={isVidsActive ? 'text-white' : 'text-brandPink font-extrabold'}>Vids</span></span>
            <span className="sm:hidden font-bold text-[11px]">Vids</span>
            <span className={`hidden sm:inline-block text-[9px] px-1 py-0.2 rounded font-mono uppercase font-black ${
              isVidsActive
                ? 'bg-white/20 text-white'
                : 'bg-brandPink/20 text-brandPink border border-brandPink/40'
            }`}>
              VOD
            </span>
          </button>
        </div>

        {/* Dynamic Trip Countdown / Date Picker Button (Shown on sm+ screens) */}
        <button
          onClick={onOpenTripModal}
          className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 border border-borderDark text-xs font-mono transition-all text-slate-200 hover:border-brandPink/50 shrink-0"
          title="Click to set your departure date & view countdown clock"
        >
          {tripDays !== null ? (
            <>
              <span className="text-sm">🌴</span>
              <span className="text-brandPink font-bold">{tripDays}d</span>
              <span className="hidden lg:inline text-slate-400">to Pattaya</span>
            </>
          ) : (
            <>
              <Calendar className="w-3.5 h-3.5 text-brandPink" />
              <span className="hidden md:inline font-semibold text-slate-200">Trip Countdown</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
