'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import MapCanvasWrapper from '@/src/components/MapCanvasWrapper';
import MultiCamGrid from '@/src/components/MultiCamGrid';
import CreatorVODFeed from '@/src/components/CreatorVODFeed';
import VideoDrawer from '@/src/components/VideoDrawer';
import RoamingTray from '@/src/components/RoamingTray';
import TripModal from '@/src/components/TripModal';
import SponsorModal from '@/src/components/SponsorModal';
import venuesData from '@/public/data/venues.json';
import liveCamsData from '@/public/data/live_cams.json';
import creatorsData from '@/public/data/creators.json';
import { useStreamStatus } from '@/src/hooks/useStreamStatus';
import { useTickerData } from '@/src/hooks/useTickerData';
import { useLiveAlerts } from '@/src/hooks/useLiveAlerts';
import TickerBar from '@/src/components/TickerBar';
import KohLarnModal from '@/src/components/KohLarnModal';
import EventRadarModal from '@/src/components/EventRadarModal';
import WeatherModal from '@/src/components/WeatherModal';
import NewsletterModal from '@/src/components/NewsletterModal';
import CookieConsentBanner from '@/src/components/CookieConsentBanner';

function playShuffleChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Series of mechanical roulette ticks
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + i * 90, now + i * 0.04);
      gain.gain.setValueAtTime(0.08, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.04);
    }

    // Victory chime
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(880, now + 0.25);
    bellGain.gain.setValueAtTime(0.12, now + 0.25);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);
    bellOsc.start(now + 0.25);
    bellOsc.stop(now + 0.8);
  } catch {
    // Silent fail if audio is not allowed without user gesture
  }
}

