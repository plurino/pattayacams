'use client';

import React, { useState, useMemo } from 'react';
import { Play, Search, Youtube, Clock, ExternalLink, X, Film, User, Sparkles, ChevronRight, Flame, Filter } from 'lucide-react';
import vodData from '@/public/data/creator_videos.json';

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

// Top curated popular flagship videos for the Trending Tonight strip
const POPULAR_FEATURED_IDS = [
  'P7ze3IrwMWA', // Vespa Life Walking Street Night Walk
  '_Wsv8jptIg4', // Buzzin Pattaya - Pattaya v Village Life
  'XT-U7iKRRxE', // Everything Pattaya - Condo Rentals
];

export default function CreatorVODFeed({ onSelectVideo }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [activeModalVideo, setActiveModalVideo] = useState(null);

  const allVideos = vodData?.videos || [];

  // Extract unique channel list with video counts for the dropdown
  const channelOptions = useMemo(() => {
    const map = new Map();
    allVideos.forEach(v => {
      const current = map.get(v.channel_slug) || { name: v.channel_name, count: 0 };
      current.count += 1;
      map.set(v.channel_slug, current);
    });
    return Array.from(map.entries()).map(([slug, data]) => ({
      slug,
      name: data.name,
      count: data.count,
    })).sort((a, b) => b.count - a.count);
  }, [allVideos]);

  // Featured Trending Strip: 3 popular high-interest videos
  const trendingVideos = useMemo(() => {
    const featured = allVideos.filter(v => POPULAR_FEATURED_IDS.includes(v.id));
    if (featured.length === 3) return featured;
    // Fallback if specific IDs aren't found: pick 3 diverse creators
    return allVideos.slice(0, 3);
  }, [allVideos]);

  const trendingIdSet = useMemo(() => {
    return new Set(trendingVideos.map(v => v.id));
  }, [trendingVideos]);

  // Main video feed: filter by channel and search query, and exclude trending IDs when no search/channel filter is active
  const filteredMainVideos = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const isFiltered = selectedChannel !== 'all' || Boolean(query);

    return allVideos.filter(v => {
      // If browsing standard view without filters, exclude the 3 videos already showcased in the Trending strip!
      if (!isFiltered && trendingIdSet.has(v.id)) {
        return false;
      }
      const matchesChannel = selectedChannel === 'all' || v.channel_slug === selectedChannel;
      const matchesQuery = !query ||
        v.title.toLowerCase().includes(query) ||
        v.channel_name.toLowerCase().includes(query);
      return matchesChannel && matchesQuery;
    });
  }, [allVideos, selectedChannel, searchQuery, trendingIdSet]);

  // Recommendations for modal player "Up Next" rail
  const upNextVideos = useMemo(() => {
    if (!activeModalVideo) return [];
    return allVideos
      .filter(v => v.id !== activeModalVideo.id)
      .slice(0, 4);
  }, [allVideos, activeModalVideo]);

  const handleCardClick = (video) => {
    if (onSelectVideo) {
      onSelectVideo(video);
    }
    setActiveModalVideo(video);
  };

  const isFiltering = selectedChannel !== 'all' || Boolean(searchQuery);

  return (
    <div className="w-full h-full flex flex-col bg-canvas text-white overflow-hidden select-none">
      {/* 1. Integrated Portal Header */}
      <div className="p-3.5 sm:p-4 md:px-6 md:py-4 border-b border-borderDark bg-surface/95 backdrop-blur-md shrink-0 flex flex-col gap-3">
        {/* Title row + Search + Channel Dropdown + Creator Directory Link */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Pattaya<span className="text-brandPink">Vids</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brandPink/20 text-brandPink border border-brandPink/40 font-bold uppercase tracking-wider">
                Daily VOD Radar
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-surfaceLight px-2 py-0.5 rounded-md border border-borderDark hidden sm:inline-block">
                {allVideos.length} Episodes
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 hidden sm:block">
              Curated 4K walking tours, street vlogs, and expat updates updated daily
            </p>
          </div>

          {/* Controls Bar: Channel Filter Dropdown + Search + Creators Link */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Channel Filter Dropdown (Replaces horizontal row of channel buttons) */}
            <div className="relative flex-1 sm:flex-none">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas border border-borderDark hover:border-brandPink/60 transition-colors">
                <Filter className="w-3.5 h-3.5 text-brandPink shrink-0" />
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-mono pr-2"
                >
                  <option value="all" className="bg-surface text-slate-200">
                    All Channels ({allVideos.length})
                  </option>
                  {channelOptions.map((c) => (
                    <option key={c.slug} value={c.slug} className="bg-surface text-slate-200">
                      {c.name} ({c.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-canvas border border-borderDark text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandPink/60 transition-colors font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Link to Creators Directory */}
            <a
              href="/creators"
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-brandPink/20 to-purple-600/20 hover:from-brandPink/30 hover:to-purple-600/30 text-pink-200 border border-brandPink/50 transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 shadow-sm"
              title="Explore 50+ Pattaya Content Creators"
            >
              <User className="w-3.5 h-3.5 text-brandPink" />
              <span>Creators Hub ↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Trending Tonight Spotlight Strip (Only when no search or channel filter is active) */}
        {!isFiltering && trendingVideos.length > 0 && (
          <section className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-brandPink animate-pulse" />
                <h2 className="text-xs md:text-sm font-bold tracking-wide uppercase font-mono text-brandPink">
                  Trending Tonight in Pattaya
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Featured Curations</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trendingVideos.map((video) => (
                <div
                  key={`trending-${video.id}`}
                  onClick={() => handleCardClick(video)}
                  className="group relative bg-gradient-to-br from-surface to-surfaceLight border border-brandPink/40 hover:border-brandPink rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,42,109,0.3)] flex flex-col"
                >
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brandPink to-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brandPink text-white text-[9px] font-mono font-black uppercase tracking-wider shadow">
                      Trending
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-brandPink" />
                      <span>{formatRelativeTime(video.published_at)}</span>
                    </div>
                  </div>

                  <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                    <h3 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-2 leading-snug">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-borderDark/40">
                      <span className="truncate max-w-[170px]">{video.channel_name}</span>
                      <span className="text-brandPink font-bold group-hover:underline flex items-center gap-1 text-[10px]">
                        Watch <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Responsive Video Wall (No duplicates of the trending videos!) */}
        <section className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wide font-mono text-slate-400">
              {filteredMainVideos.length} {isFiltering ? 'MATCHING' : 'LATEST'} EPISODES
            </h2>
          </div>

          {filteredMainVideos.length === 0 ? (
            <div className="w-full h-64 flex flex-col items-center justify-center text-center gap-3 bg-surface/50 rounded-2xl border border-borderDark">
              <Film className="w-10 h-10 text-slate-600" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-300">No Videos Found</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Try adjusting your search query or creator filter.
                </p>
              </div>
              <button
                onClick={() => { setSearchQuery(''); setSelectedChannel('all'); }}
                className="px-3 py-1.5 rounded-lg bg-surfaceLight hover:bg-surfaceLight/80 text-xs font-mono text-slate-300 border border-borderDark"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMainVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleCardClick(video)}
                  className="group relative bg-surface border border-borderDark hover:border-brandPink/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col"
                >
                  {/* 16:9 Thumbnail Container */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-brandPink/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Relative Upload Time Badge */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-brandPink" />
                      <span>{formatRelativeTime(video.published_at)}</span>
                    </div>

                    {/* Top Creator Pill */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white flex items-center gap-1.5">
                      <img
                        src={video.channel_avatar}
                        alt={video.channel_name}
                        className="w-3.5 h-3.5 rounded-full object-cover"
                      />
                      <span className="font-semibold truncate max-w-[140px]">{video.channel_name}</span>
                    </div>
                  </div>

                  {/* Card Content Footer */}
                  <div className="p-3.5 flex flex-col gap-2 flex-1 justify-between">
                    <h3 className="text-xs font-semibold text-slate-100 group-hover:text-pink-300 transition-colors line-clamp-2 leading-relaxed">
                      {video.title}
                    </h3>

                    <div className="flex items-center justify-between pt-2 border-t border-borderDark/60 text-[11px] font-mono text-slate-400">
                      <div className="flex items-center gap-1">
                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                        <span className="truncate max-w-[150px]">{video.channel_name}</span>
                      </div>
                      <span className="text-brandPink hover:underline flex items-center gap-1 text-[10px] font-bold">
                        Watch Video
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 3. Inline Video Modal Player with "Up Next" Retention Rail */}
      {activeModalVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6"
          onClick={() => setActiveModalVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[95vh] bg-surface border border-borderDark rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3 md:p-4 border-b border-borderDark flex items-center justify-between bg-surfaceLight/50 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={activeModalVideo.channel_avatar}
                  alt={activeModalVideo.channel_name}
                  className="w-8 h-8 rounded-full object-cover border border-borderDark shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-xs md:text-sm font-bold text-white truncate">
                    {activeModalVideo.title}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <span className="font-semibold text-slate-300">{activeModalVideo.channel_name}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(activeModalVideo.published_at)}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalVideo(null)}
                className="w-8 h-8 rounded-lg bg-surfaceLight hover:bg-surfaceLight/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Video Player */}
            <div className="relative w-full aspect-video bg-black shrink-0">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeModalVideo.id}?autoplay=1&mute=0&rel=0&playsinline=1`}
                title={activeModalVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Modal Actions Bar */}
            <div className="p-3 bg-surfaceLight/30 border-t border-borderDark flex items-center justify-between text-xs font-mono shrink-0">
              <a
                href={`/creators/${activeModalVideo.channel_slug}`}
                className="flex items-center gap-1.5 text-pink-300 hover:text-pink-200 font-semibold"
              >
                <User className="w-3.5 h-3.5 text-brandPink" />
                <span>View {activeModalVideo.channel_name} Profile</span>
              </a>
              <a
                href={activeModalVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-sm"
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>Watch on YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* "Up Next / More From Pattaya" Retention Strip */}
            {upNextVideos.length > 0 && (
              <div className="p-3 bg-canvas/90 border-t border-borderDark/80 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Up Next in Pattaya
                  </span>
                  <span className="text-[10px] font-mono text-brandPink">Click to watch now</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {upNextVideos.map(nextVid => (
                    <div
                      key={`next-${nextVid.id}`}
                      onClick={() => setActiveModalVideo(nextVid)}
                      className="group cursor-pointer rounded-xl overflow-hidden bg-surface border border-borderDark hover:border-brandPink transition-all"
                    >
                      <div className="relative aspect-video bg-slate-900 overflow-hidden">
                        <img
                          src={nextVid.thumbnail_url}
                          alt={nextVid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white text-white opacity-80 group-hover:opacity-100" />
                        </div>
                      </div>
                      <div className="p-1.5">
                        <div className="text-[10px] text-slate-200 line-clamp-1 font-medium group-hover:text-pink-300 transition-colors">
                          {nextVid.title}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono truncate">
                          {nextVid.channel_name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
