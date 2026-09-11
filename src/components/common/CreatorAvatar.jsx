'use client';

import React, { useState } from 'react';

function getInitials(name = '') {
  if (!name) return 'P';
  const clean = name.replace(/[^\w\s]/gi, '').trim();
  return (clean[0] || 'P').toUpperCase();
}

export default function CreatorAvatar({
  src,
  alt = '',
  name = '',
  platform = 'youtube',
  className = 'w-14 h-14 rounded-2xl',
}) {
  const [hasError, setHasError] = useState(false);

  // Invalid or dummy placeholders that should instantly trigger styled fallback
  const isInvalidUrl = !src ||
    src === '/og-image.jpg' ||
    src.endsWith('/a') ||
    src === 'https://yt3.googleusercontent.com/a' ||
    src.includes('example.com') ||
    src.includes('images.unsplash.com');

  const initials = getInitials(name || alt);
  const isKick = platform === 'kick';
  const isVenue = platform === 'venue';

  if (hasError || isInvalidUrl) {
    if (isKick) {
      return (
        <div
          className={`${className} shrink-0 bg-gradient-to-br from-[#062413] via-[#04170D] to-[#020B06] border-2 border-[#53FC18]/60 text-[#53FC18] font-mono font-black flex flex-col items-center justify-center shadow-[0_0_14px_rgba(83,252,24,0.25)] select-none relative overflow-hidden`}
          title={`${name} (Kick Streamer)`}
        >
          <span className="text-base tracking-wider">{initials}</span>
          <span className="text-[8px] font-bold tracking-widest text-[#53FC18]/80 uppercase -mt-0.5">KICK</span>
        </div>
      );
    }

    if (isVenue) {
      return (
        <div
          className={`${className} shrink-0 bg-gradient-to-br from-[#280B22] via-[#1A0819] to-[#0D0510] border-2 border-brandPink/60 text-brandPink font-mono font-black flex flex-col items-center justify-center shadow-[0_0_14px_rgba(255,42,109,0.25)] select-none relative overflow-hidden`}
          title={`${name} (Live Venue)`}
        >
          <span className="text-base tracking-wider">{initials}</span>
          <span className="text-[8px] font-bold tracking-widest text-brandPink/80 uppercase -mt-0.5">VENUE</span>
        </div>
      );
    }

    return (
      <div
        className={`${className} shrink-0 bg-gradient-to-br from-[#1C0D2E] via-[#120820] to-[#0A0413] border-2 border-purple-500/50 text-purple-200 font-mono font-black flex flex-col items-center justify-center shadow-[0_0_14px_rgba(168,85,247,0.2)] select-none relative overflow-hidden`}
        title={`${name} (Creator)`}
      >
        <span className="text-base tracking-wider">{initials}</span>
        <span className="text-[8px] font-bold tracking-widest text-purple-400/80 uppercase -mt-0.5">CREATOR</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || name}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${className} shrink-0 object-cover border-2 border-borderDark shadow-md bg-slate-900`}
      loading="lazy"
    />
  );
}
