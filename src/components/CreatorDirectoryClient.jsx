'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Video,
  MapPin,
  Search,
  ExternalLink,
  Radio,
  Youtube,
  Users,
  Film,
  Map as MapIcon,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  X,
  Grid,
  ArrowUpDown,
} from 'lucide-react';
import SiteHeaderWithModals from '@/src/components/SiteHeaderWithModals';
import CreatorAvatar from '@/src/components/common/CreatorAvatar';
import { useStreamStatus } from '@/src/hooks/useStreamStatus';

const ITEMS_PER_PAGE = 24;

export default function CreatorDirectoryClient({ creators = [], venues = [], streamStatus: initialStatus = {} }) {
  const liveStatus = useStreamStatus();
  const streamStatus = liveStatus || initialStatus;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'name-asc' | 'name-desc' | 'platform'
  const [currentPage, setCurrentPage] = useState(1);
  const gridTopRef = useRef(null);

  const entities = useMemo(() => streamStatus?.entities || {}, [streamStatus]);

  // Enrich creators with real-time live status from stream_status.json
  const enrichedCreators = useMemo(() => {
    return creators.map(creator => {
      const statusInfo = entities[`creator-${creator.slug}`] || {};
      const isLive = statusInfo.is_live === true;
      return {
        ...creator,
        item_type: 'creator',
        is_live: isLive,
        status: statusInfo.status || 'active'
      };
    });
  }, [creators, entities]);

  // Enrich venues with real-time live status from stream_status.json
  const enrichedVenues = useMemo(() => {
    return venues.map(venue => {
      const statusInfo = entities[`venue-${venue.slug}`] || {};
      const isLive = statusInfo.is_live === true;
      const activeVideoId = statusInfo.video_id || venue.video_id;
      return {
        slug: venue.slug,
        original_slug: venue.slug,
        name: venue.name,
        handle: venue.youtube_handle || `@${venue.slug}`,
        platform: 'venue',
        item_type: 'venue',
        avatar_url: activeVideoId ? `https://i.ytimg.com/vi/${activeVideoId}/hqdefault.jpg` : null,
        category: venue.category,
        zone: venue.zone,
        is_live: isLive,
        is_sponsored: Boolean(venue.is_sponsored),
        video_id: activeVideoId,
        content_tags: ['Live Venue', 'Bar & Nightlife', venue.category ? venue.category.replace('_', ' ') : 'Pattaya'],
        bio_seo: venue.description,
        status: statusInfo.status || 'active',
        google_maps_url: venue.google_maps_url
      };
    });
  }, [venues, entities]);

  // Combine creators and venues into a unified directory pool
  const allDirectoryItems = useMemo(() => {
    return [...enrichedVenues, ...enrichedCreators];
  }, [enrichedVenues, enrichedCreators]);

  // Filter items by search and platform/venue selection
  const filteredItems = useMemo(() => {
    return allDirectoryItems.filter(item => {
      let matchesPlatform = true;
      if (selectedPlatform === 'venues') {
        matchesPlatform = item.item_type === 'venue';
      } else if (selectedPlatform === 'youtube') {
        matchesPlatform = item.item_type === 'creator' && (item.platform === 'youtube' || item.platform === 'both' || Boolean(item.handle || item.channel_id));
      } else if (selectedPlatform === 'kick') {
        matchesPlatform = item.item_type === 'creator' && (item.platform === 'kick' || item.platform === 'both' || Boolean(item.kick_channel));
      }

      const query = searchQuery.toLowerCase().trim();
      const matchesQuery = !query ||
        item.name.toLowerCase().includes(query) ||
        (item.handle && item.handle.toLowerCase().includes(query)) ||
        (item.content_tags && item.content_tags.some(t => t.toLowerCase().includes(query))) ||
        (item.bio_seo && item.bio_seo.toLowerCase().includes(query));

      return matchesPlatform && matchesQuery;
    });
  }, [allDirectoryItems, selectedPlatform, searchQuery]);

  // Sort items based on chosen sorting criteria
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    if (sortBy === 'name-asc') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === 'name-desc') {
      return list.sort((a, b) => b.name.localeCompare(a.name));
    }
    if (sortBy === 'platform') {
      return list.sort((a, b) => {
        const platA = a.platform || '';
        const platB = b.platform || '';
        return platA.localeCompare(platB);
      });
    }
    // Default 'featured': live first, sponsored first, then default
    return list.sort((a, b) => {
      if (a.is_live && !b.is_live) return -1;
      if (!a.is_live && b.is_live) return 1;
      if (a.is_sponsored && !b.is_sponsored) return -1;
      if (!a.is_sponsored && b.is_sponsored) return 1;
      return 0;
    });
  }, [filteredItems, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, safeCurrentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePlatformChange = (p) => {
    setSelectedPlatform(p);
    setCurrentPage(1);
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  const liveCount = useMemo(() => {
    return allDirectoryItems.filter(c => c.is_live).length;
  }, [allDirectoryItems]);

  const youtubeCount = useMemo(() => {
    return enrichedCreators.filter(c => c.platform === 'youtube').length;
  }, [enrichedCreators]);

  const kickCount = useMemo(() => {
    return enrichedCreators.filter(c => c.platform === 'kick').length;
  }, [enrichedCreators]);

  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(safeCurrentPage * ITEMS_PER_PAGE, sortedItems.length);

  return (
    <div className="min-h-screen w-full bg-canvas text-slate-100 flex flex-col">
      {/* 1. Unified Site Header with Navbar, TickerBar, and Modals */}
      <SiteHeaderWithModals viewMode="creators" />

      {/* 2. Hero Section */}
      <section className="border-b border-borderDark bg-surface/40 px-4 py-8 sm:py-12 md:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brandPink/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surfaceLight border border-borderDark text-xs font-mono text-slate-300">
            <Users className="w-3.5 h-3.5 text-brandPink" />
            <span>{allDirectoryItems.length} Creators & Live Venues</span>
            <span className="text-slate-600">|</span>
            <span className="text-red-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {liveCount} Live Now
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            Pattaya <span className="text-brandPink">Creator & Venue Hub</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
            The definitive directory of Pattaya nightlife live venues, 4K street walk filmmakers, expat commentators, and mobile IRL streamers documenting the city that never sleeps.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-xl relative mt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search creators & venues (e.g. Oh Bar, Buzzin, Vespa Life, S3xy Bar)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface border border-borderDark focus:border-brandPink/60 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors shadow-lg font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Filter & Sort Toolbar */}
      <div
        ref={gridTopRef}
        className="border-b border-borderDark bg-surfaceLight/30 px-4 py-3 sm:px-8 flex flex-wrap items-center justify-between gap-3 sticky top-14 z-30 backdrop-blur-md"
      >
        <p className="text-xs font-mono text-slate-400">
          {sortedItems.length === 0 ? (
            '0 listings found'
          ) : (
            <>
              Showing <strong className="text-white font-bold">{startIndex}–{endIndex}</strong> of {sortedItems.length} listings
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface border border-borderDark text-xs font-mono text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-brandPink shrink-0" />
            <span className="hidden sm:inline text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="featured" className="bg-surface text-slate-200">Featured & Live</option>
              <option value="name-asc" className="bg-surface text-slate-200">Name (A–Z)</option>
              <option value="name-desc" className="bg-surface text-slate-200">Name (Z–A)</option>
              <option value="platform" className="bg-surface text-slate-200">Platform</option>
            </select>
          </div>

          {/* Platform & Venue Type Selector */}
          <div className="flex flex-wrap items-center gap-1 bg-surface p-1 rounded-xl border border-borderDark text-xs shrink-0">
            <button
              onClick={() => handlePlatformChange('all')}
              className={`px-3 py-1 rounded-lg font-mono transition-all ${
                selectedPlatform === 'all'
                  ? 'bg-brandPink text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({allDirectoryItems.length})
            </button>
            <button
              onClick={() => handlePlatformChange('venues')}
              className={`px-3 py-1 rounded-lg font-mono flex items-center gap-1 transition-all ${
                selectedPlatform === 'venues'
                  ? 'bg-gradient-to-r from-brandPink to-rose-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3 h-3 text-brandPink" />
              <span>Live Venues ({venues.length})</span>
            </button>
            <button
              onClick={() => handlePlatformChange('youtube')}
              className={`px-3 py-1 rounded-lg font-mono flex items-center gap-1 transition-all ${
                selectedPlatform === 'youtube'
                  ? 'bg-red-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Youtube className="w-3 h-3 text-red-400" />
              <span>YouTube ({youtubeCount})</span>
            </button>
            <button
              onClick={() => handlePlatformChange('kick')}
              className={`px-3 py-1 rounded-lg font-mono flex items-center gap-1 transition-all ${
                selectedPlatform === 'kick'
                  ? 'bg-emerald-500 text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3 h-3 text-black" />
              <span>Kick ({kickCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Scrollable Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {paginatedItems.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center gap-3 bg-surface/30 rounded-2xl border border-borderDark">
            <Users className="w-10 h-10 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-300">No Listings Found</h2>
            <p className="text-xs text-slate-500 font-mono max-w-sm">
              We couldn&apos;t find any creators or live venues matching your search.
            </p>
            <button
              onClick={() => { setSelectedPlatform('all'); setSearchQuery(''); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-lg bg-surfaceLight hover:bg-surfaceLight/80 text-xs font-mono text-brandPink border border-borderDark mt-2"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedItems.map((item) => {
              const isVenue = item.item_type === 'venue';
              const isKick = item.platform === 'kick';
              const targetUrl = isVenue ? `/venues/${item.slug}` : `/creators/${item.slug}`;

              return (
                <div
                  key={`${item.item_type}-${item.slug}`}
                  className="group bg-surface border border-borderDark hover:border-brandPink/60 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[0_8px_28px_rgba(255,42,109,0.15)] flex flex-col justify-between"
                >
                  <div className="p-5 flex flex-col gap-4">
                    {/* Header: Real Avatar / Styled Initials Fallback, Platform, Live Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="relative shrink-0">
                        <CreatorAvatar
                          src={item.avatar_url}
                          alt={item.name}
                          name={item.name}
                          platform={item.platform}
                          className="w-14 h-14 rounded-2xl group-hover:scale-105 transition-transform"
                        />
                        {item.is_live && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-surface animate-ping" />
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {/* Live / Offline Pill */}
                        {item.is_live ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-mono font-bold text-red-400 flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span>LIVE NOW</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-surfaceLight border border-borderDark text-[10px] font-mono text-slate-400">
                            {isVenue ? 'Standby' : 'Offline'}
                          </span>
                        )}

                        {/* Platform / Venue Badge */}
                        {isVenue ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 bg-brandPink/15 text-brandPink border border-brandPink/30 shadow-sm">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>Live Venue</span>
                          </span>
                        ) : item.platform === 'both' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 bg-purple-950/40 text-purple-300 border border-purple-500/30">
                            <Youtube className="w-2.5 h-2.5 text-red-400" />
                            <span>+</span>
                            <Radio className="w-2.5 h-2.5 text-[#53FC18]" />
                            <span>YT & Kick</span>
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                            isKick
                              ? 'bg-emerald-950/40 text-[#53FC18] border border-emerald-500/30'
                              : 'bg-red-950/40 text-red-400 border border-red-500/30'
                          }`}>
                            {isKick ? <Radio className="w-2.5 h-2.5" /> : <Youtube className="w-2.5 h-2.5" />}
                            <span>{isKick ? 'Kick' : 'YouTube'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Identity */}
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
                        {item.name}
                      </h2>
                      <p className="text-xs font-mono text-slate-400">
                        {item.handle}
                      </p>
                    </div>

                    {/* Tags */}
                    {item.content_tags && item.content_tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                        {item.content_tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-surfaceLight/60 text-slate-300 border border-borderDark/60">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bio Excerpt */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {item.bio_seo}
                    </p>
                  </div>

                  {/* Card Footer Action */}
                  <div className="p-4 pt-0">
                    <Link
                      href={targetUrl}
                      className="w-full py-2.5 px-3 rounded-xl bg-surfaceLight hover:bg-gradient-to-r hover:from-brandPink hover:to-rose-600 hover:text-white text-xs font-mono font-bold text-slate-200 transition-all flex items-center justify-center gap-1.5 border border-borderDark hover:border-transparent group/btn shadow-sm"
                    >
                      <span>
                        {isVenue
                          ? (item.is_live ? 'Watch Live Venue Feed 🎥' : 'View Venue & Street Cam ↗')
                          : 'View Full Profile & Videos'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Pagination Controls */}
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

              {/* Numbered Page Pills */}
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
      </main>

      {/* Directory Footer */}
      <footer className="border-t border-borderDark bg-surface/60 p-6 text-center text-xs font-mono text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
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
