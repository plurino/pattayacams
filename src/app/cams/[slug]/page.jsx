import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Video, MapPin, ArrowLeft, Car, Hotel, ExternalLink, Compass } from 'lucide-react';
import HlsPlayer from '@/src/components/common/HlsPlayer';
import YouTubePlayer from '@/src/components/common/YouTubePlayer';
import EmojiReactionGroup from '@/src/components/common/EmojiReactionGroup';
import cctvData from '@/public/data/cctv_cams.json';
import hotelsData from '@/public/data/hotels.json';
import {
  getUpcomingWeekendDates,
  buildAgodaHotelUrl,
  build12GoTransferUrl,
} from '@/src/utils/affiliate';

export async function generateStaticParams() {
  return cctvData.map((cam) => ({
    slug: cam.slug,
  }));
}

export async function generateMetadata({ params }) {
  const cam = cctvData.find((c) => c.slug === params.slug);
  if (!cam) {
    return {
      title: 'Camera Not Found | PattayaCams.com',
    };
  }

  return {
    title: `${cam.name} Live CCTV & Weather Cam | PattayaCams.com`,
    description: `Real-time street traffic, weather, and crowd conditions at ${cam.name} (${cam.name_th}) in Pattaya, Thailand. Official municipal CCTV surveillance feed.`,
    openGraph: {
      title: `${cam.name} Live CCTV | PattayaCams.com`,
      description: `Live street webcam and traffic feed at ${cam.name}, Pattaya.`,
      url: `https://pattayacams.com/cams/${cam.slug}/`,
      type: 'video.other',
    },
  };
}

export default function CamPage({ params }) {
  const cam = cctvData.find((c) => c.slug === params.slug);
  if (!cam) {
    notFound();
  }

  const zoneHotels = (hotelsData[cam.zone] || hotelsData.default || []).slice(0, 2);
  const weekendDates = getUpcomingWeekendDates();

  return (
    <div className="min-h-screen w-full bg-canvas text-slate-100 flex flex-col overflow-y-auto">
      {/* Top Brand Header */}
      <header className="h-14 border-b border-borderDark bg-surface flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brandCyan to-brandBlue flex items-center justify-center shadow-md">
            <Video className="w-4 h-4 text-canvas" />
          </div>
          <span className="font-bold text-base tracking-tight text-white group-hover:text-brandCyan transition-colors">
            Pattaya<span className="text-brandCyan">Cams</span>
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surfaceLight hover:bg-borderDark text-xs font-medium text-slate-300 transition-colors border border-borderDark"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Radar Map</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Camera Title & Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-borderDark">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-brandCyan/15 text-brandCyan border border-brandCyan/30 uppercase">
                {cam.id}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-surfaceLight border border-borderDark">
                Municipal CCTV
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {cam.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
              <span className="text-slate-300">{cam.name_th}</span>
              <span>•</span>
              <MapPin className="w-3.5 h-3.5 text-brandCyan" />
              <span>Zone: {cam.zone}</span>
              <span>•</span>
              <span>{cam.lat.toFixed(4)}, {cam.lng.toFixed(4)}</span>
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

        {/* Video Player Stage */}
        <div className="w-full">
          <HlsPlayer
            streamUrl={cam.stream_url}
            title={`${cam.name} Live CCTV`}
          />
        </div>

        {/* Camera Description */}
        <div className="p-4 rounded-xl bg-surface border border-borderDark space-y-2">
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider text-slate-400">
            Camera Location & Surroundings
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {cam.description}
          </p>
        </div>

        {/* 1-Click Emoji Telemetry */}
        <EmojiReactionGroup entitySlug={cam.slug} />

        {/* High-Intent 12Go Airport Transfer Card */}
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
                Pre-book your private airport taxi door-to-door from Suvarnabhumi or Don Mueang.
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

        {/* Curated Nearby Hotels */}
        {zoneHotels.length > 0 && (
          <div className="p-4 rounded-xl bg-surface border border-borderDark space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hotel className="w-4 h-4 text-brandAmber" />
                <h2 className="text-sm font-bold text-white">
                  Hotels in {cam.zone.replace('_', ' ').toUpperCase()}
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
