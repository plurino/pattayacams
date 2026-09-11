import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Video,
  MapPin,
  ArrowLeft,
  ExternalLink,
  Radio,
  Youtube,
  Play,
  Clock,
  Car,
  Wifi,
  Compass,
  Map as MapIcon,
  Tag,
  ShieldCheck,
  Grid,
  Film
} from 'lucide-react';
import YouTubePlayer from '@/src/components/common/YouTubePlayer';
import KickPlayer from '@/src/components/common/KickPlayer';
import creatorsData from '@/public/data/creators.json';
import streamStatus from '@/public/data/stream_status.json';
import vodData from '@/public/data/creator_videos.json';
import { FEATURES } from '@/src/config/features';
import { build12GoTransferUrl, buildAiraloEsimUrl } from '@/src/utils/affiliate';

const ZONE_LABELS = {
  buakhao: 'Soi Buakhao & Central Pattaya',
  walking_street: 'Walking Street & Bali Hai Area',
  beach_road: 'Beach Road & Central Promenade',
  jomtien: 'Jomtien Beach & Thappraya',
  naklua: 'Naklua & Wongamat Bay',
  pratumnak: 'Pratumnak Hill & Cosy Beach',
  expat_guide: 'Pattaya Metropolitan & Expat Life'
};

export async function generateStaticParams() {
  return creatorsData.map((creator) => ({
    slug: creator.slug,
  }));
}

export async function generateMetadata({ params }) {
  const creator = creatorsData.find((c) => c.slug === params.slug);
  if (!creator) {
    return {
      title: 'Creator Not Found | PattayaCams.com',
    };
  }

  const cleanBioSnippet = creator.bio_seo
    ? creator.bio_seo.slice(0, 155).trim() + '...'
    : `Explore latest videos, live streams, and guide dossier for ${creator.name} in Pattaya, Thailand.`;

  return {
    title: `${creator.name} | Pattaya Creator Guide & Latest Videos`,
    description: `${cleanBioSnippet} Watch live broadcasts, 4K street walks, and neighborhood tours across Pattaya.`,
    openGraph: {
      title: `${creator.name} | Pattaya Creator Guide & Latest Videos`,
      description: cleanBioSnippet,
      url: `https://pattayacams.com/creators/${creator.slug}/`,
      images: [
        {
          url: creator.avatar_url,
          width: 400,
          height: 400,
          alt: creator.name,
        }
      ],
      type: 'profile',
    },
  };
}

