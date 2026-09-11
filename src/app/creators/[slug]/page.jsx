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
  Tag,
  ShieldCheck,
  Film,
  Sparkles
} from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import CreatorAvatar from '@/src/components/common/CreatorAvatar';
import creatorsData from '@/public/data/creators.json';
import streamStatus from '@/public/data/stream_status.json';
import vodData from '@/public/data/creator_videos.json';

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
    : `Explore latest videos and travel guide for ${creator.name} in Pattaya, Thailand.`;

  return {
    title: `${creator.name} | Pattaya Creator Guide & Latest Videos`,
    description: `${cleanBioSnippet} 4K street walks, nightlife guides, and neighborhood tours across Pattaya.`,
    openGraph: {
      title: `${creator.name} | Pattaya Creator Guide & Latest Videos`,
      description: cleanBioSnippet,
      url: `https://pattayacams.com/creators/${creator.slug}/`,
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `https://pattayacams.com/creators/${creator.slug}/#person`,
        name: creator.name,
        description: creator.bio_seo || `Content creator covering Pattaya, Thailand.`,
        url: `https://pattayacams.com/creators/${creator.slug}/`,
        sameAs: [channelUrl],
        knowsAbout: ['Pattaya', 'Thailand Tourism', 'Nightlife', 'Travel Vlogging'],
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
            name: 'Creators Directory',
            item: 'https://pattayacams.com/creators/',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: creator.name,
            item: `https://pattayacams.com/creators/${creator.slug}/`,
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
      {/* 1. Unified Site Header */}
      <Navbar viewMode="creators" />

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-8 flex-1">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link href="/creators" className="hover:text-brandPink transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Creators Directory</span>
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{creator.name}</span>
        </div>

        {/* 1. Hero Dossier Banner */}
        <section className="bg-surface border border-borderDark rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Real Avatar / Styled Initial Fallback */}
            <div className="relative shrink-0">
              <CreatorAvatar
                src={creator.avatar_url}
                alt={creator.name}
                name={creator.name}
                platform={creator.platform}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-xl"
              />
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

          {/* Action CTAs: Direct Channel Link */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`py-3 px-5 rounded-xl text-xs font-mono font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                isKick
                  ? 'bg-[#53FC18] hover:bg-[#46d614] text-black font-black shadow-[0_0_16px_rgba(83,252,24,0.3)]'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.3)]'
              }`}
            >
              {isKick ? <Radio className="w-4 h-4" /> : <Youtube className="w-4 h-4" />}
              <span>Visit {isKick ? 'Kick Channel' : 'YouTube Channel'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Link
              href="/?view=vids"
              className="py-2.5 px-4 rounded-xl bg-surfaceLight hover:bg-surfaceLight/80 text-xs font-mono font-bold text-slate-300 hover:text-white border border-borderDark transition-all flex items-center justify-center gap-1.5"
            >
              <Film className="w-3.5 h-3.5 text-brandPink" />
              <span>PattayaVids Feed</span>
            </Link>
          </div>
        </section>

        {/* 2. Latest Featured Episode (Clean embed of actual video, NO live stream attempt) */}
        {latestVideo && (
          <section className="bg-surface border border-borderDark rounded-2xl p-4 sm:p-6 flex flex-col gap-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-borderDark pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brandPink" />
                <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  🎬 Latest Upload: {latestVideo.title}
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Uploaded {formatRelativeTime(latestVideo.published_at)}
              </span>
            </div>

            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-borderDark shadow-2xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${latestVideo.id}?autoplay=0&rel=0&playsinline=1`}
                title={latestVideo.title}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </section>
        )}

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
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{video.channel_name}</span>
                      <span className="text-brandPink group-hover:underline">Watch ↗</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-borderDark bg-surface/60 p-6 text-center text-xs font-mono text-slate-500 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PattayaCams.com • Independent Pattaya Tourism & Streaming Directory</p>
          <div className="flex items-center gap-4">
            <Link href="/?view=map" className="hover:text-slate-300 transition-colors">Live Radar</Link>
            <Link href="/?view=vids" className="hover:text-brandPink transition-colors">PattayaVids</Link>
            <Link href="/creators" className="text-brandPink font-semibold">Creator Hub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
