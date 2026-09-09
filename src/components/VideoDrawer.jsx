'use client';

import React, { useState } from 'react';
import { X, Car, Hotel, ExternalLink, MessageCircle, Send, Star, Compass, Wifi, MapPin, Youtube, Radio, Check } from 'lucide-react';
import HlsPlayer from './common/HlsPlayer';
import YouTubePlayer from './common/YouTubePlayer';
import EmojiReactionGroup from './common/EmojiReactionGroup';
import hotelsData from '@/public/data/hotels.json';
import {
  getUpcomingWeekendDates,
  buildAgodaHotelUrl,
  build12GoTransferUrl,
  buildAiraloEsimUrl,
  getTelegramCommunityUrl,
} from '@/src/utils/affiliate';

export default function VideoDrawer({ entity, onClose }) {
  const [copiedCode, setCopiedCode] = useState(false);
  if (!entity) return null;

  const handleCopyCode = (code) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const isCctv = entity.type === 'cctv';
  const isVenue = entity.type === 'venue';
  const isStreamer = entity.type === 'streamer';

  const zoneHotels = (hotelsData[entity.zone] || hotelsData.default || []).slice(0, 2);
  const weekendDates = getUpcomingWeekendDates();

  const permalink = isCctv
    ? `/cams/${entity.slug}/`
    : `/venues/${entity.slug}/`;

  return (
    <div className="fixed inset-0 z-[2000] flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity animate-fade-in"
      />

      {/* Drawer Container */}
      <aside aria-label="Live Stream Drawer" className="relative w-full sm:max-w-md lg:max-w-lg h-full bg-surface border-l border-borderDark flex flex-col pointer-events-auto shadow-2xl z-10 overflow-hidden animate-slide-left">
        {/* Header */}
        <div className="h-14 border-b border-borderDark px-4 flex items-center justify-between bg-surfaceLight/50 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isCctv
                  ? 'bg-brandCyan shadow-[0_0_8px_#00E5FF]'
                  : isStreamer
                    ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]'
                    : 'bg-brandPink shadow-[0_0_8px_#FF2A6D]'
              }`}
            />
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                {entity.name}
              </h2>
              <span className="text-[10px] font-mono text-slate-400 truncate">
                {entity.name_th || entity.id || entity.current_route || 'Pattaya City'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isStreamer ? (
              <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                4K Walking Tour
              </span>
            ) : entity.category ? (
              <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-surfaceLight text-brandPink border border-brandPink/30">
                {entity.category.replace('_', ' ')}
              </span>
            ) : isCctv ? (
              <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-brandCyan border border-cyan-500/30">
                Municipal CCTV
              </span>
            ) : null}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface hover:bg-borderDark text-slate-400 hover:text-white transition-colors"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Video Player Stage */}
          <div className="w-full">
            {isCctv ? (
              <HlsPlayer streamUrl={entity.stream_url} title={entity.name} cameraCode={entity.camera_code || entity.id} />
            ) : (
              <YouTubePlayer
                channelId={entity.youtube_channel_id}
                videoId={entity.video_id}
                title={entity.name}
                handle={entity.youtube_handle || '@PattayaOhBar'}
                isLive={isVenue && !!entity.video_id}
                badgeText={isStreamer ? '4K WALKING TOUR' : (isVenue ? 'LIVE STREAM BROADCAST' : undefined)}
              />
            )}
          </div>

          {/* Creator Channel Context Card (for IRL Walking Streamers) */}
          {isStreamer && (
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col gap-2 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-bold font-mono">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>Recorded 4K Street Walk Episodes</span>
                </div>
                <span className="text-[9px] font-mono text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-500/30">
                  VOD Showcase
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                This channel features ultra-high-definition 4K pedestrian walking tours and street guides around Pattaya. When the creator is not actively streaming live, this player showcases their latest 4K episodes and route walks.
              </p>
              <a
                href={entity.youtube_handle ? `https://www.youtube.com/${entity.youtube_handle.startsWith('@') ? entity.youtube_handle : '@' + entity.youtube_handle}` : `https://www.youtube.com/channel/${entity.youtube_channel_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>Visit {entity.name} on YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Municipal Portal Verification Badge (for CCTV) */}
          {isCctv && (
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-brandCyan/30 flex flex-col gap-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-brandCyan" />
                  <span>Pattaya City Hall CCTV Network</span>
                </span>
                <span className="text-[9px] font-mono text-brandCyan bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-500/30">
                  {entity.type || 'Fix'} • {entity.brand || 'AXIS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Pattaya City operates 600+ municipal surveillance cameras for public safety and traffic monitoring. Live WebRTC video is hosted directly on the City Hall streaming portal.
              </p>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-borderDark text-xs font-mono">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-400 text-[11px]">Search Code:</span>
                  <span className="text-brandCyan font-bold text-xs truncate">{entity.camera_code || entity.id}</span>
                </div>
                <button
                  onClick={() => handleCopyCode(entity.camera_code || entity.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-brandCyan/20 hover:bg-brandCyan/30 text-brandCyan border border-brandCyan/40 text-[10px] font-bold transition-all shrink-0"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-brandGreen" />
                      <span className="text-brandGreen">✓ Copied to Clipboard</span>
                    </>
                  ) : (
                    <span>Copy Code</span>
                  )}
                </button>
              </div>
              <a
                href="https://livestream.pattaya.go.th/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-brandCyan hover:bg-cyan-400 text-canvas text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,229,255,0.3)]"
              >
                <span>Launch Official City Hall Stream</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Description & Google Maps Location Link */}
          <div className="p-3 rounded-xl bg-surfaceLight/30 border border-borderDark/60 space-y-2">
            {entity.description && (
              <p className="text-xs text-slate-300 leading-relaxed">
                {entity.description}
              </p>
            )}
            {entity.google_maps_url && (
              <a
                href={entity.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brandCyan hover:underline"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>View Exact Location on Google Maps</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* 1-Click Emoji Telemetry (Strict Single-Vote per video) */}
          <EmojiReactionGroup entitySlug={entity.slug || entity.id} />

          {/* HIGH-REVENUE PROMINENT eSIM CARD */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-surfaceLight to-surfaceLight border border-brandGold/50 flex flex-col gap-2 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-brandGold text-xs font-bold">
                <Wifi className="w-4 h-4 text-brandGold" />
                <span>Instant Thailand 5G Tourist eSIM</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-brandGold bg-brandGold/20 px-2 py-0.5 rounded border border-brandGold/40">
                From $4.50
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Skip airport SIM card counters and high roaming fees. Scan the QR code to connect to Thailand DTAC/AIS 5G the minute your plane lands.
            </p>
            <a
              href={buildAiraloEsimUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-brandGold hover:brightness-110 text-canvas text-xs font-bold transition-all shadow-md"
            >
              <span>Get Thailand eSIM via Airalo ($4.50)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* High-Intent Airport Transfer Card (12Go Private Sedan) */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 to-surfaceLight border border-brandBlue/40 flex flex-col gap-2 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-brandBlue text-xs font-bold">
                <Car className="w-4 h-4" />
                <span>Bangkok Airport ➔ Pattaya Hotel Direct</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-brandGreen bg-brandGreen/10 px-2 py-0.5 rounded border border-brandGreen/30">
                1,200 THB (~$35)
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Private sedan transfer door-to-door from Suvarnabhumi (BKK) or Don Mueang (DMK) directly to your hotel. Fixed rate, zero meter haggling.
            </p>
            <a
              href={build12GoTransferUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-brandBlue hover:bg-blue-600 text-white text-xs font-semibold transition-colors shadow-[0_0_12px_rgba(59,130,246,0.3)]"
            >
              <span>Book Airport Taxi via 12Go</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* B2B VIP Sponsor Box (if sponsored) */}
          {entity.is_sponsored && entity.sponsor_data && (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-brandGold/15 to-surfaceLight border border-brandGold/50 flex flex-col gap-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold font-mono text-brandGold uppercase">
                  <Star className="w-3.5 h-3.5 fill-brandGold" />
                  {entity.sponsor_data.badge || 'VIP Featured Partner'}
                </span>
                <span className="text-[9px] font-mono bg-brandGold/20 text-brandGold px-1.5 py-0.5 rounded border border-brandGold/40">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium">
                {entity.sponsor_data.promo_text}
              </p>
              <div className="flex items-center gap-2 pt-1">
                {entity.sponsor_data.line_id && (
                  <a
                    href={`https://line.me/R/ti/p/~${entity.sponsor_data.line_id.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>LINE</span>
                  </a>
                )}
                {entity.sponsor_data.whatsapp && (
                  <a
                    href={`https://wa.me/${entity.sponsor_data.whatsapp.replace('+', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Contextual Hotel Directory Card (Agoda) */}
          {zoneHotels.length > 0 && (
            <div className="p-3.5 rounded-xl bg-surfaceLight/60 border border-borderDark flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Hotel className="w-3.5 h-3.5 text-brandAmber" />
                  <span>Recommended Hotels Nearby</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {weekendDates.formattedLabel}
                </span>
              </div>

              <div className="space-y-2">
                {zoneHotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    className="p-2.5 rounded-lg bg-surface border border-borderDark/80 flex items-center justify-between gap-3 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-white truncate">
                        {hotel.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span className="text-brandGold font-bold">★ {hotel.rating}</span>
                        <span>•</span>
                        <span>{hotel.distance}</span>
                      </div>
                    </div>
                    <a
                      href={buildAgodaHotelUrl(hotel.agoda_hotel_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brandAmber/15 hover:bg-brandAmber/25 border border-brandAmber/40 text-brandAmber text-xs font-semibold transition-colors"
                    >
                      <span>~${hotel.typical_price_usd}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safe Harbor Telegram Community Banner */}
          <div className="p-3 rounded-xl bg-surfaceLight/40 border border-borderDark flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#229ED9]/20 text-[#229ED9] flex items-center justify-center shrink-0">
                <Send className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-200">Community Discussion</span>
                <span className="text-[10px] text-slate-400 truncate">Official PattayaCams Telegram</span>
              </div>
            </div>
            <a
              href={getTelegramCommunityUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-2.5 py-1 rounded-lg bg-[#229ED9] hover:bg-[#1f8ec4] text-white text-xs font-medium transition-colors"
            >
              Join
            </a>
          </div>

          {/* Static Permalink (Venues & CCTVs only) */}
          {!isStreamer && (
            <div className="pt-2 pb-6 text-center">
              <a
                href={permalink}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-brandCyan transition-colors"
              >
                <span>View Dedicated Camera Landing Page</span>
                <Compass className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
