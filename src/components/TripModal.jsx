'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Plane, Car, Wifi, Trash2, ExternalLink } from 'lucide-react';
import { getSavedTripDate, saveTripDate, clearTripDate } from '@/src/utils/storage';
import { buildFlightSearchUrl, build12GoTransferUrl, buildAiraloEsimUrl } from '@/src/utils/affiliate';
import { FEATURES } from '@/src/config/features';

export default function TripModal({ isOpen, onClose }) {
  const [dateInput, setDateInput] = useState('');
  const [savedDate, setSavedDate] = useState(null);
  const [remainingDays, setRemainingDays] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedTripDate();
      setSavedDate(saved);
      if (saved) {
        setDateInput(saved);
        calculateDays(saved);
      } else {
        setDateInput('');
        setRemainingDays(null);
      }
    }
  }, [isOpen]);

  const calculateDays = (dateStr) => {
    if (!dateStr) {
      setRemainingDays(null);
      return;
    }
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - today.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    setRemainingDays(days > 0 ? days : 0);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!dateInput) return;
    saveTripDate(dateInput);
    setSavedDate(dateInput);
    calculateDays(dateInput);
    window.dispatchEvent(new Event('pattayacams_trip_updated'));
  };

  const handleClear = () => {
    clearTripDate();
    setSavedDate(null);
    setDateInput('');
    setRemainingDays(null);
    window.dispatchEvent(new Event('pattayacams_trip_updated'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-surface border border-borderDark rounded-2xl p-5 sm:p-6 shadow-2xl z-10 flex flex-col gap-4 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-borderDark">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌴</span>
            <div>
              <h2 className="text-base font-bold text-white">
                Pattaya Trip Countdown & Booking
              </h2>
              <p className="text-xs text-slate-400">
                Plan your arrival to the Gulf of Thailand
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surfaceLight hover:bg-borderDark text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Departure Date Setting Section */}
        <form onSubmit={handleSave} className="flex flex-col gap-3 p-4 bg-surfaceLight/50 rounded-xl border border-borderDark">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brandCyan" />
            <span>Enter Your Pattaya Arrival Date:</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateInput}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDateInput(e.target.value)}
              className="flex-1 bg-canvas border border-borderDark rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brandCyan"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-brandCyan hover:bg-cyan-400 text-canvas font-bold text-xs rounded-lg transition-colors shadow-[0_0_12px_rgba(0,229,255,0.3)]"
            >
              Save Date
            </button>
            {savedDate && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 bg-surface hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-borderDark rounded-lg transition-colors"
                title="Clear date"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Countdown Clock Display */}
          {remainingDays !== null && (
            <div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-brandGreen/15 to-brandCyan/15 border border-brandGreen/40 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-slate-300 uppercase">Countdown to Wheels Down</span>
                <span className="text-lg font-mono font-bold text-brandGreen">
                  {remainingDays} {remainingDays === 1 ? 'Day' : 'Days'} Remaining
                </span>
              </div>
              <span className="text-2xl animate-bounce">🏖️</span>
            </div>
          )}
        </form>

        {/* High-Intent Conversion Cards (Conditional on FEATURES.SHOW_AFFILIATE_ADS) */}
        {FEATURES.SHOW_AFFILIATE_ADS && (
          <div className="space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Essential Traveler Toolkit:
            </span>

            {/* 1. Aviasales Flights */}
            <div className="p-3 rounded-xl bg-surfaceLight/40 border border-borderDark flex items-center justify-between gap-3 hover:border-slate-500 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">Find Flights to Bangkok (BKK)</span>
                  <span className="text-[10px] text-slate-400">Compare lowest international airfares to Thailand</span>
                </div>
              </div>
              <a
                href={buildFlightSearchUrl('', savedDate || '')}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brandBlue hover:bg-blue-600 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <span>Search</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* 2. 12Go Airport Taxi */}
            <div className="p-3 rounded-xl bg-surfaceLight/40 border border-borderDark flex items-center justify-between gap-3 hover:border-slate-500 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brandGreen/20 text-brandGreen flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">Private Airport Taxi (1,200 THB)</span>
                  <span className="text-[10px] text-slate-400">Fixed rate private sedan door-to-door from BKK/DMK</span>
                </div>
              </div>
              <a
                href={build12GoTransferUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brandGreen hover:bg-emerald-600 text-canvas text-xs font-bold transition-colors shadow-sm"
              >
                <span>Book Taxi</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* 3. Airalo eSIM */}
            <div className="p-3 rounded-xl bg-surfaceLight/40 border border-borderDark flex items-center justify-between gap-3 hover:border-slate-500 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brandAmber/20 text-brandAmber flex items-center justify-center shrink-0">
                  <Wifi className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">Airalo 5G Thailand eSIM</span>
                  <span className="text-[10px] text-slate-400">Instant unlimited data setup before boarding</span>
                </div>
              </div>
              <a
                href={buildAiraloEsimUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brandAmber hover:bg-amber-500 text-canvas text-xs font-bold transition-colors shadow-sm"
              >
                <span>Get eSIM</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
