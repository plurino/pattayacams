'use client';

import React, { useState, useEffect, useId } from 'react';
import { Play, ExternalLink, Radio, Tv, Camera, CloudSun, Eye } from 'lucide-react';
import SnapshotCam from './SnapshotCam';
import { audioBus } from '@/src/utils/audioBus';

export default function UniversalPlayer({
  source,
  title = 'Live Stream Feed',
  posterImage,
  isLive = true,
  autoMount = false,
  muted = false,
  badgeText,
  badgeColor,
  className = '',
}) {
  const [isMounted, setIsMounted] = useState(autoMount);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [clientHost, setClientHost] = useState('pattayacams.com');
  const playerId = useId();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setClientHost(window.location.hostname || 'pattayacams.com');
    }
  }, []);

  // Update mount status if autoMount changes
  useEffect(() => {
    if (autoMount) {
      setIsMounted(true);
    }
  }, [autoMount]);

  // Subscribe to audio focus bus
  useEffect(() => {
    const unsubscribe = audioBus.subscribe((activeId) => {
      if (activeId && activeId !== playerId) {
        // Another player took focus
      }
    });
    return () => unsubscribe();
  }, [playerId]);

  const handlePlayClick = () => {
    setIsMounted(true);
    audioBus.requestAudioFocus(playerId);
  };

  // Determine source type and parameters
  const sourceType = source?.type || (source?.channel_id ? 'kick' : (source?.video_id ? 'youtube' : 'youtube'));

  // 1. Snapshot Camera (Coastal / Traffic)
  if (sourceType === 'snapshot' || source?.url) {
    return (
      <SnapshotCam
        src={source.url || source.snapshot_url}
        name={title}
        refreshIntervalMs={source.refreshIntervalMs || 5000}
        className={className}
      />
    );
  }

  // 2. Windy Webcam
  if (sourceType === 'windy' || source?.webcam_id) {
    const webcamId = source.webcam_id || source.id;
    const windyEmbedUrl = `https://embed.windy.com/embed.html?type=webcam&id=${webcamId}&metricRain=mm&metricTemp=°C`;
    const windyLink = `https://www.windy.com/-Webcams/webcams/${webcamId}`;

    return (
      <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex flex-col group shadow-lg ${className}`}>
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-cyan-500/30 text-[10px] font-mono text-cyan-400">
          <CloudSun className="w-3 h-3 text-cyan-400" />
          <span className="font-bold">WINDY WEBCAM • PATTAYA</span>
        </div>

        <a
          href={windyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2.5 py-1 rounded text-white bg-blue-600/90 hover:bg-blue-600 text-[10px] font-mono font-bold transition-all shadow-md"
        >
          <span>View on Windy</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>

        <iframe
          src={windyEmbedUrl}
          title={title}
          className="w-full h-full border-0"
          referrerPolicy="no-referrer"
          allowFullScreen
        />
      </div>
    );
  }

  // 3. Twitch Stream
  if (sourceType === 'twitch' || source?.platform === 'twitch') {
    const channel = (source.channel || source.username || source.channel_id || '').replace(/^@/, '');
    const twitchEmbedUrl = `https://player.twitch.tv/?channel=${channel}&parent=${clientHost}&parent=pattayacams.plurinoltd.workers.dev&parent=pattayacams.com&parent=localhost&muted=true&autoplay=true`;
    const twitchChannelUrl = `https://twitch.tv/${channel}`;

    if (!isMounted) {
      return (
        <div
          onClick={handlePlayClick}
          className={`relative w-full aspect-video bg-surfaceLight border border-borderDark rounded-xl overflow-hidden cursor-pointer group shadow-lg flex flex-col items-center justify-center select-none ${className}`}
        >
          {posterImage ? (
            <img src={posterImage} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-950/60 via-surface to-black" />
          )}

          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-purple-500/30 text-[10px] font-mono text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span className="font-bold">TWITCH LIVE</span>
          </div>

          <div className="relative z-20 flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-purple-600/90 group-hover:bg-purple-500 group-hover:scale-110 text-white flex items-center justify-center shadow-[0_0_24px_rgba(168,85,247,0.6)] transition-all">
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </div>
            <span className="text-xs font-mono font-bold text-white tracking-wide">
              Click to Mount Twitch Stream
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex flex-col group shadow-lg ${className}`}>
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-purple-500/30 text-[10px] font-mono text-purple-400">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span className="font-bold">TWITCH LIVE STREAM</span>
        </div>

        <iframe
          src={twitchEmbedUrl}
          title={title}
          className="w-full h-full border-0"
          allowFullScreen
          onLoad={() => setIsIframeLoaded(true)}
        />
      </div>
    );
  }

  // 4. Kick Stream
  if (sourceType === 'kick' || source?.platform === 'kick') {
    const channel = (source.channel || source.username || source.channel_id || source.slug || '').replace(/^@/, '');
    const kickEmbedUrl = `https://player.kick.com/${channel}?autoplay=true&muted=true`;
    const kickChannelUrl = `https://kick.com/${channel}`;

    if (!isMounted) {
      return (
        <div
          onClick={handlePlayClick}
          className={`relative w-full aspect-video bg-surfaceLight border border-borderDark rounded-xl overflow-hidden cursor-pointer group shadow-lg flex flex-col items-center justify-center select-none ${className}`}
        >
          {posterImage ? (
            <img src={posterImage} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/60 via-surface to-black" />
          )}

          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">{badgeText || 'KICK LIVE'}</span>
          </div>

          <div className="relative z-20 flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-[#53FC18] group-hover:bg-[#46d614] group-hover:scale-110 text-black flex items-center justify-center shadow-[0_0_24px_rgba(83,252,24,0.6)] transition-all">
              <Play className="w-6 h-6 fill-black ml-0.5" />
            </div>
            <span className="text-xs font-mono font-bold text-white tracking-wide">
              Click to Mount Kick Stream
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex flex-col group shadow-lg ${className}`}>
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold">{badgeText || 'KICK LIVE STREAM'}</span>
        </div>

        <iframe
          src={kickEmbedUrl}
          title={title}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setIsIframeLoaded(true)}
        />
      </div>
    );
  }

  // 5. YouTube Stream (Default)
  const videoId = source?.video_id || source?.videoId;
  const channelId = source?.channel_id || source?.youtube_channel_id;
  const handle = source?.youtube_handle || source?.handle || '@PattayaOhBar';

  const muteParam = muted ? 'mute=1' : 'mute=0';

  const ytEmbedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&${muteParam}&playsinline=1&rel=0&enablejsapi=1`
    : (channelId
        ? `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}&autoplay=1&${muteParam}&playsinline=1`
        : '');

  const resolvedPoster = posterImage || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
  const ytChannelUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : `https://www.youtube.com/${handle.startsWith('@') ? handle : '@' + handle}/live`;

  if (!isMounted) {
    return (
      <div
        onClick={handlePlayClick}
        className={`relative w-full aspect-video bg-surfaceLight border border-borderDark rounded-xl overflow-hidden cursor-pointer group shadow-lg flex flex-col items-center justify-center select-none ${className}`}
      >
        {resolvedPoster ? (
          <img src={resolvedPoster} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-950/50 via-surface to-black" />
        )}

        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-brandPink">
          <span className="w-2 h-2 rounded-full bg-brandPink animate-ping" />
          <span className="font-bold">{badgeText || (isLive ? 'LIVE STREAM' : 'VIDEO STREAM')}</span>
        </div>

        <div className="relative z-20 flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-brandPink group-hover:scale-110 text-white flex items-center justify-center shadow-[0_0_24px_rgba(255,42,109,0.6)] transition-all">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
          <span className="text-xs font-mono font-bold text-white tracking-wide">
            Click to Play Stream
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex flex-col group shadow-lg ${className}`}>
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-brandPink">
        <span className="w-2 h-2 rounded-full bg-brandPink animate-ping" />
        <span className="font-bold">{badgeText || 'LIVE BROADCAST'}</span>
      </div>

      {ytEmbedUrl ? (
        <iframe
          src={ytEmbedUrl}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          onLoad={() => setIsIframeLoaded(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-surface text-slate-400 text-xs font-mono">
          No video feed configured
        </div>
      )}
    </div>
  );
}
