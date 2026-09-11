'use client';

import React, { useState, useRef, useCallback } from 'react';
import Navbar from '@/src/components/Navbar';
import MapCanvasWrapper from '@/src/components/MapCanvasWrapper';
import MultiCamGrid from '@/src/components/MultiCamGrid';
import CreatorVODFeed from '@/src/components/CreatorVODFeed';
import VideoDrawer from '@/src/components/VideoDrawer';
import RoamingTray from '@/src/components/RoamingTray';
import TripModal from '@/src/components/TripModal';
import SponsorModal from '@/src/components/SponsorModal';
import venuesData from '@/public/data/venues.json';
import streamStatus from '@/public/data/stream_status.json';

export default function AppRoot() {
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'grid' | 'vids'
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const mapInstanceRef = useRef(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view');
      if (v === 'vids' || v === 'pulse') setViewMode('vids');
      else if (v === 'grid') setViewMode('grid');
      else if (v === 'map') setViewMode('map');
    }
  }, []);

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

  // 🎲 Live Shuffle (City Roulette): Filter active live streams, smooth flyTo([lat, lng], 17), and open drawer
  const handleLiveShuffle = useCallback(() => {
    const liveVenues = venuesData.filter((v) => {
      const statusInfo = streamStatus?.entities?.[`venue-${v.slug}`];
      return statusInfo?.is_live === true || (statusInfo?.status === 'active' && statusInfo?.video_id);
    });

    if (liveVenues.length === 0) return;

    let candidates = liveVenues;
    if (selectedEntity && liveVenues.length > 1) {
      candidates = liveVenues.filter((v) => v.slug !== selectedEntity.slug);
    }
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const statusInfo = streamStatus?.entities?.[`venue-${chosen.slug}`];

    const venuePayload = {
      ...chosen,
      type: 'venue',
      is_live: true,
      video_id: statusInfo?.video_id || chosen.video_id,
      last_live_at: statusInfo?.last_live_at || null,
    };

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
          setSelectedEntity(venuePayload);
        }, 700);
      } else {
        setSelectedEntity(venuePayload);
      }
    }, needsViewSwitch ? 150 : 0);
  }, [viewMode, selectedEntity]);

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

      {/* 2. Main Content Canvas */}
      <main className="flex-1 relative overflow-hidden">
        <div className={`w-full h-full ${viewMode === 'map' ? 'block' : 'hidden'}`}>
          <MapCanvasWrapper
            onSelectEntity={handleSelectEntity}
            onMapInstance={handleMapInstance}
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
    </div>
  );
}
