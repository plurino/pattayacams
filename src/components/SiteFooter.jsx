'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, FileText, Scale } from 'lucide-react';

export default function SiteFooter({ onOpenContact }) {
  return (
    <footer
      aria-label="PattayaCams Permanent Global Footer"
      className="w-full bg-surface border-t border-borderDark/80 py-2.5 px-3 sm:px-6 text-[11px] font-mono text-slate-400 select-none z-30 shrink-0"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Left: Brand & Legal Disclaimer */}
        <div className="flex items-center gap-2 text-center sm:text-left flex-wrap justify-center sm:justify-start">
          <span className="font-bold text-slate-200">PattayaCams.com © 2026</span>
          <span className="text-slate-600 hidden xs:inline">•</span>
          <span className="text-slate-400 hidden xs:inline">
            Non-Commercial Tourism Guide & City Transit Radar
          </span>
        </div>

        {/* Right: Quick Links */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center text-[10px]">
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
