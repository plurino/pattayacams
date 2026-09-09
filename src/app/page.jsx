'use client';

import React, { useState, useRef, useCallback } from 'react';
import Navbar from '@/src/components/Navbar';
import MapCanvasWrapper from '@/src/components/MapCanvasWrapper';
import MultiCamGrid from '@/src/components/MultiCamGrid';
import VideoDrawer from '@/src/components/VideoDrawer';
import RoamingTray from '@/src/components/RoamingTray';
import TripModal from '@/src/components/TripModal';
import SponsorModal from '@/src/components/SponsorModal';
import venuesData from '@/public/data/venues.json';
import streamStatus from '@/public/data/stream_status.json';

export default function AppRoot() {
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'grid'
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const mapInstanceRef = useRef(null);

  const handleMapInstance = useCallback((map) => {
    mapInstanceRef.current = map;
  }, []);

  const handleQuickJump = useCallback((center, zoom) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(center, zoom, {
        duration: 1.4,
        easeLinearity: 0.25,
      });
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

    if (viewMode !== 'map') {
      setViewMode('map');
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([chosen.lat, chosen.lng], 17, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
      setTimeout(() => {
        setSelectedEntity(venuePayload);
      }, 1000);
    } else {
      setSelectedEntity(venuePayload);
    }
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
        {viewMode === 'map' ? (
          <MapCanvasWrapper
            onSelectEntity={handleSelectEntity}
            onMapInstance={handleMapInstance}
          />
        ) : (
          <MultiCamGrid onSelectEntity={handleSelectEntity} />
        )}
      </main>

      {/* 3. Bottom Roaming Streamers Tray */}
      <RoamingTray
        onSelectStreamer={handleSelectEntity}
        onOpenSponsorModal={() => setIsSponsorModalOpen(true)}
      />

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
