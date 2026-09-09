'use client';

import React from 'react';
import { X, Star, Check, Sparkles, MessageCircle, Send, ShieldCheck, Zap } from 'lucide-react';

export default function SponsorModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-xl bg-surface border border-brandGold/40 rounded-2xl p-5 sm:p-7 shadow-2xl z-10 flex flex-col gap-5 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-borderDark">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brandGold/30 to-brandAmber/20 border border-brandGold/50 flex items-center justify-center text-brandGold shadow-[0_0_12px_rgba(234,179,8,0.3)]">
              <Star className="w-5 h-5 fill-brandGold" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Self-Serve B2B Venue Sponsorship
              </h2>
              <p className="text-xs text-slate-400">
                Put your venue in front of 50,000+ monthly Pattaya tourists
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

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-surfaceLight/50 border border-borderDark flex items-center gap-2">
            <Check className="w-4 h-4 text-brandGold shrink-0" />
            <span className="text-slate-200">Glowing Gold VIP Map Pin</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surfaceLight/50 border border-borderDark flex items-center gap-2">
            <Check className="w-4 h-4 text-brandGold shrink-0" />
            <span className="text-slate-200">Top Multi-Cam Grid Wall Placement</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surfaceLight/50 border border-borderDark flex items-center gap-2">
            <Check className="w-4 h-4 text-brandGold shrink-0" />
            <span className="text-slate-200">Direct LINE & WhatsApp Buttons</span>
          </div>
          <div className="p-2.5 rounded-lg bg-surfaceLight/50 border border-borderDark flex items-center gap-2">
            <Check className="w-4 h-4 text-brandGold shrink-0" />
            <span className="text-slate-200">Custom Special Offer Promo Badge</span>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 30-Day Plan */}
          <div className="p-4 rounded-xl bg-surfaceLight/70 border border-borderDark hover:border-slate-500 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-slate-300 uppercase">
                  30-Day Starter
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-surface px-2 py-0.5 rounded">
                  Monthly
                </span>
              </div>
              <div className="mb-3">
                <div className="text-2xl font-mono font-bold text-white">
                  1,200 <span className="text-sm font-sans font-normal text-slate-400">THB</span>
                </div>
                <div className="text-xs text-brandGold font-mono">~$35 USD</div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                Ideal for seasonal bars, cafes, and entertainment lounges testing instant foot traffic.
              </p>
            </div>
            <a
              href="https://buy.stripe.com/test_pattayacams_30d"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-lg bg-surface hover:bg-surfaceLight border border-borderDark hover:border-brandCyan text-white text-xs font-bold text-center transition-all block"
            >
              Activate 30 Days
            </a>
          </div>

          {/* 90-Day Plan (Featured) */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-brandGold/15 to-surfaceLight border-2 border-brandGold flex flex-col justify-between shadow-xl relative">
            <div className="absolute -top-2.5 right-4 bg-brandGold text-canvas text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md">
              Most Popular
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-brandGold uppercase">
                  90-Day Seasonal VIP
                </span>
                <span className="text-[10px] font-mono text-brandGold bg-brandGold/20 px-2 py-0.5 rounded">
                  Save 20%
                </span>
              </div>
              <div className="mb-3">
                <div className="text-2xl font-mono font-bold text-white">
                  3,000 <span className="text-sm font-sans font-normal text-slate-400">THB</span>
                </div>
                <div className="text-xs text-brandGold font-mono">~$85 USD</div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                Continuous high-visibility throughout the high season. Guaranteed top spot in Multi-Cam Grid.
              </p>
            </div>
            <a
              href="https://buy.stripe.com/test_pattayacams_90d"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-lg bg-brandGold hover:bg-yellow-400 text-canvas text-xs font-bold text-center transition-all block shadow-[0_0_12px_rgba(234,179,8,0.4)]"
            >
              Activate 90 Days VIP
            </a>
          </div>
        </div>

        {/* PromptPay / Direct Contact */}
        <div className="p-3 bg-canvas/60 rounded-xl border border-borderDark flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-brandGreen" />
            <span>Prefer local Thai PromptPay QR or Bank Transfer?</span>
          </div>
          <a
            href="https://t.me/pattayacams_live"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#229ED9] hover:bg-[#1f8ec4] text-white font-semibold transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Chat on Telegram</span>
          </a>
        </div>
      </div>
    </div>
  );
}
