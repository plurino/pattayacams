'use client';

import React, { useState, useMemo } from 'react';
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
  Sparkles,
  X
} from 'lucide-react';

const ZONE_LABELS = {
  all: 'All Zones',
  buakhao: 'Soi Buakhao',
  walking_street: 'Walking Street',
  beach_road: 'Beach Road',
  jomtien: 'Jomtien Beach',
  naklua: 'Naklua & North',
  pratumnak: 'Pratumnak Hill',
  expat_guide: 'Expat Guides'
};

export default function CreatorDirectoryClient({ creators = [], streamStatus = {} }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const entities = streamStatus?.entities || {};

  // Enrich creators with real-time live status from stream_status.json
  const enrichedCreators = useMemo(() => {
    return creators.map(creator => {
      const statusInfo = entities[`creator-${creator.slug}`] || {};
      const isLive = statusInfo.is_live === true;
      return {
        ...creator,
        is_live: isLive,
        status: statusInfo.status || 'active'
      };
    });
  }, [creators, entities]);

  // Filter creators
  const filteredCreators = useMemo(() => {
    return enrichedCreators.filter(c => {
      const matchesZone = selectedZone === 'all' || c.primary_zone === selectedZone;
      const matchesPlatform = selectedPlatform === 'all' || c.platform === selectedPlatform;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery = !query ||
        c.name.toLowerCase().includes(query) ||
        c.handle.toLowerCase().includes(query) ||
        (c.content_tags && c.content_tags.some(t => t.toLowerCase().includes(query))) ||
        (c.bio_seo && c.bio_seo.toLowerCase().includes(query));

      return matchesZone && matchesPlatform && matchesQuery;
    });
  }, [enrichedCreators, selectedZone, selectedPlatform, searchQuery]);

  const liveCount = useMemo(() => {
    return enrichedCreators.filter(c => c.is_live).length;
  }, [enrichedCreators]);

  return (
    <div className="min-h-screen w-full bg-canvas text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="h-14 border-b border-borderDark bg-surface/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-md">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brandCyan to-brandBlue flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.4)]">
            <Video className="w-4 h-4 text-canvas" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white group-hover:text-brandCyan transition-colors">
              Pattaya<span className="text-brandCyan">Cams</span>
            </span>
            <span className="hidden sm:inline-block text-[9px] font-mono text-slate-300 -mt-0.5 tracking-wider uppercase">
              Creator Directory
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surfaceLight hover:bg-surfaceLight/80 border border-borderDark text-xs font-mono text-slate-200 transition-all hover:border-brandCyan/50"
          >
            <MapIcon className="w-3.5 h-3.5 text-brandCyan" />
            <span className="hidden sm:inline">Live Radar Map</span>
            <span className="sm:hidden">Map</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-borderDark bg-surface/40 px-4 py-8 sm:py-12 md:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brandCyan/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surfaceLight border border-borderDark text-xs font-mono text-slate-300">
            <Users className="w-3.5 h-3.5 text-brandCyan" />
            <span>{creators.length} Featured Pattaya Creators</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">{liveCount} Live Now</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            Pattaya <span className="text-brandCyan">Creator Hub</span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
            The definitive directory of 4K walking tour filmmakers, expat commentators, and mobile IRL streamers documenting life, culture, and entertainment across Pattaya, Thailand.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-xl relative mt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creators by name, handle, or topic (e.g. Walking Tours, Buakhao)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface border border-borderDark focus:border-brandCyan/60 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors shadow-lg font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter Toolbar */}
      <div className="border-b border-borderDark bg-surfaceLight/30 px-4 py-3 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-3 sticky top-14 z-30 backdrop-blur-md">
        {/* Zone Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {Object.entries(ZONE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedZone(key)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                selectedZone === key
                  ? 'bg-brandCyan text-canvas font-bold shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                  : 'bg-surface text-slate-400 hover:text-slate-200 border border-borderDark hover:bg-surfaceLight'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Platform Selector */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-borderDark text-xs shrink-0 self-end md:self-auto">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`px-2.5 py-1 rounded-md font-mono transition-all ${
              selectedPlatform === 'all'
                ? 'bg-surfaceLight text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedPlatform('youtube')}
            className={`px-2.5 py-1 rounded-md font-mono flex items-center gap-1 transition-all ${
              selectedPlatform === 'youtube'
                ? 'bg-red-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Youtube className="w-3 h-3 text-red-400" />
            <span>YouTube</span>
          </button>
          <button
            onClick={() => setSelectedPlatform('kick')}
            className={`px-2.5 py-1 rounded-md font-mono flex items-center gap-1 transition-all ${
              selectedPlatform === 'kick'
                ? 'bg-[#53FC18] text-black font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>Kick</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-mono text-slate-400">
            Showing <strong className="text-white">{filteredCreators.length}</strong> creators
          </p>
          {(selectedZone !== 'all' || selectedPlatform !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedZone('all');
                setSelectedPlatform('all');
                setSearchQuery('');
              }}
              className="text-xs font-mono text-brandCyan hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {filteredCreators.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center gap-3 bg-surface/30 rounded-2xl border border-borderDark">
            <Users className="w-10 h-10 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-300">No Creators Found</h2>
            <p className="text-xs text-slate-500 font-mono max-w-sm">
              We couldn't find any creators matching your current search and zone filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreators.map((creator) => {
              const isKick = creator.platform === 'kick';
              return (
                <div
                  key={creator.slug}
                  className="group bg-surface border border-borderDark hover:border-brandCyan/50 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col justify-between"
                >
                  <div className="p-5 flex flex-col gap-4">
                    {/* Header: Avatar, Platform, Live Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="relative">
                        <img
                          src={creator.avatar_url}
                          alt={creator.name}
                          className="w-14 h-14 rounded-xl object-cover border border-borderDark group-hover:scale-105 transition-transform"
                        />
                        {creator.is_live && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-surface animate-ping" />
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {/* Live / Offline Pill */}
                        {creator.is_live ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-mono font-bold text-red-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span>LIVE NOW</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-surfaceLight border border-borderDark text-[10px] font-mono text-slate-400">
                            Offline
                          </span>
                        )}

                        {/* Platform Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                          isKick
                            ? 'bg-emerald-950/40 text-[#53FC18] border border-emerald-500/30'
                            : 'bg-red-950/40 text-red-400 border border-red-500/30'
                        }`}>
                          {isKick ? <Radio className="w-2.5 h-2.5" /> : <Youtube className="w-2.5 h-2.5" />}
                          <span>{isKick ? 'Kick' : 'YouTube'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Creator Identity */}
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-brandCyan transition-colors">
                        {creator.name}
                      </h2>
                      <p className="text-xs font-mono text-slate-400">
                        {creator.handle}
                      </p>
                    </div>

                    {/* Zone & Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-surfaceLight border border-borderDark text-brandCyan font-semibold flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{ZONE_LABELS[creator.primary_zone] || creator.primary_zone}</span>
                      </span>
                      {creator.content_tags?.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-surfaceLight/50 text-slate-300 border border-borderDark/60">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Bio Excerpt */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {creator.bio_seo}
                    </p>
                  </div>

                  {/* Card Footer Action */}
                  <div className="p-4 pt-0">
                    <Link
                      href={`/creators/${creator.slug}`}
                      className="w-full py-2.5 px-3 rounded-xl bg-surfaceLight hover:bg-brandCyan hover:text-canvas text-xs font-mono font-bold text-slate-200 transition-all flex items-center justify-center gap-1.5 border border-borderDark group/btn"
                    >
                      <span>View Full Profile & Videos</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Directory Footer */}
      <footer className="border-t border-borderDark bg-surface/60 p-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PattayaCams.com • Independent Pattaya Tourism & Streaming Directory</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-300 transition-colors">Live Radar</Link>
            <Link href="/?view=vids" className="hover:text-slate-300 transition-colors">PattayaVids</Link>
            <Link href="/creators" className="text-brandCyan font-semibold">Creator Hub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
