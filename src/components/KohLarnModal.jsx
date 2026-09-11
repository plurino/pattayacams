'use client';

import React, { useState } from 'react';
import { X, Ship, Waves, Compass, Clock, DollarSign, AlertCircle, Anchor } from 'lucide-react';

export default function KohLarnModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('ferry'); // 'ferry' | 'tides' | 'speedboats'

  if (!isOpen) return null;

  const nabanDepartures = ['07:00', '10:00', '12:00', '14:00', '15:30', '17:00', '18:30'];
  const nabanReturns = ['06:30', '07:30', '09:30', '12:00', '14:00', '17:00', '18:00'];

  const tawaenDepartures = ['08:00', '09:00', '11:00', '13:00'];
  const tawaenReturns = ['13:00', '14:00', '15:00', '16:00', '17:00'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-xl rounded-2xl bg-surface border border-borderDark shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-borderDark bg-surfaceLight/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Ship className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Koh Larn Ferry & Tide Radar</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono">
                  30 THB
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Bali Hai Pier ➔ Koh Larn (Naban Port & Tawaen Beach)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-borderDark bg-canvas/40 px-4 pt-2 gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('ferry')}
            className={`pb-2 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ferry'
                ? 'border-brandPink text-brandPink'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Ferry Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('tides')}
            className={`pb-2 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tides'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Tide Tracker</span>
          </button>
          <button
            onClick={() => setActiveTab('speedboats')}
            className={`pb-2 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'speedboats'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>Speedboats & Pier</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-mono">
          {activeTab === 'ferry' && (
            <div className="space-y-4">
              {/* Route 1: Bali Hai to Naban Port */}
              <div className="p-3 rounded-xl bg-canvas/70 border border-borderDark space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white pb-1.5 border-b border-borderDark/60">
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Bali Hai ⇄ Naban Port (Main Village)</span>
                  </div>
                  <span className="text-emerald-400 font-mono">30 THB (45 min)</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Depart Bali Hai:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {nabanDepartures.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-surface border border-borderDark text-slate-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Return to Bali Hai:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {nabanReturns.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-surface border border-borderDark text-slate-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Route 2: Bali Hai to Tawaen Beach */}
              <div className="p-3 rounded-xl bg-canvas/70 border border-borderDark space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white pb-1.5 border-b border-borderDark/60">
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <Waves className="w-3.5 h-3.5" />
                    <span>Bali Hai ⇄ Tawaen Beach (White Sand)</span>
                  </div>
                  <span className="text-emerald-400 font-mono">30 THB (45 min)</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Depart Bali Hai:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tawaenDepartures.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-surface border border-borderDark text-slate-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Return to Bali Hai:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tawaenReturns.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-surface border border-borderDark text-slate-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-2 text-[11px] text-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Tickets are bought directly on the boat before boarding at Bali Hai Pier. No advance booking is required.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'tides' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-canvas/70 border border-borderDark space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Gulf of Thailand Daily Tidal Cycle</span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                    Pattaya Bay & Koh Larn
                  </span>
                </div>

                {/* Tide Gauges */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-surface border border-borderDark space-y-1">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase">High Tide Peak</span>
                    <div className="text-lg font-bold text-white">~09:30 & 22:15</div>
                    <span className="text-[10px] text-slate-400 block">+2.4m above chart datum</span>
                    <span className="text-[10px] text-emerald-400 font-semibold block">✓ Ideal for water sports & jet skis</span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface border border-borderDark space-y-1">
                    <span className="text-[10px] text-amber-400 font-bold uppercase">Low Tide Window</span>
                    <div className="text-lg font-bold text-white">~04:15 & 16:45</div>
                    <span className="text-[10px] text-slate-400 block">+0.8m above chart datum</span>
                    <span className="text-[10px] text-cyan-300 font-semibold block">✓ Wider beach sand & shell walks</span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-300 space-y-1">
                  <p className="font-semibold text-white">Best Beach Recommendations:</p>
                  <p>• <strong>Tien Beach & Samae Beach:</strong> Crystal clear water with gentle slope, great for swimming all day.</p>
                  <p>• <strong>Ta Yai Beach:</strong> Cozy secluded cove on the northern tip with reef marine life.</p>
                </div>

                {/* Hydrographic Authority Citation */}
                <div className="p-2.5 rounded-lg bg-surface border border-borderDark/80 text-[10px] text-slate-400 space-y-0.5">
                  <span className="font-semibold text-cyan-400 block">⚓ Data Authority & Hydrographic Reference:</span>
                  <p>
                    Hydrographic Department, Royal Thai Navy (กรมอุทกศาสตร์ กองทัพเรือ) — Station Pattaya / Ko Sichang Amphidromic Reference Datum. Average variance: 0.8m (neap low) to 2.4m (spring high).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'speedboats' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-canvas/70 border border-borderDark space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Direct Speedboat Transfers</span>
                  <span className="text-amber-400">150–200 THB</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Speedboats depart Bali Hai Pier every 10–15 minutes continuously from 07:30 to 17:00.
                  Transit time is only <strong>15 minutes</strong> directly to your chosen beach (Tawaen, Tien, Samae, or Naban).
                </p>
                <div className="pt-2 border-t border-borderDark/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Charter Private Speedboat:</span>
                  <strong className="text-white font-mono">1,800 – 2,500 THB / roundtrip</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-canvas/70 border border-borderDark space-y-2">
                <span className="text-xs font-bold text-white">Getting to Bali Hai Pier:</span>
                <p className="text-slate-300 text-[11px]">
                  Take the Blue Songthaew (Baht Bus) to Walking Street entrance, or walk down Walking Street straight out to Bali Hai lighthouse pier.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-borderDark bg-surfaceLight/30 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Official Pattaya Municipal Maritime Service</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surfaceLight hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
