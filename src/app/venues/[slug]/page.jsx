import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Video, MapPin, ArrowLeft, Car, Hotel, ExternalLink, Star, Compass, MessageCircle, Send, Radio, Bell } from 'lucide-react';
import YouTubePlayer from '@/src/components/common/YouTubePlayer';
import EmojiReactionGroup from '@/src/components/common/EmojiReactionGroup';
import Navbar from '@/src/components/Navbar';
import venuesData from '@/public/data/venues.json';
import hotelsData from '@/public/data/hotels.json';
import streamStatus from '@/public/data/stream_status.json';
import {
  getUpcomingWeekendDates,
  buildAgodaHotelUrl,
  build12GoTransferUrl,
  getTelegramCommunityUrl,
} from '@/src/utils/affiliate';
import { FEATURES } from '@/src/config/features';

function formatRelativeTime(timestamp) {
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
}

export async function generateStaticParams() {
  return venuesData.map((venue) => ({
    slug: venue.slug,
  }));
}

export async function generateMetadata({ params }) {
  const venue = venuesData.find((v) => v.slug === params.slug);
  if (!venue) {
    return {
      title: 'Venue Not Found | PattayaCams.com',
    };
  }

  const categoryTitle = venue.category ? venue.category.toUpperCase().replace('_', ' ') : 'ENTERTAINMENT';

  return {
    title: `${venue.name} Live Stream & Webcam | PattayaCams.com`,
    description: `Watch the official live webcam feed from ${venue.name} in Pattaya, Thailand. Real-time crowd, atmosphere, and neighborhood travel guide. ${venue.description}`,
    openGraph: {
      title: `${venue.name} Live Stream & Webcam | PattayaCams.com`,
      description: `Live street webcam and entertainment guide for ${venue.name}, Pattaya.`,
      url: `https://pattayacams.com/venues/${venue.slug}/`,
      type: 'video.other',
    },
  };
}

