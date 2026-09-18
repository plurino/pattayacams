'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Video, ShieldCheck } from 'lucide-react';

export default function HlsPlayer({ streamUrl, title = 'City CCTV Stream', camId = 'CC-001', cameraCode }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [, setIsLoading] = useState(true);
  const [clock, setClock] = useState('');

  const resolvedCode = cameraCode || camId;
  const isPortalUrl = !streamUrl || streamUrl.endsWith('.th/') || streamUrl.endsWith('.th') || !streamUrl.includes('.m3u8');

  // Real-time ticking CCTV timestamp (UTC+7 Thailand)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const bkkTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${bkkTime.getFullYear()}-${pad(bkkTime.getMonth() + 1)}-${pad(bkkTime.getDate())} ${pad(bkkTime.getHours())}:${pad(bkkTime.getMinutes())}:${pad(bkkTime.getSeconds())} ICT`;
      setClock(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isPortalUrl) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setHasError(false);
    setIsLoading(true);

    if (Hls.isSupported() && streamUrl) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);

      if (videoRef.current) {
        hls.attachMedia(videoRef.current);
      }

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isMounted) {
          setIsLoading(false);
          videoRef.current?.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (isMounted) {
            setHasError(true);
            setIsLoading(false);
          }
        }
      });
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamUrl;
      videoRef.current.addEventListener('loadedmetadata', () => {
        if (isMounted) {
          setIsLoading(false);
          videoRef.current?.play().catch(() => {});
        }
      });
      videoRef.current.addEventListener('error', () => {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, isPortalUrl]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex flex-col group shadow-lg">
      {/* CCTV Top Status Bar */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-2 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-brandCyan">
        <span className={`w-2 h-2 rounded-full ${hasError ? 'bg-brandCyan' : 'bg-brandCyan animate-ping'}`}></span>
        <span className="font-bold">{hasError ? 'MUNICIPAL CCTV • PORTAL ACCESS' : 'MUNICIPAL CCTV • LIVE'}</span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-300 hidden sm:inline">{clock}</span>
      </div>

      {/* Player View */}
      {hasError ? (
        <div className="flex-1 p-4 sm:p-5 text-center flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#0a1220] via-[#070b14] to-black w-full h-full relative">
          {/* Subtle surveillance scanlines effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_50%,rgba(0,0,0,0.6)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50"></div>

          <div className="w-10 h-10 rounded-full bg-brandCyan/15 border border-brandCyan/40 flex items-center justify-center text-brandCyan shadow-[0_0_16px_rgba(0,229,255,0.25)] z-10">
            <Video className="w-5 h-5" />
          </div>

          <div className="flex flex-col items-center gap-1.5 max-w-sm z-10 px-4">
            <div className="flex items-center justify-center gap-1.5 text-white font-bold text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-brandCyan shrink-0" />
              <span className="truncate">{title}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300">
              <span>Code: <strong className="text-white">{resolvedCode}</strong></span>
              <span className="text-slate-600">•</span>
              <span>City Hall WebRTC</span>
            </div>
          </div>

          <a
            href="https://livestream.pattaya.go.th/"
            target="_blank"
            rel="noopener noreferrer"
            className="z-10 mt-2 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-canvas font-extrabold text-xs transition-all shadow-[0_0_16px_rgba(0,229,255,0.4)] hover:scale-105 active:scale-95"
          >
            <Video className="w-4 h-4 text-canvas shrink-0" />
            <span>Open Live Camera on City Portal ➔</span>
          </a>

          {/* Bottom Telemetry Info */}
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-slate-500 z-10 px-1">
            <span>NETWORK: PATTAYA-GOV</span>
            <span>NODE: {resolvedCode}</span>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
      )}
    </div>
  );
}
