'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { ExternalLink, Video, ShieldCheck, Radio } from 'lucide-react';

export default function HlsPlayer({ streamUrl, title = 'City CCTV Stream', camId = 'CC-001' }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clock, setClock] = useState('');

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
          setIsLoading(false);
          hls.destroy();
        }
      });
    } else {
      setHasError(true);
      setIsLoading(false);
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

      {/* City Hall Direct Portal Button */}
      <a
        href="https://livestream.pattaya.go.th/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-brandCyan/90 hover:bg-brandCyan text-canvas border border-cyan-300/40 text-[10px] font-mono font-bold transition-all shadow-md"
        title="Open Pattaya City Hall Livestream Portal"
      >
        <Radio className="w-3 h-3" />
        <span>Pattaya City Portal</span>
        <ExternalLink className="w-2.5 h-2.5" />
      </a>

      {/* Player View */}
      {hasError ? (
        <div className="flex-1 p-5 text-center flex flex-col items-center justify-center gap-2.5 bg-gradient-to-b from-[#0e1626] to-black w-full h-full relative">
          {/* Subtle surveillance scanlines effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40"></div>

          <div className="w-11 h-11 rounded-full bg-brandCyan/15 border border-brandCyan/40 flex items-center justify-center text-brandCyan shadow-[0_0_16px_rgba(0,229,255,0.2)] z-10">
            <Video className="w-5 h-5" />
          </div>

          <div className="flex flex-col gap-1 max-w-sm z-10">
            <div className="flex items-center justify-center gap-1.5 text-white font-bold text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-brandCyan shrink-0" />
              <span className="truncate">{title}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              Pattaya City Hall Municipal Security & Traffic Feed. Unauthenticated direct access requires municipal SSO login.
            </p>
          </div>

          <div className="z-10 mt-1">
            <a
              href="https://livestream.pattaya.go.th/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brandCyan hover:bg-cyan-400 text-canvas text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,229,255,0.3)]"
            >
              <span>Launch Official City Hall Stream</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Bottom Telemetry Info */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-slate-500 z-10 px-1">
            <span>NETWORK: PATTAYA-GOV-INNOPOLIS</span>
            <span>CODEC: 1080P H.264</span>
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
