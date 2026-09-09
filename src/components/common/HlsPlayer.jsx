'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle, RefreshCw, ExternalLink, Play, Volume2, VolumeX } from 'lucide-react';

export default function HlsPlayer({ streamUrl, title = 'City CCTV Stream' }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setHasError(false);
    setIsLoading(true);

    const video = videoRef.current;
    if (!video || !streamUrl) return;

    // Cleanup existing Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        manifestLoadingTimeOut: 8000,
        manifestLoadingMaxRetry: 2,
        levelLoadingTimeOut: 8000,
        fragLoadingTimeOut: 10000,
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!isMounted) return;
        setIsLoading(false);
        video.play().catch(() => {
          // Autoplay blocked without user interaction
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (!isMounted) return;
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('HLS Fatal network error encountered, trying recover...', data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('HLS Fatal media error encountered, trying recover...', data);
              hls.recoverMediaError();
              break;
            default:
              console.warn('HLS Unrecoverable error, displaying city hall offline state');
              setHasError(true);
              setErrorMessage('Municipal feed temporarily offline at City Hall.');
              setIsLoading(false);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS support
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        if (isMounted) {
          setIsLoading(false);
          video.play().catch(() => {});
        }
      });
      video.addEventListener('error', () => {
        if (isMounted) {
          setHasError(true);
          setErrorMessage('Municipal feed temporarily offline at City Hall.');
          setIsLoading(false);
        }
      });
    } else {
      setHasError(true);
      setErrorMessage('Browser does not support HLS streaming.');
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex items-center justify-center group shadow-lg">
      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm z-10">
          <div className="w-8 h-8 rounded-full border-2 border-brandCyan border-t-transparent animate-spin mb-2"></div>
          <span className="text-xs font-mono text-brandCyan">Connecting to City Hall Feed...</span>
        </div>
      )}

      {/* Offline Error Fallback UI */}
      {hasError ? (
        <div className="p-6 text-center flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-surface to-canvas w-full h-full">
          <div className="w-12 h-12 rounded-full bg-brandAmber/10 border border-brandAmber/30 flex items-center justify-center text-brandAmber shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <p className="text-sm font-semibold text-slate-200">
              {errorMessage || 'Municipal feed temporarily offline at City Hall.'}
            </p>
            <p className="text-xs text-slate-400">
              Pattaya City Hall streams undergo scheduled telemetry maintenance or security rotation.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surfaceLight hover:bg-borderDark border border-borderDark text-xs font-medium text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Feed</span>
            </button>
            <a
              href="https://livestream.pattaya.go.th/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brandCyan/10 hover:bg-brandCyan/20 border border-brandCyan/40 text-xs font-medium text-brandCyan transition-colors"
            >
              <span>Official City Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted={isMuted}
            autoPlay
          />

          {/* Player Overlay Controls */}
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-brandCyan">
            <span className="w-1.5 h-1.5 rounded-full bg-brandCyan animate-ping"></span>
            <span>MUNICIPAL CCTV</span>
          </div>

          <button
            onClick={toggleMute}
            className="absolute bottom-2 right-2 z-20 p-2 rounded-lg bg-black/70 hover:bg-black/90 text-white border border-white/10 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-brandCyan" />}
          </button>
        </>
      )}
    </div>
  );
}
