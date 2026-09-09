'use client';

import React, { useState } from 'react';
import { Layers, Video, Eye, Navigation, AlertCircle, X } from 'lucide-react';

export default function LayerToggleHUD({
  showVenues,
  setShowVenues,
  showCams,
  setShowCams,
  showTransit,
  setShowTransit,
  venueCount = 0,
  camCount = 0,
  transitCount = 3,
}) {
  const [toastMessage, setToastMessage] = useState(null);

  const handleCctvToggle = (checked) => {
    setShowCams(checked);
    if (checked) {
      setToastMessage('Pattaya municipal cameras require manual code lookup on the official city portal.');
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  return (
    <aside aria-label="Map Layer Controls" className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2 pointer-events-auto">
      {/* CCTV Disclaimer Toast */}
      {toastMessage && (
        <div className="bg-surface/95 backdrop-blur-md border border-brandCyan/50 text-slate-200 text-xs px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2 max-w-[280px] animate-fade-in">
          <AlertCircle className="w-4 h-4 text-brandCyan shrink-0" />
          <span className="leading-tight text-[11px]">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white shrink-0 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="bg-surface/90 backdrop-blur-md border border-borderDark rounded-xl p-3 shadow-2xl flex flex-col gap-2 min-w-[200px] text-xs font-medium">
        <div className="flex items-center gap-2 pb-1.5 border-b border-borderDark/60 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
          <Layers className="w-3.5 h-3.5 text-brandCyan" />
          <span>Map Layers</span>
        </div>

        {/* Venues Toggle */}
        <label className="flex items-center justify-between gap-3 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-surfaceLight/50 transition-colors select-none">
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

        {/* CCTVs Toggle */}
        <label className="flex items-center justify-between gap-3 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-surfaceLight/50 transition-colors select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brandCyan shadow-[0_0_8px_#00E5FF]"></span>
            <span className="text-slate-200">City CCTV Cams</span>
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
      <label className="flex items-center justify-between gap-3 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-surfaceLight/50 transition-colors select-none">
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
      </div>
    </aside>
  );
}
