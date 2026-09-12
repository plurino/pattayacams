'use client';

import React, { useState } from 'react';
import {
  Layers,
  AlertCircle,
  X,
  RotateCcw,
  RotateCw,
  Sun,
  Moon,
  Navigation,
  Play,
  Pause,
  CloudRain,
} from 'lucide-react';

export default function LayerToggleHUD({
  showVenues,
  setShowVenues,
  showLiveCams = true,
  setShowLiveCams,
  showCams,
  setShowCams,
  showTransit,
  setShowTransit,
  showRadar = true,
  setShowRadar,
  radarState,
  venueCount = 0,
  liveCamCount = 2,
  camCount = 0,
  transitCount = 3,
  bearing = 0,
  onRotateLeft,
  onRotateRight,
  onResetNorth,
  mapTheme = 'dark',
  onToggleTheme,
}) {
  const [toastMessage, setToastMessage] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCctvToggle = (checked) => {
    setShowCams(checked);
    if (checked) {
      setToastMessage('Surveillance mode active: click any cyan camera to inspect official city stream code.');
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const isRotated = bearing !== 0;

  return (
    <>
      {/* 1. Top-Right Floating Controls: Compass, Quick Rotation & Theme Switcher */}
      <div className="absolute top-24 right-3 z-30 flex flex-col items-center gap-1.5 pointer-events-auto select-none">
        {/* Compass Needle Rose Button (Click to reset to North) */}
        <button
          onClick={onResetNorth}
          className={`w-9 h-9 rounded-xl bg-surface/90 backdrop-blur-md border transition-all flex items-center justify-center relative shadow-xl group ${
            isRotated
              ? 'border-brandPink text-brandPink shadow-[0_0_12px_rgba(255,42,109,0.4)]'
              : 'border-borderDark text-slate-300 hover:text-white hover:border-slate-500'
          }`}
          title={isRotated ? `Bearing: ${bearing}° • Click to Reset North (0°)` : 'Facing North (0°)'}
        >
          {/* Rotating Compass Needle */}
          <div
            className="w-5 h-5 transition-transform duration-200 ease-out flex items-center justify-center relative"
            style={{ transform: `rotate(${-bearing}deg)` }}
          >
            <Navigation className="w-4 h-4 fill-brandPink text-rose-500 drop-shadow" />
            <span className="absolute -top-1.5 text-[7px] font-black text-brandPink font-mono">N</span>
          </div>

          {/* Rotated Angle Badge */}
          {isRotated && (
            <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-brandPink text-white font-mono font-black text-[8px]">
              {bearing}°
            </span>
          )}
        </button>

        {/* Quick Rotation Buttons (-45° and +45°) */}
        <div className="flex flex-col rounded-xl bg-surface/90 backdrop-blur-md border border-borderDark shadow-xl overflow-hidden divide-y divide-borderDark/60">
          <button
            onClick={onRotateLeft}
            className="w-9 h-8 flex items-center justify-center text-slate-300 hover:text-brandPink hover:bg-surfaceLight/60 transition-colors"
            title="Rotate Left 45° (↶)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRotateRight}
            className="w-9 h-8 flex items-center justify-center text-slate-300 hover:text-brandPink hover:bg-surfaceLight/60 transition-colors"
            title="Rotate Right 45° (↷)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dark / Light Basemap Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-xl bg-surface/90 backdrop-blur-md border border-borderDark hover:border-brandGold/60 text-slate-300 hover:text-brandGold transition-all flex items-center justify-center shadow-xl group"
          title={mapTheme === 'dark' ? 'Switch to Light Map Mode' : 'Switch to Dark Map Mode'}
        >
          {mapTheme === 'dark' ? (
            <Sun className="w-4 h-4 group-hover:rotate-90 transition-transform text-brandGold" />
          ) : (
            <Moon className="w-4 h-4 group-hover:-rotate-12 transition-transform text-indigo-400" />
          )}
        </button>
      </div>

      {/* 2. Bottom-Left Map Layer Controller */}
      <aside aria-label="Map Layer Controls" className="absolute bottom-4 sm:bottom-6 left-3 sm:left-6 z-30 flex flex-col gap-2 pointer-events-auto select-none">
        {/* CCTV Disclaimer Toast */}
        {toastMessage && (
          <div className="bg-surface/95 backdrop-blur-md border border-brandPink/50 text-slate-200 text-xs px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2 max-w-[280px] animate-fade-in">
            <AlertCircle className="w-4 h-4 text-brandPink shrink-0" />
            <span className="leading-tight text-[11px]">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white shrink-0 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Collapsed Floating Pill on Mobile (< sm) */}
        {!isMobileMenuOpen && (
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface/95 backdrop-blur-md border border-brandPink/60 text-brandPink shadow-xl active:scale-95 transition-all text-xs font-bold"
            title="Toggle Map Layers"
          >
            <Layers className="w-4 h-4 text-brandPink" />
            <span className="font-mono text-[11px]">Layers</span>
          </button>
        )}

        <div className={`bg-surface/90 backdrop-blur-md border border-borderDark rounded-xl p-3 shadow-2xl flex-col gap-2 min-w-[220px] text-xs font-medium ${isMobileMenuOpen ? 'flex' : 'hidden sm:flex'}`}>
          <div className="flex items-center justify-between pb-1.5 border-b border-borderDark/60 text-slate-400 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-brandPink" />
              <span>Map Layers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-400 uppercase">
                {mapTheme === 'dark' ? 'Dark Matter' : 'Light Map'}
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="sm:hidden text-slate-400 hover:text-white p-0.5"
                title="Close Layers Panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Venues Toggle */}
          <label className="flex items-center justify-between gap-3 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-surfaceLight/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brandPink shadow-[0_0_8px_#FF2A6D]"></span>
              <span className="text-slate-200">Live Venues</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 bg-surfaceLight px-1.5 py-0.5 rounded">
                {venueCount}
              </span>
              <input
                type="checkbox"
                checked={showVenues}
                onChange={(e) => setShowVenues(e.target.checked)}
                className="w-4 h-4 rounded border-borderDark bg-surface text-brandPink focus:ring-brandPink focus:ring-offset-0 cursor-pointer accent-brandPink"
              />
            </div>
          </label>

          {/* 24/7 Live Cams Toggle */}
          <label className="flex items-center justify-between gap-3 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-surfaceLight/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]"></span>
              <span className="text-slate-200">24/7 Live Cams</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 bg-surfaceLight px-1.5 py-0.5 rounded">
                {liveCamCount}
              </span>
              <input
                type="checkbox"
                checked={showLiveCams}
                onChange={(e) => setShowLiveCams && setShowLiveCams(e.target.checked)}
                className="w-4 h-4 rounded border-borderDark bg-surface text-emerald-400 focus:ring-emerald-400 focus:ring-offset-0 cursor-pointer accent-emerald-400"
              />
            </div>
          </label>

          {/* CCTVs Toggle (Dormant Constellation vs Active Cyan) */}
          <label className="flex items-center justify-between gap-3 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-surfaceLight/50 transition-colors">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  showCams
                    ? 'bg-brandCyan shadow-[0_0_8px_#00E5FF]'
                    : 'bg-slate-400 opacity-60'
                }`}
              ></span>
              <div className="flex flex-col">
                <span className="text-slate-200">City CCTV Cams</span>
                <span className="text-[9px] font-mono text-slate-400 -mt-0.5">
                  {showCams ? 'Active Cyan Pins' : 'Dormant Radar Dots'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 bg-surfaceLight px-1.5 py-0.5 rounded">
                {camCount}
              </span>
              <input
                type="checkbox"
                checked={showCams}
                onChange={(e) => handleCctvToggle(e.target.checked)}
                className="w-4 h-4 rounded border-borderDark bg-surface text-brandCyan focus:ring-brandCyan focus:ring-offset-0 cursor-pointer accent-brandCyan"
              />
            </div>
          </label>

          {/* Transit Lines Toggle */}
          <label className="flex items-center justify-between gap-3 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-surfaceLight/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-1 rounded bg-brandBlue shadow-[0_0_6px_#3B82F6]"></span>
              <span className="text-slate-200">Baht Bus Transit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 bg-surfaceLight px-1.5 py-0.5 rounded">
                {transitCount}
              </span>
              <input
                type="checkbox"
                checked={showTransit}
                onChange={(e) => setShowTransit(e.target.checked)}
                className="w-4 h-4 rounded border-borderDark bg-surface text-brandBlue focus:ring-brandBlue focus:ring-offset-0 cursor-pointer accent-brandBlue"
              />
            </div>
          </label>

          {/* Rain Radar Toggle (Active by default, Doppler wording removed) */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-borderDark/60">
            <label className="flex items-center justify-between gap-3 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-surfaceLight/50 transition-colors">
              <div className="flex items-center gap-2">
                <CloudRain className={`w-3.5 h-3.5 ${showRadar ? 'text-teal-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="text-slate-200">Rain Radar</span>
              </div>
              <input
                type="checkbox"
                checked={showRadar}
                onChange={(e) => setShowRadar && setShowRadar(e.target.checked)}
                className="w-4 h-4 rounded border-borderDark bg-surface text-teal-400 focus:ring-teal-400 focus:ring-offset-0 cursor-pointer accent-teal-400"
              />
            </label>

            {/* Radar Playback Timeline Controls when active */}
            {showRadar && radarState && (
              <div className="bg-canvas/90 p-2 rounded-lg border border-teal-500/30 flex flex-col gap-1.5 mt-0.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-teal-400 font-bold truncate max-w-[140px]">{radarState.frameLabel || radarState.formattedTime || 'Live Rain Radar'}</span>
                  <span className={`text-[8.5px] px-1 py-0.5 rounded font-bold flex items-center gap-1 ${radarState.currentFrame?.isForecast ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'}`}>
                    {radarState.currentFrame?.isForecast ? '🔮 Forecast' : '🛰️ Live Radar'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={radarState.handleTogglePlay || (() => radarState.setIsPlaying(!radarState.isPlaying))}
                    className="p-1 rounded bg-teal-950/60 hover:bg-teal-900 border border-teal-500/40 text-teal-300 hover:text-white transition-colors"
                    title={radarState.isPlaying ? 'Pause Radar Loop' : 'Play Radar (Plays once to end)'}
                  >
                    {radarState.isPlaying ? (
                      <Pause className="w-3 h-3 fill-teal-300" />
                    ) : (
                      <Play className="w-3 h-3 fill-teal-300" />
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, radarState.frames.length - 1)}
                    value={radarState.currentIdx}
                    onChange={(e) => {
                      radarState.setIsPlaying(false);
                      radarState.setCurrentIdx(Number(e.target.value));
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                </div>

                <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono px-0.5">
                  <span>-2 Hours</span>
                  <span className="text-slate-300 font-semibold">Now</span>
                  <span className="text-amber-400 font-semibold">+30m Forecast</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
