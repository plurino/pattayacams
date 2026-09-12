'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, Check, X } from 'lucide-react';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('pattayacams_cookie_consent');
      if (!consent) {
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // LocalStorage unavailable
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('pattayacams_cookie_consent', 'accepted');
    } catch (e) {}
    setIsVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('pattayacams_cookie_consent', 'declined');
    } catch (e) {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-[2100] max-w-sm rounded-2xl bg-surface/95 backdrop-blur-xl border border-borderDark/80 p-3.5 shadow-2xl text-slate-300 animate-fade-in">
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
          <Cookie className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs">
          <p className="leading-snug text-slate-200 font-medium">
            We use cookies to save your custom multi-cam layout, preferred currency, and map filters.{' '}
            <a href="/privacy" className="text-brandPink hover:underline">
              Privacy Policy
            </a>
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={handleAccept}
              className="px-3 py-1 rounded-lg bg-brandPink hover:bg-pink-600 text-white font-bold text-[11px] transition-colors shadow-sm"
            >
              Accept
            </button>
            <button
              onClick={handleDecline}
              className="px-2.5 py-1 rounded-lg bg-canvas hover:bg-slate-800 text-slate-400 hover:text-white font-medium text-[11px] transition-colors border border-borderDark"
            >
              Essential Only
            </button>
          </div>
        </div>
        <button
          onClick={handleDecline}
          className="text-slate-500 hover:text-white transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
