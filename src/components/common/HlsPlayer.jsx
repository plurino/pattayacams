'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle, RefreshCw, ExternalLink, Video, ShieldAlert } from 'lucide-react';

export default function HlsPlayer({ streamUrl, title = 'City CCTV Stream' }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const isPortalUrl = !streamUrl || streamUrl.endsWith('.th/') || streamUrl.endsWith('.th') || !streamUrl.includes('.m3u8');

  useEffect(() => {
    let isMounted = true;

    // If stream URL is the official portal, transition to portal view directly
    if (isPortalUrl) {
      setIsLoading(false);
      setHasError(true);
      setErrorMessage('Pattaya City Hall Municipal Feed');
      return;
    }

    setHasError(false);
    setIsLoading(true);

    const video = videoRef.current;
    if (!video || !streamUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        manifestLoadingTimeOut: 5000,
        manifestLoadingMaxRetry: 1,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!isMounted) return;
        setIsLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (!isMounted) return;
        if (data.fatal) {
          setHasError(true);
          setErrorMessage('Pattaya City Hall Municipal Feed');
          setIsLoading(false);
          hls.destroy();
        }
      });
    } else {
      setHasError(true);
      setErrorMessage('Pattaya City Hall Municipal Feed');
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, retryCount, isPortalUrl]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex items-center justify-center group shadow-lg">
      {/* City Hall Camera Portal View */}
      {hasError ? (
        <div className="p-6 text-center flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-surface to-canvas w-full h-full">
          <div className="w-12 h-12 rounded-full bg-brandCyan/15 border border-brandCyan/40 flex items-center justify-center text-brandCyan shadow-[0_0_16px_rgba(0,229,255,0.25)]">
            <Video className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <p className="text-sm font-bold text-white">
              {title}
            </p>
            <p className="text-xs text-slate-300">
              Official City Hall Surveillance Stream. View real-time traffic and street monitoring directly via the municipal portal.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <a
              href="https://livestream.pattaya.go.th/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brandCyan hover:bg-cyan-400 text-canvas text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,229,255,0.3)]"
            >
              <span>Launch Official City Portal</span>
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
            muted
            autoPlay
          />
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-brandCyan">
            <span className="w-1.5 h-1.5 rounded-full bg-brandCyan animate-ping"></span>
            <span>MUNICIPAL CCTV</span>
          </div>
        </>
      )}
    </div>
  );
}
