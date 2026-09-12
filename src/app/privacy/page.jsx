import React from 'react';
import Link from 'next/link';
import SiteHeaderWithModals from '@/src/components/SiteHeaderWithModals';
import { ShieldCheck, ArrowLeft, Mail, ExternalLink, Lock, Eye, Database } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy & Terms of Service | PattayaCams',
  description: 'Privacy Policy, YouTube API Services disclosure, cookie governance, and platform compliance terms for PattayaCams.com.',
  openGraph: {
    title: 'Privacy Policy & Terms | PattayaCams.com',
    description: 'Privacy Policy, YouTube API Services disclosure, and platform compliance terms.',
    url: 'https://pattayacams.com/privacy/',
    type: 'website',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col font-sans">
      <SiteHeaderWithModals viewMode="creators" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-400 hover:text-brandPink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Live Radar Map</span>
          </Link>
        </div>

        {/* Hero Header */}
        <div className="border-b border-borderDark pb-6 mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Legal Governance & Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Privacy Policy & Platform Terms
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-400">
            Effective Date: September 2026 • Platform: PattayaCams.com
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed font-normal">
          {/* Section 1 */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Eye className="w-5 h-5 text-brandPink shrink-0" />
              <h2>1. YouTube API Services & Third-Party Embeds</h2>
            </div>
            <p>
              PattayaCams uses official YouTube API Services and embedded YouTube and Kick video players to display public broadcasts, 24/7 webcams, and curated 4K street walks.
            </p>
            <p>
              By accessing and viewing YouTube video content on PattayaCams, you acknowledge and agree to be bound by the{' '}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brandPink hover:underline font-semibold inline-flex items-center gap-0.5"
              >
                <span>YouTube Terms of Service</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              .
            </p>
            <p>
              For details on how Google collects, retains, and processes user data when interacting with YouTube video players, please review the{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline font-semibold inline-flex items-center gap-0.5"
              >
                <span>Google Privacy Policy</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              .
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Database className="w-5 h-5 text-brandCyan shrink-0" />
              <h2>2. Information We Collect & Local Storage</h2>
            </div>
            <p>
              We prioritize visitor privacy and collect zero personally identifiable information (PII) during ordinary browsing.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 ml-1">
              <li>
                <strong className="text-white">Local Storage (Client-Side):</strong> We store technical user preferences locally in your browser (e.g. customized Multi-Cam 2x2 channels, dark/light theme, selected currency USD/GBP/EUR/AUD, and departure trip countdown date). This data never leaves your device.
              </li>
              <li>
                <strong className="text-white">Server & Infrastructure Logs:</strong> Cloudflare provides standard non-identifying technical analytics (country of origin, browser type, HTTP status codes) strictly for DDoS mitigation, caching performance, and load balancing.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Lock className="w-5 h-5 text-amber-400 shrink-0" />
              <h2>3. Mapping, Weather & Transit Telemetry</h2>
            </div>
            <p>
              Interactive maps, weather forecasts, and marine radar are powered by open third-party services:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 ml-1">
              <li>Map tiles are provided by CARTO and OpenStreetMap contributors.</li>
              <li>Precipitation Doppler radar tiles are retrieved dynamically from RainViewer API.</li>
              <li>Weather temperature, humidity, and wind metrics are provided by Open-Meteo.</li>
            </ul>
            <p className="text-xs text-slate-400">
              Songthaew (Baht Bus) routes and ferry transit timetables are curated navigational approximations for tourist orientation and are not legally binding transit schedules.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Mail className="w-5 h-5 text-purple-400 shrink-0" />
              <h2>4. Creator Attribution & Delisting Requests</h2>
            </div>
            <p>
              All video content, audio, channel trademarks, and logos displayed on PattayaCams remain the intellectual property of their original YouTube/Kick creators and municipal authorities.
            </p>
            <p>
              If you are a content creator, venue proprietor, or copyright holder and wish to update your coordinates, verify your badge, or request immediate removal from our directory, contact our desk at:
            </p>
            <div className="p-3.5 rounded-xl bg-canvas border border-borderDark font-mono text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400">Contact Desk:</span>{' '}
                <span className="text-brandPink font-bold">contact@pattayacams.com</span>
              </div>
              <span className="text-slate-500 text-[11px]">SLA: &lt; 24h</span>
            </div>
          </section>
        </div>

        {/* Footer info */}
        <div className="mt-12 pt-6 border-t border-borderDark flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <p>© {new Date().getFullYear()} PattayaCams.com. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-brandPink transition-colors">
              Radar Map
            </Link>
            <span>•</span>
            <Link href="/creators" className="hover:text-brandPink transition-colors">
              Creators Directory
            </Link>
            <span>•</span>
            <Link href="/privacy" className="text-brandPink font-bold">
              Privacy Policy
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
