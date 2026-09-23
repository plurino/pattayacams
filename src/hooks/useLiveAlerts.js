'use client';

import { useState, useEffect, useRef } from 'react';

const ALERTS_STORAGE_KEY = 'pattayacams_live_alerts_enabled';

export function useLiveAlerts(streamStatus) {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const previousStatusRef = useRef({});

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      const saved = localStorage.getItem(ALERTS_STORAGE_KEY) === 'true';
      if (saved && Notification.permission === 'granted') {
        setIsEnabled(true);
      }
    }
  }, []);

  const toggleLiveAlerts = async () => {
    if (!isSupported) {
      alert('Browser notifications are not supported on this device.');
      return;
    }

    if (Notification.permission === 'granted') {
      const next = !isEnabled;
      setIsEnabled(next);
      localStorage.setItem(ALERTS_STORAGE_KEY, String(next));
      if (next) {
        new Notification('PattayaCams Live Radar', {
          body: '🔔 Live alerts enabled! You will be notified when streamers go live.',
          icon: '/favicon.ico',
        });
      }
      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setIsEnabled(true);
        localStorage.setItem(ALERTS_STORAGE_KEY, 'true');
        new Notification('PattayaCams Live Radar', {
          body: '🔔 Subscribed! You will be notified when streamers go live.',
          icon: '/favicon.ico',
        });
      }
    } else {
      alert('Notifications are blocked in your browser settings. Please enable them to receive stream alerts.');
    }
  };

  // Watch streamStatus for transitions to live
  useEffect(() => {
    if (!isEnabled || !streamStatus?.entities) return;

    const entities = streamStatus.entities;
    const prev = previousStatusRef.current;

    Object.entries(entities).forEach(([key, info]) => {
      const wasLive = prev[key]?.is_live;
      const isNowLive = info.is_live;

      if (isNowLive && wasLive === false) {
        // Stream just transitioned to live!
        try {
          const channelName = info.name || key.replace(/^(venue-|streamer-)/, '');
          new Notification('🔴 Live in Pattaya!', {
            body: `${channelName} is now broadcasting live!`,
            icon: '/favicon.ico',
          });
        } catch (e) {
          console.warn('Live notification dispatch error:', e);
        }
      }
    });

    previousStatusRef.current = entities;
  }, [streamStatus, isEnabled]);

  return {
    isSupported,
    isEnabled,
    toggleLiveAlerts,
  };
}
