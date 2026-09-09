'use client';

import React, { useState } from 'react';
import { ExternalLink, Youtube } from 'lucide-react';

export default function YouTubePlayer({
  channelId,
  videoId,
  title = 'Live Venue Stream',
  handle = '@PattayaOhBar',
  badgeText = 'LIVE STREAM BROADCAST',
  badgeColor = 'brandPink',
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Resolve active live video ID:
  // If videoId is supplied, use it; otherwise fallback to known live broadcasts or upload playlists
  const resolvedVideoId = videoId || (channelId === 'UCuRdgfA3P-cDPmcK804cnuQ' ? 'k8zVyL8mk74' : null);

  const embedUrl = resolvedVideoId
    ? `https://www.youtube-nocookie.com/embed/${resolvedVideoId}?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1`
    : (channelId ? `https://www.youtube-nocookie.com/embed/videoseries?list=UU${channelId.slice(2)}&autoplay=1&mute=1&playsinline=1&rel=0` : '');

  const liveChannelUrl = resolvedVideoId
    ? `https://www.youtube.com/watch?v=${resolvedVideoId}`
    : (handle ? `https://www.youtube.com/${handle.startsWith('@') ? handle : '@' + handle}/live` : `https://www.youtube.com/channel/${channelId}`);

  const isCyan = badgeColor === 'brandCyan';

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex flex-col group shadow-lg">
        {/* Top Badges */}
        <div className={`absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono ${isCyan ? 'text-brandCyan' : 'text-brandPink'}`}>
          <span className={`w-2 h-2 rounded-full animate-ping ${isCyan ? 'bg-brandCyan' : 'bg-brandPink'}`}></span>
          <span className="font-bold">{badgeText}</span>
        </div>

        {/* Direct Action Link */}
        <a
          href={liveChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2.5 py-1 rounded bg-red-600/90 hover:bg-red-600 text-white border border-red-400/40 text-[10px] font-mono font-bold transition-all shadow-md"
          title="Open video on YouTube"
        >
          <Youtube className="w-3 h-3" />
          <span>Open YouTube</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>

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
            No live video feed configured
          </div>
        )}

        {/* Loading / Connecting Overlay */}
        {!isLoaded && embedUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface gap-2 z-10 pointer-events-none">
            <Youtube className="w-8 h-8 text-red-500 animate-pulse" />
            <span className="text-xs font-mono text-slate-300">Connecting to Live Video Feed...</span>
          </div>
        )}
      </div>

      {/* Live Stream Helper Bar */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-surfaceLight/50 border border-borderDark text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${isCyan ? 'bg-brandCyan animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-slate-300 font-mono text-[11px] truncate">
            {isCyan ? 'Municipal Surveillance Node' : 'Broadcast Channel'}: <strong className="text-white">{handle || resolvedVideoId || channelId}</strong>
          </span>
        </div>
        <a
          href={liveChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors"
        >
          <span>Watch Feed</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
