'use client';

import React, { useState } from 'react';
import { ExternalLink, Youtube, Radio, Play } from 'lucide-react';

export default function YouTubePlayer({
  channelId,
  videoId,
  title = 'Live Venue Stream',
  handle = '@PattayaOhBar',
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Permanent live stream embed URL for channel
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`
    : `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&playsinline=1&rel=0`;

  const liveChannelUrl = handle
    ? `https://www.youtube.com/${handle.startsWith('@') ? handle : '@' + handle}/live`
    : `https://www.youtube.com/channel/${channelId}/live`;

  const mainChannelUrl = handle
    ? `https://www.youtube.com/${handle.startsWith('@') ? handle : '@' + handle}`
    : `https://www.youtube.com/channel/${channelId}`;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex flex-col group shadow-lg">
        {/* Top Badges */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-brandPink">
          <span className="w-2 h-2 rounded-full bg-brandPink animate-ping"></span>
          <span className="font-bold">LIVE STREAM BROADCAST</span>
        </div>

        {/* Direct Action Link */}
        <a
          href={liveChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2.5 py-1 rounded bg-red-600/90 hover:bg-red-600 text-white border border-red-400/40 text-[10px] font-mono font-bold transition-all shadow-md"
          title="Open live on YouTube"
        >
          <Youtube className="w-3 h-3" />
          <span>Open YouTube</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>

        {/* Responsive Iframe Embed */}
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
        />

        {/* Loading / Connecting Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface gap-2 z-10 pointer-events-none">
            <Youtube className="w-8 h-8 text-red-500 animate-pulse" />
            <span className="text-xs font-mono text-slate-300">Connecting to Live Channel Feed...</span>
          </div>
        )}
      </div>

      {/* Live Stream Helper Bar */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-surfaceLight/50 border border-borderDark text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
          <span className="text-slate-300 font-mono text-[11px] truncate">
            Broadcast Channel: <strong className="text-white">{handle || channelId}</strong>
          </span>
        </div>
        <a
          href={liveChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors"
        >
          <span>Watch Live Feed</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
