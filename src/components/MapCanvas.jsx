'use client';

import React, { useEffect, useRef, useState } from 'react';
import venuesData from '@/public/data/venues.json';
import cctvData from '@/public/data/cctv_cams.json';
import busRoutes from '@/public/data/pattaya_baht_bus.geojson';
import LayerToggleHUD from './LayerToggleHUD';

export default function MapCanvas({ onSelectEntity, onMapInstance }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({
    cctvCluster: null,
    venueGroup: null,
    transitGroup: null,
  });

  const [showVenues, setShowVenues] = useState(true);
  const [showCams, setShowCams] = useState(true);
  const [showTransit, setShowTransit] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (!mapContainerRef.current || mapRef.current) return;

      const L = await import('leaflet');
      if (typeof window !== 'undefined') {
        window.L = L.default || L;
        try {
          require('leaflet.markercluster');
        } catch (e) {
          console.warn('MarkerCluster load warning', e);
        }
      }

      const Leaflet = L.default || L;

      // Initialize map centered at Central Pattaya / Soi Buakhao
      const map = Leaflet.map(mapContainerRef.current, {
        center: [12.9345, 100.8825],
        zoom: 14,
        minZoom: 11,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: true,
      });

      Leaflet.control.zoom({ position: 'topright' }).addTo(map);

      // CartoDB Dark Matter Tile Layer with API Key to remove watermarks
      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_33su_1_683c1b500e92ad8b2069c2d2';
      const tileUrl = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`;

      Leaflet.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // 1. Transit Vectors Layer Group
      const transitGroup = Leaflet.geoJSON(busRoutes, {
        style: (feature) => {
          const color = feature.properties?.color || '#3B82F6';
          return {
            color: color,
            weight: 5,
            opacity: 0.95,
            lineJoin: 'round',
            lineCap: 'round',
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const tooltipContent = `
            <div style="font-family: inherit; font-size: 11px;">
              <div style="font-weight: 700; color: ${p.color}; margin-bottom: 2px;">${p.name}</div>
              <div style="color: #94A3B8; margin-bottom: 4px;">${p.name_th || ''}</div>
              <div style="display: flex; gap: 8px; font-family: monospace;">
                <span style="background: #26354A; padding: 2px 6px; border-radius: 4px; color: #10B981; font-weight: 700;">${p.fare_thb} THB</span>
                <span style="color: #E2E8F0;">${p.frequency || ''}</span>
              </div>
              <div style="margin-top: 4px; color: #CBD5E1; font-size: 10px;">${p.direction || ''}</div>
            </div>
          `;
          layer.bindTooltip(tooltipContent, {
            className: 'pattaya-dark-tooltip',
            sticky: true,
            direction: 'top',
          });
        },
      });
      transitGroup.addTo(map);

      // 2. Municipal CCTV Layer (Individual 8px dots, unclustered per user request)
      const cctvGroup = Leaflet.layerGroup();

      cctvData.forEach((cam) => {
        const cctvIcon = Leaflet.divIcon({
          className: 'custom-cctv-marker-container',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          html: `
            <div style="width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #00E5FF; border: 1.5px solid #0B0F17; box-shadow: 0 0 6px #00E5FF; transition: transform 0.15s ease;"></div>
            </div>
          `,
        });

        const marker = Leaflet.marker([cam.lat, cam.lng], { icon: cctvIcon });
        marker.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px;">
             <span style="color: #00E5FF; font-family: monospace; font-weight: 700; display: block;">${cam.camera_code || cam.id}</span>
             <strong style="color: #F8FAFC;">${cam.name_th || cam.name}</strong>
             <span style="display: block; color: #94A3B8; font-size: 10px;">District: ${cam.district || 'Pattaya'}</span>
           </div>`,
          { className: 'pattaya-dark-tooltip', direction: 'top', offset: [0, -6] }
        );
        marker.on('click', () => {
          if (onSelectEntity) {
            onSelectEntity({ ...cam, type: 'cctv' });
          }
        });
        cctvGroup.addLayer(marker);
      });
      cctvGroup.addTo(map);

      // 3. Hero Venues Layer Group (High-Visibility Unclustered Markers)
      const venueGroup = Leaflet.layerGroup();

      const getCategoryIcon = (category, isSponsor) => {
        if (isSponsor) return '⭐';
        switch (category) {
          case 'dispensary': return '🌿';
          case 'webcam': return '📹';
          case 'sports_bar': return '⚽';
          case 'restaurant': return '🍜';
          case 'cafe': return '☕';
          case 'beach_club': return '🏖️';
          case 'lounge': return '✨';
          default: return '🍸';
        }
      };

      venuesData.forEach((venue) => {
        const isSponsor = venue.is_sponsored;
        const iconEmoji = getCategoryIcon(venue.category, isSponsor);

        const venueIcon = Leaflet.divIcon({
          className: 'custom-venue-marker-container',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          html: `
            <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <span style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${isSponsor ? '#EAB308' : '#FF2A6D'}; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: ${isSponsor ? 'linear-gradient(135deg, #FACC15, #CA8A04)' : 'linear-gradient(135deg, #FF2A6D, #BE185D)'}; border: 2px solid #FFFFFF; box-shadow: 0 0 16px ${isSponsor ? '#EAB308' : '#FF2A6D'}; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">
                ${iconEmoji}
              </div>
            </div>
          `,
        });

        const marker = Leaflet.marker([venue.lat, venue.lng], {
          icon: venueIcon,
          zIndexOffset: 1200,
        });

        const categoryLabel = venue.category ? venue.category.toUpperCase().replace('_', ' ') : 'VENUE';
        marker.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px;">
             <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
               <span style="background: ${isSponsor ? '#EAB308' : '#FF2A6D'}; color: #0B0F17; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px;">${categoryLabel}</span>
               <span style="color: #EAB308; font-weight: 700; font-size: 10px;">LIVE STREAM</span>
             </div>
             <strong style="color: #FFFFFF; font-size: 12px;">${venue.name}</strong>
             <div style="color: #94A3B8; font-size: 10px; margin-top: 2px;">Zone: ${venue.zone.replace('_', ' ')}</div>
           </div>`,
          { className: 'pattaya-dark-tooltip', direction: 'top', offset: [0, -14] }
        );

        marker.on('click', () => {
          if (onSelectEntity) {
            onSelectEntity({ ...venue, type: 'venue' });
          }
        });
        venueGroup.addLayer(marker);
      });
      venueGroup.addTo(map);

      mapRef.current = map;
      layersRef.current = {
        cctvGroup,
        venueGroup,
        transitGroup,
      };

      if (onMapInstance) {
        onMapInstance(map);
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onSelectEntity, onMapInstance]);

  // Handle Layer Visibility Toggles
  useEffect(() => {
    if (!mapRef.current) return;
    const { venueGroup } = layersRef.current;
    if (!venueGroup) return;

    if (showVenues) {
      if (!mapRef.current.hasLayer(venueGroup)) mapRef.current.addLayer(venueGroup);
    } else {
      if (mapRef.current.hasLayer(venueGroup)) mapRef.current.removeLayer(venueGroup);
    }
  }, [showVenues]);

  useEffect(() => {
    if (!mapRef.current) return;
    const { cctvGroup } = layersRef.current;
    if (!cctvGroup) return;

    if (showCams) {
      if (!mapRef.current.hasLayer(cctvGroup)) mapRef.current.addLayer(cctvGroup);
    } else {
      if (mapRef.current.hasLayer(cctvGroup)) mapRef.current.removeLayer(cctvGroup);
    }
  }, [showCams]);

  useEffect(() => {
    if (!mapRef.current) return;
    const { transitGroup } = layersRef.current;
    if (!transitGroup) return;

    if (showTransit) {
      if (!mapRef.current.hasLayer(transitGroup)) mapRef.current.addLayer(transitGroup);
    } else {
      if (mapRef.current.hasLayer(transitGroup)) mapRef.current.removeLayer(transitGroup);
    }
  }, [showTransit]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-canvas">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      <LayerToggleHUD
        showVenues={showVenues}
        setShowVenues={setShowVenues}
        showCams={showCams}
        setShowCams={setShowCams}
        showTransit={showTransit}
        setShowTransit={setShowTransit}
        venueCount={venuesData.length}
        camCount={cctvData.length}
        transitCount={busRoutes.features.length}
      />
    </div>
  );
}
