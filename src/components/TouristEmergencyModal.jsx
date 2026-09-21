'use client';

import React, { useEffect } from 'react';
import { X, Phone, ShieldAlert, AlertTriangle, Hospital, Building2, PhoneCall, HeartHandshake } from 'lucide-react';

const EMERGENCY_SERVICES = [
  {
    name: 'Tourist Police',
    number: '1155',
    tel: '1155',
    description: '24/7 Nationwide English-speaking tourist police dispatch & dispute resolution',
    icon: ShieldAlert,
    badge: 'Toll-Free • 24/7',
    color: 'text-rose-400 border-rose-500/30 bg-rose-950/30 hover:bg-rose-900/40 hover:border-rose-500/60',
    btnColor: 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]',
  },
  {
    name: 'City Hall Help Center',
    number: '1337',
    tel: '1337',
    description: 'Pattaya City Hall municipal hotline for complaints, noise, public safety & city services',
    icon: Building2,
    badge: 'Municipal • 24/7',
    color: 'text-amber-400 border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/40 hover:border-amber-500/60',
    btnColor: 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]',
  },
  {
    name: 'Bangkok Hospital ER',
    number: '1719',
    tel: '1719',
    description: 'JCI-accredited international hospital emergency room, ICU & rapid ambulance dispatch',
    icon: Hospital,
    badge: 'Emergency ER • 24/7',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-900/40 hover:border-emerald-500/60',
    btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]',
  },
  {
    name: 'TAC Center (Chonburi)',
    number: '038-427667',
    tel: '038427667',
    description: 'Tourist Assistance Center operated by the Ministry of Tourism & Sports',
    icon: HeartHandshake,
    badge: 'Ministry Center',
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 hover:border-cyan-500/60',
    btnColor: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]',
  },
];

export default function TouristEmergencyModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tourist-emergency-title"
      className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-surface border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-[0_0_35px_rgba(244,63,94,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-16 border-b border-borderDark px-5 flex items-center justify-between bg-rose-950/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="tourist-emergency-title" className="text-sm font-black text-white tracking-wide uppercase font-mono">
                  Pattaya Tourist Emergency
                </h2>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <p className="text-[11px] font-mono text-rose-300/80">
                24/7 Free Hotlines & Direct Assistance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surfaceLight transition-colors"
            title="Close Emergency Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hotlines Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            Save these numbers or tap to dial directly from any Thai SIM or roaming international mobile:
          </p>

          <div className="space-y-2.5">
            {EMERGENCY_SERVICES.map((srv) => {
              const Icon = srv.icon;
              return (
                <div
                  key={srv.number}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${srv.color}`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-black/40 shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white font-mono">{srv.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-300 border border-white/10">
                          {srv.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                        {srv.description}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`tel:${srv.tel}`}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-black shrink-0 flex items-center gap-1.5 transition-transform active:scale-95 ${srv.btnColor}`}
                    title={`Call ${srv.name} (${srv.number})`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{srv.number}</span>
                  </a>
                </div>
              );
            })}
          </div>

          {/* Quick Advice Notice */}
          <div className="p-3 rounded-xl bg-canvas border border-borderDark text-[11px] font-mono text-slate-400 space-y-1">
            <div className="flex items-center gap-1 text-slate-300 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>General Police / Fire / Medical</span>
            </div>
            <p className="leading-normal">
              For general Thai national emergency: <strong>191</strong> (Police) • <strong>199</strong> (Fire) • <strong>1669</strong> (National Medical Ambulance). For tourists, <strong>1155</strong> is recommended as operators are fluent in English.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-borderDark px-5 flex items-center justify-between bg-surfaceLight/20 shrink-0 text-[10px] font-mono text-slate-400">
          <span>Toll-free within Thailand</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-surfaceLight hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
