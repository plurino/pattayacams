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
        const past = (data.radar?.past || []).map((f) => ({
          ...f,
          isForecast: false,
        }));
        let nowcast = (data.radar?.nowcast || []).map((f) => ({
          ...f,
          isForecast: true,
        }));

        // If RainViewer API has no active nowcast frames (e.g. clear skies / model regen),
        // project +10m, +20m, +30m forecast frames from the latest observation
        if (nowcast.length === 0 && past.length > 0) {
          const latestPast = past[past.length - 1];
          nowcast = [10, 20, 30].map((offsetMin) => ({
            time: latestPast.time + offsetMin * 60,
            path: latestPast.path,
            isForecast: true,
            forecastMinutes: offsetMin,
          }));
        }

        const combined = [...past, ...nowcast];

        if (combined.length > 0) {
          setFrames(combined);
          // Default to the latest REAL-TIME observation frame (the "NOW" frame)
          const nowIdx = past.length > 0 ? past.length - 1 : 0;
          setCurrentIdx(nowIdx);
        }
      } catch (err) {
        console.warn('RainViewer API load error:', err);
      }
    }

    loadRadarMaps();
    const refreshInterval = setInterval(loadRadarMaps, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [enabled]);

  // Handle Play: Plays once from current position (or start) to the finish, then STOPS (no loop)
  useEffect(() => {
    if (isPlaying && frames.length > 1) {
      playTimerRef.current = setInterval(() => {
        setCurrentIdx((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          if (next >= frames.length - 1) {
            setIsPlaying(false);
          }
          return next;
        });
      }, 750);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, frames.length]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // If already at the end of the timeline, restart playback from frame 0
      if (currentIdx >= frames.length - 1) {
        setCurrentIdx(0);
      }
      setIsPlaying(true);
    }
  };

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

  // Calculate descriptive relative label (e.g. -30m, NOW, +20m Forecast)
  let frameLabel = formattedTime;
  if (currentFrame && frames.length > 0) {
    const pastFrames = frames.filter((f) => !f.isForecast);
    const nowTime = pastFrames.length > 0 ? pastFrames[pastFrames.length - 1].time : frames[0].time;
    const diffMin = Math.round((currentFrame.time - nowTime) / 60);

    if (diffMin === 0) {
      frameLabel = `${formattedTime} • NOW (Live)`;
    } else if (diffMin < 0) {
      frameLabel = `${formattedTime} • ${diffMin}m`;
    } else {
      frameLabel = `${formattedTime} • +${diffMin}m (Forecast)`;
    }
  }

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
    handleTogglePlay,
    formattedTime,
    frameLabel,
    getTileUrl,
  };
}
