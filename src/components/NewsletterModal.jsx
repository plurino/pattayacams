'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2, Sparkles, Bell, X, ShieldCheck } from 'lucide-react';

export default function NewsletterModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState({
    nightlife: true,
    cctv: true,
    festivals: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // Store in localStorage
      try {
        const subs = JSON.parse(localStorage.getItem('pattayacams_newsletter_subs') || '[]');
        subs.push({
          email,
          interests,
          date: new Date().toISOString(),
        });
        localStorage.setItem('pattayacams_newsletter_subs', JSON.stringify(subs));
        localStorage.setItem('pattayacams_is_subscribed', 'true');
      } catch (err) {
        // Ignore localStorage error
      }

      setIsSubmitting(false);
      setIsSuccess(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[2600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-surface border border-brandPink/40 shadow-2xl p-6 overflow-hidden text-slate-200">
        {/* Glow ambient accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-brandPink/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-surface/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-borderDark"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {!isSuccess ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-2 rounded-xl bg-brandPink/20 border border-brandPink/40 text-brandPink">
                <Bell className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-brandPink font-bold">
                  VIP Club • Pattaya Insider
                </span>
                <h3 className="text-lg font-bold text-white leading-tight">
                  Pattaya Pulse VIP Dispatch
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Get notified when iconic venues go live, when new 24/7 webcams are installed, and receive our curated weekend nightlife & weather guide.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  YOUR EMAIL ADDRESS
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="traveler@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-canvas border border-borderDark focus:border-brandPink focus:outline-none text-xs text-white placeholder-slate-500 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-1.5 pt-1">
                <span className="block text-[10px] font-mono text-slate-400 uppercase">
                  Alert Preferences:
                </span>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={interests.nightlife}
                      onChange={(e) => setInterests({ ...interests, nightlife: e.target.checked })}
                      className="rounded border-borderDark text-brandPink focus:ring-brandPink bg-canvas"
                    />
                    <span>🍺 Bar Live Streams & Nightlife Updates</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={interests.cctv}
                      onChange={(e) => setInterests({ ...interests, cctv: e.target.checked })}
                      className="rounded border-borderDark text-cyan-400 focus:ring-cyan-400 bg-canvas"
                    />
                    <span>📹 New Beach & Street CCTV Cams Added</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={interests.festivals}
                      onChange={(e) => setInterests({ ...interests, festivals: e.target.checked })}
                      className="rounded border-borderDark text-amber-400 focus:ring-amber-400 bg-canvas"
                    />
                    <span>🎆 Pattaya Festivals, Fireworks & Ferry Schedules</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brandPink to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brandPink/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Subscribing...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Join VIP Dispatch (Free)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero spam. 100% Pattaya insider content. Unsubscribe anytime.</span>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 space-y-3 animate-fade-in">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-1">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Welcome to the VIP Club!</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              You are subscribed to Pattaya Pulse VIP Dispatch at <span className="text-amber-300 font-mono">{email}</span>. We will notify you when high-vibe live streams start!
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors border border-borderDark"
            >
              Back to Live Map
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
