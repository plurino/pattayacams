'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Calculator,
  CloudSun,
  Download,
  Droplets,
  Palmtree,
  Ship,
  Sparkles,
  ShieldAlert,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import { playTacticalClick } from '@/src/utils/sfx';
import { getSavedTripDate } from '@/src/utils/storage';
import DryDayAlert from './DryDayAlert';
import AmbientRadioPlayer from './AmbientRadioPlayer';
import TripModal from './TripModal';
import { triggerPwaInstall } from './InstallPrompt';

const PANEL_CLASSES =
  'absolute right-2 top-full mt-1 w-[min(92vw,360px)] rounded-xl bg-surface border border-borderDark shadow-2xl p-2.5 z-50 backdrop-blur-md text-slate-200 font-mono';

const ROW_CLASSES =
  'flex items-center gap-2 px-2 py-1.5 rounded-md bg-canvas/40 border border-borderDark/60 text-[11px] text-slate-300';

const ROW_TITLE_CLASSES = 'text-[9px] font-bold uppercase tracking-wider text-slate-400';

const ACTION_BTN_CLASSES =
  'flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-canvas/40 hover:bg-surfaceLight border border-borderDark/60 hover:border-borderDark text-[11px] font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer';

const SECTION_TITLE_CLASSES =
  'px-1.5 pt-1 pb-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500';

