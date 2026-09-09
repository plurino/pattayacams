'use client';

import React, { useState } from 'react';
import { ExternalLink, Play, Youtube } from 'lucide-react';

export default function YouTubePlayer({
  channelId,
  videoId,
  title = 'Live Venue Camera',
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Construct permanent live stream embed URL
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`
    : `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&playsinline=1&rel=0`;

  const externalUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : `https://www.youtube.com/channel/${channelId}/live`;

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex flex-col group shadow-lg">
      {/* Live Badge */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-brandPink">
        <span className="w-1.5 h-1.5 rounded-full bg-brandPink animate-ping"></span>
        <span>LIVE YOUTUBE FEED</span>
      </div>

      {/* Direct Fallback Action */}
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded bg-black/80 hover:bg-black text-slate-300 hover:text-white border border-white/10 text-[10px] font-mono transition-colors"
        title="Open directly on YouTube"
      >
        <span>Open YT</span>
        <ExternalLink className="w-3 h-3 text-red-500" />
      </a>

      {/* Responsive Iframe */}
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={() => setIsLoaded(true)}
      />

      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface gap-2 z-10 pointer-events-none">
          <Youtube className="w-8 h-8 text-red-500 animate-pulse" />
          <span className="text-xs font-mono text-slate-400">Loading YouTube Live Stream...</span>
        </div>
      )}
    </div>
  );
}
