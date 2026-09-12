'use client';

import React, { useState } from 'react';
import { ExternalLink, Radio, Play } from 'lucide-react';

export default function KickPlayer({
  channelSlug,
  title = 'Kick Stream',
  isLive = true,
  badgeText = 'KICK LIVE BROADCAST'
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  const cleanSlug = (channelSlug || '').replace(/^@/, '').toLowerCase().trim();
  const embedUrl = cleanSlug
    ? `https://player.kick.com/${cleanSlug}?autoplay=true&muted=true`
    : '';
  const channelUrl = cleanSlug ? `https://kick.com/${cleanSlug}` : '#';

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark flex flex-col group shadow-lg">
        {/* Top Status Badge */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/85 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-emerald-600'}`}></span>
          <span className="font-bold">{badgeText}</span>
        </div>

        {/* Responsive Kick Iframe Embed */}
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setIsLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface text-slate-400 text-xs font-mono">
            No Kick channel specified
          </div>
        )}

        {/* Loading Overlay */}
        {!isLoaded && embedUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface gap-2 z-10 pointer-events-none">
            <Radio className="w-8 h-8 text-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-300">
              Connecting to Kick Broadcast...
            </span>
          </div>
        )}
      </div>

      {/* Stream Channel Helper Bar */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-surfaceLight/50 border border-borderDark text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
          <span className="text-slate-300 font-mono text-[11px] truncate">
            Kick Broadcast Channel: <strong className="text-white font-semibold">@{cleanSlug}</strong>
          </span>
        </div>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <span>Watch on Kick</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
