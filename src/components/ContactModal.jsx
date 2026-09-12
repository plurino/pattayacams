'use client';

import React, { useState } from 'react';
import { X, Send, Copy, Check, MessageSquare, ShieldCheck, Mail, AlertTriangle, Building2, Tv, Sparkles, MapPin } from 'lucide-react';

const CATEGORIES = [
  { id: 'venue_addition', label: 'Add / Feature a Venue or 24/7 Live Cam', icon: Building2 },
  { id: 'creator_verification', label: 'Add / Verify Creator Channel (YouTube / Kick)', icon: Tv },
  { id: 'advertising', label: 'Commercial Promotion & Sponsorship Inquiry', icon: Sparkles },
  { id: 'geo_correction', label: 'Report Inaccurate Map Location or Transit Route', icon: MapPin },
  { id: 'bug_report', label: 'Report a Broken Stream or Technical Bug', icon: AlertTriangle },
];

export default function ContactModal({ isOpen, onClose, initialTab = 'contact' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'contact' | 'privacy'
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);

  if (!isOpen) return null;

  const selectedCategoryObj = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  const buildMessageBody = () => {
    return `Category: ${selectedCategoryObj.label}\nFrom: ${name || 'Anonymous'}\nContact: ${contactInfo || 'Not provided'}\nReference URL: ${targetUrl || 'None'}\n\nMessage:\n${message || 'No additional message provided.'}`;
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[PattayaCams] ${selectedCategoryObj.label} - ${name || 'Inquiry'}`);
    const body = encodeURIComponent(buildMessageBody());
    window.location.href = `mailto:contact@pattayacams.com?subject=${subject}&body=${body}`;
    setSentNotice(true);
    setTimeout(() => setSentNotice(false), 5000);
  };

  const handleCopy = () => {
    const fullText = `Subject: [PattayaCams] ${selectedCategoryObj.label}\n\n${buildMessageBody()}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-[3100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-xl bg-surface border border-borderDark/90 rounded-2xl p-5 sm:p-7 shadow-2xl z-10 flex flex-col gap-4 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-borderDark">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brandPink/30 to-purple-600/30 border border-brandPink/50 flex items-center justify-center text-brandPink shadow-[0_0_14px_rgba(255,42,109,0.3)]">
              {activeTab === 'contact' ? (
                <Mail className="w-5 h-5 text-brandPink" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {activeTab === 'contact' ? 'Partner Desk & Developer Contact' : 'Privacy Policy & Terms'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeTab === 'contact'
                  ? 'Submit venue additions, creator requests, promotions or bug reports'
                  : 'Platform disclaimers, YouTube API compliance & data governance'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surfaceLight hover:bg-borderDark text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-canvas/80 p-1 rounded-xl border border-borderDark/80">
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'contact'
                ? 'bg-surfaceLight text-brandPink shadow border border-brandPink/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact & Inquiries</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-surfaceLight text-cyan-400 shadow border border-cyan-400/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy & Compliance</span>
          </button>
        </div>

        {/* TAB 1: Contact Form */}
        {activeTab === 'contact' && (
          <form onSubmit={handleSendEmail} className="flex flex-col gap-3.5 text-xs">
            {/* Category Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <span className="text-brandPink">●</span> Inquiry Reason
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-canvas border border-borderDark rounded-xl p-2.5 text-slate-100 focus:border-brandPink focus:outline-none transition-colors appearance-none cursor-pointer pr-9 font-medium"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-surface text-slate-200">
                      {cat.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  ▾
                </div>
              </div>
            </div>

            {/* Name / Business */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Your Name / Channel / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Tree Town Lounge or @PattayaWalker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-canvas border border-borderDark rounded-xl p-2.5 text-slate-100 placeholder:text-slate-500 focus:border-brandPink focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">Contact Email / LINE / Telegram</label>
                <input
                  type="text"
                  placeholder="e.g. manager@treetown.com or LINE ID"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  required
                  className="bg-canvas border border-borderDark rounded-xl p-2.5 text-slate-100 placeholder:text-slate-500 focus:border-brandPink focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Target URL / Channel Link (Optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-semibold">
                Relevant URL / Stream Link / Google Maps Pin <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/@channel or https://maps.app.goo.gl/..."
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="bg-canvas border border-borderDark rounded-xl p-2.5 text-slate-100 placeholder:text-slate-500 focus:border-brandPink focus:outline-none transition-colors"
              />
            </div>

            {/* Message Details */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-semibold">Message & Details</label>
              <textarea
                rows={4}
                placeholder="Describe your venue, channel, advertising proposal, or provide details of the bug/correction..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="bg-canvas border border-borderDark rounded-xl p-2.5 text-slate-100 placeholder:text-slate-500 focus:border-brandPink focus:outline-none transition-colors resize-none"
              />
            </div>

            {sentNotice && (
              <div className="p-2.5 rounded-xl bg-teal-950/60 border border-teal-500/50 text-teal-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Opening default email client... If it doesn&apos;t launch, use the &quot;Copy to Clipboard&quot; button below!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brandPink to-rose-600 hover:from-pink-600 hover:to-rose-500 text-white font-bold transition-all shadow-[0_0_14px_rgba(255,42,109,0.35)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send via Email</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 px-3.5 rounded-xl bg-surfaceLight hover:bg-slate-700 border border-borderDark text-slate-200 font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Copy formatted inquiry to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-teal-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-borderDark/60">
              Direct inbox: <span className="text-brandPink font-mono font-bold">contact@pattayacams.com</span>
            </div>
          </form>
        )}

        {/* TAB 2: Privacy Policy & Compliance */}
        {activeTab === 'privacy' && (
          <div className="flex flex-col gap-3 text-xs text-slate-300 leading-relaxed max-h-[50vh] overflow-y-auto pr-1">
            <div className="p-3 rounded-xl bg-surfaceLight/60 border border-borderDark">
              <h3 className="font-bold text-white text-sm mb-1">1. YouTube API Services & Embedded Content</h3>
              <p className="text-slate-400 text-[11px] mb-2">
                PattayaCams uses official YouTube API Services and official embed players to index and display public live broadcasts and video episodes. By using this website, you agree to be bound by the{' '}
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brandPink hover:underline font-semibold"
                >
                  YouTube Terms of Service
                </a>
                .
              </p>
              <p className="text-slate-400 text-[11px]">
                Please refer to the{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Google Privacy Policy
                </a>{' '}
                for details on how Google processes user data.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surfaceLight/60 border border-borderDark">
              <h3 className="font-bold text-white text-sm mb-1">2. Cookies & Local Storage</h3>
              <p className="text-slate-400 text-[11px]">
                We store non-identifying technical preferences locally on your device (localStorage), such as your saved Multi-Cam 2x2 grid channels, preferred Thai Baht currency selection, dark/light theme, and departure trip countdown date. We do not sell or broker personal data.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surfaceLight/60 border border-borderDark">
              <h3 className="font-bold text-white text-sm mb-1">3. Third-Party Map & Weather Providers</h3>
              <p className="text-slate-400 text-[11px]">
                Interactive mapping and weather forecasting utilize open APIs including CARTO Basemaps, OpenStreetMap contributors, OSRM road geometries, RainViewer radar tiles, and Open-Meteo meteorological models.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surfaceLight/60 border border-borderDark">
              <h3 className="font-bold text-white text-sm mb-1">4. Creator Attribution & Removal Requests</h3>
              <p className="text-slate-400 text-[11px]">
                All streams and videos remain the copyrighted intellectual property of their respective creators and broadcasters. If you are a creator or venue owner and wish to modify your listing details or request delisting, use our Contact Desk tab or email <span className="text-brandPink font-mono">contact@pattayacams.com</span>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
