'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Star, Play, Radio, Users, Tv, MapPin, Video } from 'lucide-react';
import streamersData from '@/public/data/roaming_streamers.json';
import creatorsData from '@/public/data/creators.json';
import venuesData from '@/public/data/venues.json';
import liveCamsData from '@/public/data/live_cams.json';
import { useStreamStatus } from '@/src/hooks/useStreamStatus';
import { FEATURES } from '@/src/config/features';

/**
 * Resolve the best thumbnail for an entity.
 * Creators/streamers use avatar_url; venues & livecams fall back to their
 * first Google Street View photo or a generic icon.
 */
function resolveThumbnail(item) {
  if (item.avatar_url) return item.avatar_url;
  if (Array.isArray(item.photos) && item.photos.length > 0 && item.photos[0]?.url) {
    return item.photos[0].url;
  }
  return null;
}

/**
 * Human label + glyph for an entity's type, used inside the live card.
 */
function describeType(item) {
  switch (item.type) {
    case 'creator':
      return { label: 'Creator', Icon: Video };
    case 'streamer':
      return { label: 'Roaming', Icon: Video };
    case 'venue':
      return { label: item.category || 'Venue', Icon: MapPin };
    case 'livecam':
      return { label: '24/7 Cam', Icon: Tv };
    default:
      return { label: 'Stream', Icon: Video };
  }
}

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=60';

