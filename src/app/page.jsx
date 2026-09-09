'use client';

import React, { useState, useRef, useCallback } from 'react';
import Navbar from '@/src/components/Navbar';
import MapCanvasWrapper from '@/src/components/MapCanvasWrapper';

export default function AppRoot() {
  const [viewMode, setViewMode] = useState('map');
  const [selectedEntity, setSelectedEntity] = useState(null);
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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas">
      {/* Top Header Navbar */}
      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        onQuickJump={handleQuickJump}
        onOpenTripModal={() => console.log('Open trip modal')}
        onOpenSponsorModal={() => console.log('Open sponsor modal')}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'map' ? (
          <MapCanvasWrapper
            onSelectEntity={handleSelectEntity}
            onMapInstance={handleMapInstance}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-canvas text-slate-400 font-mono text-sm">
            Multi-Cam Command Grid (Batch 3)
          </div>
        )}
      </main>
    </div>
  );
}