function formatRelativeTime(isoString) {
  if (!isoString) return 'Recently';
  const pubDate = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - pubDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

export default function CreatorProfilePage({ params }) {
  const creator = creatorsData.find((c) => c.slug === params.slug);
  if (!creator) {
    notFound();
  }

  const isKick = creator.platform === 'kick';
  const entityStatus = streamStatus?.entities?.[`creator-${creator.slug}`] || {};
  const isLive = entityStatus.is_live === true;

  // Recent videos for this creator
  const allVideos = vodData?.videos || [];
  const creatorVideos = allVideos.filter(
    (v) => v.channel_slug === creator.slug || v.channel_name.toLowerCase() === creator.name.toLowerCase()
  );

  const latestVideo = creatorVideos[0] || null;

  const channelUrl = isKick
    ? `https://kick.com/${(creator.channel_id || creator.slug || creator.handle).replace(/^@/, '')}`
    : (creator.handle
        ? `https://www.youtube.com/${creator.handle.startsWith('@') ? creator.handle : '@' + creator.handle}`
        : `https://www.youtube.com/channel/${creator.channel_id}`);

  return (
    <div className="min-h-screen w-full bg-canvas text-slate-100 flex flex-col overflow-y-auto">
      {/* Top Header */}
      <header className="h-14 border-b border-borderDark bg-surface/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-5 sticky top-0 z-50 shadow-md">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brandPink to-purple-600 flex items-center justify-center shadow-[0_0_14px_rgba(255,42,109,0.5)] group-hover:scale-105 transition-transform duration-200">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-base tracking-tight text-white group-hover:text-pink-300 transition-colors">
            Pattaya<span className="text-brandPink">Cams</span>
          </span>
        </Link>

        {/* Unified Navigation Switcher */}
        <nav aria-label="Site Navigation" className="flex items-center bg-canvas/90 p-0.5 sm:p-1 rounded-xl border border-borderDark/90 shadow-inner">
          <Link
            href="/?view=map"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-surfaceLight/50 transition-all"
            title="Interactive Live Radar Map"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Radar</span>
          </Link>
          <Link
            href="/?view=grid"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-surfaceLight/50 transition-all"
            title="Multi-Cam Command Grid"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Multi-Cam</span>
          </Link>
          <Link
            href="/?view=vids"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold text-brandPink hover:text-white hover:bg-brandPink/10 transition-all"
            title="PattayaVids: Daily 4K VOD Hub"
          >
            <Film className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PattayaVids</span>
            <span className="sm:hidden">Vids</span>
          </Link>
          <Link
            href="/creators"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-surfaceLight/50 transition-all"
            title="Back to Creators Directory"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Directory</span>
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-8">
        {/* 1. Hero Dossier Banner */}
        <section className="bg-surface border border-borderDark rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar with Live Pulse */}
            <div className="relative shrink-0">
              <img
                src={creator.avatar_url}
                alt={creator.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-borderDark shadow-lg"
              />
              {isLive ? (
                <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold tracking-wider animate-pulse shadow-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  LIVE
                </span>
              ) : (
                <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-surfaceLight border border-borderDark text-slate-400 text-[9px] font-mono">
                  Offline
                </span>
              )}
            </div>

            {/* Creator Title & Meta */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                  {creator.name}
                </h1>
                {/* Platform Pill */}
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                  isKick
                    ? 'bg-emerald-950/50 text-[#53FC18] border border-emerald-500/40'
                    : 'bg-red-950/50 text-red-400 border border-red-500/40'
                }`}>
                  {isKick ? <Radio className="w-3 h-3" /> : <Youtube className="w-3 h-3" />}
                  <span>{isKick ? 'Kick Creator' : 'YouTube Channel'}</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm font-mono text-slate-400">
                {creator.handle}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded-md bg-surfaceLight border border-borderDark text-brandCyan font-medium flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-brandCyan" />
                  <span>{ZONE_LABELS[creator.primary_zone] || creator.primary_zone}</span>
                </span>
                {creator.content_tags?.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-canvas border border-borderDark text-slate-300 text-[11px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-row md:flex-col items-center gap-2 w-full md:w-auto shrink-0">
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 md:w-48 py-2.5 px-4 rounded-xl text-xs font-mono font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                isKick
                  ? 'bg-[#53FC18] hover:bg-[#46d614] text-black font-bold'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {isKick ? <Radio className="w-4 h-4" /> : <Youtube className="w-4 h-4" />}
              <span>Visit {isKick ? 'Kick' : 'YouTube'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <Link
              href="/"
              className="flex-1 md:w-48 py-2.5 px-4 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-xs font-mono font-bold text-slate-200 border border-borderDark transition-all flex items-center justify-center gap-1.5"
            >
              <MapIcon className="w-3.5 h-3.5 text-brandCyan" />
              <span>View On Map</span>
            </Link>
          </div>
        </section>

        {/* 2. Media Player Stage */}
        <section className="bg-surface border border-borderDark rounded-2xl p-4 sm:p-6 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-indigo-400'}`} />
              <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                {isLive ? '🔴 Live Stream Broadcast' : (latestVideo ? '🎬 Latest Upload / Featured Video' : 'Featured Broadcast')}
              </h2>
            </div>
            {latestVideo && !isLive && (
              <span className="text-[11px] font-mono text-slate-400">
                Uploaded {formatRelativeTime(latestVideo.published_at)}
              </span>
            )}
          </div>

          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark shadow-2xl">
            {isKick ? (
              <KickPlayer
                channelSlug={creator.channel_id || creator.slug || creator.handle}
                title={creator.name}
                isLive={isLive}
              />
            ) : (
              <YouTubePlayer
                channelId={creator.channel_id}
                videoId={isLive ? entityStatus.video_id : (latestVideo?.id || null)}
                title={creator.name}
                handle={creator.handle}
                isLive={isLive}
                type="streamer"
                badgeText={isLive ? 'LIVE BROADCAST' : '4K STREET EPISODE'}
              />
            )}
          </div>
        </section>

        {/* 3. Comprehensive AI SEO Bio */}
        <section className="bg-surface border border-borderDark rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-md">
          <div className="flex items-center gap-2 border-b border-borderDark pb-3">
            <ShieldCheck className="w-4 h-4 text-brandCyan" />
            <h2 className="text-base font-bold text-white tracking-tight">
              About {creator.name} & Pattaya Travel Focus
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
            {creator.bio_seo}
          </p>
        </section>

        {/* 4. Recent Videos Grid */}
        {creatorVideos.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-brandPink" />
                <h2 className="text-base font-bold text-white">
                  Recent Uploads ({creatorVideos.length})
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Past 7 Days
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {creatorVideos.map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-surface border border-borderDark hover:border-brandPink/50 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-brandPink/90 text-white flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-brandPink" />
                      <span>{formatRelativeTime(video.published_at)}</span>
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col gap-2">
                    <h3 className="text-xs font-semibold text-slate-200 group-hover:text-brandPink transition-colors line-clamp-2 leading-relaxed">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-borderDark/60">
                      <span>Watch on YouTube</span>
                      <ExternalLink className="w-3 h-3 text-brandPink" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 5. Contextual Travel Cards (Governed by FEATURES.SHOW_AFFILIATE_ADS) */}
        {FEATURES.SHOW_AFFILIATE_ADS && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 12Go Airport Taxi Card */}
            <a
              href={build12GoTransferUrl('BKK')}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-surface border border-borderDark hover:border-brandGreen/50 transition-all group flex items-start gap-3.5 shadow-md"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-brandGreen/40 flex items-center justify-center text-brandGreen shrink-0 group-hover:scale-105 transition-transform">
                <Car className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-brandGreen transition-colors">
                    Bangkok Airport to Pattaya Taxi
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-brandGreen" />
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Book guaranteed private car transfers from Suvarnabhumi (BKK) or Don Mueang (DMK) directly to your Pattaya hotel.
                </p>
                <span className="text-[10px] font-mono text-brandGreen font-semibold mt-1">
                  From 1,200 THB • Instant Confirmation ➔
                </span>
              </div>
            </a>

            {/* Airalo 5G eSIM Card */}
            <a
              href={buildAiraloEsimUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-surface border border-borderDark hover:border-brandGold/50 transition-all group flex items-start gap-3.5 shadow-md"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-950/40 border border-brandGold/40 flex items-center justify-center text-brandGold shrink-0 group-hover:scale-105 transition-transform">
                <Wifi className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-brandGold transition-colors">
                    Thailand 5G Tourist eSIM
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-brandGold" />
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Download high-speed 5G mobile data directly to your phone before landing. No physical SIM swap needed.
                </p>
                <span className="text-[10px] font-mono text-brandGold font-semibold mt-1">
                  Starting at $4.50 • Unlimited Data Plans ➔
                </span>
              </div>
            </a>
          </section>
        )}

        {/* 6. Prominent Backlink CTA to Live Radar */}
        <section className="bg-gradient-to-r from-brandCyan/20 via-purple-900/20 to-brandPink/20 border border-brandCyan/40 rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center gap-4 shadow-xl">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Explore Pattaya Live in Real Time
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Switch to the interactive Pattaya Live Radar to view active venue webcams, municipal surveillance nodes, and the colorful Songthaew transit loops.
          </p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-brandCyan hover:bg-cyan-400 text-canvas text-sm font-mono font-bold transition-all shadow-[0_0_16px_rgba(0,229,255,0.4)] flex items-center gap-2 active:scale-95"
          >
            <MapIcon className="w-4 h-4" />
            <span>🗺️ View on Live Pattaya Radar</span>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-borderDark bg-surface/60 p-6 text-center text-xs font-mono text-slate-500 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} PattayaCams.com • Independent Tourism & Webcam Directory</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-300 transition-colors">Live Radar</Link>
            <Link href="/?view=vids" className="hover:text-slate-300 transition-colors">PattayaVids</Link>
            <Link href="/creators" className="hover:text-slate-300 transition-colors">Creators Hub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
