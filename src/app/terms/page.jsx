import React from 'react';
import Link from 'next/link';
import SiteHeaderWithModals from '@/src/components/SiteHeaderWithModals';
import SiteFooter from '@/src/components/SiteFooter';
import {
  Globe,
  AlertTriangle,
  Copyright,
  Link2,
  UserCheck,
  Flag,
  Scale,
  Gavel,
  FileText,
  Mail,
  ArrowLeft,
} from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | PattayaCams',
  description: 'Terms of Service for PattayaCams.com — a non-commercial tourism directory that surfaces third-party live streams.',
  openGraph: {
    title: 'Terms of Service | PattayaCams.com',
    description: 'Terms of Service for PattayaCams.com — non-commercial tourism directory surfacing third-party streams.',
    url: 'https://pattayacams.com/terms/',
    type: 'website',
  },
};

export default function TermsPage() {
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
            <Scale className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-400">
            Effective Date: September 2026 • Platform: PattayaCams.com
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed font-normal">
          {/* Section 1 — Nature of the Service */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Globe className="w-5 h-5 text-brandPink shrink-0" />
              <h2>1. Nature of the Service</h2>
            </div>
            <p>
              PattayaCams (the &ldquo;Service&rdquo;) is a non-commercial tourism directory that helps visitors orient themselves
              in Pattaya by surfacing publicly available third-party live streams. The Service does not host, produce,
              broadcast, transcode, edit, or otherwise create any of the audio or video content it displays.
            </p>
            <p>
              All streams surfaced through the Service are created by independent third parties and broadcast on
              third-party platforms (including but not limited to YouTube, Kick, and similar services). PattayaCams
              acts solely as an aggregator and directory; we are not the publisher, broadcaster, or producer of any
              embedded stream.
            </p>
          </section>

          {/* Section 2 — No Warranty / As Available */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <h2>2. No Warranty / &ldquo;As Available&rdquo;</h2>
            </div>
            <p>
              The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. The operator of this Service makes no
              warranties, express or implied, regarding the accuracy, reliability, availability, or completeness of
              any content, listing, map element, or functionality.
            </p>
            <p>
              The operator of this Service does not guarantee that any particular stream will be live at any given
              time, that the Service will be uninterrupted or error-free, that defects will be corrected, or that the
              Service is free of viruses or other harmful components. Stream verdicts, locations, and other metadata
              may be inaccurate, outdated, or incomplete.
            </p>
          </section>

          {/* Section 3 — Content Attribution */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Copyright className="w-5 h-5 text-brandCyan shrink-0" />
              <h2>3. Content Attribution</h2>
            </div>
            <p>
              All video, audio, channel names, logos, trademarks, and other content displayed through the Service
              remain the intellectual property of their respective creators and rights holders. PattayaCams displays
              attribution to the extent reasonably practicable and does not claim any ownership over third-party
              broadcasts.
            </p>
            <p>
              If you are a rights holder and wish to request removal or modification of a listing, you may contact
              us at the address below. We handle such requests in good faith and at our sole discretion, but we make
              no commitment as to response timeframe, methodology, or outcome.
            </p>
          </section>

          {/* Section 4 — Third-Party Content & Links */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Link2 className="w-5 h-5 text-purple-400 shrink-0" />
              <h2>4. Third-Party Content &amp; Links</h2>
            </div>
            <p>
              The Service embeds players, links, and feeds operated by third parties. The operator of this Service does
              not control, endorse, sponsor, or assume responsibility for any third-party content, platform, or service.
              Your interactions with third-party platforms are governed solely by their own terms, policies, and
              practices.
            </p>
            <p>
              Embedding a player does not constitute an endorsement of the underlying broadcast, the broadcaster, the
              venue shown, or any views expressed therein. The operator of this Service accepts no liability for
              statements, actions, or content originating from third-party streams.
            </p>
          </section>

          {/* Section 5 — Acceptable Use */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <h2>5. Acceptable Use</h2>
            </div>
            <p>
              You agree to use the Service for personal, non-commercial, tourist-orientation purposes only. Without
              prior written permission, you may not scrape, crawl, bulk-download, re-broadcast, mirror, frame, or
              otherwise systematically extract content or data from the Service.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 ml-1">
              <li>You may not use the Service to harass, stalk, defame, or unlawfully target any creator, venue, or individual.</li>
              <li>You may not use the Service for any unlawful purpose or in violation of any applicable local, national, or international law or regulation.</li>
              <li>You may not attempt to interfere with, reverse-engineer, or compromise the integrity of the Service or its infrastructure.</li>
              <li>You may not use the Service to build a competing product, dataset, or service without our written consent.</li>
            </ul>
          </section>

          {/* Section 6 — Reporting Concerns */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Flag className="w-5 h-5 text-rose-400 shrink-0" />
              <h2>6. Reporting Concerns</h2>
            </div>
            <p>
              If you believe content surfaced by the Service is infringing, defamatory, or otherwise objectionable,
              please notify us through the contact channel listed in Section 10. Where possible, the most expedient
              recourse is to report the concern directly to the source platform (e.g., YouTube, Kick), as the
              operator of this Service has no technical control over third-party broadcasts.
            </p>
            <p>
              The operator of this Service may, at its sole discretion, remove, edit, annotate, or decline to act on
              listings in response to concerns. We are under no obligation to investigate, respond within any
              particular timeframe, or remove any listing, and we assume no liability for any decision or inaction.
            </p>
          </section>

          {/* Section 7 — Limitation of Liability */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Scale className="w-5 h-5 text-slate-300 shrink-0" />
              <h2>7. Limitation of Liability</h2>
            </div>
            <p>
              To the maximum extent permitted by applicable law, the operator of this Service, along with its
              affiliates, licensors, service providers, and contributors, shall not be liable for any indirect,
              incidental, special, consequential, exemplary, or punitive damages, including but not limited to loss
              of profits, revenue, data, goodwill, business opportunity, or other intangible losses, arising out of or
              in connection with your access to or use of &mdash; or inability to access or use &mdash; the Service or
              any content surfaced through it.
            </p>
            <p>
              Because the Service is provided free of charge, any aggregate liability of the operator of this Service
              for any and all claims arising under or relating to these Terms shall not exceed zero dollars (US$0).
              You acknowledge that this limitation is a fundamental basis of the bargain between you and the operator
              of this Service.
            </p>
            <p>
              Nothing in these Terms is intended to exclude or limit any liability that cannot be excluded or limited
              under applicable law.
            </p>
          </section>

          {/* Section 8 — Governing Law & Disputes */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Gavel className="w-5 h-5 text-amber-300 shrink-0" />
              <h2>8. Governing Law &amp; Disputes</h2>
            </div>
            <p>
              These Terms shall be construed in accordance with the laws applicable to the jurisdiction in which the
              operator of this Service resides, without regard to conflict-of-law principles.
            </p>
            <p>
              Any dispute arising out of or relating to these Terms or the Service shall first be addressed through
              good-faith informal negotiation. Where negotiation fails, both parties consent to resolve the dispute
              through binding individual arbitration rather than jury trials or class proceedings, to the fullest
              extent permitted by applicable law.
            </p>
            <p>
              You expressly waive any right to participate in a class action, collective action, private attorney
              general action, or other representative proceeding against the operator of this Service. If arbitration
              is found unenforceable for any reason, the dispute shall be resolved exclusively in the competent courts
              located in the jurisdiction of the operator of this Service, and you consent to personal jurisdiction
              therein.
            </p>
          </section>

          {/* Section 9 — Changes */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <FileText className="w-5 h-5 text-slate-400 shrink-0" />
              <h2>9. Changes to These Terms</h2>
            </div>
            <p>
              The operator of this Service may update, revise, or replace these Terms at any time, with or without
              prior notice. The current effective date will be reflected at the bottom of this page. Your continued
              use of the Service after any such change constitutes acceptance of the revised Terms. It is your
              responsibility to review this page periodically.
            </p>
          </section>

          {/* Section 10 — Contact */}
          <section className="bg-surface border border-borderDark rounded-2xl p-5 sm:p-7 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
              <Mail className="w-5 h-5 text-brandPink shrink-0" />
              <h2>10. Contact</h2>
            </div>
            <p>
              For all inquiries, including takedown requests, attribution corrections, and general correspondence,
              contact:
            </p>
            <div className="p-3.5 rounded-xl bg-canvas border border-borderDark font-mono text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400">Contact Desk:</span>{' '}
                <span className="text-brandPink font-bold">contact@pattayacams.com</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              We do not guarantee a response within any specific timeframe. Most inquiries are handled on a
              best-effort basis.
            </p>
          </section>

          {/* Effective Date Footer */}
          <div className="pt-2 text-center text-xs font-mono text-slate-500">
            Effective Date: September 2026
          </div>
        </div>
      </main>

      {/* Global Permanent Uniform Footer */}
      <SiteFooter />
    </div>
  );
}