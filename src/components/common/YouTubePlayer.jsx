'use client';

import React, { useState } from 'react';
import { ExternalLink, Youtube } from 'lucide-react';

export default function YouTubePlayer({
  channelId,
  videoId,
  title = 'Venue Stream',
  handle = '@PattayaOhBar',
  type = 'venue',
  isLive = false,
  muted = false,
  badgeText,
  badgeColor,
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  const isStreamer = type === 'streamer';
  const isVenue = type === 'venue' || isLive || !isStreamer;

  // Resolve active live video ID:
  const resolvedVideoId = videoId || (channelId === 'UCuRdgfA3P-cDPmcK804cnuQ' ? 'cG8EAlyY9gQ' : null);

  const muteParam = muted ? 'mute=1' : 'mute=0';

  const embedUrl = resolvedVideoId
    ? `https://www.youtube-nocookie.com/embed/${resolvedVideoId}?autoplay=1&${muteParam}&playsinline=1&rel=0&enablejsapi=1`
    : (channelId
        ? (isVenue
            ? `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}&autoplay=1&${muteParam}&playsinline=1`
            : `https://www.youtube-nocookie.com/embed/videoseries?list=UU${channelId.slice(2)}&autoplay=1&${muteParam}&playsinline=1&rel=0`)
        : '');

  const liveChannelUrl = resolvedVideoId
    ? `https://www.youtube.com/watch?v=${resolvedVideoId}`
    : (handle
        ? `https://www.youtube.com/${handle.startsWith('@') ? handle : '@' + handle}${isVenue ? '/live' : ''}`
        : `https://www.youtube.com/channel/${channelId}`);

  const isCyan = badgeColor === 'brandCyan';
  const resolvedBadgeText = badgeText || (isVenue ? 'LIVE STREAM BROADCAST' : '4K WALKING TOUR');

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex flex-col group shadow-lg">
        {/* Top Badges */}
        {isVenue ? (
          <div className={`absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono ${isCyan ? 'text-brandCyan' : 'text-brandPink'}`}>
            <span className={`w-2 h-2 rounded-full animate-ping ${isCyan ? 'bg-brandCyan' : 'bg-brandPink'}`}></span>
            <span className="font-bold">{resolvedBadgeText}</span>
          </div>
        ) : (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-indigo-500/30 text-[10px] font-mono text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span className="font-bold">{resolvedBadgeText}</span>
          </div>
        )}

        {/* Responsive Iframe Embed */}
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onLoad={() => setIsLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface text-slate-400 text-xs font-mono">
            No video feed configured
          </div>
        )}

        {/* Loading / Connecting Overlay */}
        {!isLoaded && embedUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface gap-2 z-10 pointer-events-none">
            <Youtube className={`w-8 h-8 animate-pulse ${isVenue ? 'text-red-500' : 'text-indigo-400'}`} />
            <span className="text-xs font-mono text-slate-300">
              {isVenue ? 'Connecting to Live Broadcast...' : 'Loading 4K Street Walk Tour...'}
            </span>
          </div>
        )}
      </div>

      {/* Stream / Channel Helper Bar */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-surfaceLight/50 border border-borderDark text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            isVenue
              ? (isCyan ? 'bg-brandCyan animate-pulse' : 'bg-red-500 animate-pulse')
              : 'bg-indigo-400'
          }`}></div>
          <span className="text-slate-300 font-mono text-[11px] truncate">
            {isVenue
              ? (isCyan ? 'Municipal Surveillance Node' : 'Broadcast Channel')
              : 'IRL Walking Channel'}: <strong className="text-white">{handle || resolvedVideoId || channelId}</strong>
          </span>
        </div>
        <a
          href={liveChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold transition-colors ${
            isVenue ? 'text-red-400 hover:text-red-300' : 'text-indigo-400 hover:text-indigo-300'
          }`}
        >
          <span>{isVenue ? 'Watch Live' : 'Visit Channel'}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
