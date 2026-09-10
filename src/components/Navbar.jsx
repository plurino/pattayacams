'use client';

import React, { useEffect, useState } from 'react';
import { Video, Map as MapIcon, Grid, Calendar, ExternalLink, Wifi, Compass, Film, Users } from 'lucide-react';
import { QUICK_JUMP_TARGETS } from '@/src/utils/zones';
import { getSavedTripDate } from '@/src/utils/storage';
import { getKofiTipUrl, buildAiraloEsimUrl } from '@/src/utils/affiliate';
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

  const handleJump = (target) => {
    setActiveZone(target.label);
    if (viewMode !== 'map') {
      setViewMode('map');
    }
    if (onQuickJump) {
      onQuickJump(target.center, target.zoom);
    }
  };

  return (
    <header className="h-14 border-b border-borderDark bg-surface flex items-center justify-between px-3 md:px-5 shrink-0 z-50 select-none shadow-md">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brandCyan to-brandBlue flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.4)]">
            <Video className="w-4 h-4 text-canvas" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white group-hover:text-brandCyan transition-colors">
              Pattaya<span className="text-brandCyan">Cams</span>
            </span>
            <span className="hidden sm:inline-block text-[9px] font-mono text-slate-300 -mt-0.5 tracking-wider uppercase">
              Live Streams and Cameras
            </span>
          </div>
        </a>

        {/* Live Network Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surfaceLight border border-borderDark text-[11px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-brandGreen animate-pulse shadow-[0_0_8px_#10B981]"></span>
          <span className="font-semibold text-brandGreen">Live Radar</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Active</span>
        </div>
      </div>

      {/* Quick Jump Zone Pills */}
      <nav aria-label="Zone Quick Jumps" className="hidden md:flex items-center gap-1 bg-canvas/60 p-1 rounded-xl border border-borderDark/80">
        {QUICK_JUMP_TARGETS.map((target) => {
          const isActive = activeZone === target.label;
          return (
            <button
              key={target.label}
              onClick={() => handleJump(target)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-surfaceLight text-brandCyan shadow-sm border border-brandCyan/40'
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

      {/* Right Controls: Live Shuffle, Mode Switcher, Trip Countdown, and eSIM */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* City Roulette: Live Shuffle Button */}
        {FEATURES.ENABLE_ROULETTE && (
          <button
            onClick={onLiveShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brandPink/20 via-purple-600/20 to-brandCyan/20 hover:from-brandPink/30 hover:to-brandCyan/30 border border-brandPink/60 hover:border-brandPink text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,42,109,0.3)] hover:shadow-[0_0_16px_rgba(255,42,109,0.5)] cursor-pointer group shrink-0 active:scale-95"
            title="City Roulette: Fly to a random live stream"
          >
            <span className="text-sm group-hover:rotate-45 transition-transform duration-300">🎲</span>
            <span className="hidden sm:inline font-mono tracking-wide">Live Shuffle</span>
            <span className="sm:hidden font-mono">Shuffle</span>
          </button>
        )}

        {/* HIGH-INTENT PROMINENT eSIM PILL (Conditional on FEATURES.SHOW_AFFILIATE_ADS) */}
        {FEATURES.SHOW_AFFILIATE_ADS && (
          <a
            href={buildAiraloEsimUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-brandGold/20 hover:from-amber-500/30 hover:to-brandGold/30 border border-brandGold/60 text-brandGold text-xs font-bold transition-all shadow-[0_0_10px_rgba(234,179,8,0.2)]"
            title="Instant 5G Tourist eSIM for Thailand starting at $4.50"
          >
            <Wifi className="w-3.5 h-3.5 text-brandGold" />
            <span>Thailand 5G eSIM ($4.50)</span>
            <ExternalLink className="w-2.5 h-2.5 text-brandGold/70" />
          </a>
        )}

        {/* Mode Switcher: Map vs Grid vs PattayaVids */}
        <div className="flex items-center bg-canvas/90 p-1 rounded-xl border border-borderDark/90 shadow-inner">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'map'
                ? 'bg-brandCyan text-canvas shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-surfaceLight/50'
            }`}
            title="Interactive Live Map & Surveillance Radar"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Radar</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-brandCyan text-canvas shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-surfaceLight/50'
            }`}
            title="Multi-Cam Command Grid (4-up Quad View)"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Multi-Cam</span>
          </button>
          <button
            onClick={() => setViewMode('vids')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'vids' || viewMode === 'pulse'
                ? 'bg-gradient-to-r from-brandPink to-purple-600 text-white shadow-[0_0_14px_rgba(255,42,109,0.5)] border border-white/20'
                : 'text-brandPink hover:text-white hover:bg-brandPink/10'
            }`}
            title="PattayaVids: Curated 4K Street Walks, Nightlife Highlights & Expat Guides"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Pattaya<span className={viewMode === 'vids' || viewMode === 'pulse' ? 'text-white' : 'text-brandPink font-extrabold'}>Vids</span></span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider font-extrabold ${
              viewMode === 'vids' || viewMode === 'pulse'
                ? 'bg-white/20 text-white'
                : 'bg-brandPink/20 text-brandPink border border-brandPink/40'
            }`}>
              VOD
            </span>
          </button>
        </div>

        {/* Dynamic Trip Countdown / Date Picker Button */}
        <button
          onClick={onOpenTripModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surfaceLight hover:bg-surfaceLight/80 border border-borderDark text-xs font-mono transition-all text-slate-200 hover:border-brandGreen/50"
          title="Click to set your departure date & view countdown clock"
        >
          {tripDays !== null ? (
            <>
              <span className="text-base">🌴</span>
              <span className="text-brandGreen font-bold">{tripDays}d</span>
              <span className="hidden sm:inline text-slate-400">to Pattaya</span>
            </>
          ) : (
            <>
              <Calendar className="w-3.5 h-3.5 text-brandGreen" />
              <span className="font-semibold text-slate-200">Set Trip Date & Countdown</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