export default function VenuePage({ params }) {
  const venue = venuesData.find((v) => v.slug === params.slug);
  if (!venue) {
    notFound();
  }

  const statusInfo = streamStatus?.entities?.[`venue-${venue.slug}`];
  const isLive = statusInfo ? statusInfo.is_live === true : false;
  const videoId = statusInfo?.video_id || venue.video_id;
  const lastLiveAt = statusInfo?.last_live_at || null;

  const channelUrl = venue.youtube_handle
    ? `https://www.youtube.com/${venue.youtube_handle.startsWith('@') ? venue.youtube_handle : '@' + venue.youtube_handle}`
    : `https://www.youtube.com/channel/${venue.youtube_channel_id}`;

  const zoneHotels = (hotelsData[venue.zone] || hotelsData.default || []).slice(0, 2);
  const weekendDates = getUpcomingWeekendDates();
  const categoryLabel = venue.category ? venue.category.toUpperCase().replace('_', ' ') : 'VENUE';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BarOrPub',
        '@id': `https://pattayacams.com/venues/${venue.slug}/#business`,
        name: venue.name,
        description: venue.description,
        url: `https://pattayacams.com/venues/${venue.slug}/`,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: venue.lat,
          longitude: venue.lng,
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Pattaya',
          addressRegion: 'Chon Buri',
          addressCountry: 'TH',
        },
      },
      {
        '@type': 'VideoObject',
        name: `${venue.name} Live Webcam Feed`,
        description: `Live video stream from ${venue.name}, Pattaya.`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId || 'default'}/hqdefault.jpg`,
        uploadDate: lastLiveAt || '2024-01-01T00:00:00Z',
        embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : channelUrl,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://pattayacams.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Creators & Venues',
            item: 'https://pattayacams.com/creators/',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: venue.name,
            item: `https://pattayacams.com/venues/${venue.slug}/`,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen w-full bg-canvas text-slate-100 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Universal Site-Wide Navbar */}
      <Navbar viewMode="creators" />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link href="/creators" className="hover:text-brandPink transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Creators & Venues Directory</span>
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{venue.name}</span>
        </div>

        {/* Venue Title & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-borderDark">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-brandPink/15 text-brandPink border border-brandPink/30 uppercase">
                {categoryLabel}
              </span>
              {isLive ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-red-950/60 text-red-400 border border-red-500/50 uppercase shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Live Stream
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800/80 text-slate-400 border border-slate-700 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  Currently Offline
                </span>
              )}
              {venue.is_sponsored && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-brandGold/20 text-brandGold border border-brandGold/40 uppercase">
                  <Star className="w-3 h-3 fill-brandGold" />
                  VIP Partner
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {venue.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
              <MapPin className="w-3.5 h-3.5 text-brandCyan" />
              <span>Zone: {venue.zone}</span>
              <span>•</span>
              <span>Coordinates: {venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}</span>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brandCyan hover:bg-cyan-400 text-canvas font-bold text-xs transition-all shadow-[0_0_16px_rgba(0,229,255,0.3)] shrink-0"
          >
            <Compass className="w-4 h-4" />
            <span>View on Radar Map</span>
          </Link>
        </div>

        {/* Live Stream Player OR Offline Standby Card */}
        <div className="w-full">
          {isLive && videoId ? (
            <YouTubePlayer
              channelId={venue.youtube_channel_id}
              videoId={videoId}
              title={`${venue.name} Live Stream`}
              handle={venue.youtube_handle}
              type="venue"
              isLive={true}
            />
          ) : (
            <div className="w-full aspect-video bg-surfaceLight/70 border border-borderDark rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-3 sm:gap-4 shadow-lg">
              <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shadow-inner">
                <Radio className="w-7 h-7 text-slate-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-sm font-mono font-bold text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Currently Offline</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {lastLiveAt
                    ? `Last broadcast ${formatRelativeTime(lastLiveAt)}`
                    : 'Standby • Check Channel for Streams'}
                </p>
              </div>
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md bg-red-600 hover:bg-red-500 text-white"
              >
                <Bell className="w-4 h-4" />
                <span>Open YouTube Channel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="p-4 rounded-xl bg-surface border border-borderDark space-y-2">
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider text-slate-400">
            About This Venue & Location
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {venue.description}
          </p>
        </div>

        {/* Sponsor Banner (if applicable) */}
        {venue.is_sponsored && venue.sponsor_data && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-brandGold/20 to-surface border border-brandGold/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-brandGold font-bold text-xs uppercase font-mono">
                <Star className="w-4 h-4 fill-brandGold" />
                <span>Special Promotion from {venue.name}</span>
              </div>
              <p className="text-sm text-slate-200">
                {venue.sponsor_data.promo_text}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {venue.sponsor_data.line_id && (
                <a
                  href={`https://line.me/R/ti/p/~${venue.sponsor_data.line_id.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>LINE</span>
                </a>
              )}
              {venue.sponsor_data.whatsapp && (
                <a
                  href={`https://wa.me/${venue.sponsor_data.whatsapp.replace('+', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* 1-Click Emoji Telemetry */}
        <EmojiReactionGroup entitySlug={venue.slug} />

        {/* High-Intent 12Go Airport Transfer Card (Conditional on FEATURES.SHOW_AFFILIATE_ADS) */}
        {FEATURES.SHOW_AFFILIATE_ADS && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/50 to-surface border border-brandBlue/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brandBlue/20 text-brandBlue flex items-center justify-center shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Bangkok Airport ➔ Pattaya Direct</span>
                  <span className="text-xs font-mono font-bold text-brandGreen bg-brandGreen/10 px-2 py-0.5 rounded border border-brandGreen/30">
                    1,200 THB (~$35)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Door-to-door private sedan transfer from Suvarnabhumi (BKK) or Don Mueang (DMK).
                </p>
              </div>
            </div>
            <a
              href={build12GoTransferUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brandBlue hover:bg-blue-600 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <span>Book Taxi via 12Go</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Curated Nearby Hotels (Conditional on FEATURES.SHOW_AFFILIATE_ADS) */}
        {FEATURES.SHOW_AFFILIATE_ADS && zoneHotels.length > 0 && (
          <div className="p-4 rounded-xl bg-surface border border-borderDark space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hotel className="w-4 h-4 text-brandAmber" />
                <h2 className="text-sm font-bold text-white">
                  Recommended Hotels Near {venue.name}
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Weekend: {weekendDates.formattedLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {zoneHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="p-3 rounded-lg bg-surfaceLight/50 border border-borderDark flex items-center justify-between gap-3 hover:border-slate-500 transition-colors"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-white truncate">
                      {hotel.name}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                      <span className="text-brandGold font-bold">★ {hotel.rating}</span>
                      <span>•</span>
                      <span>{hotel.distance}</span>
                    </div>
                  </div>
                  <a
                    href={buildAgodaHotelUrl(hotel.agoda_hotel_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brandAmber/15 hover:bg-brandAmber/25 border border-brandAmber/40 text-brandAmber text-xs font-semibold transition-colors"
                  >
                    <span>~${hotel.typical_price_usd}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Return to Map CTA */}
        <div className="pt-4 pb-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brandCyan to-brandBlue text-canvas font-bold text-sm shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:brightness-110 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>🗺️ View on Full Interactive Radar Map</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
