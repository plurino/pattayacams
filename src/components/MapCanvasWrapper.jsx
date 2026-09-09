'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const DynamicMapCanvas = dynamic(() => import('./MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-canvas text-slate-400 gap-3">
      <Loader2 className="w-8 h-8 text-brandCyan animate-spin" />
      <span className="text-xs font-mono tracking-wider uppercase text-slate-300">
        Loading Pattaya City Surveillance Matrix...
      </span>
    </div>
  ),
});

export default function MapCanvasWrapper(props) {
  return <DynamicMapCanvas {...props} />;
}