export default function RoamingTray({ onSelectStreamer, onOpenSponsorModal }) {
  const streamStatus = useStreamStatus();

  // Index all entities with physical locations on the map (Venues & 24/7 Webcams)
  // so we can *exclude* them from this tray — the Sep 2026 redesign explicitly
  // scoped this strip to "live creators that aren't tied to a venue address".
  // (If a stream is already represented by a map pin, surfacing it again here
  // would just be visual noise.) The index still exists because dedupe against
  // the creator pool is the right hygiene step.
  const physicalKeys = useMemo(() => {
    const keys = new Set();
    venuesData.forEach((v) => {
      if (v.slug) keys.add(v.slug.toLowerCase());
      if (v.id) keys.add(v.id.toLowerCase());
      if (v.youtube_handle) keys.add(v.youtube_handle.toLowerCase().replace(/^@/, ''));
      if (v.youtube_channel_id) keys.add(v.youtube_channel_id.toLowerCase());
      if (v.name) keys.add(v.name.toLowerCase());
    });
    liveCamsData.forEach((c) => {
      if (c.slug) keys.add(c.slug.toLowerCase());
      if (c.id) keys.add(c.id.toLowerCase());
      if (c.youtube_handle) keys.add(c.youtube_handle.toLowerCase().replace(/^@/, ''));
      if (c.youtube_channel_id) keys.add(c.youtube_channel_id.toLowerCase());
      if (c.name) keys.add(c.name.toLowerCase());
    });
    return keys;
  }, []);

  const isPhysicalOnMap = useCallback((item) => {
    const slug = (item.slug || '').toLowerCase();
    const handle = (item.handle || '').toLowerCase().replace(/^@/, '');
    const cid = (item.channel_id || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    return physicalKeys.has(slug) || physicalKeys.has(handle) || physicalKeys.has(cid) || physicalKeys.has(name);
  }, [physicalKeys]);

  // Pool is restricted to roaming streamers + creators (no venue/livecam entries).
  // Venues & cams are already visible as map pins; duplicating them here made the
  // tray feel like a "second map" rather than a discovery surface for the
  // location-less IRL creators.
  const allPool = useMemo(() => {
    const list = [];
    const seen = new Set();

    const addItem = (item) => {
      const cid = (item.channel_id || '').toLowerCase();
      const handle = (item.handle || '').toLowerCase().replace(/^@/, '');
      const name = (item.name || '').toLowerCase();

      // Deduplicate so no channel appears twice
      if (cid && seen.has(`cid:${cid}`)) return;
      if (handle && seen.has(`h:${handle}`)) return;
      if (name && seen.has(`n:${name}`)) return;

      if (cid) seen.add(`cid:${cid}`);
      if (handle) seen.add(`h:${handle}`);
      if (name) seen.add(`n:${name}`);

      list.push(item);
    };

    // 1. Creators (no map pin of their own → most "on the move")
    creatorsData.forEach((c) => {
      addItem({
        id: c.slug,
        slug: c.slug,
        name: c.name,
        handle: c.handle,
        avatar_url: c.avatar_url,
        platform: c.platform,
        channel_id: c.channel_id,
        kick_channel: c.kick_channel,
        type: 'creator',
      });
    });

    // 2. Roaming streamers (location-less by definition)
    streamersData.forEach((s) => {
      addItem({
        id: s.id,
        slug: s.id.toLowerCase(),
        name: s.name,
        handle: s.youtube_handle,
        avatar_url: s.avatar_url,
        platform: 'youtube',
        channel_id: s.youtube_channel_id,
        type: 'streamer',
      });
    });

    // 3. Venues are deliberately excluded — they appear on the map.
    // 4. 24/7 Live Cams are deliberately excluded — they appear on the map.

    return list;
  }, []);

  const getEntityStatus = useCallback((item) => {
    // Try every key shape used across the codebase so we pick up status
    // regardless of where the entity originated.
    const slug = item.slug;
    const id = item.id;
    return (
      streamStatus?.entities?.[slug] ||
      streamStatus?.entities?.[id] ||
      streamStatus?.entities?.[id?.toLowerCase?.()] ||
      streamStatus?.entities?.[slug ? `creator-${slug}` : ''] ||
      streamStatus?.entities?.[slug ? `venue-${slug}` : ''] ||
      streamStatus?.entities?.[slug ? `livecam-${slug}` : ''] ||
      streamStatus?.entities?.[id ? `streamer-${id}` : ''] ||
      streamStatus?.entities?.[id ? `streamer-${id?.toLowerCase?.()}` : ''] ||
      null
    );
  }, [streamStatus]);

  // Filter strictly to ACTIVE live entities (not upcoming)
  const liveStreams = useMemo(() => {
    return allPool
      .filter((item) => {
        const status = getEntityStatus(item);
        return status?.is_live === true && !status?.is_upcoming;
      })
      .map((item) => {
        const status = getEntityStatus(item);
        return {
          ...item,
          is_live: true,
          video_id: status?.video_id || null,
          active_platform: status?.platform || item.platform,
          concurrent_viewers: status?.concurrent_viewers || null,
        };
      })
      // Pool is creators + streamers only; creators sort before streamers, then alphabetical by name.
      .sort((a, b) => {
        const order = { creator: 0, streamer: 1 };
        const ao = order[a.type] ?? 9;
        const bo = order[b.type] ?? 9;
        if (ao !== bo) return ao - bo;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [allPool, getEntityStatus]);

  const liveCount = liveStreams.length;
  const hasLive = liveCount > 0;

  return (
    <aside
      aria-label="Currently Broadcasting"
      className="h-16 sm:h-[72px] border-t border-borderDark bg-surface flex items-center justify-between px-2 sm:px-4 md:px-5 shrink-0 z-40 select-none shadow-[0_-4px_18px_rgba(0,0,0,0.35)] gap-2"
    >
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 scrollbar-none flex-1 min-w-0">
        {/* Dock Header — pulsing live pill + count badge.
            Renamed in Sep 2026 from "LIVE NOW" to "Live on the Move in Pattaya"
            to reflect the new scope: only roaming creators + streamers (not
            venues or 24/7 cams, which already have map pins). */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pr-2 sm:pr-3 border-r border-borderDark">
          {hasLive ? (
            <>
              <span className="relative flex h-2.5 sm:h-3 w-2.5 sm:w-3" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 sm:h-3 w-2.5 sm:w-3 bg-red-500 shadow-[0_0_8px_#EF4444]"></span>
              </span>
              <div className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-bold">
                <span className="text-white uppercase tracking-wider hidden sm:inline">
                  ● Live on the Move in Pattaya
                </span>
                <span className="text-white uppercase tracking-wider sm:hidden">
                  ● On the Move
                </span>
                <span
                  className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-extrabold shadow-[0_0_8px_#EF4444]"
                  aria-label={`${liveCount} streams live`}
                >
                  {liveCount} {liveCount === 1 ? 'stream' : 'streams'}
                </span>
              </div>
            </>
          ) : (
            <>
              <Radio className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                On the Move — Standby
              </span>
            </>
          )}
        </div>

        {/* When NO streams are live: quiet "check back later" message + link */}
        {!hasLive ? (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 truncate">
            <span className="hidden sm:inline">
              No roaming streams right now — check back later.
            </span>
            <span className="sm:hidden text-[11px]">No streams live.</span>
            <span className="text-slate-600" aria-hidden="true">•</span>
            <Link
              href="/creators"
              className="text-brandPink hover:text-pink-300 font-bold transition-colors flex items-center gap-1 shrink-0 text-[11px] sm:text-xs"
            >
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Explore 70+ Channels ↗</span>
            </Link>
          </div>
        ) : (
          /* When streams ARE live: horizontal scrollable card strip */
          <div
            className="flex items-stretch gap-2 min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5"
            role="list"
            aria-label="Live streams"
          >
            {liveStreams.map((stream) => {
              const thumb = resolveThumbnail(stream);
              const { label: typeLabel, Icon: TypeIcon } = describeType(stream);
              const handle = stream.handle || (stream.slug ? `@${stream.slug}` : '');
              const viewerCount = stream.concurrent_viewers;

              return (
                <button
                  key={`${stream.type}:${stream.id}`}
                  type="button"
                  role="listitem"
                  onClick={() => onSelectStreamer(stream)}
                  title={`Watch ${stream.name} live on ${stream.active_platform || stream.platform || 'YouTube'}`}
                  className="group flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border bg-red-950/60 hover:bg-red-900/80 border-red-500/60 hover:border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="relative shrink-0">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={stream.name}
                        className="w-7 h-7 rounded-full object-cover border border-red-500 shrink-0"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_AVATAR;
                        }}
                      />
                    ) : (
                      <span className="w-7 h-7 rounded-full border border-red-500 bg-red-900/80 flex items-center justify-center shrink-0">
                        <TypeIcon className="w-3.5 h-3.5 text-red-200" aria-hidden="true" />
                      </span>
                    )}
                    <span
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-surface animate-pulse"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="flex flex-col text-left min-w-0 max-w-[120px] sm:max-w-[160px]">
                    <span className="text-xs font-bold font-mono text-white group-hover:text-red-200 leading-tight truncate">
                      {stream.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-300 leading-tight truncate flex items-center gap-1">
                      <TypeIcon className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{typeLabel}</span>
                      {handle ? <span className="truncate opacity-70">· {handle}</span> : null}
                      {viewerCount ? (
                        <span className="truncate text-red-300">· {formatViewers(viewerCount)} watching</span>
                      ) : null}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 group-hover:from-red-500 group-hover:to-rose-500 text-white text-[9px] font-mono font-bold tracking-wider shrink-0 shadow-[0_0_6px_rgba(239,68,68,0.6)] ml-0.5">
                    <Play className="w-2.5 h-2.5 fill-white" aria-hidden="true" />
                    <span className="hidden sm:inline">WATCH</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons: B2B Self-Serve List Venue
          (Contact button removed in Sep 2026 — same CTA is already in SiteFooter
          and the TickerOverflowMenu so three contact entry-points was overkill.) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {FEATURES.SHOW_B2B_SPONSOR_MODAL && (
          <button
            onClick={onOpenSponsorModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-brandGold/20 to-brandAmber/20 hover:from-brandGold/30 hover:to-brandAmber/30 border border-brandGold/60 text-brandGold text-xs font-bold transition-all shadow-[0_0_12px_rgba(234,179,8,0.25)] hover:shadow-[0_0_16px_rgba(234,179,8,0.4)] cursor-pointer"
            title="List your Pattaya Venue"
          >
            <Star className="w-3.5 h-3.5 fill-brandGold" aria-hidden="true" />
            <span className="hidden sm:inline whitespace-nowrap">List Venue</span>
          </button>
        )}
      </div>
    </aside>
  );
}

/**
 * Compact viewer count formatter — 1234 → "1.2k", 12345 → "12k".
 */
function formatViewers(n) {
  if (typeof n !== 'number' || !isFinite(n) || n <= 0) return null;
  if (n < 1000) return `${n}`;
  if (n < 10000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n / 1000)}k`;
}
