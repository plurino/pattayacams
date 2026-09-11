'use client';

import React, { useState } from 'react';
import {
  X,
  Car,
  Hotel,
  ExternalLink,
  MessageCircle,
  Send,
  Star,
  Compass,
  Wifi,
  MapPin,
  Youtube,
  Radio,
  Check,
  Maximize2,
  Minimize2,
  Bell,
  AlertCircle
} from 'lucide-react';
import HlsPlayer from './common/HlsPlayer';
import YouTubePlayer from './common/YouTubePlayer';
import KickPlayer from './common/KickPlayer';
import UniversalPlayer from './common/UniversalPlayer';
import EmojiReactionGroup from './common/EmojiReactionGroup';
import hotelsData from '@/public/data/hotels.json';
import { FEATURES } from '@/src/config/features';
import {
  getUpcomingWeekendDates,
  buildAgodaHotelUrl,
  build12GoTransferUrl,
  buildAiraloEsimUrl,
  getTelegramCommunityUrl,
} from '@/src/utils/affiliate';

export default function VideoDrawer({ entity, onClose }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!entity) return null;

  const handleCopyCode = (code) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleLaunchCityPortal = (code) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
    if (typeof window !== 'undefined') {
      window.open('https://livestream.pattaya.go.th/', '_blank', 'noopener,noreferrer');
    }
  };

  const isCctv = entity.type === 'cctv';
  const isLiveCam = entity.type === 'livecam' || entity.category === 'live_cam';
  const isVenue = entity.type === 'venue';
  const isStreamer = entity.type === 'streamer';
  const isVenueOffline = isVenue && (entity.is_live === false);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'recently';
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffMinutes < 60) return `${Math.max(1, diffMinutes)} minute${diffMinutes === 1 ? '' : 's'} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } catch {
      return 'recently';
    }
  };

  const zoneHotels = (hotelsData[entity.zone] || hotelsData.default || []).slice(0, 2);
  const weekendDates = getUpcomingWeekendDates();

  const permalink = isCctv
    ? `/cams/${entity.slug}/`
    : `/venues/${entity.slug}/`;

  // Render video stage or offline standby card
  const renderVideoStage = () => {
    if (isVenueOffline) {
      const isKick = entity.platform === 'kick';
      const kickSlug = (entity.channel_id || entity.slug || entity.handle || '').replace(/^@/, '');
      const channelUrl = isKick
        ? `https://kick.com/${kickSlug}`
        : (entity.youtube_handle
            ? `https://www.youtube.com/${entity.youtube_handle.startsWith('@') ? entity.youtube_handle : '@' + entity.youtube_handle}`
            : `https://www.youtube.com/channel/${entity.youtube_channel_id}`);

      return (
        <div className="w-full aspect-video bg-surfaceLight/70 border border-borderDark rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 shadow-lg">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shadow-inner">
            <Radio className="w-6 h-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Currently Offline</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {entity.last_live_at
                ? `Last broadcast ${formatRelativeTime(entity.last_live_at)}`
                : 'Standby • Check Channel for Streams'}
            </p>
          </div>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
              isKick
                ? 'bg-[#53FC18] hover:bg-[#46d614] text-black'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {isKick ? <Radio className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            <span>{isKick ? 'Open Kick Channel' : 'Open YouTube Channel'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      );
    }

    if (isCctv) {
      return (
        <HlsPlayer streamUrl={entity.stream_url} title={entity.name} cameraCode={entity.camera_code || entity.id} />
      );
    }

    if (entity.source?.type === 'snapshot' || entity.snapshot_url) {
      return (
        <UniversalPlayer
          source={{
            type: 'snapshot',
            url: entity.snapshot_url || entity.source?.url,
            refreshIntervalMs: entity.refreshIntervalMs || 5000,
          }}
          title={entity.name}
          autoMount={true}
        />
      );
    }

    if (entity.source?.type === 'windy' || entity.webcam_id) {
      return (
        <UniversalPlayer
          source={{
            type: 'windy',
            webcam_id: entity.webcam_id || entity.source?.webcam_id,
          }}
          title={entity.name}
          autoMount={true}
        />
      );
    }

    if (entity.platform === 'twitch' || entity.source?.type === 'twitch') {
      return (
        <UniversalPlayer
          source={{
            type: 'twitch',
            channel: entity.twitch_channel || entity.channel_id || entity.slug,
          }}
          title={entity.name}
          isLive={entity.is_live ?? true}
          autoMount={true}
        />
      );
    }

    if (entity.platform === 'kick' || entity.source?.type === 'kick') {
      return (
        <KickPlayer
          channelSlug={entity.channel_id || entity.slug || entity.handle}
          title={entity.name}
          isLive={entity.is_live ?? true}
          badgeText="KICK LIVE STREAM"
        />
      );
    }

    return (
      <YouTubePlayer
        channelId={entity.youtube_channel_id}
        videoId={entity.video_id}
        title={entity.name}
        handle={entity.youtube_handle || entity.handle || '@PattayaOhBar'}
        type={entity.type}
        isLive={entity.is_live ?? (isVenue || isLiveCam)}
        badgeText={isLiveCam ? '24/7 LIVE WEBCAM' : (isStreamer ? '4K WALKING TOUR' : (isVenue ? 'LIVE STREAM BROADCAST' : undefined))}
      />
    );
  };

  // Render auxiliary cards (Telemetries, Google Maps, Affiliate & Hotels)
  const renderAuxiliaryCards = () => (
    <>
      {/* Creator Context Card (for Streamers) */}
      {isStreamer && (
        <div className={`p-3 rounded-xl border flex flex-col gap-2 shadow-md ${
          entity.platform === 'kick'
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : 'bg-indigo-950/30 border-indigo-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 text-xs font-bold font-mono ${
              entity.platform === 'kick' ? 'text-emerald-300' : 'text-indigo-300'
            }`}>
              {entity.platform === 'kick' ? (
                <Radio className="w-4 h-4 text-emerald-400" />
              ) : (
                <Youtube className="w-4 h-4 text-red-500" />
              )}
              <span>{entity.platform === 'kick' ? 'Kick Live Broadcast Feed' : 'Recorded 4K Street Walk Episodes'}</span>
            </div>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
              entity.platform === 'kick'
                ? 'text-emerald-300 bg-emerald-900/40 border-emerald-500/30'
                : 'text-indigo-300 bg-indigo-900/40 border-indigo-500/30'
            }`}>
              {entity.platform === 'kick' ? 'Kick Channel' : 'VOD Showcase'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {entity.platform === 'kick'
              ? 'This creator broadcasts real-time mobile IRL street walks and live community exploration on Kick. Watch live interactions, crowd walks, and nighttime venues directly in high definition.'
              : 'This channel features ultra-high-definition 4K pedestrian walking tours and street guides around Pattaya. When the creator is not actively streaming live, this player showcases their latest 4K episodes and route walks.'}
          </p>
          <a
            href={
              entity.platform === 'kick'
                ? `https://kick.com/${(entity.channel_id || entity.slug || entity.handle || '').replace(/^@/, '')}`
                : (entity.youtube_handle
                    ? `https://www.youtube.com/${entity.youtube_handle.startsWith('@') ? entity.youtube_handle : '@' + entity.youtube_handle}`
                    : `https://www.youtube.com/channel/${entity.youtube_channel_id}`)
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors shadow-sm ${
              entity.platform === 'kick'
                ? 'bg-[#53FC18] hover:bg-[#46d614] text-black font-bold'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {entity.platform === 'kick' ? <Radio className="w-3.5 h-3.5" /> : <Youtube className="w-3.5 h-3.5" />}
            <span>Visit {entity.name} on {entity.platform === 'kick' ? 'Kick' : 'YouTube'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* 24/7 Live Webcam Context Card */}
      {isLiveCam && (
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col gap-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>24/7 Pattaya Street & Beach Webcam</span>
            </span>
            <span className="text-[9px] font-mono text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/30">
              Live Feed • YouTube
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Continuous real-time exterior live broadcast of Pattaya street, beach, and pedestrian traffic. High-definition feed hosted directly on YouTube by {entity.youtube_handle || '@PattayaCams'}.
          </p>
          {entity.youtube_handle && (
            <a
              href={`https://www.youtube.com/${entity.youtube_handle.startsWith('@') ? entity.youtube_handle : '@' + entity.youtube_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>Visit {entity.youtube_handle} on YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Municipal Portal Verification Badge (for CCTV) */}
      {isCctv && (
        <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-brandCyan/30 flex flex-col gap-3 shadow-md">
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

          {/* 1 Single Prominent Command Button */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-black/50 border border-borderDark text-xs font-mono">
              <span className="text-slate-400 text-[11px]">Camera Code:</span>
              <span className="text-brandCyan font-bold text-xs">{entity.camera_code || entity.id}</span>
              <button
                onClick={() => handleCopyCode(entity.camera_code || entity.id)}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-surfaceLight transition-colors"
                title="Copy code only"
              >
                {copiedCode ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            <button
              onClick={() => handleLaunchCityPortal(entity.camera_code || entity.id)}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-canvas font-extrabold text-xs transition-all shadow-[0_0_16px_rgba(0,229,255,0.4)] hover:shadow-[0_0_24px_rgba(0,229,255,0.6)] active:scale-98 cursor-pointer"
            >
              <Radio className="w-4 h-4 text-canvas animate-pulse shrink-0" />
              <span>
                {copiedCode
                  ? '✓ Code Copied! Opening City Hall Stream...'
                  : 'Launch Official City Hall Stream'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </button>
            <span className="text-[10px] text-center text-slate-400 font-mono">
              Auto-copies code <strong>{entity.camera_code || entity.id}</strong> to clipboard on click
            </span>
          </div>
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
            className="inline-flex items-center gap-1.5 text-xs text-brandCyan hover:text-cyan-300 font-mono transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>View Exact Location on Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* High-Intent 12Go Airport Transfer Card (Conditional on FEATURES.SHOW_AFFILIATE_ADS) */}
      {FEATURES.SHOW_AFFILIATE_ADS && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 to-surface border border-brandBlue/30 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brandBlue/20 text-brandBlue flex items-center justify-center shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Bangkok Airport ➔ Pattaya</span>
                <span className="text-[10px] font-mono text-brandGreen font-bold bg-brandGreen/10 px-1 rounded">
                  1,200 THB
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Private Door-to-Door Taxi via 12Go
              </span>
            </div>
          </div>
          <a
            href={build12GoTransferUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-brandBlue hover:bg-blue-600 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
          >
            <span>Book Taxi</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Curated Nearby Hotels (Conditional on FEATURES.SHOW_AFFILIATE_ADS) */}
      {FEATURES.SHOW_AFFILIATE_ADS && zoneHotels.length > 0 && (
        <div className="p-3 rounded-xl bg-surfaceLight/30 border border-borderDark/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Hotel className="w-3.5 h-3.5 text-brandAmber" />
              <span className="text-xs font-bold text-slate-200">
                Hotels Near {entity.zone ? entity.zone.replace('_', ' ').toUpperCase() : 'PATTAYA'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {weekendDates.formattedLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {zoneHotels.map((hotel) => (
              <div
                key={hotel.id}
                className="p-2 rounded-lg bg-surface border border-borderDark flex items-center justify-between gap-2 hover:border-slate-500 transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate">
                    {hotel.name}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="text-brandGold font-bold">★ {hotel.rating}</span>
                    <span>•</span>
                    <span>{hotel.distance}</span>
                  </div>
                </div>
                <a
                  href={buildAgodaHotelUrl(hotel.agoda_hotel_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded bg-brandAmber/15 hover:bg-brandAmber/25 border border-brandAmber/40 text-brandAmber text-xs font-semibold transition-colors"
                >
                  <span>~${hotel.typical_price_usd}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={`fixed inset-0 z-[2000] flex ${isExpanded ? 'items-center justify-center' : 'justify-end'} pointer-events-none`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto transition-opacity animate-fade-in"
      />

      {/* Drawer / Theater Command View */}
      <aside
        aria-label="Live Stream Command Console"
        className={`relative bg-surface border-borderDark flex flex-col pointer-events-auto shadow-2xl z-10 overflow-hidden transition-all duration-300 ${
          isExpanded
            ? 'w-full h-full md:m-4 md:rounded-2xl border bg-surface/98 backdrop-blur-xl animate-fade-in'
            : 'w-full sm:max-w-md lg:max-w-lg h-full border-l animate-slide-left'
        }`}
      >
        {/* Header */}
        <div className="h-14 border-b border-borderDark px-4 sm:px-6 flex items-center justify-between bg-surfaceLight/50 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isCctv
                  ? 'bg-brandCyan shadow-[0_0_8px_#00E5FF]'
                  : isLiveCam
                    ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                    : isStreamer
                      ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]'
                      : isVenueOffline
                        ? 'bg-slate-400'
                        : 'bg-brandPink shadow-[0_0_8px_#FF2A6D]'
              }`}
            />
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {entity.name}
              </h2>
              <span className="text-[10px] font-mono text-slate-400 truncate">
                {entity.name_th || entity.id || entity.current_route || 'Pattaya City'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLiveCam ? (
              <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                24/7 Live Cam
              </span>
            ) : isStreamer ? (
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

            {/* Desktop Expand / Theater Mode Toggle */}
            {FEATURES.ENABLE_THEATER_MODE && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden md:flex p-1.5 rounded-lg bg-surface hover:bg-borderDark text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isExpanded ? 'Exit Theater Mode' : 'Expand to Fullscreen Theater Mode'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface hover:bg-borderDark text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isExpanded ? (
            /* 2-Column Desktop Theater Command Layout */
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-4">
                <div className="w-full">
                  {renderVideoStage()}
                </div>
                {!isCctv && <EmojiReactionGroup entitySlug={entity.slug} />}
                <div className="p-4 rounded-xl bg-surfaceLight/30 border border-borderDark space-y-2">
                  <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
                    Location & Area Overview
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {entity.description || 'Live entertainment and scenic webcam coverage in Pattaya, Thailand.'}
                  </p>
                  {entity.google_maps_url && (
                    <a
                      href={entity.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-brandCyan hover:text-cyan-300 font-mono transition-colors pt-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View Location on Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4">
                {renderAuxiliaryCards()}
              </div>
            </div>
          ) : (
            /* Standard Vertical Drawer Stack */
            <div className="space-y-4">
              <div className="w-full">
                {renderVideoStage()}
              </div>
              {!isCctv && <EmojiReactionGroup entitySlug={entity.slug} />}
              {renderAuxiliaryCards()}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
