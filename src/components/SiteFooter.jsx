'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, FileText, Scale } from 'lucide-react';

export default function SiteFooter({ onOpenContact }) {
  return (
    <footer
      aria-label="PattayaCams Permanent Global Footer"
      className="w-full bg-surface border-t border-borderDark/80 py-1.5 sm:py-2 px-3 sm:px-6 text-[10px] sm:text-[11px] font-mono text-slate-400 select-none z-30 shrink-0"
    >
      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2">
        {/* Left: Brand & Legal Disclaimer (hidden on narrow screens to prevent multi-line wrap) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-slate-200 hidden sm:inline whitespace-nowrap">
            PattayaCams.com © 2026
          </span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="text-slate-400 hidden md:inline truncate max-w-xs lg:max-w-none">
            Non-Commercial Tourism Guide & City Transit Radar
          </span>
        </div>

        {/* Right: Quick Links */}
        <div className="flex items-center gap-3 sm:gap-4 ml-auto justify-end text-[10px] sm:text-[11px] shrink-0 whitespace-nowrap">
          {/* Contact */}
          {onOpenContact ? (
            <button
              onClick={onOpenContact}
              className="flex items-center gap-1 text-slate-300 hover:text-brandPink transition-colors cursor-pointer"
              title="Get in touch with PattayaCams"
            >
              <Mail className="w-3 h-3 text-brandPink shrink-0" />
              <span>Contact</span>
            </button>
          ) : (
            <a
              href="mailto:team@pattayacams.com"
              className="flex items-center gap-1 text-slate-300 hover:text-brandPink transition-colors"
              title="Get in touch with PattayaCams"
            >
              <Mail className="w-3 h-3 text-brandPink shrink-0" />
              <span>Contact</span>
            </a>
          )}

          {/* Terms */}
          <Link
            href="/terms"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            title="Terms of Service"
          >
            <Scale className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Terms</span>
          </Link>

          {/* Privacy & Terms */}
          <Link
            href="/privacy"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            title="Privacy Policy & Cookies"
          >
            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Privacy</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
