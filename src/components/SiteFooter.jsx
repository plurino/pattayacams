'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Shield, ExternalLink, Users, FileText, Phone } from 'lucide-react';

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
          {/* Contact Desk */}
          {onOpenContact ? (
            <button
              onClick={onOpenContact}
              className="flex items-center gap-1 text-slate-300 hover:text-brandPink transition-colors cursor-pointer"
              title="Feature Venue, Submit Stream, or Report Issue"
            >
              <Mail className="w-3 h-3 text-brandPink shrink-0" />
              <span>Contact Desk</span>
            </button>
          ) : (
            <a
              href="mailto:team@pattayacams.com"
              className="flex items-center gap-1 text-slate-300 hover:text-brandPink transition-colors"
              title="Email PattayaCams Support"
            >
              <Mail className="w-3 h-3 text-brandPink shrink-0" />
              <span>Contact Desk</span>
            </a>
          )}

          {/* Tourist Police 1155 */}
          <a
            href="tel:1155"
            className="flex items-center gap-1 text-slate-300 hover:text-cyan-400 transition-colors"
            title="Call Tourist Police Hotline (1155)"
          >
            <Phone className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>Police: 1155</span>
          </a>

          {/* City Hall CCTV */}
          <a
            href="https://livestream.pattaya.go.th/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 text-slate-300 hover:text-amber-300 transition-colors"
            title="Official Pattaya City Hall CCTV Portal"
          >
            <Shield className="w-3 h-3 text-amber-400 shrink-0" />
            <span>City Hall CCTV</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
          </a>

          {/* Creators Directory */}
          <Link
            href="/creators"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            title="Browse all Pattaya creators and live channels"
          >
            <Users className="w-3 h-3 text-purple-400 shrink-0" />
            <span>Creators</span>
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
