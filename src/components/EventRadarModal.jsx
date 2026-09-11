'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, MapPin, Flame, Music, Droplets, PartyPopper } from 'lucide-react';

const PATTAYA_EVENTS = [
  {
    id: 'fireworks',
    name: 'Pattaya International Fireworks Festival',
    name_th: 'เทศกาลพลุนานาชาติ เมืองพัทยา',
    dateStr: '2026-11-27T18:00:00+07:00',
    displayDate: 'November 27–28, 2026',
    location: 'Central Pattaya Beach Road',
    icon: Flame,
    color: '#FF2A6D',
    description: 'World-class pyro-musical fireworks displays from international teams lighting up Pattaya Bay.',
  },
  {
    id: 'countdown',
    name: 'Pattaya Countdown & Jet Ski World Cup',
    name_th: 'พัทยาเคาท์ดาวน์ & เวิลด์คัพ',
    dateStr: '2026-12-29T17:00:00+07:00',
    displayDate: 'December 29–31, 2026',
    location: 'Bali Hai Pier & Jomtien Beach',
    icon: PartyPopper,
    color: '#FACC15',
    description: 'A 3-day mega New Year festival featuring Thailand top rock & pop acts plus world championship jet ski racing.',
  },
  {
    id: 'loy-krathong',
    name: 'Loy Krathong Festival of Lights',
    name_th: 'ประเพณีลอยกระทง',
    dateStr: '2026-11-13T19:00:00+07:00',
    displayDate: 'November 13, 2026',
    location: 'Pattaya, Jomtien & Naklua Beaches',
    icon: Sparkles,
    color: '#38BDF8',
    description: 'Floating candle-lit floral baskets (krathongs) drifting out onto the moonlit Gulf of Thailand.',
  },
  {
    id: 'music-fest',
    name: 'Pattaya Music Festival',
    name_th: 'เทศกาลดนตรีเมืองพัทยา',
    dateStr: '2027-03-05T18:00:00+07:00',
    displayDate: 'Every Weekend in March 2027',
    location: 'Beach Road, Jomtien Beach & Lan Pho',
    icon: Music,
    color: '#A855F7',
    description: 'Thailand largest free beach music festival with 3 simultaneous sound stages along the coastline.',
  },
  {
    id: 'wan-lai',
    name: 'Wan Lai Pattaya Songkran Mega-Festival',
    name_th: 'วันไหลพัทยา สงกรานต์',
    dateStr: '2027-04-18T09:00:00+07:00',
    displayDate: 'April 18–19, 2027',
    location: 'Central Pattaya Road & Beach Road',
    icon: Droplets,
    color: '#00E5FF',
    description: 'The legendary climax of Thai New Year where the entire city becomes an epic 48-hour water battle.',
  },
];

function getTimeRemaining(targetDateStr) {
  const total = Date.parse(targetDateStr) - Date.now();
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true };

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, isPassed: false };
}

export default function EventRadarModal({ isOpen, onClose }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-2xl bg-surface border border-borderDark shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-borderDark bg-surfaceLight/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Pattaya Event & Festival Radar</span>
                <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[10px] font-mono">
                  LIVE COUNTDOWNS
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Key dates driving stream spikes & massive citywide gatherings
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

        {/* Modal Body: Events List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs font-mono">
          {PATTAYA_EVENTS.map((evt) => {
            const countdown = getTimeRemaining(evt.dateStr);
            const IconComponent = evt.icon;

            return (
              <div
                key={evt.id}
                className="p-3.5 rounded-xl bg-canvas/70 border border-borderDark/80 hover:border-borderDark transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                {/* Event Metadata */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${evt.color}20`,
                        borderColor: `${evt.color}50`,
                        color: evt.color,
                      }}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </span>
                    <strong className="text-sm font-bold text-white truncate">
                      {evt.name}
                    </strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-200">{evt.displayDate}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{evt.location}</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    {evt.description}
                  </p>
                </div>

                {/* Live Countdown Display */}
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-center bg-surface/90 border border-borderDark rounded-xl p-2 font-mono text-center">
                  <div className="flex flex-col px-1.5">
                    <span className="text-base font-black text-white">{countdown.days}</span>
                    <span className="text-[8px] text-slate-400 uppercase">Days</span>
                  </div>
                  <span className="text-slate-600 font-bold">:</span>
                  <div className="flex flex-col px-1.5">
                    <span className="text-base font-black text-white">{String(countdown.hours).padStart(2, '0')}</span>
                    <span className="text-[8px] text-slate-400 uppercase">Hrs</span>
                  </div>
                  <span className="text-slate-600 font-bold">:</span>
                  <div className="flex flex-col px-1.5">
                    <span className="text-base font-black text-white">{String(countdown.minutes).padStart(2, '0')}</span>
                    <span className="text-[8px] text-slate-400 uppercase">Min</span>
                  </div>
                  <span className="text-slate-600 font-bold">:</span>
                  <div className="flex flex-col px-1.5">
                    <span className="text-base font-black text-brandPink">{String(countdown.seconds).padStart(2, '0')}</span>
                    <span className="text-[8px] text-brandPink uppercase">Sec</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-borderDark bg-surfaceLight/30 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Official Tourism Authority of Thailand (TAT) Pattaya Calendar</span>
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
