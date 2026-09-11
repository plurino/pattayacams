'use client';

import React, { useState } from 'react';
import { Radio, ExternalLink, Copy, Check } from 'lucide-react';

export default function CctvLaunchCard({ cameraCode, cameraType = 'CCTV Node', cameraBrand = 'Surveillance' }) {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cameraCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleLaunchCityPortal = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cameraCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
    if (typeof window !== 'undefined') {
      window.open('https://livestream.pattaya.go.th/', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="p-4 rounded-xl bg-cyan-950/20 border border-brandCyan/30 flex flex-col gap-3 shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-brandCyan" />
          <span>Pattaya City Hall CCTV Network</span>
        </span>
        <span className="text-[10px] font-mono text-brandCyan bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-500/30 uppercase">
          {cameraType} • {cameraBrand}
        </span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">
        Pattaya City operates 600+ municipal surveillance cameras for public safety and traffic monitoring. Live WebRTC video is hosted directly on the City Hall streaming portal.
      </p>

      {/* 1 Single Clean Command Launcher */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/60 border border-borderDark text-xs font-mono">
          <span className="text-slate-400 text-xs">Camera Code:</span>
          <span className="text-brandCyan font-bold text-sm tracking-wider">{cameraCode}</span>
          <button
            onClick={handleCopyCode}
            className="text-[11px] text-brandCyan hover:text-white px-2.5 py-1 rounded bg-brandCyan/10 hover:bg-brandCyan/25 border border-brandCyan/30 transition-colors flex items-center gap-1 cursor-pointer"
            title="Copy code to clipboard"
          >
            {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCode ? '✓ Copied' : 'Copy'}</span>
          </button>
        </div>

        <button
          onClick={handleLaunchCityPortal}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-canvas font-extrabold text-xs sm:text-sm transition-all shadow-[0_0_16px_rgba(0,229,255,0.4)] hover:shadow-[0_0_24px_rgba(0,229,255,0.6)] active:scale-98 cursor-pointer"
        >
          <Radio className="w-4 h-4 text-canvas animate-pulse shrink-0" />
          <span>
            {copiedCode
              ? '✓ Code Copied! Opening City Hall Stream...'
              : 'Launch Official City Hall Stream'}
          </span>
          <ExternalLink className="w-4 h-4 shrink-0" />
        </button>
        <span className="text-[10px] text-center text-slate-400 font-mono">
          Auto-copies code <strong className="text-brandCyan">{cameraCode}</strong> to clipboard on click
        </span>
      </div>
    </div>
  );
}
