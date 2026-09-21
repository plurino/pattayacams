'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const STORAGE_KEY = 'pattayacams_install_dismissed';

export default function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // Skip if user previously dismissed
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      // localStorage unavailable; fall through
    }
    if (dismissed) return undefined;

    const handleBeforeInstall = (event) => {
      // Stash the event so we can trigger the prompt from a user gesture
      event.preventDefault();
      setDeferredEvent(event);
      setIsVisible(true);
    };

    const handleInstalled = () => {
      setIsVisible(false);
      setDeferredEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredEvent) return;
    try {
      deferredEvent.prompt();
      const choice = await deferredEvent.userChoice;
      // Regardless of outcome, hide the card — the browser won't re-fire
      // beforeinstallprompt after the user has made a choice.
      setIsVisible(false);
      setDeferredEvent(null);
      if (choice && choice.outcome === 'dismissed') {
        try {
          localStorage.setItem(STORAGE_KEY, '1');
        } catch (e) {}
      }
    } catch (e) {
      // If the prompt failed, fall back to dismissal
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {}
    setIsVisible(false);
    setDeferredEvent(null);
  };

  if (!isVisible || !deferredEvent) return null;

  return (
    <div
      role="dialog"
      aria-label="Install PattayaCams"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-[2050] rounded-2xl bg-surface/95 backdrop-blur-md border border-borderDark p-3.5 shadow-2xl text-slate-200 animate-fade-in"
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-brandPink/20 border border-brandPink/40 text-brandPink shrink-0 mt-0.5">
          <Download className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs">
          <p className="font-bold text-white text-[13px] mb-1">Install PattayaCams</p>
          <p className="leading-snug text-slate-300">
            Add to your home screen for one-tap access to the live radar — no app store required.
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 rounded-lg bg-brandPink hover:bg-rose-500 text-white text-xs font-bold border border-brandPink transition-colors cursor-pointer shadow-sm"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg bg-canvas hover:bg-surfaceLight text-slate-300 hover:text-white text-xs font-semibold border border-borderDark transition-colors cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-500 hover:text-white transition-colors p-0.5 shrink-0"
          aria-label="Dismiss install prompt"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
