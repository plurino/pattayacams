'use client';

import { useState, useEffect, useRef } from 'react';

export function useRainViewer(enabled = false) {
  const [host, setHost] = useState('https://tilecache.rainviewer.com');
  const [frames, setFrames] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);

  // Fetch RainViewer public frames
  useEffect(() => {
    if (!enabled) {
      setIsPlaying(false);
      return;
    }

    let isMounted = true;
    async function loadRadarMaps() {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (data.host) setHost(data.host);
        const past = data.radar?.past || [];
        const nowcast = data.radar?.nowcast || [];
        const combined = [...past, ...nowcast];

        if (combined.length > 0) {
          setFrames(combined);
          setCurrentIdx(past.length > 0 ? past.length - 1 : combined.length - 1);
        }
      } catch (err) {
        console.warn('RainViewer API load error:', err);
      }
    }

    loadRadarMaps();
    // Refresh radar data every 5 minutes
    const refreshInterval = setInterval(loadRadarMaps, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [enabled]);

  // Handle Play/Pause animated loop
  useEffect(() => {
    if (isPlaying && frames.length > 1) {
      playTimerRef.current = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % frames.length);
      }, 750);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, frames.length]);

  const currentFrame = frames[currentIdx] || null;

  // Format frame timestamp to ICT (UTC+7)
  const formattedTime = currentFrame?.time
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(currentFrame.time * 1000)) + ' ICT'
    : '';

  const getTileUrl = (idx = currentIdx) => {
    const frame = frames[idx];
    if (!frame) return null;
    return `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
  };

  return {
    frames,
    currentIdx,
    currentFrame,
    isPlaying,
    setIsPlaying,
    setCurrentIdx,
    formattedTime,
    getTileUrl,
  };
}
