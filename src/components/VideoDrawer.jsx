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
  AlertCircle,
  Share2,
  Camera,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Navigation,
  Clock,
  Bus
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
} from '@/src/utils/affiliate';
import { findNearestCctv } from '@/src/utils/proximity';
import TargetLockReticle from './common/TargetLockReticle';
import { useStreamStatus } from '@/src/hooks/useStreamStatus';

export default function VideoDrawer({ entity, onClose, onSelectEntity, onLiveShuffle }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!entity) return null;

  const handleCopyCode = (code) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyShare = (url) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const handleNativeShare = async (url) => {
    const shareUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}/?target=${entity.type || 'venue'}:${entity.slug || entity.id}` : '');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${entity.name} - PattayaCams.com`,
          text: `Live stream radar and camera view of ${entity.name} in Pattaya, Thailand`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    handleCopyShare(shareUrl);
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

  const streamStatus = useStreamStatus();

  const isCctv = entity.type === 'cctv';
  const isLiveCam = entity.type === 'livecam' || entity.category === 'live_cam';
  const isVenue = entity.type === 'venue';
  const isStreamer = entity.type === 'streamer' || entity.type === 'creator' || entity.category === 'streamer' || entity.slug?.startsWith('streamer-') || entity.slug?.startsWith('creator-') || entity.platform === 'kick' || (!entity.type && !!entity.handle);

  // Real-time live status lookup directly from global status store
  const liveInfo = !isCctv ? (
    streamStatus?.entities?.[`venue-${entity.slug}`] ||
    streamStatus?.entities?.[`livecam-${entity.slug}`] ||
    streamStatus?.entities?.[`creator-${entity.slug}`] ||
    streamStatus?.entities?.[`streamer-${entity.id}`] ||
    streamStatus?.entities?.[entity.slug] ||
    streamStatus?.entities?.[entity.id]
  ) : null;

  const isTrulyLive = liveInfo ? Boolean(liveInfo.is_live && !liveInfo.is_upcoming) : Boolean(entity.is_live);
  const activeVideoId = liveInfo?.video_id || entity.video_id;
  const isVenueOffline = (isVenue || (!isCctv && !isLiveCam && !isStreamer)) && (!isTrulyLive || !activeVideoId);

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
    : (isStreamer ? `/creators/${entity.slug}/` : `/venues/${entity.slug}/`);

  const photos = entity.photos && entity.photos.length > 0 ? entity.photos : null;
  const currentPhoto = photos ? (photos[activePhotoIdx] || photos[0]) : null;

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
        <div className="flex flex-col gap-3 w-full">
          {/* Photo Showcase (if venue has photos) */}
          {photos && currentPhoto ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-borderDark shadow-lg group">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption || entity.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

              {/* Status Badge */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Currently Offline</span>
              </div>

              {/* Photo Navigation Arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length)}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActivePhotoIdx((prev) => (prev + 1) % photos.length)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Caption and Channel Action */}
              <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between gap-2 z-10">
                <span className="text-[11px] text-white drop-shadow truncate">
                  {currentPhoto.caption}
                </span>
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-md ${
                    isKick
                      ? 'bg-[#53FC18] hover:bg-[#46d614] text-black'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  <Bell className="w-3 h-3" />
                  <span>Channel</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          ) : (
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
          )}
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

    // Smartphone Frame Live Streamer Mode for IRL Streamers / Creators
    if (isStreamer) {
      return (
        <div className="w-full flex flex-col items-center">
          {/* Smartphone Frame */}
          <div className="relative w-full rounded-2xl p-1.5 sm:p-2 bg-gradient-to-b from-neutral-800 to-neutral-900 border border-neutral-700 shadow-[0_0_24px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200">
            {/* Phone Top Notch / Dynamic Island Telemetry Bar */}
            <div className="h-5 sm:h-6 bg-black rounded-t-xl px-3 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-slate-400 select-none mb-1">
              <div className="flex items-center gap-1.5 text-red-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>LIVE FEED</span>
              </div>
              {/* Center Camera Punch Hole */}
              <div className="w-12 h-3.5 bg-neutral-900 rounded-full border border-neutral-800 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-950 border border-neutral-700" />
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span>5G 📶</span>
                <span>100% 🔋</span>
              </div>
            </div>

            {/* Live Video Player Stage */}
            <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
              <UniversalPlayer
                source={{
                  type: entity.platform || 'youtube',
                  video_id: entity.video_id,
                  youtube_channel_id: entity.channel_id || entity.youtube_channel_id,
                  channel: entity.kick_channel || entity.handle || entity.slug,
                }}
                title={entity.name}
                isLive={entity.is_live ?? true}
                autoMount={true}
                badgeText="MOBILE IRL STREAM"
              />
            </div>

            {/* Smartphone Bottom Home Bar */}
            <div className="h-3 flex items-center justify-center mt-1">
              <div className="w-16 h-1 rounded-full bg-slate-600/70" />
            </div>
          </div>
        </div>
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
        videoId={activeVideoId}
        title={entity.name}
        handle={entity.youtube_handle || entity.handle || '@PattayaOhBar'}
        type={entity.type}
        isLive={isTrulyLive}
        badgeText={isLiveCam ? '24/7 LIVE WEBCAM' : (isVenue ? 'LIVE STREAM BROADCAST' : undefined)}
      />
    );
  };

  // Google Maps Coordinates & Quick Share logic
  const lat = entity.lat;
  const lng = entity.lng;
  const hasCoordinates = typeof lat === 'number' && typeof lng === 'number';
  const googleMapsUrl = entity.google_maps_url || (hasCoordinates ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null);
  const osmEmbedUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.003}%2C${lat - 0.002}%2C${lng + 0.003}%2C${lat + 0.002}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;

  // Calculate nearest municipal CCTV camera for spatial handoff
  const nearestCctv = !isCctv && hasCoordinates ? findNearestCctv(lat, lng, 3500) : null;

  // Render auxiliary cards
  const renderAuxiliaryCards = () => (
    <>
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
        </div>
      )}

      {/* Description & Transit Tip (Venues & Custom Points) */}
      {(!isCctv && (entity.description || entity.transit_tip || entity.opening_hours)) && (
        <div className="p-3.5 rounded-xl bg-surfaceLight/30 border border-borderDark/60 space-y-2">
          {entity.description && (
            <p className="text-xs text-slate-300 leading-relaxed">
              {entity.description}
            </p>
          )}
          {entity.transit_tip && (
            <div className="flex items-start gap-2 pt-1 text-[11px] text-cyan-300 font-mono">
              <Bus className="w-3.5 h-3.5 text-brandCyan shrink-0 mt-0.5" />
              <span>{entity.transit_tip}</span>
            </div>
          )}
          {entity.opening_hours && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{entity.opening_hours}</span>
            </div>
          )}
        </div>
      )}

      {/* IRL Streamer Context Card (Streamers have no static location) */}
      {isStreamer && (
        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col gap-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-purple-300 font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>IRL Roaming Streamer</span>
            </span>
            <span className="text-[9px] font-mono text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/30">
              Mobile Broadcast • Live in Pattaya
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This creator broadcasts live walks and nightlife events throughout Pattaya. Because they are on the move across nightlife zones, they do not have a static venue location.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <a
              href={`/creators/${entity.slug?.replace(/^creator-|^streamer-/, '') || ''}`}
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md"
            >
              <span>View Creator Dossier & Recent VODs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Embedded Map Preview & Quick Share Location (Only for static venues and stationary cams) */}
      {!isStreamer && hasCoordinates && (
        <div className="p-3 rounded-xl bg-surface border border-borderDark flex flex-col gap-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brandCyan" />
              <span>Exact Location</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>

          {/* Embedded Mini-Map Frame */}
          {osmEmbedUrl && (
            <div className="relative w-full h-36 rounded-lg overflow-hidden border border-borderDark bg-black">
              <iframe
                src={osmEmbedUrl}
                title="Location Map"
                className="w-full h-full border-0 pointer-events-auto"
                loading="lazy"
              />
            </div>
          )}

          {/* Action Buttons: Quick Share & Google Maps */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleNativeShare(googleMapsUrl)}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                copiedShare
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-brandPink to-rose-600 text-white hover:brightness-110'
              }`}
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>✓ Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Quick Share</span>
                </>
              )}
            </button>

            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surfaceLight hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-borderDark transition-colors shadow-sm"
              >
                <Compass className="w-3.5 h-3.5 text-brandCyan" />
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
          </div>

          {/* Tactical Spatial Handoff: Nearest Municipal Street Camera */}
          {nearestCctv && (
            <button
              onClick={() => onSelectEntity && onSelectEntity(nearestCctv.camera)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-brandCyan/40 text-brandCyan text-xs font-mono font-bold transition-all shadow-sm group cursor-pointer"
              title={`Switch focus to municipal CCTV camera ${nearestCctv.camera.camera_code || nearestCctv.camera.id}`}
            >
              <div className="flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-brandCyan group-hover:scale-110 transition-transform" />
                <span className="text-[11px] tracking-wide">NEAREST STREET CAM ({nearestCctv.formattedDistance})</span>
              </div>
              <span className="text-xs text-cyan-300 group-hover:translate-x-1 transition-transform">➔</span>
            </button>
          )}
        </div>
      )}

      {/* Emergency Tourist Hotlines */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-borderDark/80 flex flex-col gap-2 shadow-md">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 font-bold">
          <span className="flex items-center gap-1.5 text-rose-400">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Pattaya Tourist Emergency</span>
          </span>
          <span className="text-[9px] text-slate-500 font-normal">24/7 Free Hotlines</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[10px] font-mono">
          <a
            href="tel:1155"
            className="flex items-center justify-between p-2 rounded-lg bg-surface/80 hover:bg-surfaceLight border border-borderDark text-slate-300 hover:text-white transition-colors"
          >
            <span>Tourist Police</span>
            <span className="text-brandCyan font-bold">1155</span>
          </a>
          <a
            href="tel:1337"
            className="flex items-center justify-between p-2 rounded-lg bg-surface/80 hover:bg-surfaceLight border border-borderDark text-slate-300 hover:text-white transition-colors"
          >
            <span>City Hall Help</span>
            <span className="text-amber-400 font-bold">1337</span>
          </a>
          <a
            href="tel:1719"
            className="flex items-center justify-between p-2 rounded-lg bg-surface/80 hover:bg-surfaceLight border border-borderDark text-slate-300 hover:text-white transition-colors"
          >
            <span>Bkk Hospital ER</span>
            <span className="text-emerald-400 font-bold">1719</span>
          </a>
          <a
            href="tel:038427667"
            className="flex items-center justify-between p-2 rounded-lg bg-surface/80 hover:bg-surfaceLight border border-borderDark text-slate-300 hover:text-white transition-colors"
          >
            <span>TAC Center</span>
            <span className="text-purple-400 font-bold">038-427667</span>
          </a>
        </div>
      </div>
    </>
  );

  return (
    <div
      className={`fixed inset-y-0 right-0 z-[2000] bg-surface/95 backdrop-blur-xl border-l border-borderDark shadow-2xl flex flex-col transition-all duration-300 ease-out ${
        isExpanded ? 'w-full lg:w-[850px]' : 'w-full sm:w-[460px]'
      }`}
    >
      {/* Top Header Bar */}
      <div className="h-14 border-b border-borderDark px-4 sm:px-5 flex items-center justify-between shrink-0 bg-surface/80">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {isTrulyLive ? (
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0 shadow-[0_0_8px_#EF4444]" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
          )}
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
            {entity.name}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onLiveShuffle && (
            <button
              onClick={onLiveShuffle}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brandPink/20 hover:bg-brandPink/30 border border-brandPink/60 text-brandPink hover:text-white text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(255,42,109,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
              title="Hop to next random live stream"
            >
              <span>🎲</span>
              <span className="hidden xs:inline">Shuffle Next</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden sm:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surfaceLight transition-colors"
            title={isExpanded ? 'Collapse Drawer' : 'Expand Drawer'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surfaceLight transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* Tactical HUD Reticle Header */}
        <TargetLockReticle
          name={entity.name}
          code={entity.camera_code || entity.id || entity.slug}
          type={isCctv ? 'MUNICIPAL CCTV' : (isLiveCam ? '24/7 WEBCAM' : (isStreamer ? 'IRL STREAMER' : 'HERO VENUE'))}
          lat={entity.lat}
          lng={entity.lng}
          isLive={Boolean(entity.is_live)}
        />

        {/* 1. Video Player Stage or Standby Card */}
        {renderVideoStage()}

        {/* 2. Emoji Telemetry Reactions (Venues & Live Streamers only - hidden on municipal CCTV) */}
        {!isCctv && <EmojiReactionGroup entitySlug={entity.slug || entity.id} />}

        {/* 3. Auxiliary Location, Maps & Guides */}
        {renderAuxiliaryCards()}
      </div>
    </div>
  );
}
