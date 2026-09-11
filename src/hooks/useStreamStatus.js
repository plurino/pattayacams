'use client';

import { useState, useEffect } from 'react';
import staticStreamStatus from '@/public/data/stream_status.json';

let inMemoryCache = null;
let lastFetchTimestamp = 0;
const listeners = new Set();

async function fetchLiveStreamStatus() {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch(`/data/stream_status.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.entities && typeof data.entities === 'object') {
        inMemoryCache = data;
        lastFetchTimestamp = Date.now();
        listeners.forEach((callback) => callback(data));
      }
    }
  } catch (err) {
    // Network errors fail silently and retain current cached / static baseline
    console.warn('Live stream status hydration warning:', err.message);
  }
}

/**
 * Hook to retrieve real-time stream status on Cloudflare Pages.
 * Starts with compile-time static data for instant 0-layout-shift render,
 * then hydrates immediately with live JSON over HTTP and polls every 60s.
 */
export function useStreamStatus() {
  const [streamStatus, setStreamStatus] = useState(inMemoryCache || staticStreamStatus);

  useEffect(() => {
    listeners.add(setStreamStatus);

    const now = Date.now();
    // Fetch immediately if not cached or cache is older than 45s
    if (!inMemoryCache || now - lastFetchTimestamp > 45000) {
      fetchLiveStreamStatus();
    }

    // Background polling interval: 60 seconds
    const interval = setInterval(fetchLiveStreamStatus, 60000);

    return () => {
      listeners.delete(setStreamStatus);
      clearInterval(interval);
    };
  }, []);

  return streamStatus;
}

export default useStreamStatus;