export default function TickerOverflowMenu({
  isOpen,
  onClose,
  triggerRef,
  weather,
  rates,
  telemetry,
  sunsetInfo,
  nightlifeVibe,
  onOpenKohLarn,
  onOpenEvents,
  onOpenWeather,
  onOpenConverter,
  onOpenEmergency,
  onToggleAlerts,
  hasLiveAlerts,
}) {
  const panelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [tripDays, setTripDays] = useState(null);

  // Close on Escape + simple focus trap (Tab cycles inside the panel)
  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        // Focus trap: collect tabbable children and wrap around.
        const focusables = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [isOpen, onClose]);

  // Close on outside click (ignoring trigger button so clicking "Less" cleanly collapses)
  useEffect(() => {
    if (!isOpen) return undefined;
    function handleMouseDown(e) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        (!triggerRef?.current || !triggerRef.current.contains(e.target))
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, onClose, triggerRef]);

  // Auto-focus the close button on open + restore focus on close (for keyboard users)
  useEffect(() => {
    if (!isOpen) return undefined;
    previouslyFocusedRef.current = document.activeElement;
    // Defer one tick so the panel is mounted in the DOM.
    const id = requestAnimationFrame(() => {
      if (panelRef.current) {
        const closeBtn = panelRef.current.querySelector('[data-autofocus="true"]');
        if (closeBtn) closeBtn.focus();
      }
    });
    return () => {
      cancelAnimationFrame(id);
      // Restore focus to the element that opened the menu (the overflow trigger button).
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
        prev.focus();
      }
    };
  }, [isOpen]);

  // Trip countdown (was previously in the navbar; moved here in Sep 2026 redesign)
  // - Updates whenever the panel opens OR the trip-saved event fires
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

  if (!isOpen) return null;

  const aqi = telemetry?.aqiLabel ?? 'Good';
  const pm25 = telemetry?.pm25;
  const waveHeight = telemetry?.waveHeightMeters;
  const waveAdvisory = telemetry?.waveAdvisory;
  const windSpeed = telemetry?.windSpeedKmh;
  const humidity = telemetry?.humidity ?? weather?.humidity;

  const handleAction = (fn) => () => {
    playTacticalClick();
    if (fn) fn();
    onClose();
  };

  const handleOpenTrip = () => {
    playTacticalClick();
    // Close the overflow menu first so the TripModal stacks above everything cleanly.
    onClose();
    // Defer opening one tick so the menu's outside-click handler doesn't immediately close the modal.
    setTimeout(() => setIsTripModalOpen(true), 0);
  };

  return (
    <div ref={panelRef} className={PANEL_CLASSES} role="dialog" aria-label="More Pattaya Telemetry">
      <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-borderDark/60">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-brandCyan" />
          <span className={ROW_TITLE_CLASSES}>Ambient Telemetry</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-surfaceLight"
          title="Close"
          data-autofocus="true"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Solar + Vibe row */}
      <div className="flex flex-col gap-1.5 mb-2">
        {sunsetInfo && (
          <div
            className={ROW_CLASSES}
            title={
              sunsetInfo.sunriseTime && sunsetInfo.sunsetTime
                ? `Sunrise: ${sunsetInfo.sunriseTime} ICT • Sunset: ${sunsetInfo.sunsetTime} ICT`
                : sunsetInfo.label
            }
          >
            <span className="text-base shrink-0">{sunsetInfo.isNight ? '🌙' : sunsetInfo.isGoldenHour ? '✨' : '🌅'}</span>
            <span className="font-semibold text-amber-300 truncate">{sunsetInfo.label}</span>
          </div>
        )}
        {nightlifeVibe && (
          <div className={ROW_CLASSES} title={nightlifeVibe.sub}>
            <span className="text-base shrink-0">{nightlifeVibe.icon}</span>
            <span className="font-bold text-white">{nightlifeVibe.label}</span>
            <span className="text-slate-400 text-[10px] truncate">• {nightlifeVibe.sub}</span>
          </div>
        )}
      </div>

      {/* Environmental telemetry */}
      <div className={SECTION_TITLE_CLASSES}>Conditions</div>
      <div className="flex flex-col gap-1.5 mb-2">
        {telemetry && pm25 !== undefined && (
          <div className={ROW_CLASSES} title={`Air Quality: ${aqi}`}>
            <Wind className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>PM2.5:</span>
            <strong className="text-white">{pm25}</strong>
            <span className="text-slate-400 text-[10px]">({aqi})</span>
          </div>
        )}
        {telemetry && waveHeight !== undefined && (
          <div className={ROW_CLASSES} title={waveAdvisory}>
            <Waves className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>Swell:</span>
            <strong className="text-white">{waveHeight}m</strong>
            {waveAdvisory && <span className="text-slate-400 text-[10px] truncate">• {waveAdvisory}</span>}
          </div>
        )}
        {telemetry && windSpeed !== undefined && (
          <div className={ROW_CLASSES}>
            <Wind className="w-3 h-3 text-cyan-300 shrink-0" />
            <span>Wind:</span>
            <strong className="text-white">{windSpeed}km/h</strong>
          </div>
        )}
        {humidity !== undefined && (
          <div className={ROW_CLASSES}>
            <Droplets className="w-3 h-3 text-blue-400 shrink-0" />
            <span>Humidity:</span>
            <strong className="text-white">{humidity}%</strong>
          </div>
        )}
      </div>

      {/* FX detail */}
      {rates && (
        <>
          <div className={SECTION_TITLE_CLASSES}>Currency (THB)</div>
          <div className="flex flex-col gap-1.5 mb-2">
            <div className={ROW_CLASSES}>
              <Calculator className="w-3 h-3 text-amber-400 shrink-0" />
              <span>$1 = <strong className="text-amber-300">{rates.USD}฿</strong></span>
            </div>
            <div className={ROW_CLASSES}>
              <Calculator className="w-3 h-3 text-amber-400 shrink-0" />
              <span>£1 = <strong className="text-amber-300">{rates.GBP}฿</strong></span>
            </div>
            <div className={ROW_CLASSES}>
              <Calculator className="w-3 h-3 text-amber-400 shrink-0" />
              <span>€1 = <strong className="text-amber-300">{rates.EUR}฿</strong></span>
            </div>
          </div>
        </>
      )}

      {/* Dry Day banner */}
      <DryDayAlert />

      {/* Action shortcuts */}
      <div className={SECTION_TITLE_CLASSES}>Quick Actions</div>
      <div className="grid grid-cols-2 gap-1.5 mt-1 mb-2">
        <button onClick={handleAction(onOpenWeather)} className={ACTION_BTN_CLASSES}>
          <CloudSun className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>Weather Radar</span>
        </button>
        <button onClick={handleAction(onOpenKohLarn)} className={ACTION_BTN_CLASSES}>
          <Ship className="w-3 h-3 text-blue-400 shrink-0" />
          <span>Ferry & Tides</span>
        </button>
        <button onClick={handleAction(onOpenEvents)} className={ACTION_BTN_CLASSES}>
          <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
          <span>Events</span>
        </button>
        <button onClick={handleAction(onOpenEmergency)} className={ACTION_BTN_CLASSES}>
          <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
          <span>Hotlines</span>
        </button>
        <button onClick={handleAction(onOpenConverter)} className={ACTION_BTN_CLASSES}>
          <Calculator className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Converter</span>
        </button>
        <button
          onClick={() => {
            playTacticalClick();
            triggerPwaInstall();
            onClose();
          }}
          className={ACTION_BTN_CLASSES}
          title="Install PattayaCams app to home screen"
        >
          <Download className="w-3 h-3 text-brandPink shrink-0" />
          <span>Install App</span>
        </button>
      </div>

      {/* Pattaya Trip Countdown (was previously in Navbar; moved here so the navbar stays focused on view-switching) */}
      <div className={SECTION_TITLE_CLASSES}>Pattaya Trip Countdown</div>
      <button
        onClick={handleOpenTrip}
        className={`${ACTION_BTN_CLASSES} w-full mt-1 mb-2 justify-between`}
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
        <span className="flex items-center gap-1.5">
          <Palmtree className={`w-3 h-3 shrink-0 ${tripDays !== null ? 'text-emerald-400' : 'text-amber-300'}`} />
          <span>{tripDays !== null ? `${tripDays} day${tripDays === 1 ? '' : 's'} to Pattaya` : 'Set Trip Date'}</span>
        </span>
        <span className="text-[10px] font-bold font-mono text-brandPink">
          {tripDays !== null ? `${tripDays}d` : 'New'}
        </span>
      </button>

      {/* Radio + Alerts */}
      <div className="pt-2 border-t border-borderDark/60">
        <div className="px-1.5 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
          Fabulous 103 FM (Fabulous Radio Pattaya)
        </div>
        <div className="flex items-center justify-between gap-2">
          <AmbientRadioPlayer />
          <button
            onClick={handleAction(onToggleAlerts)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-semibold transition-colors ${
              hasLiveAlerts
                ? 'bg-brandPink/20 border-brandPink/60 text-brandPink'
                : 'bg-canvas/40 hover:bg-surfaceLight border-borderDark/60 text-slate-300 hover:text-white'
            }`}
            title={hasLiveAlerts ? 'Stream Go-Live Alerts Active' : 'Enable Stream Go-Live Browser Alerts'}
          >
            <Bell className={`w-3 h-3 shrink-0 ${hasLiveAlerts ? 'text-brandPink fill-brandPink animate-pulse' : 'text-slate-400'}`} />
            <span>{hasLiveAlerts ? 'Alerts ON' : 'Alerts'}</span>
          </button>
        </div>
      </div>

      {/* TripModal is rendered here (not in the navbar) so the entry point and modal stack together. */}
      <TripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
      />
    </div>
  );
}