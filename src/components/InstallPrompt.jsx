'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const STORAGE_KEY = 'pattayacams_install_dismissed';

export function triggerPwaInstall() {
  if (typeof window === 'undefined') return;

  if (window.__pattaya_deferred_install) {
    try {
      window.__pattaya_deferred_install.prompt();
      window.__pattaya_deferred_install.userChoice.finally(() => {
        window.__pattaya_deferred_install = null;
      });
      return;
    } catch (e) {
      console.warn('Install prompt error', e);
    }
  }

  // Fallback toast instructions for iOS Safari and browsers without beforeinstallprompt
  window.dispatchEvent(
    new CustomEvent('pattayacams:toast', {
      detail: {
        kind: 'info',
        message: 'To install PattayaCams: On iOS tap Share (⎋) then "Add to Home Screen". On Chrome/Android, tap menu (⋮) then "Install app".',
      },
    })
  );
}

export default function InstallPrompt() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleBeforeInstall = (event) => {
      // Prevent browser default automatic banner
      event.preventDefault();
      window.__pattaya_deferred_install = event;
      window.dispatchEvent(new CustomEvent('pattayacams:install-available'));
    };

    const handleInstalled = () => {
      window.__pattaya_deferred_install = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  // Popup is disabled per user preference — app installation is now triggered from the More menu
  return null;
}
