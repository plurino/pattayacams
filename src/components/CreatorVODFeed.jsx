'use client';

import React, { useState, useMemo } from 'react';
import { Play, Search, Youtube, Clock, ExternalLink, X, Film, CheckCircle2, User } from 'lucide-react';
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

export default function CreatorVODFeed({ onSelectVideo }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [activeModalVideo, setActiveModalVideo] = useState(null);

  const videos = vodData?.videos || [];

  // Extract unique channel names for quick filter pills
  const channelList = useMemo(() => {
    const map = new Map();
    videos.forEach(v => {
      if (!map.has(v.channel_slug)) {
        map.set(v.channel_slug, v.channel_name);
      }
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [videos]);

  // Filtered videos based on search query and channel filter
  const filteredVideos = useMemo(() => {
    return videos.filter(v => {
      const matchesChannel = selectedChannel === 'all' || v.channel_slug === selectedChannel;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery = !query ||
        v.title.toLowerCase().includes(query) ||
        v.channel_name.toLowerCase().includes(query);
      return matchesChannel && matchesQuery;
    });
  }, [videos, selectedChannel, searchQuery]);

  const handleCardClick = (video) => {
    if (onSelectVideo) {
      onSelectVideo(video);
    }
    setActiveModalVideo(video);
  };

  return (
    <div className="w-full h-full flex flex-col bg-canvas text-white overflow-hidden select-none">
      {/* 1. Header Toolbar */}
      <div className="p-4 md:px-6 md:py-4 border-b border-borderDark bg-surface/80 backdrop-blur-md shrink-0 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brandPink to-purple-600 flex items-center justify-center shadow-[0_0_12px_rgba(255,42,109,0.4)]">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Pattaya <span className="text-brandPink">Pulse</span>
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brandPink/20 text-brandPink border border-brandPink/40 font-bold uppercase tracking-wider">
                  24/7 VOD Radar
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono hidden md:block">
                Latest 4K walking tours, street vlogs, and expat updates from the past 7 days
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos or creators..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-canvas border border-borderDark text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandPink/60 transition-colors font-mono"
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
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedChannel('all')}
            className={`px-3 py-1 rounded-full text-xs font-mono transition-all whitespace-nowrap ${
              selectedChannel === 'all'
                ? 'bg-brandPink text-white font-bold shadow-[0_0_10px_rgba(255,42,109,0.3)]'
                : 'bg-surfaceLight/80 text-slate-400 hover:text-slate-200 hover:bg-surfaceLight border border-borderDark'
            }`}
          >
            All Creators ({videos.length})
          </button>
          {channelList.slice(0, 10).map(c => (
            <button
              key={c.slug}
              onClick={() => setSelectedChannel(c.slug)}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-all whitespace-nowrap ${
                selectedChannel === c.slug
                  ? 'bg-brandPink text-white font-bold shadow-[0_0_10px_rgba(255,42,109,0.3)]'
                  : 'bg-surfaceLight/80 text-slate-400 hover:text-slate-200 hover:bg-surfaceLight border border-borderDark'
              }`}
            >
              {c.name}
            </button>
          ))}
          <a
            href="/creators"
            className="px-3 py-1 rounded-full text-xs font-mono bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 transition-all whitespace-nowrap flex items-center gap-1"
          >
            <User className="w-3 h-3" />
            <span>Full Creator Directory ↗</span>
          </a>
        </div>
      </div>

      {/* 2. Responsive 3-Column Video Wall */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredVideos.length === 0 ? (
          <div className="w-full h-64 flex flex-col items-center justify-center text-center gap-3">
            <Film className="w-10 h-10 text-slate-600" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-300">No Videos Found</h2>
              <p className="text-xs text-slate-500 font-mono">
                Try adjusting your search query or selecting a different creator.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => handleCardClick(video)}
                className="group relative bg-surface border border-borderDark hover:border-brandPink/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col"
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
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white flex items-center gap-1.5">
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
                  <h2 className="text-xs font-semibold text-slate-100 group-hover:text-brandPink transition-colors line-clamp-2 leading-relaxed">
                    {video.title}
                  </h2>

                  <div className="flex items-center justify-between pt-2 border-t border-borderDark/60 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-1">
                      <Youtube className="w-3.5 h-3.5 text-red-500" />
                      <span className="truncate">{video.channel_name}</span>
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
      </div>

      {/* 3. Inline Video Modal Player */}
      {activeModalVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveModalVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-surface border border-borderDark rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-borderDark flex items-center justify-between bg-surfaceLight/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={activeModalVideo.channel_avatar}
                  alt={activeModalVideo.channel_name}
                  className="w-7 h-7 rounded-full object-cover border border-borderDark shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    {activeModalVideo.title}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <span>{activeModalVideo.channel_name}</span>
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
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeModalVideo.id}?autoplay=1&mute=0&rel=0&playsinline=1`}
                title={activeModalVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Modal Actions Footer */}
            <div className="p-3.5 bg-surfaceLight/30 border-t border-borderDark flex items-center justify-between text-xs font-mono">
              <a
                href={`/creators/${activeModalVideo.channel_slug}`}
                className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <User className="w-3.5 h-3.5" />
                <span>View {activeModalVideo.channel_name} Full Dossier</span>
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
          </div>
        </div>
      )}
    </div>
  );
}
