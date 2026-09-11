'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';

export default function SnapshotCam({
  src,
  name = 'Coastal Snapshot Camera',
  refreshIntervalMs = 5000,
  className = '',
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Reset error state on src change
    setHasError(false);
    setImgSrc(`${src}${src.includes('?') ? '&' : '?'}t=${Date.now()}`);

    const updateFrame = () => {
      // Don't poll if document is hidden to conserve bandwidth
      if (typeof document !== 'undefined' && document.hidden) return;

      setIsRefreshing(true);
      const nextUrl = `${src}${src.includes('?') ? '&' : '?'}t=${Date.now()}`;

      // Preload image before swapping to eliminate flicker
      const img = new Image();
      img.onload = () => {
        setImgSrc(nextUrl);
        setHasError(false);
        setLastUpdated(Date.now());
        setIsRefreshing(false);
      };
      img.onerror = () => {
        setIsRefreshing(false);
      };
      img.src = nextUrl;
    };

    intervalRef.current = setInterval(updateFrame, Math.max(2000, refreshIntervalMs));

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [src, refreshIntervalMs]);

  const handleManualRefresh = () => {
    if (!src) return;
    setIsRefreshing(true);
    const nextUrl = `${src}${src.includes('?') ? '&' : '?'}t=${Date.now()}`;
    const img = new Image();
    img.onload = () => {
      setImgSrc(nextUrl);
      setHasError(false);
      setLastUpdated(Date.now());
      setIsRefreshing(false);
    };
    img.onerror = () => {
      setHasError(true);
      setIsRefreshing(false);
    };
    img.src = nextUrl;
  };

  return (
    <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex flex-col group shadow-lg select-none ${className}`}>
      {/* Top Status & Timestamp Badges */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-cyan-500/30 text-[10px] font-mono text-brandCyan">
        <span className="w-2 h-2 rounded-full bg-brandCyan animate-pulse shadow-[0_0_8px_#00E5FF]"></span>
        <span className="font-bold">LIVE • 5S SNAPSHOT</span>
      </div>

      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
        <button
          onClick={handleManualRefresh}
          className="p-1 rounded bg-black/70 hover:bg-black/90 text-slate-300 hover:text-white border border-white/10 transition-colors"
          title="Refresh frame now"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-brandCyan' : ''}`} />
        </button>
      </div>

      {/* Camera Image or Error State */}
      {hasError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-surface p-4 text-center gap-2">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <span className="text-xs font-mono text-slate-300">Live Snapshot Temporarily Offline</span>
          <button
            onClick={handleManualRefresh}
            className="px-3 py-1 rounded bg-surfaceLight border border-borderDark text-[11px] font-mono text-brandCyan hover:text-white"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={() => setHasError(true)}
        />
      )}

      {/* Bottom Camera Caption Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 flex items-center justify-between text-[11px] font-mono text-slate-300 z-20">
        <div className="flex items-center gap-1.5 truncate">
          <Camera className="w-3.5 h-3.5 text-brandCyan shrink-0" />
          <span className="truncate font-semibold text-white">{name}</span>
        </div>
        <span className="text-[9px] text-slate-400 shrink-0">
          Auto-updates every {Math.round(refreshIntervalMs / 1000)}s
        </span>
      </div>
    </div>
  );
}
