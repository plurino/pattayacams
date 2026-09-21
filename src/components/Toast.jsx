'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

/**
 * Lightweight global toast component.
 *
 * Other components dispatch `window.dispatchEvent(new CustomEvent('pattayacams:toast', { detail: { kind, message } }))`.
 * Toasts auto-dismiss after `durationMs` ms (default 5000). At most 3 stacked at once.
 *
 * Kinds:
 *   - 'info'  → cyan icon, neutral surface
 *   - 'warn'  → amber icon, amber-tinted border (used for out-of-bounds snap-to-location)
 *   - 'error' → red icon
 *   - 'ok'    → emerald icon
 */
export default function Toast({ durationMs = 5000 }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (event) => {
      const detail = event.detail || {};
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const next = { id, kind: detail.kind || 'info', message: detail.message || '' };
      setToasts((prev) => [...prev.slice(-2), next]); // cap at 3
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
    };
    window.addEventListener('pattayacams:toast', handler);
    return () => window.removeEventListener('pattayacams:toast', handler);
  }, [durationMs]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const Icon = t.kind === 'warn' ? AlertTriangle : t.kind === 'error' ? AlertTriangle : t.kind === 'ok' ? CheckCircle2 : Info;
        const iconColor = t.kind === 'warn' ? 'text-amber-400' : t.kind === 'error' ? 'text-rose-400' : t.kind === 'ok' ? 'text-emerald-400' : 'text-brandCyan';
        const borderColor = t.kind === 'warn' ? 'border-amber-500/60' : t.kind === 'error' ? 'border-rose-500/60' : t.kind === 'ok' ? 'border-emerald-500/60' : 'border-borderDark';
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 max-w-[min(92vw,520px)] px-3.5 py-2.5 rounded-xl bg-surface/95 backdrop-blur-md border ${borderColor} shadow-2xl text-[12px] sm:text-[13px] font-mono text-slate-100 animate-in fade-in slide-in-from-bottom-2`}
            role={t.kind === 'error' ? 'alert' : 'status'}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <span className="leading-relaxed">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
