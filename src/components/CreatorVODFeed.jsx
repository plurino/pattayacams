'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Play,
  Search,
  Youtube,
  Clock,
  ExternalLink,
  X,
  Film,
  User,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Flame,
  Filter,
  ArrowUpDown,
  Check
} from 'lucide-react';
import vodData from '@/public/data/creator_videos.json';

const VIDEOS_PER_PAGE = 24;

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
  const [selectedChannels, setSelectedChannels] = useState([]); // array of channel slugs; empty = all
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'channel'
  const [currentPage, setCurrentPage] = useState(1);
  const [isChannelMenuOpen, setIsChannelMenuOpen] = useState(false);
  const [channelSearch, setChannelSearch] = useState('');
  const [activeModalVideo, setActiveModalVideo] = useState(null);

  const channelMenuRef = useRef(null);
  const feedScrollRef = useRef(null);

  const allVideos = useMemo(() => vodData?.videos || [], []);

  // Close channel multi-select on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (channelMenuRef.current && !channelMenuRef.current.contains(e.target)) {
        setIsChannelMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract unique channel list with video counts for multi-select
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

  // Filtered channel options inside the multi-select dropdown
  const filteredChannelOptions = useMemo(() => {
    if (!channelSearch.trim()) return channelOptions;
    const q = channelSearch.toLowerCase().trim();
    return channelOptions.filter(c => c.name.toLowerCase().includes(q));
  }, [channelOptions, channelSearch]);

  const toggleChannel = (slug) => {
    setSelectedChannels(prev => {
      if (prev.includes(slug)) {
        return prev.filter(s => s !== slug);
      }
      return [...prev, slug];
    });
    setCurrentPage(1);
  };

  const clearChannelSelection = () => {
    setSelectedChannels([]);
    setCurrentPage(1);
  };

  // Featured Trending Strip: 3 popular high-interest videos
  const trendingVideos = useMemo(() => {
    const featured = allVideos.filter(v => POPULAR_FEATURED_IDS.includes(v.id));
    if (featured.length === 3) return featured;
    return allVideos.slice(0, 3);
  }, [allVideos]);

  const trendingIdSet = useMemo(() => {
    return new Set(trendingVideos.map(v => v.id));
  }, [trendingVideos]);

  const isFiltering = selectedChannels.length > 0 || Boolean(searchQuery);

  // Main filtered & sorted videos
  const filteredAndSortedVideos = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const hasChannels = selectedChannels.length > 0;

    let list = allVideos.filter(v => {
      // Exclude trending strip videos only when viewing standard unfiltered front page
      if (!isFiltering && trendingIdSet.has(v.id)) {
        return false;
      }
      const matchesChannel = !hasChannels || selectedChannels.includes(v.channel_slug);
      const matchesQuery = !query ||
        v.title.toLowerCase().includes(query) ||
        v.channel_name.toLowerCase().includes(query);
      return matchesChannel && matchesQuery;
    });

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
    } else if (sortBy === 'channel') {
      list.sort((a, b) => a.channel_name.localeCompare(b.channel_name));
    }

    return list;
  }, [allVideos, selectedChannels, searchQuery, sortBy, isFiltering, trendingIdSet]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedVideos.length / VIDEOS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedVideos = useMemo(() => {
    const start = (safeCurrentPage - 1) * VIDEOS_PER_PAGE;
    return filteredAndSortedVideos.slice(start, start + VIDEOS_PER_PAGE);
  }, [filteredAndSortedVideos, safeCurrentPage]);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    if (feedScrollRef.current) {
      feedScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  const startIndex = (safeCurrentPage - 1) * VIDEOS_PER_PAGE + 1;
  const endIndex = Math.min(safeCurrentPage * VIDEOS_PER_PAGE, filteredAndSortedVideos.length);

  return (
    <div className="w-full h-full flex flex-col bg-canvas text-white overflow-hidden select-none">
      {/* 1. Integrated Portal Header */}
      <div className="p-3.5 sm:p-4 md:px-6 md:py-4 border-b border-borderDark bg-surface/95 backdrop-blur-md shrink-0 flex flex-col gap-3 z-30">
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

          {/* Controls Bar: Multi-Select Channel Filter + Sort + Search + Creators Link */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Multi-Select Channel Filter Dropdown */}
            <div className="relative flex-1 sm:flex-none" ref={channelMenuRef}>
              <button
                onClick={() => setIsChannelMenuOpen(!isChannelMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                  selectedChannels.length > 0
                    ? 'bg-brandPink/15 border-brandPink text-brandPink font-bold shadow-[0_0_10px_rgba(255,42,109,0.25)]'
                    : 'bg-canvas border-borderDark text-slate-200 hover:border-brandPink/60'
                }`}
                title="Filter by multiple creators"
              >
                <Filter className="w-3.5 h-3.5 text-brandPink shrink-0" />
                <span>
                  {selectedChannels.length === 0
                    ? `All Creators (${channelOptions.length})`
                    : selectedChannels.length === 1
                    ? `${channelOptions.find(c => c.slug === selectedChannels[0])?.name || '1 Creator'}`
                    : `${selectedChannels.length} Creators Selected`}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isChannelMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isChannelMenuOpen && (
                <div className="absolute left-0 lg:right-0 lg:left-auto mt-1.5 w-64 max-h-80 bg-surface border border-borderDark rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-2 backdrop-blur-xl">
                  <div className="flex items-center justify-between px-1 pb-1 border-b border-borderDark/60">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Select Creators</span>
                    {selectedChannels.length > 0 && (
                      <button
                        onClick={clearChannelSelection}
                        className="text-[10px] font-mono text-brandPink hover:underline"
                      >
                        Clear ({selectedChannels.length})
                      </button>
                    )}
                  </div>

                  {/* Channel Search Input */}
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={channelSearch}
                      onChange={(e) => setChannelSearch(e.target.value)}
                      placeholder="Find creator..."
                      className="w-full pl-7 pr-2 py-1 rounded-lg bg-canvas border border-borderDark text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandPink/60 font-mono"
                    />
                  </div>

                  {/* Channel Checkbox List */}
                  <div className="overflow-y-auto max-h-52 flex flex-col gap-0.5 pr-1">
                    {filteredChannelOptions.map((c) => {
                      const isSelected = selectedChannels.includes(c.slug);
                      return (
                        <button
                          key={c.slug}
                          onClick={() => toggleChannel(c.slug)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-brandPink/20 text-brandPink font-bold border border-brandPink/40'
                              : 'text-slate-300 hover:text-white hover:bg-surfaceLight'
                          }`}
                        >
                          <span className="truncate pr-2">{c.name}</span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-400">({c.count})</span>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-brandPink border-brandPink text-white' : 'border-slate-600 bg-canvas'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-canvas border border-borderDark text-xs font-mono text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-brandPink shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="newest" className="bg-surface text-slate-200">Newest First</option>
                <option value="oldest" className="bg-surface text-slate-200">Oldest First</option>
                <option value="channel" className="bg-surface text-slate-200">Creator Name</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search episodes..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-canvas border border-borderDark text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandPink/60 transition-colors font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Link to Creators Hub */}
            <a
              href="/creators"
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-brandPink/20 to-purple-600/20 hover:from-brandPink/30 hover:to-purple-600/30 text-pink-200 border border-brandPink/50 transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 shadow-sm"
              title="Explore 70+ Pattaya Content Creators & Live Venues"
            >
              <User className="w-3.5 h-3.5 text-brandPink" />
              <span className="hidden sm:inline">Creators Hub ↗</span>
              <span className="sm:hidden">Hub ↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Scrollable Content */}
      <div ref={feedScrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Trending Tonight Spotlight Strip (Only on page 1 when no search or channel filter is active) */}
        {!isFiltering && safeCurrentPage === 1 && trendingVideos.length > 0 && (
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

        {/* Responsive Video Wall */}
        <section className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wide font-mono text-slate-400">
              {filteredAndSortedVideos.length === 0 ? (
                '0 MATCHING EPISODES'
              ) : (
                <>
                  Showing {startIndex}–{endIndex} of {filteredAndSortedVideos.length} {isFiltering ? 'MATCHING' : 'LATEST'} EPISODES
                </>
              )}
            </h2>
          </div>

          {paginatedVideos.length === 0 ? (
            <div className="w-full h-64 flex flex-col items-center justify-center text-center gap-3 bg-surface/50 rounded-2xl border border-borderDark">
              <Film className="w-10 h-10 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-300">No Videos Found</h3>
              <p className="text-xs text-slate-500 font-mono">
                No videos match your filter. Try clearing filters or searching for another term.
              </p>
              <button
                onClick={() => { setSelectedChannels([]); setSearchQuery(''); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-lg bg-surfaceLight hover:bg-surfaceLight/80 text-xs font-mono text-brandPink border border-borderDark mt-2"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleCardClick(video)}
                  className="group bg-surface border border-borderDark hover:border-brandPink/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-brandPink/90 text-white flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-brandPink" />
                      <span>{formatRelativeTime(video.published_at)}</span>
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                    <h3 className="text-xs font-semibold text-slate-200 group-hover:text-brandPink transition-colors line-clamp-2 leading-relaxed">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-borderDark/60">
                      <span className="truncate max-w-[170px] text-slate-300 font-medium">
                        {video.channel_name}
                      </span>
                      <span className="text-brandPink text-[10px] font-bold group-hover:underline">
                        Play Video ↗
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-10 pt-6 border-t border-borderDark flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs font-mono text-slate-400">
                Page <span className="text-white font-bold">{safeCurrentPage}</span> of {totalPages}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-borderDark text-xs font-mono text-slate-300 hover:text-white hover:border-brandPink/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all ${
                        safeCurrentPage === p
                          ? 'bg-gradient-to-r from-brandPink to-rose-600 text-white shadow-[0_0_12px_rgba(255,42,109,0.4)]'
                          : 'bg-surface border border-borderDark text-slate-400 hover:text-white hover:bg-surfaceLight'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface border border-borderDark text-xs font-mono text-slate-300 hover:text-white hover:border-brandPink/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 4. Fullscreen Modal Player with "Up Next" Retention Strip */}
      {activeModalVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-surface border border-borderDark rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            <div className="p-3.5 px-4 border-b border-borderDark flex items-center justify-between gap-3 bg-surfaceLight/50">
              <div className="flex items-center gap-2 truncate">
                <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs font-mono font-bold text-white truncate">
                  {activeModalVideo.channel_name}: {activeModalVideo.title}
                </span>
              </div>
              <button
                onClick={() => setActiveModalVideo(null)}
                className="w-8 h-8 rounded-full bg-surface border border-borderDark hover:bg-red-500/20 hover:border-red-500/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full aspect-video bg-black shrink-0">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeModalVideo.id}?autoplay=1&rel=0&playsinline=1`}
                title={activeModalVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            <div className="p-4 bg-canvas flex-1 overflow-y-auto space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white leading-snug">
                  {activeModalVideo.title}
                </h3>
                <a
                  href={activeModalVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono font-bold text-brandPink hover:underline shrink-0"
                >
                  <span>Open on YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {upNextVideos.length > 0 && (
                <div className="pt-3 border-t border-borderDark">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-brandPink" />
                    <span>Up Next in Pattaya</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {upNextVideos.map(nextVid => (
                      <div
                        key={`next-${nextVid.id}`}
                        onClick={() => setActiveModalVideo(nextVid)}
                        className="group bg-surface hover:bg-surfaceLight border border-borderDark hover:border-brandPink/40 rounded-xl p-1.5 cursor-pointer transition-all flex flex-col gap-1.5"
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900">
                          <img
                            src={nextVid.thumbnail_url}
                            alt={nextVid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 fill-white text-white" />
                          </div>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-200 line-clamp-2 group-hover:text-brandPink leading-tight">
                          {nextVid.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