export default function AppRoot() {
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'grid' | 'vids'
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [isKohLarnModalOpen, setIsKohLarnModalOpen] = useState(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const mapInstanceRef = useRef(null);

  const streamStatus = useStreamStatus();
  const { weather } = useTickerData();
  const { isEnabled: hasLiveAlerts, toggleLiveAlerts } = useLiveAlerts(streamStatus);
    const activeLiveCount = useMemo(() => {
    const liveVenues = venuesData.filter((v) => {
      const statusInfo = streamStatus?.entities?.[v.slug] || streamStatus?.entities?.[v.slug ? `venue-${v.slug}` : ''];
      return statusInfo?.is_live === true || (statusInfo?.status === 'active' && statusInfo?.video_id);
    }).length;

    const liveCams = liveCamsData.filter((c) => {
      const statusInfo = streamStatus?.entities?.[c.slug] || streamStatus?.entities?.[c.slug ? `livecam-${c.slug}` : ''];
      return statusInfo?.status !== 'error_404' && statusInfo?.is_live !== false;
    }).length;

    const liveCreators = creatorsData.filter((c) => {
      const statusInfo = streamStatus?.entities?.[c.slug] || streamStatus?.entities?.[c.slug ? `creator-${c.slug}` : ''];
      return statusInfo?.is_live === true;
    }).length;

    return liveVenues + liveCams + liveCreators;
  }, [streamStatus]);

  const handleMapInstance = useCallback((map) => {
    mapInstanceRef.current = map;
  }, []);

  const handleQuickJump = useCallback((center, zoom) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    try {
      if (typeof map.invalidateSize === 'function') {
        map.invalidateSize();
      }
      if (typeof map.flyTo === 'function' && map._loaded && map.getContainer()) {
        map.flyTo(center, zoom, {
          duration: 1.4,
          easeLinearity: 0.25,
        });
      } else if (typeof map.setView === 'function') {
        map.setView(center, zoom);
      }
    } catch (err) {
      console.warn('Map flyTo warning:', err);
    }
  }, []);

  const handleSelectEntity = useCallback((entity) => {
    setSelectedEntity(entity);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  // 🎲 Live Shuffle (City Roulette): Filter active live streams, play chime, smooth flyTo([lat, lng], 17), and open drawer
  const handleLiveShuffle = useCallback(() => {
    playShuffleChime();

    const liveVenues = venuesData.filter((v) => {
      const statusInfo = streamStatus?.entities?.[`venue-${v.slug}`];
      return statusInfo?.is_live === true || (statusInfo?.status === 'active' && statusInfo?.video_id);
    }).map((v) => {
      const statusInfo = streamStatus?.entities?.[`venue-${v.slug}`];
      return {
        ...v,
        type: 'venue',
        is_live: true,
        video_id: statusInfo?.video_id || v.video_id,
        last_live_at: statusInfo?.last_live_at || null,
      };
    });

    const liveCams = liveCamsData.filter((c) => {
      const statusInfo = streamStatus?.entities?.[`livecam-${c.slug}`];
      return statusInfo?.status !== 'error_404';
    }).map((c) => {
      const statusInfo = streamStatus?.entities?.[`livecam-${c.slug}`];
      return {
        ...c,
        type: 'livecam',
        is_live: true,
        video_id: statusInfo?.video_id || c.video_id,
        last_live_at: statusInfo?.last_live_at || null,
      };
    });

        const liveCreators = creatorsData.filter((c) => {
      const statusInfo = streamStatus?.entities?.[c.slug] || streamStatus?.entities?.[c.slug ? `creator-${c.slug}` : ''];
      return statusInfo?.is_live === true;
    }).map((c) => {
      const statusInfo = streamStatus?.entities?.[c.slug] || streamStatus?.entities?.[c.slug ? `creator-${c.slug}` : ''];
      let lat = 12.9262, lng = 100.8735;
      if (c.primary_zone === 'buakhao') { lat = 12.9323; lng = 100.8861; }
      else if (c.primary_zone === 'soi_6') { lat = 12.9423; lng = 100.8860; }
      else if (c.primary_zone === 'jomtien') { lat = 12.8950; lng = 100.8710; }
      return {
        ...c,
        lat,
        lng,
        type: 'creator',
        is_live: true,
        video_id: statusInfo?.video_id || null,
        active_platform: statusInfo?.platform || c.platform,
      };
    });

    const allLiveCandidates = [...liveVenues, ...liveCams, ...liveCreators];
    if (allLiveCandidates.length === 0) return;

    let candidates = allLiveCandidates;
    if (selectedEntity && allLiveCandidates.length > 1) {
      candidates = allLiveCandidates.filter((c) => c.slug !== selectedEntity.slug);
    }
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const entityPayload = { ...chosen };

    const needsViewSwitch = viewMode !== 'map';
    if (needsViewSwitch) {
      setViewMode('map');
    }

    setTimeout(() => {
      const map = mapInstanceRef.current;
      if (map) {
        try {
          if (typeof map.invalidateSize === 'function') {
            map.invalidateSize();
          }
          if (typeof map.flyTo === 'function' && map._loaded && map.getContainer()) {
            map.flyTo([chosen.lat, chosen.lng], 17, {
              duration: 1.5,
              easeLinearity: 0.25,
            });
          }
        } catch (e) {
          console.warn('Shuffle flyTo warning', e);
        }
        setTimeout(() => {
          setSelectedEntity(entityPayload);
        }, 700);
      } else {
        setSelectedEntity(entityPayload);
      }
    }, needsViewSwitch ? 150 : 0);
  }, [viewMode, selectedEntity, streamStatus]);

  // Force Leaflet to recalculate container geometry and render tiles whenever returning to map mode
  useEffect(() => {
    if (viewMode === 'map') {
      const map = mapInstanceRef.current;
      if (map) {
        const refreshMap = () => {
          try {
            if (typeof map.invalidateSize === 'function') {
              map.invalidateSize();
            }
          } catch (e) {
            console.warn('Map refresh warning', e);
          }
        };
        refreshMap();
        const t1 = setTimeout(refreshMap, 60);
        const t2 = setTimeout(refreshMap, 200);
        const t3 = setTimeout(refreshMap, 450);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      }
    }
  }, [viewMode]);

  // Listen for custom video-select event from CreatorVODFeed retention strip
  useEffect(() => {
    const handleSelectCustomVideo = (event) => {
      const video = event.detail;
      if (!video) return;

      setSelectedEntity({
        ...video,
        name: video.name || video.title,
        channel_name: video.channel_title,
        video_id: video.video_id,
        category: video.category || 'Nightlife & Walking',
        zone: video.zone || 'Pattaya',
        type: video.type || 'vod',
        is_live: video.is_live ?? false,
        platform: video.platform || 'youtube',
      });
    };

    window.addEventListener('pattayacams:select-video', handleSelectCustomVideo);
    return () => {
      window.removeEventListener('pattayacams:select-video', handleSelectCustomVideo);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas">
      {/* 1. Top Navigation Bar */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onQuickJump={handleQuickJump}
        onLiveShuffle={handleLiveShuffle}
        onOpenTripModal={() => setIsTripModalOpen(true)}
        onOpenSponsorModal={() => setIsSponsorModalOpen(true)}
      />

      {/* Real-Time Financial & Indochina Time Ticker Bar */}
      <TickerBar
        onOpenKohLarn={() => setIsKohLarnModalOpen(true)}
        onOpenEvents={() => setIsEventsModalOpen(true)}
        onOpenWeather={() => setIsWeatherModalOpen(true)}
        onOpenNewsletter={() => setIsNewsletterOpen(true)}
        onToggleAlerts={toggleLiveAlerts}
        hasLiveAlerts={hasLiveAlerts}
      />

      {/* 2. Main Content Canvas */}
      <main className="flex-1 relative overflow-hidden">
        <div className={`w-full h-full ${viewMode === 'map' ? 'block' : 'hidden'}`}>
          <MapCanvasWrapper
            onSelectEntity={handleSelectEntity}
            onMapInstance={handleMapInstance}
            onOpenKohLarn={() => setIsKohLarnModalOpen(true)}
          />
        </div>
        {viewMode === 'grid' && (
          <div className="w-full h-full">
            <MultiCamGrid onSelectEntity={handleSelectEntity} />
          </div>
        )}
        {(viewMode === 'vids' || viewMode === 'pulse') && (
          <div className="w-full h-full">
            <CreatorVODFeed />
          </div>
        )}

        {/* Subtle Floating Banner when No Streams are Currently Live */}
        {viewMode === 'map' && activeLiveCount === 0 && !isBannerDismissed && (
          <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 max-w-lg w-[92%] sm:w-auto pointer-events-auto">
            <div className="bg-surface/90 backdrop-blur-md border border-brandPink/50 shadow-[0_0_24px_rgba(255,42,109,0.3)] rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-200">
                <span className="text-base animate-pulse">🌙</span>
                <span className="leading-snug">
                  <strong className="text-white font-semibold">Pattaya is resting.</strong> No streams are live right now. Watch latest 4K street walks & nightlife episodes in{' '}
                  <button
                    onClick={() => setViewMode('vids')}
                    className="text-brandPink font-bold hover:underline inline-flex items-center gap-0.5 ml-0.5"
                  >
                    <span>Videos</span>
                    <span className="text-[10px]">➔</span>
                  </button>
                </span>
              </div>
              <button
                onClick={() => setIsBannerDismissed(true)}
                className="w-6 h-6 rounded-full bg-surfaceLight/80 hover:bg-surfaceLight flex items-center justify-center text-slate-400 hover:text-white shrink-0 transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Live Shuffle Popup in Bottom Right Corner of Map */}
        {viewMode === 'map' && (
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 pointer-events-auto">
            {activeLiveCount > 0 ? (
              <button
                onClick={handleLiveShuffle}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface/95 backdrop-blur-md border border-brandPink/70 hover:border-brandPink text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,42,109,0.35)] hover:shadow-[0_0_28px_rgba(255,42,109,0.6)] cursor-pointer group hover:scale-105 active:scale-95"
                title="City Roulette: Fly to a random live stream"
              >
                <span className="text-base group-hover:rotate-12 transition-transform">🎲</span>
                <span className="font-mono tracking-wide font-extrabold text-brandPink group-hover:text-white transition-colors">
                  Live Shuffle
                </span>
                <span className="text-[10px] font-mono font-bold bg-brandPink text-white px-1.5 py-0.5 rounded-full shadow-[0_0_8px_#FF2A6D]">
                  {activeLiveCount} Live
                </span>
              </button>
            ) : (
              <button
                disabled
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface/80 backdrop-blur-md border border-borderDark/80 text-slate-500 text-xs font-bold cursor-not-allowed opacity-60 shadow-lg"
                title="No live streams currently broadcasting. Shuffle is unavailable."
              >
                <span className="text-base grayscale opacity-50">🎲</span>
                <span className="font-mono tracking-wide">Live Shuffle</span>
                <span className="text-[10px] font-mono text-slate-500 bg-surfaceLight px-1.5 py-0.5 rounded-full">
                  0 Live
                </span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* 3. Bottom Roaming Streamers Tray (shown on map and grid views) */}
      {viewMode !== 'vids' && viewMode !== 'pulse' && (
        <RoamingTray
          onSelectStreamer={handleSelectEntity}
          onOpenSponsorModal={() => setIsSponsorModalOpen(true)}
        />
      )}

      {/* 4. Slide-Over Video Drawer */}
      <VideoDrawer
        entity={selectedEntity}
        onClose={handleCloseDrawer}
      />

      {/* 5. Conversion Modals */}
      <TripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
      />

      <SponsorModal
        isOpen={isSponsorModalOpen}
        onClose={() => setIsSponsorModalOpen(false)}
      />

      {/* 6. Utility & Retention Modals */}
      <KohLarnModal
        isOpen={isKohLarnModalOpen}
        onClose={() => setIsKohLarnModalOpen(false)}
      />

      <EventRadarModal
        isOpen={isEventsModalOpen}
        onClose={() => setIsEventsModalOpen(false)}
      />

      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        currentWeather={weather}
      />

      <NewsletterModal
        isOpen={isNewsletterOpen}
        onClose={() => setIsNewsletterOpen(false)}
      />

      {/* 7. Privacy & Analytics Cookie Consent Banner */}
      <CookieConsentBanner />
    </div>
  );
}
