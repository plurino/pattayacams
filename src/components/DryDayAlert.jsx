'use client';

import React, { useState, useMemo } from 'react';
import { AlertTriangle, Calendar, Info, X } from 'lucide-react';
import dryDaysData from '@/public/data/dry_days.json';

export default function DryDayAlert() {
  const [isOpen, setIsOpen] = useState(false);

  // Determine current and tomorrow's date in Thailand (Asia/Bangkok)
  const alertStatus = useMemo(() => {
    try {
      const now = new Date();
      const thaiDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);

      const tomorrow = new Date(now.getTime() + 86400000);
      const tomorrowThaiDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(tomorrow);

      const todayMatch = dryDaysData.find((d) => d.date === thaiDateStr);
      if (todayMatch) {
        return { isDryToday: true, isDryTomorrow: false, holiday: todayMatch };
      }

      const tomorrowMatch = dryDaysData.find((d) => d.date === tomorrowThaiDateStr);
      if (tomorrowMatch) {
        return { isDryToday: false, isDryTomorrow: true, holiday: tomorrowMatch };
      }

      // Find next upcoming
      const upcoming = dryDaysData
        .filter((d) => d.date > thaiDateStr)
        .sort((a, b) => a.date.localeCompare(b.date))[0];

      return { isDryToday: false, isDryTomorrow: false, nextUpcoming: upcoming };
    } catch {
      return { isDryToday: false, isDryTomorrow: false };
    }
  }, []);

  if (!alertStatus.isDryToday && !alertStatus.isDryTomorrow) {
    return null;
  }

  const { isDryToday, holiday } = alertStatus;

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all shadow-sm ${
          isDryToday
            ? 'bg-red-950/80 text-red-300 border border-red-500/50 hover:bg-red-900/80 animate-pulse'
            : 'bg-amber-950/80 text-amber-300 border border-amber-500/50 hover:bg-amber-900/80'
        }`}
        title="Click to read official nationwide alcohol regulations"
      >
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">
          {isDryToday
            ? `🚨 DRY DAY: ${holiday.name} (Bars Closed)`
            : `⚠️ BAN TOMORROW: ${holiday.name} (Bars close midnight)`}
        </span>
        <span className="sm:hidden text-[10px] font-bold">
          {isDryToday ? '🚨 DRY DAY' : '⚠️ DRY SOON'}
        </span>
      </div>

      {/* Detail Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-borderDark rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-borderDark">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Nationwide Alcohol Ban</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surfaceLight"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className="font-semibold text-amber-300 text-sm">
                {holiday?.name} ({holiday?.name_th})
              </p>
              <p className="text-slate-300">
                {holiday?.description ||
                  'Under Section 39 of the Thai Alcoholic Beverage Control Act, the sale of alcoholic beverages is strictly prohibited nationwide during religious Buddhist holidays.'}
              </p>

              <div className="p-3 rounded-xl bg-surfaceLight/50 border border-borderDark space-y-1.5 font-mono text-[11px]">
                <div className="text-brandCyan font-bold">Key Rules for Tourists:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Entertainment venues, gogo bars, and clubs are fully closed.</li>
                  <li>Convenience stores (7-Eleven, CJ) will not sell alcohol for 24 hours.</li>
                  <li>Personal consumption in private hotel rooms is permitted.</li>
                  <li>Live stream creators will broadcast daytime walks and food markets.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-brandPink text-white font-bold text-xs hover:brightness-110"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
