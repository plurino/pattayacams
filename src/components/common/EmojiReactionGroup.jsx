'use client';

import React, { useEffect, useState } from 'react';
import { getEntityReactions, toggleEntityReaction } from '@/src/utils/storage';

const REACTIONS = [
  { type: 'busy', emoji: '🔥', label: 'Busy' },
  { type: 'quiet', emoji: '😴', label: 'Quiet' },
  { type: 'flood', emoji: '🌧️', label: 'Flood' },
  { type: 'vibe', emoji: '🍻', label: 'Vibe' },
];

export default function EmojiReactionGroup({ entitySlug }) {
  const [reactions, setReactions] = useState({
    busy: 0,
    quiet: 0,
    flood: 0,
    vibe: 0,
    userVoted: null,
  });

  useEffect(() => {
    if (entitySlug) {
      setReactions(getEntityReactions(entitySlug));
    }
  }, [entitySlug]);

  const handleVote = (type) => {
    if (!entitySlug) return;
    toggleEntityReaction(entitySlug, type);
    setReactions(getEntityReactions(entitySlug));
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-surfaceLight/50 border border-borderDark rounded-xl">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brandCyan animate-pulse"></span>
          Real-Time Vibe Check
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {reactions.userVoted ? '✓ Your Vote Recorded (1 Vote Max)' : '1-Click Telemetry (2h Window)'}
        </span>
      </div>

      {/* 4 Standardized Emoji Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {REACTIONS.map(({ type, emoji, label }) => {
          const count = reactions[type] || 0;
          const isSelected = reactions.userVoted === type;

          return (
            <button
              key={type}
              onClick={() => handleVote(type)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all select-none ${
                isSelected
                  ? 'bg-brandCyan/20 border-brandCyan text-white shadow-[0_0_12px_rgba(0,229,255,0.3)] scale-[1.03]'
                  : 'bg-surface hover:bg-surfaceLight border-borderDark text-slate-300 hover:border-slate-600 active:scale-95'
              }`}
              title={isSelected ? `Click to remove your ${label} vote` : `Vote ${label}`}
            >
              <span className="text-xl mb-0.5">
                {emoji}
              </span>
              <span className="text-[10px] font-medium">{label}</span>
              <span className={`text-[10px] font-mono mt-0.5 font-bold ${isSelected ? 'text-brandCyan' : 'text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
